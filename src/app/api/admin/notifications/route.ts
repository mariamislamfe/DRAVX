import { NextResponse } from "next/server";
import { isAdmin } from "@/server/auth";
import { readDB } from "@/server/db";

export const dynamic = "force-dynamic";

/** Polled by the open dashboard to raise alerts for new orders. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await readDB();
  const list = db.notifications ?? [];
  return NextResponse.json(
    {
      unread: list.filter((n) => !n.read).length,
      newOrders: db.orders.filter((o) => o.status === "pending").length,
      latest: list.slice(0, 10),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
