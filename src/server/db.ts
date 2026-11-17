/**
 * DATA STORE. Two backends, same data shape:
 *
 *  - Neon Postgres (when DATABASE_URL is set): the store is one jsonb row,
 *    uploads are rows in an `uploads` table. Use this on Vercel or any
 *    serverless host. See src/server/neon.ts.
 *  - Local files otherwise:
 *      <DATA_DIR>/store.json   catalog, categories, customizer templates, orders, settings
 *      <DATA_DIR>/uploads/     product photos and customer designs
 *    DATA_DIR defaults to ./data and must be on a persistent disk.
 *
 * Every read/write in the app goes through the functions below.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { SEED_PRODUCTS } from "@/data/products";
import type { Catalog, CustomTemplate, DB } from "@/data/schema";
import { neonCreate, neonRead, neonWrite, neonEnabled } from "./neon";

export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? path.join(process.cwd(), "data"));
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const FILE = path.join(DATA_DIR, "store.json");

function seed(): DB {
  return {
    version: 1,
    seq: 1000,
    settings: { shippingFee: 10, freeShippingThreshold: 150, customizerEnabled: true },
    categories: [
      { id: "hoodies", name: "Hoodies", description: "Oversized. Quiet front, loud back.", order: 1, active: true },
    ],
    products: SEED_PRODUCTS,
    templates: [seedTemplate()],
    orders: [],
  };
}

/** The oversized hoodie blank, photographed in white and black. */
function seedTemplate(): CustomTemplate {
  return {
    id: "custom-hoodie",
    name: "Custom Hoodie",
    categoryId: "hoodies",
    description: "Our oversized hoodie blank, printed with your artwork.",
    basePrice: 80,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: SEED_COLORS,
    views: [
      {
        side: "front",
        enabled: true,
        mockup: "/customizer/hoodie-white-front.webp",
        mockupW: 1000,
        mockupH: 1150,
        area: { x: 0.34, y: 0.3, w: 0.32, h: 0.26 },
        printWidthCm: 26,
        printPrice: 10,
      },
      {
        side: "back",
        enabled: true,
        mockup: "/customizer/hoodie-white-back.webp",
        mockupW: 1000,
        mockupH: 1150,
        area: { x: 0.3, y: 0.3, w: 0.4, h: 0.44 },
        printWidthCm: 33,
        printPrice: 15,
      },
    ],
    // colours added later without their own photos get the white mockup tinted
    tint: true,
    active: true,
    order: 1,
  };
}

const SEED_COLORS = [
  {
    id: "white",
    name: "White",
    hex: "#f2f2f0",
    photos: { front: "/customizer/hoodie-white-front.webp", back: "/customizer/hoodie-white-back.webp" },
  },
  {
    id: "black",
    name: "Black",
    hex: "#141416",
    photos: { front: "/customizer/hoodie-black-front.webp", back: "/customizer/hoodie-black-back.webp" },
  },
];

/** Bring stores created by older versions up to date. Returns true if changed. */
function upgrade(db: DB): boolean {
  let changed = false;
  for (const t of db.templates) {
    // the first customizer shipped with flat vector blanks; swap in the photos
    if (t.views.some((v) => /^\/customizer\/hoodie-(front|back)\.svg$/.test(v.mockup))) {
      const s = seedTemplate();
      t.views = s.views.map((v) => ({ ...v, enabled: t.views.find((x) => x.side === v.side)?.enabled ?? v.enabled }));
      t.colors = s.colors;
      changed = true;
    }
  }
  return changed;
}

let cache: { db: DB; mtime: number } | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DB> {
  try {
    const stat = await fs.stat(FILE);
    if (cache && cache.mtime === stat.mtimeMs) return cache.db;
    const db = JSON.parse(await fs.readFile(FILE, "utf8")) as DB;
    if (upgrade(db)) {
      await persist(db);
      return db;
    }
    cache = { db, mtime: stat.mtimeMs };
    return db;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const db = seed();
    await persist(db);
    return db;
  }
}

async function persist(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  // Windows refuses the rename while another reader has the file open; retry briefly
  for (let i = 0; ; i++) {
    try {
      await fs.rename(tmp, FILE);
      break;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (i >= 6 || (code !== "EPERM" && code !== "EBUSY" && code !== "EACCES")) {
        await fs.rm(tmp, { force: true });
        throw e;
      }
      await new Promise((r) => setTimeout(r, 25 * (i + 1)));
    }
  }
  const stat = await fs.stat(FILE);
  cache = { db, mtime: stat.mtimeMs };
}

/* --- Neon: one jsonb row, optimistic locking ------------------------ */

async function remoteLoad(): Promise<{ db: DB }> {
  for (let i = 0; i < 5; i++) {
    const row = await neonRead<DB>();
    if (row) {
      if (upgrade(row.data) && !(await neonWrite(row.data, row.version))) continue;
      return { db: row.data };
    }
    // first run on an empty project: seed it
    await neonCreate(seed());
  }
  throw new Error("Couldn't load the store from the database.");
}

async function remoteMutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  for (let i = 0; i < 8; i++) {
    const row = await neonRead<DB>();
    if (!row) {
      await remoteLoad();
      continue;
    }
    upgrade(row.data);
    const out = await fn(row.data);
    if (await neonWrite(row.data, row.version)) return out;
    // someone else wrote in between (another serverless instance): redo on fresh data
    await new Promise((r) => setTimeout(r, 30 * (i + 1) + Math.random() * 40));
  }
  throw new Error("The store is busy, please try again.");
}

/* --- public API ---------------------------------------------------------- */

/** Read-only snapshot. Don't mutate the result; use `mutate`. */
export async function readDB(): Promise<DB> {
  if (neonEnabled()) return (await remoteLoad()).db;
  await queue.catch(() => {});
  return load();
}

/**
 * Serialised read-modify-write. The callback may mutate `db` in place.
 * With Neon it can run more than once (on a write conflict), so keep it
 * free of side effects other than changing `db`.
 */
export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    if (neonEnabled()) return remoteMutate(fn);
    const db = structuredClone(await load());
    const out = await fn(db);
    await persist(db);
    return out;
  });
  queue = run.catch(() => {});
  return run;
}

/** Public catalog for the storefront: only active items. */
export async function getCatalog(): Promise<Catalog> {
  const db = await readDB();
  const cats = db.categories.filter((c) => c.active).sort((a, b) => a.order - b.order);
  const catIds = new Set(cats.map((c) => c.id));
  return {
    settings: db.settings,
    categories: cats,
    products: db.products.filter((p) => p.active && catIds.has(p.categoryId)).sort((a, b) => a.rank - b.rank),
    templates: db.settings.customizerEnabled
      ? db.templates.filter((t) => t.active && t.views.some((v) => v.enabled)).sort((a, b) => a.order - b.order)
      : [],
  };
}
