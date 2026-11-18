import { readDB } from "@/server/db";
import { INTEGRATIONS, type IntegrationKind } from "@/data/integrations";
import { IntegrationCard, type IntegrationView } from "@/components/admin/IntegrationCard";
import styles from "@/components/admin/Admin.module.css";

export const metadata = { title: "Integrations" };

const GROUPS: { kind: IntegrationKind; title: string; blurb: string }[] = [
  { kind: "shipping", title: "Shipping companies", blurb: "Send orders to a courier and track deliveries." },
  { kind: "payment", title: "Payment gateways", blurb: "Take cards and wallets online at checkout." },
];

export default async function IntegrationsPage() {
  const db = await readDB();
  const view = (id: string): IntegrationView => {
    const st = db.integrations[id];
    const p = INTEGRATIONS.find((x) => x.id === id)!;
    if (!st) return null;
    // secrets never leave the server; the form only learns that one is saved
    return {
      enabled: st.enabled,
      updatedAt: st.updatedAt,
      values: Object.fromEntries(p.fields.filter((f) => !f.secret).map((f) => [f.key, st.fields[f.key] ?? ""])),
      secretsSet: Object.fromEntries(p.fields.filter((f) => f.secret).map((f) => [f.key, Boolean(st.fields[f.key])])),
    };
  };
  const connected = INTEGRATIONS.filter((p) => db.integrations[p.id]?.enabled).length;

  return (
    <>
      <header className={styles.head}>
        <div>
          <h1>Integrations</h1>
          <p>
            Shipping companies and payment gateways · {connected} connected
          </p>
        </div>
      </header>

      <div className={styles.stack}>
        {GROUPS.map((g) => (
          <section key={g.kind} className={styles.stack}>
            <div>
              <h2 className={styles.cardTitle} style={{ marginBottom: 2 }}>
                {g.title}
              </h2>
              <p className={styles.muted}>{g.blurb}</p>
            </div>
            <div className={styles.intGrid}>
              {INTEGRATIONS.filter((p) => p.kind === g.kind).map((p) => (
                <IntegrationCard key={p.id} provider={p} saved={view(p.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
