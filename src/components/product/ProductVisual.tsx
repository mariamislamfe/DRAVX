import Image from "next/image";
import { getImage, type ImageKind, type Product } from "@/data/products";
import { HoodieRender } from "./HoodieRender";
import styles from "./ProductVisual.module.css";

type Props = {
  product: Product;
  kind: ImageKind;
  variant?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** show the "pending" disclosure on slots without dedicated photography */
  tag?: boolean;
};

/**
 * Single entry point for product imagery:
 *  - front/back  → transparent cut-out staged on the world's surface
 *  - details     → close-up crop of the studio image
 *  - model/campaign → staged cut-out, labelled until the shoot exists
 */
export function ProductVisual({ product, kind, variant, className = "", priority, sizes = "(max-width: 900px) 100vw, 50vw", tag = true }: Props) {
  const scene = kind === "model" || kind === "campaign";
  const img = getImage(product, kind, variant);
  const backImg = getImage(product, "back", variant);

  // dedicated photography for this slot (e.g. a future model shoot)
  if (scene && img.src) {
    return (
      <div className={`${styles.frame} ${className}`} data-world={product.world}>
        <Image src={img.src} alt={img.alt} fill sizes={sizes} priority={priority} className={styles.photo} />
      </div>
    );
  }

  if (scene) {
    return (
      <div className={`${styles.frame} ${styles.scene} ${className}`} data-world={product.world} data-kind={kind}>
        <SceneBackdrop world={product.world} />
        <div className={styles.sceneGarment}>
          {backImg.cutout ? (
            <Image src={backImg.cutout} alt={img.alt} fill sizes={sizes} priority={priority} className={styles.cut} />
          ) : (
            <HoodieRender world={product.world} view="back" variant={variant} />
          )}
        </div>
        {tag && <span className={`${styles.tag} mono`}>Lookbook · campaign shoot pending</span>}
      </div>
    );
  }

  if ((kind === "front" || kind === "back") && img.cutout) {
    return (
      <div className={`${styles.frame} ${className}`} data-world={product.world} data-kind={kind}>
        <div className={styles.stageFloor} aria-hidden="true" />
        <div className={styles.garment}>
          <Image src={img.cutout} alt={img.alt} fill sizes={sizes} priority={priority} className={styles.cut} />
        </div>
      </div>
    );
  }

  if (img.src) {
    return (
      <div className={`${styles.frame} ${className}`} data-world={product.world} data-kind={kind}>
        <Image src={img.src} alt={img.alt} fill sizes={sizes} priority={priority} className={styles.photo} />
      </div>
    );
  }

  const view = kind === "back" || kind === "detail-back" ? "back" : "front";
  const crop = kind === "detail-front" ? "chest" : kind === "detail-back" ? "print" : "full";
  return (
    <div className={`${styles.frame} ${className}`} data-world={product.world} data-kind={kind}>
      <HoodieRender world={product.world} view={view} crop={crop} variant={variant} className={styles.render} title={img.alt} />
      {tag && <span className={`${styles.tag} mono`}>Render · photo pending</span>}
    </div>
  );
}

function SceneBackdrop({ world }: { world: Product["world"] }) {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      {world === "daydream" ? (
        <>
          <div className={styles.grid} />
          <span className={`${styles.scrawl} hand`}>this side up →</span>
          <span className={`${styles.scrawl2} hand`}>✳ the loud side</span>
        </>
      ) : (
        <>
          <div className={styles.beam} />
          <div className={styles.scan} />
        </>
      )}
    </div>
  );
}
