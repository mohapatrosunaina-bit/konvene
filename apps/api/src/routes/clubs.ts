import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles, requireRole, hasScopedRole } from "../lib/rbac";
import { verifySupabaseToken } from "../lib/supabaseAdmin";

export const clubsRouter = Router();

clubsRouter.get("/", async (_req, res) => {
  const clubs = await prisma.club.findMany({
    include: { department: true, _count: { select: { members: true, events: true } } },
  });
  res.json(clubs);
});

/**
 * Public visitors only see PUBLISHED/ONGOING/COMPLETED events. If the caller
 * is authenticated and holds CLUB_HEAD/FACULTY_COORDINATOR for this club,
 * DRAFT/PENDING_APPROVAL/REJECTED events are included too, since their
 * management dashboards need to see and act on those.
 */
clubsRouter.get("/:slug", async (req: AuthedRequest, res) => {
  const club = await prisma.club.findUnique({ where: { slug: req.params.slug } });
  if (!club) return res.status(404).json({ error: "Club not found" });

  let canSeeAll = false;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const authUser = await verifySupabaseToken(header.slice("Bearer ".length));
    if (authUser) {
      const roles = await prisma.userRoleAssignment.findMany({ where: { userId: authUser.id } });
      canSeeAll =
        hasScopedRole(roles, "CLUB_HEAD", "CLUB", club.id) ||
        hasScopedRole(roles, "FACULTY_COORDINATOR", "CLUB", club.id);
    }
    // invalid/expired token on a public route just falls back to public visibility
  }

  const full = await prisma.club.findUnique({
    where: { id: club.id },
    include: {
      department: true,
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      events: canSeeAll ? true : { where: { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } } },
    },
  });
  res.json(full);
});

const createClubSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  departmentId: z.string(),
  facultyAdvisorName: z.string().optional(),
  headEmail: z.string().email(),
});

/**
 * Admin-only. The new head is identified by email rather than id — they must
 * already have a Konvene account (there's no user directory in the UI yet,
 * so email is the only identifier an admin realistically has on hand).
 */
clubsRouter.post("/", requireAuth, loadRoles, requireRole("ADMIN"), async (req, res) => {
  const parsed = createClubSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { headEmail, ...data } = parsed.data;

  const headUser = await prisma.user.findUnique({ where: { email: headEmail } });
  if (!headUser) return res.status(404).json({ error: "No Konvene account with that email yet — they need to sign up first." });

  const existingSlug = await prisma.club.findUnique({ where: { slug: data.slug } });
  if (existingSlug) return res.status(409).json({ error: "That club slug is already taken" });

  const club = await prisma.club.create({
    data: {
      ...data,
      members: { create: { userId: headUser.id, role: "CLUB_HEAD" } },
    },
  });

  await prisma.userRoleAssignment.create({
    data: { userId: headUser.id, role: "CLUB_HEAD", scopeType: "CLUB", scopeId: club.id },
  });

  res.status(201).json(club);
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["CORE_TEAM", "VOLUNTEER"]),
});

/** Club head (or admin) adds an existing user as core team or volunteer for their club. */
clubsRouter.post("/:id/members", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const club = await prisma.club.findUnique({ where: { id: req.params.id } });
  if (!club) return res.status(404).json({ error: "Club not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", club.id)) {
    return res.status(403).json({ error: "Only this club's head (or an admin) can add members" });
  }

  const { email, role } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: "No Konvene account with that email yet — they need to sign up first." });

  const existing = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: club.id, userId: user.id } } });
  if (existing) return res.status(409).json({ error: `${user.name} is already a member of this club` });

  await prisma.$transaction([
    prisma.clubMember.create({ data: { clubId: club.id, userId: user.id, role } }),
    prisma.userRoleAssignment.create({ data: { userId: user.id, role, scopeType: "CLUB", scopeId: club.id } }),
  ]);

  res.status(201).json({ added: user.name, role });
});
