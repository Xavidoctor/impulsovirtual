"use client";

import { useEffect, useRef, useState } from "react";

import type { TestimonialEntity } from "@/src/types/entities";

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "IV";
}

function TestimonialStars() {
  return (
    <div className="testimonial-stars" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <path d="m12 3.8 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.5 2.9 1.1-6.1-4.5-4.3 6.2-.9L12 3.8Z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const [isBroken, setIsBroken] = useState(false);
  const cleanAvatarUrl = avatarUrl?.trim() || null;

  useEffect(() => {
    setIsBroken(false);
  }, [cleanAvatarUrl]);

  if (cleanAvatarUrl && !isBroken) {
    return (
      <img
        src={cleanAvatarUrl}
        alt={`Avatar de ${name}`}
        loading="lazy"
        decoding="async"
        onError={() => setIsBroken(true)}
        className="h-12 w-12 rounded-full border border-white/20 object-cover"
      />
    );
  }

  return <span className="testimonial-avatar-fallback">{getInitials(name)}</span>;
}

function getVisibleCount() {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1280px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}

export function TestimonialsCarousel({ testimonials }: { testimonials: TestimonialEntity[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(1);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const showControls = testimonials.length > visibleCount;

  const updateScrollState = () => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const nextCanPrev = track.scrollLeft > 2;
    const nextCanNext = track.scrollLeft < maxScroll - 2;

    setCanPrev(nextCanPrev);
    setCanNext(nextCanNext);
  };

  useEffect(() => {
    const refresh = () => setVisibleCount(getVisibleCount());
    refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => updateScrollState();
    track.addEventListener("scroll", onScroll, { passive: true });
    updateScrollState();

    return () => track.removeEventListener("scroll", onScroll);
  }, [showControls, testimonials.length, visibleCount]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollTo({ left: 0 });
    updateScrollState();
  }, [visibleCount, testimonials.length]);

  const scrollByOne = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const firstCard = track.querySelector<HTMLElement>("[data-testimonial-card='true']");
    const style = window.getComputedStyle(track);
    const gapValue = style.columnGap || style.gap || "0px";
    const gap = Number.parseFloat(gapValue) || 0;
    const stepSize = firstCard ? firstCard.getBoundingClientRect().width + gap : 0;
    const fallback = track.clientWidth / Math.max(1, visibleCount);
    const delta = (stepSize || fallback) * direction;
    track.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="space-y-5">
      {showControls ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByOne(-1)}
            disabled={!canPrev}
            aria-label="Ver testimonio anterior"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.02] text-foreground transition-colors hover:border-white/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollByOne(1)}
            disabled={!canNext}
            aria-label="Ver siguiente testimonio"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.02] text-foreground transition-colors hover:border-white/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : null}

      <div
        ref={trackRef}
        className="testimonial-carousel-track flex gap-5 overflow-x-auto pb-2"
        role="region"
        aria-label="Listado de testimonios"
      >
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.id}
            data-testimonial-card="true"
            className="premium-card testimonial-premium-card h-full shrink-0 basis-full p-6 md:basis-[calc(50%-0.625rem)] xl:basis-[calc((100%-2.5rem)/3)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TestimonialAvatar name={testimonial.name} avatarUrl={testimonial.avatar_url} />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                  {testimonial.role || testimonial.company ? (
                    <p className="text-xs text-muted">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </div>
              <TestimonialStars />
            </div>
            <p className="mt-5 text-lg leading-relaxed text-foreground/95 md:text-[1.1rem]">
              “{testimonial.quote}”
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
