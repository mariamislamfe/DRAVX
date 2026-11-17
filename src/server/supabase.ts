/**
 * Supabase backend, used when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 *
 *  - The whole store lives in one row of the `store` table (jsonb), with a
 *    version number for optimistic locking, so concurrent serverless
 *    instances never overwrite each other's orders.
 *  - Uploads go to a private Storage bucket and are still served through
 *    /uploads/<name>, so URLs don't change between backends.
 *
 * Setup SQL: see supabase/schema.sql. The service-role key is server-only;
 * never expose it with a NEXT_PUBLIC_ prefix.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = process.env.SUPABASE_BUCKET || "uploads";
const ROW = 1;

let client: SupabaseClient | null = null;

export function supabaseEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function sb(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function sbRead<T>(): Promise<{ data: T; version: number } | null> {
  const { data, error } = await sb().from("store").select("data, version").eq("id", ROW).maybeSingle();
  if (error) throw new Error(`Supabase read failed: ${error.message}`);
  return data ? { data: data.data as T, version: data.version as number } : null;
}

/** Insert the first version. Returns false if another instance got there first. */
export async function sbCreate<T>(data: T): Promise<boolean> {
  const { error } = await sb().from("store").insert({ id: ROW, data, version: 1 });
  if (!error) return true;
  if (error.code === "23505") return false; // duplicate key
  throw new Error(`Supabase write failed: ${error.message}`);
}

/** Write only if nobody else wrote since `version`. Returns false on conflict. */
export async function sbWrite<T>(data: T, version: number): Promise<boolean> {
  const { data: rows, error } = await sb()
    .from("store")
    .update({ data, version: version + 1, updated_at: new Date().toISOString() })
    .eq("id", ROW)
    .eq("version", version)
    .select("version");
  if (error) throw new Error(`Supabase write failed: ${error.message}`);
  return (rows?.length ?? 0) > 0;
}
