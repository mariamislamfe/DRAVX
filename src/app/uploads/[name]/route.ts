import { readUpload } from "@/server/uploads";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = await readUpload(name);
  if (!file) return new Response("Not found", { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  const size = file.buf.length;
  const headers: Record<string, string> = {
    "Content-Type": file.type,
    // file names are random UUIDs and never overwritten
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    ...(download ? { "Content-Disposition": `attachment; filename="${name}"` } : {}),
  };

  // byte ranges, so videos can stream and seek (Safari won't play without them)
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    }
    return new Response(new Uint8Array(file.buf.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(new Uint8Array(file.buf), { headers: { ...headers, "Content-Length": String(size) } });
}
