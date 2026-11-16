# Product imagery

All product images were extracted from the brand's reference mockups:

| File | What it is | Used for |
| --- | --- | --- |
| `front.webp`, `back*.webp` | The garment on its original studio backdrop, padded to 4:5 | Fallback / reference |
| `*-cut.webp` | Same garment with the backdrop removed, fitted to a shared 1000×1150 canvas | Every staged view (cards, PDP stage, hero, 3D flip). The shared canvas lets different hoodies line up exactly |
| `detail-*.webp` | Close-up crops (chest logo, back print) | PDP detail shots, campaign frames |

Third Eye back designs each have their own `back-<variant>.webp` + cut-out:
`main-design`, `eyes-focus`, `silhouette-energy`, `minimal-symbol`.

## Still missing: real photography

- **Model / lookbook shots.** The "Lookbook" slot and the campaign frames stage the cut-out on a styled backdrop, labelled "campaign shoot pending".
- **Higher resolution.** The variant mockups in the reference sheet were small (~320 px wide). They are upscaled but will look soft on large retina screens. Replace them with full-size exports when you have them.

## Replacing images

Keep the same filenames, or point `src` / `cutout` in `src/data/products.ts` at new files.
For a model shot, add `src` to the `kind: "model"` entry and it replaces the staged version everywhere.

After replacing files that keep the same name, clear `.next/cache/images` locally so the image optimizer doesn't serve old versions.
