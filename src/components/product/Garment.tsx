import Image from "next/image";
import { getCutout, getImage, type Product } from "@/data/products";
import { HoodieRender } from "./HoodieRender";

type Props = {
  product: Product;
  view?: "front" | "back";
  variant?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** decorative (aria-hidden) when used purely as art direction */
  decorative?: boolean;
};

/**
 * The garment on its own, background removed. All cut-outs share one
 * 1000×1150 canvas so different hoodies line up exactly when layered.
 */
export function Garment({ product, view = "back", variant, className, priority, sizes = "(max-width: 900px) 90vw, 45vw", decorative }: Props) {
  const src = getCutout(product, view, variant);
  const alt = decorative ? "" : getImage(product, view, variant).alt;
  return (
    <div className={className} style={{ position: "relative", aspectRatio: "1000 / 1150", width: "100%" }} aria-hidden={decorative || undefined}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "contain" }} draggable={false} />
      ) : !hasPhotos(product) ? (
        <PhotoPending name={product.shortName} />
      ) : (
        <HoodieRender world={product.world} view={view} variant={variant} />
      )}
    </div>
  );
}

/** Products added from the dashboard before their photos are uploaded. */
export const hasPhotos = (p: Product) => p.images.some((i) => i.src || i.cutout);

export function PhotoPending({ name }: { name: string }) {
  return (
    <div
      style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", padding: 16, color: "var(--muted)" }}
      role="img"
      aria-label={`${name}, photo coming soon`}
    >
      <span>
        <span className="display" style={{ display: "block", fontSize: "var(--step-2)", color: "var(--fg)" }}>
          {name}
        </span>
        <span className="mono" style={{ fontSize: "0.66rem" }}>
          Photo coming soon
        </span>
      </span>
    </div>
  );
}
