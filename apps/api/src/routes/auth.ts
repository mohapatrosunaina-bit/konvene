import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabaseAdmin";

export const authRouter = Router();

/**
 * Signup delegates identity entirely to Supabase Auth: it owns the password
 * (hashed, verified, rotated — none of that touches our code) and issues the
 * session token. We only keep the app-specific row (role assignments,
 * student profile, etc.) here, keyed by the same id Supabase assigned.
 * `email_confirm: true` skips Supabase's email-confirmation flow, since this
 * app has no transactional email set up yet (Phase 1).
 */
const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  usn: z.string().optional(),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, email, password, usn } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return res.status(409).json({ error: createError?.message ?? "Could not create account" });
  }

  try {
    await prisma.user.create({
      data: {
        id: created.user.id,
        name,
        email,
        usn,
        roleAssignments: { create: { role: "STUDENT", scopeType: "GLOBAL" } },
      },
    });
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    throw err;
  }

  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (signInError || !session.session) {
    return res.status(500).json({ error: "Account created but sign-in failed — try logging in." });
  }

  res.status(201).json({
    token: session.session.access_token,
    refreshToken: session.session.refresh_token,
    user: { id: created.user.id, name, email },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const { data: session, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error || !session.session) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return res.status(404).json({ error: "Account exists in auth but has no app profile" });

  res.json({
    token: session.session.access_token,
    refreshToken: session.session.refresh_token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});
