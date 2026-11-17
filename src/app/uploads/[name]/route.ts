import { readUpload } from "@/server/uploads";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = await readUpload(name);
  if (!file) return new Response("Not found", { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  return new Response(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": file.type,
      "Content-Length": String(file.buf.length),
      // file names are random UUIDs and never overwritten
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(download ? { "Content-Disposition": `attachment; filename="${name}"` } : {}),
    },
  });
}
