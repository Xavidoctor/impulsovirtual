"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const isMobileViewport = window.matchMedia("(max-width: 900px)").matches;
    const rootMargin = isMobileViewport ? "0px 0px -10% 0px" : "-6% 0px -12% 0px";
    const threshold = isMobileViewport ? 0.08 : 0.12;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`reveal-block ${isVisible ? "is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={
        {
          "--reveal-delay": `${Math.max(0, delay)}s`,
          "--reveal-y": `${Math.max(0, y)}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
