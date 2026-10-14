import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/rbac";
import { signTicketToken } from "../lib/qr";

export const registrationsRouter = Router();

const registerSchema = z.object({
  ticketTypeId: z.string(),
  formResponses: z.record(z.any()).default({}),
});

/**
 * Registers the caller for an event and issues a signed QR ticket immediately
 * (Konvene doesn't process payments — every ticket type is free). When the
 * ticket type is at capacity, the registration is WAITLISTED instead of
 * rejected, and promoted automatically if a spot later opens up.
 */
registrationsRouter.post("/events/:eventId/register", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { ticketTypeId, formResponses } = parsed.data;
  const eventId = req.params.eventId;

  const [event, ticketType] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.ticketType.findUnique({ where: { id: ticketTypeId } }),
  ]);
  if (!event || event.status !== "PUBLISHED") return res.status(404).json({ error: "Event not open for registration" });
  if (!ticketType || ticketType.eventId !== eventId) return res.status(400).json({ error: "Invalid ticket type" });

  const existing = await prisma.registration.findUnique({
    where: { eventId_userId: { eventId, userId: req.userId! } },
  });
  if (existing) return res.status(409).json({ error: "Already registered for this event" });

  const confirmedCount = await prisma.registration.count({
    where: { ticketTypeId, status: "CONFIRMED" },
  });
  const isWaitlisted = confirmedCount >= ticketType.capacity;

  const registration = await prisma.registration.create({
    data: {
      eventId,
      userId: req.userId!,
      ticketTypeId,
      formResponseJson: JSON.stringify(formResponses),
      status: isWaitlisted ? "WAITLISTED" : "CONFIRMED",
    },
  });

  if (isWaitlisted) {
    return res.status(202).json({ registration, waitlisted: true });
  }

  const ticket = await issueTicket(registration.id);
  res.status(201).json({ registration, ticket });
});

/** Creates the Ticket row and its signed QR token for a confirmed, paid-for registration. */
export async function issueTicket(registrationId: string) {
  const created = await prisma.ticket.create({
    data: { registrationId, qrToken: "pending", status: "ISSUED" },
  });
  const qrToken = signTicketToken(created.id);
  return prisma.ticket.update({ where: { id: created.id }, data: { qrToken } });
}

registrationsRouter.delete("/registrations/:id", requireAuth, async (req: AuthedRequest, res) => {
  const registration = await prisma.registration.findUnique({ where: { id: req.params.id } });
  if (!registration || registration.userId !== req.userId) return res.status(404).json({ error: "Not found" });

  await prisma.registration.update({ where: { id: registration.id }, data: { status: "CANCELLED" } });

  if (registration.status === "CONFIRMED") {
    // Promote the earliest waitlisted registration for the same ticket type.
    const next = await prisma.registration.findFirst({
      where: { ticketTypeId: registration.ticketTypeId, status: "WAITLISTED" },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.registration.update({ where: { id: next.id }, data: { status: "CONFIRMED" } });
      await issueTicket(next.id);
      await prisma.notification.create({
        data: {
          userId: next.userId,
          type: "WAITLIST_PROMOTED",
          payloadJson: JSON.stringify({ registrationId: next.id }),
        },
      });
    }
  }

  res.status(204).send();
});
