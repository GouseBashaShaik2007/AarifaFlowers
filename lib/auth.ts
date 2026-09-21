// Single admin login. The password comes from the ADMIN_PASSWORD environment variable.
// A signed cookie keeps the admin logged in for 30 days.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "aarifa_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const isProd = process.env.NODE_ENV === "production";

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  if (p) return p;
  return isProd ? null : "admin123"; // development fallback only
}

function secret(): string {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "dev-only-secret";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export const loginConfigured = () => adminPassword() !== null;

export function passwordMatches(input: string): boolean {
  const pw = adminPassword();
  return pw !== null && safeEqual(input, pw);
}

export async function startSession(): Promise<void> {
  const expires = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const jar = await cookies();
  jar.set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return false;
  const [expires, sig] = raw.split(".");
  if (!expires || !sig) return false;
  if (!safeEqual(sig, sign(expires))) return false;
  return Number(expires) > Date.now();
}

/** For admin pages. Sends visitors who are not logged in to the login page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
