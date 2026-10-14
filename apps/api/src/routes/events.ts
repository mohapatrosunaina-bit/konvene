import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles, hasScopedRole } from "../lib/rbac";

export const eventsRouter = Router();

eventsRouter.get("/", async (req, res) => {
  const { category, clubSlug, from, to, q } = req.query as Record<string, string | undefined>;

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { category: category as any } : {}),
      ...(clubSlug ? { club: { slug: clubSlug } } : {}),
      ...(from || to
        ? { startAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    include: { club: true, ticketTypes: true, _count: { select: { registrations: true } } },
    orderBy: { startAt: "asc" },
  });
  res.json(events);
});

eventsRouter.get("/:slug", async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { slug: req.params.slug },
    include: {
      club: true,
      ticketTypes: true,
      form: true,
      linkedSubject: true,
      _count: { select: { registrations: true } },
    },
  });
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

const createEventSchema = z.object({
  clubId: z.string(),
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  category: z.enum([
    "WORKSHOP", "HACKATHON", "CONFERENCE", "TALK", "SEMINAR", "SPORTS", "CULTURAL",
    "TECHNICAL", "MUSIC", "DANCE", "FEST", "BOOTCAMP", "PLACEMENT", "COMPETITION",
  ]),
  venue: z.string().min(2),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  capacity: z.number().int().positive(),
  bannerUrl: z.string().url().optional(),
  requiresFacultyAttendance: z.boolean().optional(),
  linkedSubjectId: z.string().optional(),
  ticketTypes: z
    .array(z.object({ name: z.string(), capacity: z.number().int().positive() }))
    .min(1),
  formFields: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["text", "textarea", "select", "checkbox", "file"]),
        options: z.array(z.string()).optional(),
        required: z.boolean().optional(),
      })
    )
    .default([]),
});

eventsRouter.post("/", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { clubId, ticketTypes, formFields, ...data } = parsed.data;

  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", clubId)) {
    return res.status(403).json({ error: "Only the club's head/admin can create events for this club" });
  }

  const event = await prisma.event.create({
    data: {
      ...data,
      clubId,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      status: "DRAFT",
      ticketTypes: { create: ticketTypes },
      form: { create: { schemaJson: JSON.stringify(formFields) } },
    },
    include: { ticketTypes: true, form: true },
  });

  res.status(201).json(event);
});

const updateEventSchema = createEventSchema.omit({ clubId: true }).partial().extend({
  ticketTypes: z.array(z.object({ name: z.string(), capacity: z.number().int().positive() })).min(1).optional(),
});

/**
 * Edits an event's core fields (and, if provided, fully replaces its ticket
 * types and form schema). Only allowed while the event hasn't been sent
 * anywhere yet (DRAFT) or was sent back for changes (REJECTED) — once it's
 * PENDING_APPROVAL or PUBLISHED, editing would invalidate what the
 * coordinator already reviewed or what attendees already registered against.
 */
eventsRouter.patch("/:id", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (event.status !== "DRAFT" && event.status !== "REJECTED") {
    return res.status(409).json({ error: `Cannot edit an event in status ${event.status}` });
  }

  const { ticketTypes, formFields, startAt, endAt, ...rest } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (ticketTypes) {
      const existingTypes = await tx.ticketType.findMany({ where: { eventId: event.id } });
      const inUse = await tx.registration.count({ where: { ticketTypeId: { in: existingTypes.map((t) => t.id) } } });
      if (inUse > 0) throw new Error("TICKET_TYPES_IN_USE");
      await tx.ticketType.deleteMany({ where: { eventId: event.id } });
      await tx.ticketType.createMany({ data: ticketTypes.map((t) => ({ ...t, eventId: event.id })) });
    }
    if (formFields) {
      await tx.eventForm.upsert({
        where: { eventId: event.id },
        create: { eventId: event.id, schemaJson: JSON.stringify(formFields) },
        update: { schemaJson: JSON.stringify(formFields) },
      });
    }
    return tx.event.update({
      where: { id: event.id },
      data: {
        ...rest,
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : {}),
      },
      include: { ticketTypes: true, form: true },
    });
  }).catch((err) => {
    if (err instanceof Error && err.message === "TICKET_TYPES_IN_USE") return null;
    throw err;
  });

  if (!updated) return res.status(409).json({ error: "Can't replace ticket types that already have registrations" });
  res.json(updated);
});

/** Club head sends a DRAFT event to their Faculty Coordinator for approval. */
eventsRouter.post("/:id/submit-for-approval", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (event.status !== "DRAFT") return res.status(409).json({ error: `Cannot submit an event in status ${event.status}` });

  const updated = await prisma.event.update({ where: { id: event.id }, data: { status: "PENDING_APPROVAL" } });
  await prisma.auditLog.create({
    data: { actorUserId: req.userId, action: "EVENT_SUBMITTED_FOR_APPROVAL", targetType: "Event", targetId: event.id },
  });
  res.json(updated);
});

/** Faculty Coordinator (scoped to the club) or Admin approves a pending event, publishing it. */
eventsRouter.post("/:id/approve", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "FACULTY_COORDINATOR", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Only this club's Faculty Coordinator (or an Admin) can approve events" });
  }
  if (event.status !== "PENDING_APPROVAL") {
    return res.status(409).json({ error: `Cannot approve an event in status ${event.status}` });
  }

  const updated = await prisma.event.update({ where: { id: event.id }, data: { status: "PUBLISHED" } });
  await prisma.auditLog.create({
    data: { actorUserId: req.userId, action: "EVENT_APPROVED", targetType: "Event", targetId: event.id },
  });
  res.json(updated);
});

/** Faculty Coordinator rejects a pending event, sending it back to the club head with a reason. */
eventsRouter.post("/:id/reject", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const parsed = z.object({ reason: z.string().min(2) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "reason is required" });

  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "FACULTY_COORDINATOR", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (event.status !== "PENDING_APPROVAL") {
    return res.status(409).json({ error: `Cannot reject an event in status ${event.status}` });
  }

  const updated = await prisma.event.update({ where: { id: event.id }, data: { status: "REJECTED" } });
  await prisma.auditLog.create({
    data: {
      actorUserId: req.userId,
      action: "EVENT_REJECTED",
      targetType: "Event",
      targetId: event.id,
      afterJson: JSON.stringify({ reason: parsed.data.reason }),
    },
  });
  res.json(updated);
});

/** Lets a club head move a REJECTED event back to DRAFT to edit and resubmit. */
eventsRouter.post("/:id/revise", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (event.status !== "REJECTED") return res.status(409).json({ error: "Only rejected events can be revised" });

  const updated = await prisma.event.update({ where: { id: event.id }, data: { status: "DRAFT" } });
  res.json(updated);
});

/** Events awaiting this Faculty Coordinator's decision, across all clubs they cover. */
eventsRouter.get("/pending-approval/mine", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const coordinatedClubIds = (req.roles ?? [])
    .filter((r) => r.role === "FACULTY_COORDINATOR" && r.scopeType === "CLUB" && r.scopeId)
    .map((r) => r.scopeId as string);

  const isAdmin = req.roles?.some((r) => r.role === "ADMIN" || r.role === "SUPER_ADMIN");
  if (!isAdmin && coordinatedClubIds.length === 0) return res.json([]);

  const events = await prisma.event.findMany({
    where: { status: "PENDING_APPROVAL", ...(isAdmin ? {} : { clubId: { in: coordinatedClubIds } }) },
    include: { club: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(events);
});

eventsRouter.get("/:id/registrations", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const registrations = await prisma.registration.findMany({
    where: { eventId: event.id },
    include: {
      user: { select: { id: true, name: true, usn: true, email: true } },
      ticketType: true,
      ticket: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(registrations);
});

eventsRouter.get("/:id/checkin-stats", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const [registered, checkedIn] = await Promise.all([
    prisma.registration.count({ where: { eventId: event.id, status: "CONFIRMED" } }),
    prisma.ticket.count({
      where: { registration: { eventId: event.id }, status: "CHECKED_IN" },
    }),
  ]);
  res.json({ capacity: event.capacity, registered, checkedIn, noShow: registered - checkedIn });
});
