/**
 * Dashboard sign-in.
 *
 * Password, in order of precedence:
 *  1. The one set in Dashboard → Settings → Password (stored as a scrypt hash
 *     in the data store, never in plain text).
 *  2. The ADMIN_PASSWORD environment variable.
 *  3. The default (123456) until either of the above is set; the dashboard
 *     shows a reminder to change it.
 * ADMIN_RECOVERY_PASSWORD (optional env) always works, for when the
 * dashboard password is forgotten.
 *
 * The session is an HMAC-signed expiry in an httpOnly cookie. The signing key
 * is derived from the current password, so changing it signs out every other
 * device.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { readDB } from "./db";

const COOKIE = "dravx_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
/** Used until a password is set, in development and production alike. */
export const DEFAULT_PASSWORD = "123456";
export const MIN_PASSWORD = 8;

export type PasswordHash = { hash: string; salt: string; changedAt: string };

export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString("hex");
  return { salt, hash: scryptSync(password, salt, 64).toString("hex"), changedAt: new Date().toISOString() };
}

const envPassword = () => process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

async function stored(): Promise<PasswordHash | undefined> {
  return (await readDB()).admin;
}

/** True while nobody has set a password (dashboard or env). */
export async function usingDefaultPassword() {
  return !(await stored()) && !process.env.ADMIN_PASSWORD;
}

async function secret() {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  const s = await stored();
  return createHash("sha256").update(`dravx|${s ? s.hash : envPassword()}`).digest("hex");
}

const sign = async (v: string) => createHmac("sha256", await secret()).update(v).digest("hex");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// compare hashes so length differences don't leak
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function checkPassword(input: string) {
  const recovery = process.env.ADMIN_RECOVERY_PASSWORD;
  if (recovery && safeEqual(sha(input), sha(recovery))) return true;
  const s = await stored();
  if (s) return safeEqual(scryptSync(input, s.salt, 64).toString("hex"), s.hash);
  return safeEqual(sha(input), sha(envPassword()));
}

export async function startSession() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  (await cookies()).set(COOKIE, `${exp}.${await sign(exp)}`, {
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
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || !safeEqual(sig, await sign(exp))) return false;
  return Number(exp) * 1000 > Date.now();
}

/** For pages and server actions. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
