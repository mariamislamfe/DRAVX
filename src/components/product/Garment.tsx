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
      ) : (
        <HoodieRender world={product.world} view={view} variant={variant} />
      )}
    </div>
  );
}
