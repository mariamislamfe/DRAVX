"use client";

import { useRef, useState } from "react";
import { upload } from "@/lib/customize/render";
import styles from "./Admin.module.css";

/**
 * Upload a video or image, or paste a direct link to one (handy for big
 * videos: host the .mp4 elsewhere and paste its address).
 */
export function MediaField({
  label,
  kind,
  value,
  onChange,
  hint,
}: {
  label: string;
  kind: "video" | "image";
  value?: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const accept = kind === "video" ? "video/mp4,video/webm" : "image/png,image/jpeg,image/webp";

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      onChange(await upload(f, f.name, "admin"));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={styles.field}>
      <span>{label}</span>
      {value ? (
        kind === "video" ? (
          <video src={value} muted playsInline controls preload="metadata" style={{ width: "100%", maxWidth: 360, borderRadius: 6, background: "#000" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={styles.checker} style={{ width: "100%", maxWidth: 200, maxHeight: 140, objectFit: "contain", borderRadius: 6 }} />
        )
      ) : (
        <span className={styles.uploadEmpty}>{busy ? "Uploading…" : kind === "video" ? "No video" : "No image"}</span>
      )}
      <div className={styles.actions}>
        <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button type="button" className={`${styles.btnGhost} ${styles.btnSm}`} onClick={() => onChange("")}>
            Clear
          </button>
        )}
      </div>
      <input
        type="url"
        value={value?.startsWith("http") ? value : ""}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder={kind === "video" ? "…or paste a link to an .mp4 file (https://…)" : "…or paste an image link (https://…)"}
        aria-label={`${label} link`}
      />
      {hint && <small>{hint}</small>}
      {err && <small style={{ color: "var(--a-red)" }}>{err}</small>}
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
