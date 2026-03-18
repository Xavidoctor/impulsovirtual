"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";

type UseScrollWordActivationParams = {
  targetRef: RefObject<HTMLElement | null>;
  totalWords: number;
  offset?: [string, string];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function useScrollWordActivation({
  targetRef,
  totalWords,
  offset = ["start 82%", "end 34%"],
}: UseScrollWordActivationParams) {
  const prefersReducedMotion = useReducedMotion();
  const [activeWordCount, setActiveWordCount] = useState(() =>
    prefersReducedMotion ? Math.max(0, totalWords) : 0,
  );

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: offset as never,
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 26,
    mass: 0.35,
  });

  useEffect(() => {
    setActiveWordCount((previous) => {
      if (prefersReducedMotion) return Math.max(0, totalWords);
      return clamp(previous, 0, Math.max(0, totalWords));
    });
  }, [prefersReducedMotion, totalWords]);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (totalWords <= 0) return;

    if (prefersReducedMotion) {
      setActiveWordCount((previous) =>
        previous === totalWords ? previous : totalWords,
      );
      return;
    }

    const bounded = clamp(latest, 0, 1);
    const next = Math.round(bounded * totalWords);
    setActiveWordCount((previous) => (previous === next ? previous : next));
  });

  return { activeWordCount };
}
