import { useId } from "react";
import type { World } from "@/data/products";

/**
 * Parametric garment render used until real product photography is supplied.
 * It draws the garment (colour, cut, hood, pocket, drawcords) faithfully, but
 * the original artwork is NOT recreated: the back print and the Rex chest
 * graphic are shown as labelled print zones so nothing is invented.
 * The Third Eye's minimal chest eye is drawn as a simple symbol.
 */

export type RenderView = "front" | "back";
export type RenderCrop = "full" | "chest" | "print";

type Props = {
  world: World;
  view?: RenderView;
  crop?: RenderCrop;
  variant?: string;
  className?: string;
  title?: string;
};

const PALETTE = {
  daydream: { body: "#9a9893", shade: "#7d7b77", deep: "#5f5d5a", light: "#b4b2ad", lining: "#55534f", cord: "#e9e6df" },
  nightshift: { body: "#1a1a1d", shade: "#111113", deep: "#070708", light: "#2a2a2f", lining: "#050506", cord: "#1f1f23" },
};

const VIEWBOX: Record<World, Record<RenderCrop, string>> = {
  daydream: { full: "0 0 600 700", chest: "296 196 140 120", print: "160 190 280 360" },
  nightshift: { full: "0 0 600 700", chest: "226 210 148 110", print: "160 190 280 360" },
};

const CRAYON = ["#ff5b1f", "#ffd23f", "#3ec46d", "#ff7eb6", "#2fb7ff", "#8b5cf6"];

function scribble(seed: number, x: number, y: number, w: number, h: number, rows: number) {
  // deterministic zig-zag crayon fill
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    const yy = y + (h / rows) * r + rnd() * 6;
    let d = `M${x - 10} ${yy.toFixed(1)}`;
    for (let i = 0; i < 9; i++) {
      d += ` L${(x + (w / 8) * i + rnd() * 10).toFixed(1)} ${(yy + (i % 2 ? 18 : -8) + rnd() * 8).toFixed(1)}`;
    }
    out.push(d);
  }
  return out;
}

export function HoodieRender({ world, view = "front", crop = "full", variant, className, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const c = PALETTE[world];
  const id = (n: string) => `${n}-${uid}`;
  const isBack = view === "back";
  const v = variant ?? "vision-01";

  return (
    <svg
      viewBox={VIEWBOX[world][crop]}
      className={className}
      role="img"
      aria-label={title ?? `${world === "daydream" ? "Heather grey" : "Black"} hoodie, ${view} view (render)`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={id("vol")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.22" stopColor="#000" stopOpacity="0" />
          <stop offset="0.55" stopColor="#fff" stopOpacity={world === "daydream" ? 0.08 : 0.05} />
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={id("drop")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <pattern id={id("rib")} width="7" height="10" patternUnits="userSpaceOnUse">
          <rect width="7" height="10" fill={c.shade} />
          <rect width="2" height="10" fill={c.deep} opacity="0.55" />
        </pattern>
        <radialGradient id={id("glow")} cx="0.5" cy={v === "vision-02" ? "0.3" : "0.5"} r="0.6">
          <stop offset="0" stopColor="#7fb2ff" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#2d6bff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#2d6bff" stopOpacity="0" />
        </radialGradient>
        <pattern id={id("dots")} width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.6" fill="#2d6bff" />
        </pattern>
        <clipPath id={id("zone")}>
          <rect x="196" y="236" width="208" height="270" rx="2" />
        </clipPath>
        <clipPath id={id("chestzone")}>
          <rect x="336" y="236" width="58" height="46" rx="2" />
        </clipPath>
      </defs>

      {/* sleeves */}
      <g>
        <path d="M178 150 C140 156 112 176 100 222 L58 548 L128 562 L164 322 Z" fill={c.body} />
        <path d="M422 150 C460 156 488 176 500 222 L542 548 L472 562 L436 322 Z" fill={c.body} />
        <path d="M178 150 C140 156 112 176 100 222 L58 548 L128 562 L164 322 Z" fill={`url(#${id("vol")})`} />
        <path d="M422 150 C460 156 488 176 500 222 L542 548 L472 562 L436 322 Z" fill={`url(#${id("vol")})`} />
        <path d="M56 540 L130 554 L124 606 L50 594 Z" fill={`url(#${id("rib")})`} />
        <path d="M544 540 L470 554 L476 606 L550 594 Z" fill={`url(#${id("rib")})`} />
        {/* sleeve folds */}
        <g stroke={c.deep} strokeOpacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M96 300 C110 310 128 312 142 306" />
          <path d="M82 420 C98 432 116 432 132 424" />
          <path d="M504 300 C490 310 472 312 458 306" />
          <path d="M518 420 C502 432 484 432 468 424" />
        </g>
      </g>

      {/* torso */}
      <path
        d="M178 150 L422 150 C432 200 438 250 438 322 L446 604 L154 604 L162 322 C162 250 168 200 178 150 Z"
        fill={c.body}
      />
      <path
        d="M178 150 L422 150 C432 200 438 250 438 322 L446 604 L154 604 L162 322 C162 250 168 200 178 150 Z"
        fill={`url(#${id("vol")})`}
      />
      <path d="M154 520 L446 520 L446 604 L154 604 Z" fill={`url(#${id("drop")})`} />
      <path d="M152 598 L448 598 L450 652 L150 652 Z" fill={`url(#${id("rib")})`} />
      {/* dropped-shoulder seams */}
      <g stroke={c.deep} strokeOpacity="0.5" strokeWidth="1.5" fill="none">
        <path d="M176 156 C170 210 166 270 164 322" strokeDasharray="3 4" />
        <path d="M424 156 C430 210 434 270 436 322" strokeDasharray="3 4" />
      </g>
      {/* torso folds */}
      <g stroke={c.deep} strokeOpacity="0.28" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M184 470 C200 500 206 540 204 590" />
        <path d="M416 470 C400 500 394 540 396 590" />
        <path d="M250 560 C262 574 270 588 272 598" />
      </g>

      {isBack ? (
        <>
          {/* back print zone */}
          <BackPrint world={world} variant={v} id={id} />
          {/* hood, seen from behind */}
          <ellipse cx="300" cy="196" rx="112" ry="22" fill="#000" opacity="0.22" />
          <path
            d="M206 178 C184 92 234 34 300 34 C366 34 416 92 394 178 C360 204 240 204 206 178 Z"
            fill={c.body}
          />
          <path
            d="M206 178 C184 92 234 34 300 34 C366 34 416 92 394 178 C360 204 240 204 206 178 Z"
            fill={`url(#${id("vol")})`}
          />
          <path d="M300 38 L300 196" stroke={c.deep} strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="3 4" />
          <path d="M226 110 C236 150 262 176 290 186" stroke={c.deep} strokeOpacity="0.25" strokeWidth="2.5" fill="none" />
        </>
      ) : (
        <>
          {/* hood + opening */}
          <path d="M206 170 C190 92 236 40 300 40 C364 40 410 92 394 170 Z" fill={c.shade} />
          <path
            d="M232 170 C230 110 260 78 300 78 C340 78 370 110 368 170 C346 198 254 198 232 170 Z"
            fill={c.lining}
          />
          <path d="M206 170 C230 214 370 214 394 170" stroke={c.light} strokeOpacity="0.6" strokeWidth="9" fill="none" />
          <path d="M206 170 C230 214 370 214 394 170" stroke={c.deep} strokeOpacity="0.6" strokeWidth="1.5" fill="none" />
          {/* drawcords */}
          <g stroke={c.cord} strokeWidth="5" strokeLinecap="round" fill="none">
            <path d="M280 200 C278 240 277 272 276 304" />
            <path d="M320 200 C322 240 323 272 324 304" />
          </g>
          <g fill={world === "daydream" ? "#d9d5cc" : "#2a2a30"}>
            <rect x="272" y="302" width="8" height="16" rx="2" />
            <rect x="320" y="302" width="8" height="16" rx="2" />
          </g>
          {/* kangaroo pocket */}
          <path
            d="M208 432 L392 432 C398 472 410 512 422 560 L178 560 C190 512 202 472 208 432 Z"
            fill={c.shade}
            opacity="0.55"
          />
          <g stroke={c.deep} strokeOpacity="0.7" strokeWidth="1.6" fill="none">
            <path d="M208 432 L392 432" strokeDasharray="3 4" />
            <path d="M208 432 C202 472 190 512 178 560" />
            <path d="M392 432 C398 472 410 512 422 560" />
          </g>
          <FrontPrint world={world} id={id} />
        </>
      )}
    </svg>
  );
}

function FrontPrint({ world, id }: { world: World; id: (n: string) => string }) {
  if (world === "nightshift") {
    // Minimal electric-blue eye symbol (described in the brief)
    return (
      <g transform="translate(300 262)" fill="none" stroke="#2d6bff" strokeWidth="3.2" strokeLinecap="round">
        <path d="M-34 0 C-18 -20 18 -20 34 0 C18 20 -18 20 -34 0 Z" />
        <circle r="8.5" fill="#2d6bff" stroke="none" />
        <circle r="3" cx="-2.5" cy="-2.5" fill="#cfe0ff" stroke="none" />
      </g>
    );
  }
  // Rex chest graphic — print zone only (original art not recreated)
  return (
    <g>
      <g clipPath={`url(#${id("chestzone")})`}>
        <rect x="336" y="236" width="58" height="46" fill="#e9e6df" opacity="0.9" />
        {scribble(7, 336, 240, 58, 40, 4).map((d, i) => (
          <path key={i} d={d} stroke={CRAYON[i % CRAYON.length]} strokeWidth="5" fill="none" strokeLinejoin="round" opacity="0.85" />
        ))}
      </g>
      <rect x="336" y="236" width="58" height="46" fill="none" stroke="#0b0b0c" strokeOpacity="0.55" strokeDasharray="3 3" />
    </g>
  );
}

function BackPrint({ world, variant, id }: { world: World; variant: string; id: (n: string) => string }) {
  if (world === "daydream") {
    return (
      <g>
        <g clipPath={`url(#${id("zone")})`}>
          <rect x="196" y="236" width="208" height="270" fill="#ece8de" />
          {scribble(3, 196, 250, 208, 240, 13).map((d, i) => (
            <path key={i} d={d} stroke={CRAYON[i % CRAYON.length]} strokeWidth="11" fill="none" strokeLinejoin="round" opacity="0.82" />
          ))}
        </g>
        <rect x="196" y="236" width="208" height="270" fill="none" stroke="#0b0b0c" strokeWidth="1.5" strokeDasharray="5 5" />
        <ZoneLabel x={204} y={498} text="BACK ARTWORK · DINO" dark />
      </g>
    );
  }
  return (
    <g>
      <g clipPath={`url(#${id("zone")})`}>
        <rect x="196" y="236" width="208" height="270" fill="#06070c" />
        <rect x="196" y="236" width="208" height="270" fill={`url(#${id("dots")})`} opacity="0.45" />
        {variant === "vision-02" ? (
          <rect x="270" y="236" width="60" height="270" fill={`url(#${id("glow")})`} />
        ) : variant === "vision-03" ? (
          <g fill="none" stroke="#2d6bff">
            <circle cx="300" cy="370" r="88" strokeWidth="10" opacity="0.9" />
            <circle cx="300" cy="370" r="58" strokeWidth="3" opacity="0.6" />
          </g>
        ) : (
          <rect x="196" y="236" width="208" height="270" fill={`url(#${id("glow")})`} />
        )}
        {Array.from({ length: 18 }).map((_, i) => (
          <rect key={i} x="196" y={240 + i * 15} width="208" height="1.2" fill="#9cc0ff" opacity="0.18" />
        ))}
      </g>
      <rect x="196" y="236" width="208" height="270" fill="none" stroke="#2d6bff" strokeWidth="1.5" strokeDasharray="5 5" />
      <ZoneLabel x={204} y={498} text={`BACK ARTWORK · ${variant.toUpperCase().replace("-", " ")}`} />
    </g>
  );
}

function ZoneLabel({ x, y, text, dark }: { x: number; y: number; text: string; dark?: boolean }) {
  return (
    <g>
      <rect x={x - 3} y={y - 11} width={text.length * 6.2 + 8} height="15" fill={dark ? "#0b0b0c" : "#2d6bff"} />
      <text
        x={x + 1}
        y={y}
        fontSize="9.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill={dark ? "#e9e6df" : "#050506"}
        letterSpacing="0.6"
      >
        {text}
      </text>
    </g>
  );
}
