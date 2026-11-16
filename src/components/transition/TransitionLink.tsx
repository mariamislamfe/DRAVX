"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useTransitionNav, type NavigateOptions } from "./TransitionProvider";

type Props = ComponentProps<typeof Link> & { transition?: NavigateOptions };

/** Drop-in replacement for next/link that plays the curtain transition. */
export function TransitionLink({ href, transition, onClick, target, ...rest }: Props) {
  const { navigate } = useTransitionNav();
  const url = typeof href === "string" ? href : href.pathname ?? "/";

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || target === "_blank") return;
    e.preventDefault();
    navigate(url, transition);
  };

  return <Link href={href} onClick={handle} target={target} {...rest} />;
}
