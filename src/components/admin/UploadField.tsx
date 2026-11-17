"use client";

import { useRef, useState } from "react";
import { upload } from "@/lib/customize/render";
import styles from "./Admin.module.css";

/** Image picker that uploads immediately and hands back the stored URL. */
export function UploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value?: string;
  onChange: (url: string | undefined, size?: { w: number; h: number }) => void;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await upload(f, f.name, "admin");
      const img = new Image();
      img.src = url;
      await img.decode().catch(() => {});
      onChange(url, img.naturalWidth ? { w: img.naturalWidth, h: img.naturalHeight } : undefined);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={styles.upload}>
      <span className={styles.label}>{label}</span>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={`${styles.uploadPreview} ${styles.checker}`} />
      ) : (
        <span className={styles.uploadEmpty}>{busy ? "Uploading…" : "No image"}</span>
      )}
      <div className={styles.actions}>
        <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "…" : value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => onChange(undefined)}>
            Clear
          </button>
        )}
      </div>
      {hint && <small className={styles.muted}>{hint}</small>}
      {err && <small style={{ color: "var(--a-red)" }}>{err}</small>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
