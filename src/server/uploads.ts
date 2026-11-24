import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { UPLOAD_DIR } from "./db";
import { neonEnabled, neonFileExists, neonReadFile, neonSaveFile } from "./neon";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Videos (dashboard only). The database backend keeps files in Postgres, so stay modest there. */
export const maxVideoBytes = () => (neonEnabled() ? 15 : 80) * 1024 * 1024;

const TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
} as const;
export type UploadExt = keyof typeof TYPES;

/** Identify the file from its bytes, never from the name or the browser's claim. */
export function sniff(buf: Buffer): UploadExt | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 8) === "ftyp") return "mp4"; // ISO media (mp4 / mov / m4v)
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "webm";
  return null;
}

export const isVideo = (ext: UploadExt) => ext === "mp4" || ext === "webm";

const NAME_RE = /^(?:[a-z]+-)?[0-9a-f-]{36}\.(png|jpg|webp|mp4|webm)$/;

export function isUploadUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("/uploads/") && NAME_RE.test(url.slice("/uploads/".length));
}

export async function saveUpload(buf: Buffer, prefix: "design" | "admin"): Promise<string> {
  const ext = sniff(buf);
  if (!ext || (isVideo(ext) && prefix !== "admin")) throw new Error("Only PNG, JPG or WebP images are accepted.");
  if (isVideo(ext)) {
    if (buf.length > maxVideoBytes()) throw new Error(`Video is larger than ${maxVideoBytes() / 1024 / 1024} MB. Compress it or paste a link instead.`);
  } else if (buf.length > MAX_UPLOAD_BYTES) throw new Error("File is larger than 15 MB.");
  const name = `${prefix}-${randomUUID()}.${ext}`;
  if (neonEnabled()) {
    await neonSaveFile(name, TYPES[ext], buf);
    return `/uploads/${name}`;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

export async function readUpload(name: string) {
  if (!NAME_RE.test(name)) return null;
  const ext = name.split(".").pop() as UploadExt;
  try {
    if (neonEnabled()) {
      const buf = await neonReadFile(name);
      return buf ? { buf, type: TYPES[ext] } : null;
    }
    const buf = await fs.readFile(path.join(UPLOAD_DIR, name));
    return { buf, type: TYPES[ext] };
  } catch {
    return null;
  }
}

export async function uploadExists(url: string) {
  if (!isUploadUrl(url)) return false;
  if (neonEnabled()) return neonFileExists(url.slice("/uploads/".length));
  try {
    await fs.access(path.join(UPLOAD_DIR, url.slice("/uploads/".length)));
    return true;
  } catch {
    return false;
  }
}
