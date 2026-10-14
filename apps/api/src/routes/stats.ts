import { Router } from "express";
import { prisma } from "../lib/prisma";

export const statsRouter = Router();

/** Public, real (never fabricated) counts for the landing page's social-proof strip. */
statsRouter.get("/stats", async (_req, res) => {
  const [clubs, publishedEvents, registrations, certificates] = await Promise.all([
    prisma.club.count(),
    prisma.event.count({ where: { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } } }),
    prisma.registration.count({ where: { status: "CONFIRMED" } }),
    prisma.certificate.count(),
  ]);
  res.json({ clubs, publishedEvents, registrations, certificates });
});
