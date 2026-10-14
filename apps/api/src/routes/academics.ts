import { Router } from "express";
import { prisma } from "../lib/prisma";

export const academicsRouter = Router();

/** Public — needed for the club-creation dropdown. */
academicsRouter.get("/departments", async (_req, res) => {
  const departments = await prisma.department.findMany({
    include: { branches: true },
    orderBy: { name: "asc" },
  });
  res.json(departments);
});

/** Public — needed for tagging an event to the subject its attendance counts toward. */
academicsRouter.get("/subjects", async (_req, res) => {
  const subjects = await prisma.subject.findMany({
    include: { branch: { include: { department: true } } },
    orderBy: { name: "asc" },
  });
  res.json(subjects);
});
