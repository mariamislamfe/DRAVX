/**
 * Canvas helpers for the customizer: tinting the blank mockup and exporting
 * the print file + the mockup preview. Browser only.
 */
import type { TemplateView } from "@/data/schema";

export const PRINT_DPI = 150;
const MAX_PRINT_PX = 4800;

export type ImageLayer = {
  id: string;
  type: "image";
  file: File;
  url: string; // object URL
  natW: number;
  natH: number;
  /** centre, as a fraction of the print area */
  x: number;
  y: number;
  /** width as a fraction of the print area width */
  w: number;
  rot: number;
};

export type TextLayer = {
  id: string;
  type: "text";
  text: string;
  color: string;
  font: "display" | "body" | "serif" | "hand" | "mono";
  x: number;
  y: number;
  /** font size as a fraction of the print area width */
  size: number;
  rot: number;
};

export type Layer = ImageLayer | TextLayer;

export const FONTS: Record<TextLayer["font"], { label: string; css: string; weight: number }> = {
  display: { label: "Block", css: "var(--f-display), Impact, sans-serif", weight: 900 },
  body: { label: "Clean", css: "var(--f-body), system-ui, sans-serif", weight: 600 },
  serif: { label: "Serif", css: "var(--f-serif), Georgia, serif", weight: 400 },
  hand: { label: "Marker", css: "var(--f-hand), cursive", weight: 400 },
  mono: { label: "Mono", css: "var(--f-mono), monospace", weight: 500 },
};

const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((res, rej) => {
      const i = new Image();
      i.decoding = "async";
      i.onload = () => res(i);
      i.onerror = () => rej(new Error(`Could not load ${src}`));
      i.src = src;
    });
    imgCache.set(src, p);
    p.catch(() => imgCache.delete(src));
  }
  return p;
}

export type MockupSource = { src: string; tint: string | null };

/** Garment in the chosen colour: its own photo, or the light mockup tinted. */
export async function drawMockup(ctx: CanvasRenderingContext2D, mock: MockupSource, w: number, h: number) {
  const img = await loadImage(mock.src);
  const color = mock.tint;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  if (color) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    // dark colours swallow the folds; lift them back a little
    const n = parseInt(color.replace("#", ""), 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    if (lum < 0.35) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.14;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    // keep the garment's own transparency
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(img, 0, 0, w, h);
  }
  ctx.restore();
}

/** Resolve a text layer's real font stack (next/font hashes family names). */
export function resolveFont(font: TextLayer["font"], probe: HTMLElement | null) {
  if (!probe) return FONTS[font].css.replace(/var\([^)]*\),\s*/, "");
  const el = document.createElement("span");
  el.style.fontFamily = FONTS[font].css;
  probe.appendChild(el);
  const fam = getComputedStyle(el).fontFamily;
  el.remove();
  return fam;
}

/** Draw the layers into a box of size w × h (the print area). */
export async function drawLayers(ctx: CanvasRenderingContext2D, layers: Layer[], w: number, h: number, fontProbe: HTMLElement | null) {
  for (const l of layers) {
    ctx.save();
    ctx.translate(l.x * w, l.y * h);
    ctx.rotate((l.rot * Math.PI) / 180);
    if (l.type === "image") {
      const img = await loadImage(l.url);
      const dw = l.w * w;
      const dh = dw * (l.natH / l.natW);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      const px = l.size * w;
      const f = FONTS[l.font];
      ctx.font = `${f.weight} ${px}px ${resolveFont(l.font, fontProbe)}`;
      ctx.fillStyle = l.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = l.text.split("\n");
      const lh = px * 1.05;
      lines.forEach((t, i) => ctx.fillText(t, 0, (i - (lines.length - 1) / 2) * lh));
    }
    ctx.restore();
  }
}

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Export failed"))), "image/png"));
}

/** Tight bounding box of non-transparent pixels. */
function alphaBounds(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { data } = ctx.getImageData(0, 0, w, h);
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[row + x * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export type SideExport = {
  design: Blob;
  mockup: Blob;
  areaWidthCm: number;
  areaHeightCm: number;
  artWidthCm: number;
  artHeightCm: number;
  artTopCm: number;
  artLeftCm: number;
  dpi: number;
};

/**
 * Print file: the whole print area at PRINT_DPI on a transparent background,
 * so the printer only has to align its top-left corner with the area.
 * Mockup: the tinted garment with the design composited into the area.
 */
export async function exportSide(view: TemplateView, layers: Layer[], garment: MockupSource, fontProbe: HTMLElement | null): Promise<SideExport> {
  const aspect = (view.area.h * view.mockupH) / (view.area.w * view.mockupW); // h / w
  const areaWidthCm = view.printWidthCm;
  const areaHeightCm = areaWidthCm * aspect;
  let dpi = PRINT_DPI;
  let pw = Math.round((areaWidthCm / 2.54) * dpi);
  let ph = Math.round(pw * aspect);
  const scale = Math.min(1, MAX_PRINT_PX / Math.max(pw, ph));
  if (scale < 1) {
    pw = Math.round(pw * scale);
    ph = Math.round(ph * scale);
    dpi = Math.round(dpi * scale);
  }

  const print = document.createElement("canvas");
  print.width = pw;
  print.height = ph;
  const pctx = print.getContext("2d", { willReadFrequently: true })!;
  await drawLayers(pctx, layers, pw, ph, fontProbe);
  const b = alphaBounds(pctx, pw, ph);
  const cmPerPx = areaWidthCm / pw;

  const MW = 1200;
  const MH = Math.round((MW * view.mockupH) / view.mockupW);
  const mock = document.createElement("canvas");
  mock.width = MW;
  mock.height = MH;
  const mctx = mock.getContext("2d")!;
  await drawMockup(mctx, garment, MW, MH);
  mctx.drawImage(print, view.area.x * MW, view.area.y * MH, view.area.w * MW, view.area.h * MH);

  const r = (n: number) => Math.round(n * 10) / 10;
  return {
    design: await toBlob(print),
    mockup: await toBlob(mock),
    areaWidthCm: r(areaWidthCm),
    areaHeightCm: r(areaHeightCm),
    artWidthCm: r((b?.w ?? 0) * cmPerPx),
    artHeightCm: r((b?.h ?? 0) * cmPerPx),
    artTopCm: r((b?.y ?? 0) * cmPerPx),
    artLeftCm: r((b?.x ?? 0) * cmPerPx),
    dpi,
  };
}

export async function upload(file: Blob, name: string, scope: "design" | "admin" = "design"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, name);
  fd.append("scope", scope);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (res.status === 413) throw new Error(`“${name}” is too large to upload. Try a smaller file (under 4 MB).`);
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
  return json.url;
}
