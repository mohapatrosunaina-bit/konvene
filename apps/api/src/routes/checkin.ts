import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles, hasScopedRole } from "../lib/rbac";
import { verifyTicketToken } from "../lib/qr";

export const checkinRouter = Router();

/**
 * Core check-in transition, shared by QR-scan and manual-search paths so both
 * go through the exact same state machine and get recorded identically.
 *
 * Two layers of defense against forged/duplicate check-ins:
 *  1. Signature check on the QR path (verifyTicketToken) — rejects any token
 *     whose ticketId wasn't signed by this server, before the DB is touched.
 *  2. Atomic conditional update (`updateMany` with `status: "ISSUED"` in the
 *     WHERE clause) — the UPDATE...WHERE executes atomically in the database,
 *     so two volunteers scanning/searching the same attendee at the same
 *     instant cannot both succeed: only one UPDATE can affect the row while
 *     it is still ISSUED.
 */
async function performCheckIn(ticketId: string, scannedByUserId: string, method: "QR" | "MANUAL", res: Response, req: AuthedRequest) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      registration: {
        include: {
          user: { select: { id: true, name: true, usn: true, studentProfile: true } },
          event: true,
          ticketType: true,
        },
      },
    },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found", result: "INVALID" });

  const { event, user, ticketType } = ticket.registration;
  const authorized =
    hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId) ||
    hasScopedRole(req.roles, "VOLUNTEER", "CLUB", event.clubId);
  if (!authorized) return res.status(403).json({ error: "Not authorized to check in for this event" });

  if (ticket.status === "CANCELLED" || ticket.status === "BLACKLISTED") {
    return res.status(409).json({ result: ticket.status, name: user.name });
  }
  if (ticket.status === "CHECKED_IN") {
    const existing = await prisma.checkIn.findUnique({ where: { ticketId: ticket.id } });
    return res.status(409).json({ result: "DUPLICATE", name: user.name, scannedAt: existing?.scannedAt });
  }

  const updateResult = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: "ISSUED" },
    data: { status: "CHECKED_IN" },
  });
  if (updateResult.count === 0) {
    return res.status(409).json({ result: "DUPLICATE", name: user.name });
  }

  const checkIn = await prisma.checkIn.create({
    data: { ticketId: ticket.id, scannedByUserId, method },
  });
  const candidate = await prisma.attendanceCandidate.create({ data: { checkInId: checkIn.id } });

  let routedToFaculty: string | null = null;
  if (event.requiresFacultyAttendance && event.linkedSubjectId && user.studentProfile) {
    const assignment = await prisma.subjectFacultyAssignment.findUnique({
      where: {
        subjectId_sectionId: { subjectId: event.linkedSubjectId, sectionId: user.studentProfile.sectionId },
      },
    });
    if (assignment) {
      await prisma.pendingAttendance.create({
        data: { attendanceCandidateId: candidate.id, facultyUserId: assignment.facultyUserId },
      });
      routedToFaculty = assignment.facultyUserId;
    }
  } else if (!event.requiresFacultyAttendance) {
    // Events that don't require academic credit auto-credit attendance on check-in.
    await prisma.attendance.create({ data: { userId: user.id, eventId: event.id } });
  }

  return res.json({
    result: "SUCCESS",
    name: user.name,
    usn: user.usn,
    ticketType: ticketType.name,
    routedToFaculty,
  });
}

const verifySchema = z.object({ token: z.string() });

checkinRouter.post("/verify", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Missing token" });

  const { valid, ticketId } = verifyTicketToken(parsed.data.token);
  if (!valid || !ticketId) return res.status(400).json({ error: "Invalid QR signature", result: "INVALID" });

  await performCheckIn(ticketId, req.userId!, "QR", res, req);
});

const manualSchema = z.object({ registrationId: z.string() });

checkinRouter.post("/manual", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const parsed = manualSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Missing registrationId" });

  const registration = await prisma.registration.findUnique({
    where: { id: parsed.data.registrationId },
    include: { ticket: true },
  });
  if (!registration?.ticket) return res.status(404).json({ error: "No ticket for this registration" });

  await performCheckIn(registration.ticket.id, req.userId!, "MANUAL", res, req);
});

/** Attendee search for the manual check-in fallback (lost/unreadable QR). */
checkinRouter.get("/search", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const { eventId, q } = req.query as { eventId?: string; q?: string };
  if (!eventId || !q) return res.status(400).json({ error: "eventId and q are required" });

  const results = await prisma.registration.findMany({
    where: {
      eventId,
      status: "CONFIRMED",
      user: { OR: [{ name: { contains: q } }, { usn: { contains: q } }] },
    },
    include: {
      user: { select: { id: true, name: true, usn: true, email: true } },
      ticket: { select: { status: true } },
      ticketType: { select: { name: true } },
    },
    take: 10,
  });
  res.json(results);
});
