import { NextResponse } from "next/server";
import { isAdmin } from "@/server/auth";
import { MAX_UPLOAD_BYTES, maxVideoBytes, saveUpload } from "@/server/uploads";

export const runtime = "nodejs";

/**
 * POST multipart/form-data { file, scope: "design" | "admin" }
 *  - design: customer artwork from the customizer (public)
 *  - admin:  product photos and mockups (dashboard session required)
 */
export async function POST(req: Request) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > Math.max(MAX_UPLOAD_BYTES, maxVideoBytes()) + 64 * 1024) return NextResponse.json({ error: "File is too large." }, { status: 413 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  const scope = form.get("scope") === "admin" ? "admin" : "design";
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (scope === "admin" && !(await isAdmin())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  // only the dashboard may send videos; their size is checked in saveUpload
  if (file.size > (scope === "admin" ? Math.max(MAX_UPLOAD_BYTES, maxVideoBytes()) : MAX_UPLOAD_BYTES))
    return NextResponse.json({ error: "File is too large." }, { status: 413 });

  try {
    const url = await saveUpload(Buffer.from(await file.arrayBuffer()), scope);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 415 });
  }
}
