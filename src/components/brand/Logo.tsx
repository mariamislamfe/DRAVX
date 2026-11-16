import type { CSSProperties } from "react";
import { BRAND } from "@/config/brand";

const ASSETS = {
  mark: { src: "/brand/logo-mark.png", ratio: 602 / 543 },
  wordmark: { src: "/brand/logo-wordmark.png", ratio: 827 / 187 },
  full: { src: "/brand/logo-full.png", ratio: 827 / 768 },
} as const;

/**
 * The DRAVX logo, rendered as a CSS mask so it always takes `currentColor`
 * (works with blend modes, hover colours and both themes).
 */
export function Logo({
  variant = "wordmark",
  height,
  width,
  className,
  style,
  decorative,
}: {
  variant?: keyof typeof ASSETS;
  height?: number | string;
  width?: number | string;
  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
}) {
  const a = ASSETS[variant];
  const mask = `url(${a.src}) center / contain no-repeat`;
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : BRAND.name}
      aria-hidden={decorative || undefined}
      className={className}
      style={{
        display: "inline-block",
        aspectRatio: `${a.ratio}`,
        height,
        width,
        backgroundColor: "currentColor",
        WebkitMask: mask,
        mask,
        ...style,
      }}
    />
  );
}
