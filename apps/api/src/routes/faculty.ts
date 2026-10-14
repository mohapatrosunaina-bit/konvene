import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/rbac";

export const facultyRouter = Router();

/** Pending attendance addressed to the calling faculty member, grouped by subject/section. */
facultyRouter.get("/pending-attendance", requireAuth, async (req: AuthedRequest, res) => {
  const pending = await prisma.pendingAttendance.findMany({
    where: { facultyUserId: req.userId, status: "PENDING" },
    include: {
      attendanceCandidate: {
        include: {
          checkIn: {
            include: {
              ticket: {
                include: {
                  registration: {
                    include: {
                      user: {
                        select: {
                          id: true, name: true, usn: true, email: true,
                          studentProfile: { include: { section: true } },
                        },
                      },
                      event: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(pending);
});

const approveSchema = z.object({ ids: z.array(z.string()).min(1) });

facultyRouter.post("/pending-attendance/approve", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = approveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ids[] required" });

  const rows = await prisma.pendingAttendance.findMany({
    where: { id: { in: parsed.data.ids }, facultyUserId: req.userId, status: "PENDING" },
    include: {
      attendanceCandidate: {
        include: { checkIn: { include: { ticket: { include: { registration: true } } } } },
      },
    },
  });

  const results = await prisma.$transaction(
    rows.flatMap((row) => {
      const { registration } = row.attendanceCandidate.checkIn.ticket;
      return [
        prisma.pendingAttendance.update({
          where: { id: row.id },
          data: { status: "APPROVED", decidedAt: new Date() },
        }),
        prisma.attendance.create({
          data: { userId: registration.userId, eventId: registration.eventId, creditedByUserId: req.userId },
        }),
      ];
    })
  );

  res.json({ approved: rows.length, results });
});

const rejectSchema = z.object({ id: z.string(), reason: z.string().min(2) });

facultyRouter.post("/pending-attendance/reject", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "id and reason required" });

  const row = await prisma.pendingAttendance.findFirst({
    where: { id: parsed.data.id, facultyUserId: req.userId, status: "PENDING" },
  });
  if (!row) return res.status(404).json({ error: "Not found" });

  const updated = await prisma.pendingAttendance.update({
    where: { id: row.id },
    data: { status: "REJECTED", rejectionReason: parsed.data.reason, decidedAt: new Date() },
  });
  res.json(updated);
});
