import { STATUS_LABEL, type OrderStatus } from "@/data/schema";
import styles from "./Admin.module.css";

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={styles.pill} data-s={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CustomPill() {
  return (
    <span className={styles.pill} data-s="custom">
      Custom
    </span>
  );
}

export function fmtDate(iso: string, withTime = true) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}
