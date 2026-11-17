/**
 * Dashboard sign-in: one password from the ADMIN_PASSWORD env variable.
 * The session is an HMAC-signed expiry in an httpOnly cookie.
 * Until ADMIN_PASSWORD is set the default password (123456) works, and the
 * dashboard shows a reminder to change it.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "dravx_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
/** Used until ADMIN_PASSWORD is set, in development and production alike. */
export const DEFAULT_PASSWORD = "123456";

export function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export const usingDevPassword = () => !process.env.ADMIN_PASSWORD;

function secret() {
  return process.env.ADMIN_SECRET ?? createHash("sha256").update(`dravx|${adminPassword() ?? ""}`).digest("hex");
}

const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string) {
  const p = adminPassword();
  if (!p) return false;
  // compare hashes so length differences don't leak
  const h = (s: string) => createHash("sha256").update(s).digest("hex");
  return safeEqual(h(input), h(p));
}

export async function startSession() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminPassword()) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) * 1000 > Date.now();
}

/** For pages and server actions. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
