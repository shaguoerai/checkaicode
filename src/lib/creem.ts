import crypto from "crypto";

export const CREEM_PRODUCT_ID = process.env.CREEM_PRODUCT_ID || "prod_21ucscjxbwrU6k7ZRkAVcR";
export const CREEM_API_BASE_URL =
  (process.env.CREEM_API_BASE_URL || "https://api.creem.io").replace(/\/$/, "");
export const CREEM_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_CREEM_PAYMENT_LINK ||
  "https://www.creem.io/payment/prod_21ucscjxbwrU6k7ZRkAVcR";

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://checkaicode.com";
}

export function verifyCreemSignature(payload: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;

  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expected = Buffer.from(signature.trim(), "hex");
  const actual = Buffer.from(computed, "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function parseDateOrFallback(value: unknown, fallbackDays: number) {
  if (typeof value === "string" && value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
}
