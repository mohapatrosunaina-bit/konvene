import { Request, Response, NextFunction } from "express";
import { verifySupabaseToken, VerifiedAuthUser } from "./supabaseAdmin";
import { prisma } from "./prisma";

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "HOD"
  | "FACULTY"
  | "FACULTY_COORDINATOR"
  | "CLUB_HEAD"
  | "CORE_TEAM"
  | "VOLUNTEER"
  | "STUDENT"
  | "GUEST"
  | "SPONSOR"
  | "JUDGE"
  | "SPEAKER";

export interface AuthedRequest extends Request {
  userId?: string;
  authUser?: VerifiedAuthUser;
  roles?: { role: string; scopeType: string; scopeId: string | null }[];
}

/**
 * Authentication is delegated entirely to Supabase Auth — this just verifies
 * the bearer token against Supabase (password hashing, session issuance, and
 * expiry are all Supabase's responsibility, not ours) and resolves it to the
 * matching app-level user id.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  const authUser = await verifySupabaseToken(header.slice("Bearer ".length));
  if (!authUser) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.userId = authUser.id;
  req.authUser = authUser;
  next();
}

/** Loads the caller's role assignments onto the request for scope-aware checks. */
export async function loadRoles(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "Not authenticated" });
  req.roles = await prisma.userRoleAssignment.findMany({ where: { userId: req.userId } });
  next();
}

/** Passes if the caller holds `role` in ANY scope, or is ADMIN/SUPER_ADMIN. */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const has = req.roles?.some(
      (r) => roles.includes(r.role as Role) || r.role === "ADMIN" || r.role === "SUPER_ADMIN"
    );
    if (!has) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export function hasScopedRole(
  roles: AuthedRequest["roles"],
  role: Role,
  scopeType: string,
  scopeId: string
): boolean {
  return !!roles?.some(
    (r) =>
      r.role === "ADMIN" ||
      r.role === "SUPER_ADMIN" ||
      (r.role === role && r.scopeType === scopeType && r.scopeId === scopeId)
  );
}
