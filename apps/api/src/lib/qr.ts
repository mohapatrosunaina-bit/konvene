import crypto from "crypto";

const SECRET = process.env.QR_SIGNING_SECRET!;
if (!SECRET) throw new Error("QR_SIGNING_SECRET is not set");

/**
 * Ticket QR tokens are "<ticketId>.<base64url HMAC-SHA256 signature>".
 * The signature binds the token to this server's secret so a QR image cannot
 * be forged by encoding an arbitrary ticketId — the scanner recomputes the
 * HMAC and rejects anything that doesn't match before ever touching the DB.
 */
export function signTicketToken(ticketId: string): string {
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(ticketId)
    .digest("base64url");
  return `${ticketId}.${signature}`;
}

export function verifyTicketToken(token: string): { valid: boolean; ticketId?: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [ticketId, signature] = parts;
  if (!ticketId || !signature) return { valid: false };

  const expected = crypto.createHmac("sha256", SECRET).update(ticketId).digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return { valid: false };
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return { valid: false };

  return { valid: true, ticketId };
}
