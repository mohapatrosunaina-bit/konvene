import { Router } from "express";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, loadRoles, hasScopedRole } from "../lib/rbac";
import { saveCertificatePdf } from "../lib/storage";

export const certificatesRouter = Router();

function newCertId(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

/** Renders the certificate to a PDF buffer, then hands it to storage (Supabase in prod, local disk in dev). */
async function renderCertificatePdf(opts: {
  certId: string;
  studentName: string;
  eventTitle: string;
  eventDate: string;
  verifyUrl: string;
}): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(opts.verifyUrl, { margin: 1 });
  const qrImage = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0b0b14");
    doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).lineWidth(1.5).stroke("#7c5cff");

    doc.fillColor("#7c5cff").fontSize(14).font("Helvetica-Bold").text("KONVENE", 0, 70, { align: "center" });
    doc.fillColor("#ffffff").fontSize(30).font("Helvetica-Bold").text("Certificate of Participation", 0, 110, { align: "center" });
    doc.fillColor("#b8b8c8").fontSize(14).font("Helvetica").text("This certifies that", 0, 175, { align: "center" });
    doc.fillColor("#ffffff").fontSize(26).font("Helvetica-Bold").text(opts.studentName, 0, 205, { align: "center" });
    doc.fillColor("#b8b8c8").fontSize(14).font("Helvetica").text(
      `successfully participated in "${opts.eventTitle}" held on ${opts.eventDate}.`,
      80,
      250,
      { align: "center", width: doc.page.width - 160 }
    );

    doc.image(qrImage, doc.page.width - 150, doc.page.height - 150, { width: 90 });
    doc.fillColor("#7c5cff").fontSize(9).text(`Certificate ID: ${opts.certId}`, doc.page.width - 160, doc.page.height - 55, { width: 110, align: "center" });
    doc.fillColor("#6b6b7d").fontSize(9).text("Verify at " + opts.verifyUrl, 40, doc.page.height - 55);

    doc.end();
  });

  return saveCertificatePdf(`${opts.certId}.pdf`, pdfBuffer);
}

/**
 * Issues certificates for every credited Attendance on an event that doesn't
 * already have one. Requires the caller to be the club head/coordinator/admin
 * for that event's club — no one else can bulk-mint certificates.
 */
certificatesRouter.post("/events/:eventId/issue-certificates", requireAuth, loadRoles, async (req: AuthedRequest, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (!hasScopedRole(req.roles, "CLUB_HEAD", "CLUB", event.clubId)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const eligible = await prisma.attendance.findMany({
    where: { eventId: event.id, certificate: null },
    include: { user: { select: { name: true } } },
  });

  const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
  const issued = [];
  for (const attendance of eligible) {
    const certId = newCertId();
    const verifyUrl = `${webOrigin}/verify/${certId}`;
    const pdfUrl = await renderCertificatePdf({
      certId,
      studentName: attendance.user.name,
      eventTitle: event.title,
      eventDate: event.startAt.toDateString(),
      verifyUrl,
    });
    const cert = await prisma.certificate.create({
      data: {
        certId,
        userId: attendance.userId,
        eventId: event.id,
        attendanceId: attendance.id,
        pdfUrl,
      },
    });
    issued.push(cert);
  }

  res.status(201).json({ issuedCount: issued.length, certificates: issued });
});

/** Public — no auth. Anyone holding a certificate ID (e.g. a recruiter) can confirm it's real. */
certificatesRouter.get("/verify/:certId", async (req, res) => {
  const cert = await prisma.certificate.findUnique({
    where: { certId: req.params.certId },
    include: { user: { select: { name: true } }, event: { include: { club: true } } },
  });
  if (!cert) return res.status(404).json({ valid: false });

  res.json({
    valid: true,
    holderName: cert.user.name,
    eventTitle: cert.event.title,
    club: cert.event.club.name,
    issuedAt: cert.issuedAt,
    certId: cert.certId,
  });
});
