/**
 * Neon (Postgres) backend, used when DATABASE_URL is set.
 *
 *  - The whole store lives in one row of the `store` table (jsonb), with a
 *    version number for optimistic locking, so concurrent serverless
 *    instances never overwrite each other's orders.
 *  - Uploads (product photos, customer designs) live in the `uploads` table
 *    and are served through /uploads/<name>, so URLs are the same as with
 *    local files.
 *
 * Tables are created automatically on first use; nothing to run by hand.
 * DATABASE_URL is server-only; never expose it with a NEXT_PUBLIC_ prefix.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const ROW = 1;
let client: NeonQueryFunction<false, false> | null = null;
let ready: Promise<void> | null = null;

export function neonEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

async function db() {
  if (!client) client = neon(process.env.DATABASE_URL!);
  const sql = client;
  if (!ready) {
    ready = (async () => {
      await sql`create table if not exists store (
        id integer primary key,
        data jsonb not null,
        version integer not null default 1,
        updated_at timestamptz not null default now()
      )`;
      await sql`create table if not exists uploads (
        name text primary key,
        type text not null,
        data bytea not null,
        created_at timestamptz not null default now()
      )`;
    })();
    ready.catch(() => (ready = null)); // retry next time if the database was unreachable
  }
  await ready;
  return sql;
}

/* --- store ------------------------------------------------------------- */

export async function neonRead<T>(): Promise<{ data: T; version: number } | null> {
  const sql = await db();
  const rows = await sql`select data, version from store where id = ${ROW}`;
  return rows[0] ? { data: rows[0].data as T, version: Number(rows[0].version) } : null;
}

/** Insert the first version. Returns false if another instance got there first. */
export async function neonCreate<T>(data: T): Promise<boolean> {
  const sql = await db();
  const rows = await sql`insert into store (id, data, version) values (${ROW}, ${JSON.stringify(data)}::jsonb, 1)
    on conflict (id) do nothing returning id`;
  return rows.length > 0;
}

/** Write only if nobody else wrote since `version`. Returns false on conflict. */
export async function neonWrite<T>(data: T, version: number): Promise<boolean> {
  const sql = await db();
  const rows = await sql`update store set data = ${JSON.stringify(data)}::jsonb, version = version + 1, updated_at = now()
    where id = ${ROW} and version = ${version} returning version`;
  return rows.length > 0;
}

/* --- uploads ----------------------------------------------------------- */

export async function neonSaveFile(name: string, type: string, buf: Buffer) {
  const sql = await db();
  await sql`insert into uploads (name, type, data) values (${name}, ${type}, decode(${buf.toString("base64")}, 'base64'))`;
}

export async function neonReadFile(name: string): Promise<Buffer | null> {
  const sql = await db();
  const rows = await sql`select encode(data, 'base64') as b64 from uploads where name = ${name}`;
  return rows[0] ? Buffer.from(rows[0].b64 as string, "base64") : null;
}

export async function neonFileExists(name: string) {
  const sql = await db();
  const rows = await sql`select 1 from uploads where name = ${name}`;
  return rows.length > 0;
}
