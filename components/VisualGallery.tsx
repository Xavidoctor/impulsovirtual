"use client";

import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

type GalleryItem = {
  src: string;
  alt: string;
};

type VisualGalleryProps = {
  heading: string;
  items: GalleryItem[];
};

function wrapOffset(value: number, width: number) {
  if (!Number.isFinite(width) || width <= 0) return value;

  let next = value;
  while (next <= -width) next += width;
  while (next > 0) next -= width;
  return next;
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function VisualGallery({ heading, items }: VisualGalleryProps) {
  if (items.length === 0) return null;

  const AUTOPLAY_HOLD_MS = 2400;
  const AUTOPLAY_TRANSITION_SECONDS = 0.62;

  const prefersReducedMotion = useReducedMotion();
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [loopWidth, setLoopWidth] = useState(0);
  const [stepSize, setStepSize] = useState(0);

  const loopRef = useRef<HTMLDivElement | null>(null);
  const firstSlideRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({ active: false, startX: 0, startOffset: 0 });
  const autoplayTimeoutRef = useRef<number | null>(null);
  const autoplayAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const manualAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const x = useMotionValue(0);

  const duplicatedItems = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsAutoplay(false);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    const measure = () => {
      if (loopRef.current) {
        setLoopWidth(loopRef.current.offsetWidth);
      }

      if (firstSlideRef.current) {
        setStepSize(firstSlideRef.current.offsetWidth);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);

    if (loopRef.current) observer.observe(loopRef.current);
    if (firstSlideRef.current) observer.observe(firstSlideRef.current);

    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  useEffect(() => {
    if (!isAutoplay || isDragging || loopWidth <= 0 || stepSize <= 0 || prefersReducedMotion) return;

    const clearAutoplayCycle = () => {
      if (autoplayTimeoutRef.current !== null) {
        window.clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
      autoplayAnimationRef.current?.stop();
      autoplayAnimationRef.current = null;
    };

    const runStep = () => {
      autoplayAnimationRef.current?.stop();
      const target = wrapOffset(x.get() - stepSize, loopWidth);

      autoplayAnimationRef.current = animate(x, target, {
        duration: AUTOPLAY_TRANSITION_SECONDS,
        ease: [0.22, 1, 0.36, 1],
        onComplete: () => {
          autoplayTimeoutRef.current = window.setTimeout(runStep, AUTOPLAY_HOLD_MS);
        },
      });
    };

    clearAutoplayCycle();
    autoplayTimeoutRef.current = window.setTimeout(runStep, AUTOPLAY_HOLD_MS);

    return () => {
      clearAutoplayCycle();
    };
  }, [AUTOPLAY_HOLD_MS, AUTOPLAY_TRANSITION_SECONDS, isAutoplay, isDragging, loopWidth, prefersReducedMotion, stepSize, x]);

  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current !== null) {
        window.clearTimeout(autoplayTimeoutRef.current);
      }
      autoplayAnimationRef.current?.stop();
      manualAnimationRef.current?.stop();
    };
  }, []);

  const previous = () => {
    setIsAutoplay(false);
    if (stepSize <= 0 || loopWidth <= 0) return;

    if (autoplayTimeoutRef.current !== null) {
      window.clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    autoplayAnimationRef.current?.stop();
    manualAnimationRef.current?.stop();
    const target = wrapOffset(x.get() + stepSize, loopWidth);
    manualAnimationRef.current = animate(x, target, {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
    });
  };

  const next = () => {
    setIsAutoplay(false);
    if (stepSize <= 0 || loopWidth <= 0) return;

    if (autoplayTimeoutRef.current !== null) {
      window.clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    autoplayAnimationRef.current?.stop();
    manualAnimationRef.current?.stop();
    const target = wrapOffset(x.get() - stepSize, loopWidth);
    manualAnimationRef.current = animate(x, target, {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
    });
  };

  const snapToMostVisible = (duration = 0.42) => {
    if (stepSize <= 0 || loopWidth <= 0) return;

    if (autoplayTimeoutRef.current !== null) {
      window.clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    autoplayAnimationRef.current?.stop();
    manualAnimationRef.current?.stop();

    const rawIndex = Math.round(-x.get() / stepSize);
    const target = wrapOffset(-rawIndex * stepSize, loopWidth);

    manualAnimationRef.current = animate(x, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
  };

  const togglePlayback = () => {
    setIsAutoplay((previousState) => {
      if (previousState) {
        snapToMostVisible(0.42);
        return false;
      }

      if (loopWidth > 0) {
        x.set(wrapOffset(x.get(), loopWidth));
      }
      return true;
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    setIsAutoplay(false);
    setIsDragging(true);
    if (autoplayTimeoutRef.current !== null) {
      window.clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    autoplayAnimationRef.current?.stop();
    manualAnimationRef.current?.stop();

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startOffset: x.get(),
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active || loopWidth <= 0) return;

    const delta = event.clientX - dragStateRef.current.startX;
    x.set(wrapOffset(dragStateRef.current.startOffset + delta, loopWidth));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;

    dragStateRef.current.active = false;
    setIsDragging(false);

    if (stepSize > 0 && loopWidth > 0) {
      const snapped = wrapOffset(Math.round(x.get() / stepSize) * stepSize, loopWidth);
      manualAnimationRef.current = animate(x, snapped, {
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1],
      });
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="section-padding pb-16 pt-28 md:pt-36">
      <div className="container-width space-y-6">
        <div className="flex items-end justify-between gap-4 border-t border-border pt-8">
          <h2 className="font-display text-5xl uppercase tracking-[0.02em] text-foreground md:text-7xl">{heading}</h2>
          <div className="flex items-center gap-2">
            {!isAutoplay ? (
              <>
                <button
                  type="button"
                  onClick={previous}
                  className="focus-ring rounded-full border border-white/20 bg-black/45 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-white/10"
                  aria-label="Imagen anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="focus-ring rounded-full border border-white/20 bg-black/45 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-white/10"
                  aria-label="Siguiente imagen"
                >
                  →
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={togglePlayback}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-white/10"
              aria-label={isAutoplay ? "Pausar carrusel" : "Reproducir carrusel"}
              aria-pressed={!isAutoplay}
            >
              {isAutoplay ? <PauseIcon /> : <PlayIcon />}
              <span className="hidden sm:inline">{isAutoplay ? "Pause" : "Play"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden border-y border-border/70">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ touchAction: "pan-y" }}
        >
          <motion.div
            style={{ x }}
            className="flex will-change-transform"
          >
            <div ref={loopRef} className="flex shrink-0">
              {items.map((item, index) => (
                <div
                  key={`base-${item.src}-${index}`}
                  ref={index === 0 ? firstSlideRef : null}
                  className="relative h-[62vw] min-h-[260px] w-screen max-h-[760px] shrink-0 overflow-hidden"
                >
                  <Image src={item.src} alt={item.alt} fill sizes="100vw" className="object-cover" />
                </div>
              ))}
            </div>

            <div aria-hidden="true" className="flex shrink-0">
              {duplicatedItems.slice(items.length).map((item, index) => (
                <div
                  key={`dup-${item.src}-${index}`}
                  className="relative h-[62vw] min-h-[260px] w-screen max-h-[760px] shrink-0 overflow-hidden"
                >
                  <Image src={item.src} alt="" fill sizes="100vw" className="object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
