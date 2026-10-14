import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles } from "../lib/rbac";

export const usersRouter = Router();

const profileInclude = {
  studentProfile: { include: { section: { include: { branch: true } } } },
  clubMemberships: { include: { club: true } },
} as const;

usersRouter.get("/me", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  let user = await prisma.user.findUnique({ where: { id: req.userId }, include: profileInclude });

  // First-time OAuth login (Google/GitHub): Supabase already created the auth
  // identity, but our app-level profile row doesn't exist yet. Provision it
  // here from the provider's profile data instead of requiring a separate
  // signup step that OAuth users never go through.
  if (!user) {
    const authUser = req.authUser!;
    user = await prisma.user.create({
      data: {
        id: authUser.id,
        name: authUser.name ?? authUser.email.split("@")[0],
        email: authUser.email,
        avatarUrl: authUser.avatarUrl,
        roleAssignments: { create: { role: "STUDENT", scopeType: "GLOBAL" } },
      },
      include: profileInclude,
    });
    req.roles = await prisma.userRoleAssignment.findMany({ where: { userId: req.userId } });
  }

  res.json({ ...user, roles: req.roles });
});

usersRouter.get("/me/tickets", requireAuth, async (req: AuthedRequest, res) => {
  const registrations = await prisma.registration.findMany({
    where: { userId: req.userId },
    include: { event: true, ticketType: true, ticket: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(registrations);
});

usersRouter.get("/me/certificates", requireAuth, async (req: AuthedRequest, res) => {
  const certs = await prisma.certificate.findMany({
    where: { userId: req.userId },
    include: { event: true },
    orderBy: { issuedAt: "desc" },
  });
  res.json(certs);
});
