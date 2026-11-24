import { Fragment } from "react";

/** Renders site text, setting *starred* words in the italic accent font. */
export function Rich({ text, className = "serif" }: { text: string; className?: string }) {
  const parts = text.split(/\*([^*]+)\*/);
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <em key={i} className={className}>{p}</em> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}
