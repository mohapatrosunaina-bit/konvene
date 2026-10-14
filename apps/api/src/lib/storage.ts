import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CERT_BUCKET = "certificates";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

const LOCAL_DIR = path.join(__dirname, "..", "..", "uploads", "certificates");

/**
 * Certificates must survive across requests/deploys, which rules out writing
 * to local disk on serverless hosts (the filesystem is ephemeral there).
 * When Supabase credentials are configured, upload to Supabase Storage and
 * return its public URL; otherwise fall back to local disk for zero-setup
 * local dev.
 */
export async function saveCertificatePdf(filename: string, buffer: Buffer): Promise<string> {
  if (supabase) {
    const { error } = await supabase.storage.from(CERT_BUCKET).upload(filename, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(CERT_BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  }

  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  const filePath = path.join(LOCAL_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/certificates/${filename}`;
}
