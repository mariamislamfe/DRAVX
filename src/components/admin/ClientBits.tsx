"use client";

import styles from "./Admin.module.css";

export function PrintButton() {
  return (
    <button type="button" className={styles.btnGhost} onClick={() => window.print()}>
      Print order sheet
    </button>
  );
}

/** Submit button that asks first. */
export function ConfirmButton({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
