import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { clubsRouter } from "./routes/clubs";
import { eventsRouter } from "./routes/events";
import { registrationsRouter } from "./routes/registrations";
import { checkinRouter } from "./routes/checkin";
import { facultyRouter } from "./routes/faculty";
import { certificatesRouter } from "./routes/certificates";
import { statsRouter } from "./routes/stats";
import { academicsRouter } from "./routes/academics";

export const app = express();

// WEB_ORIGIN accepts a comma-separated list so local dev + the deployed
// frontend can both be allowed without a code change.
const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Local-dev fallback only: in production, certificate PDFs are served from
// Supabase Storage (see src/lib/storage.ts), so this route serves nothing.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_req, res) => res.json({ ok: true, service: "konvene-api" }));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/clubs", clubsRouter);
app.use("/events", eventsRouter);
app.use("/", registrationsRouter); // exposes /events/:eventId/register and /registrations/:id
app.use("/checkin", checkinRouter);
app.use("/faculty", facultyRouter);
app.use("/", certificatesRouter); // exposes /events/:id/issue-certificates and /verify/:certId
app.use("/", statsRouter); // exposes /stats
app.use("/", academicsRouter); // exposes /departments and /subjects
