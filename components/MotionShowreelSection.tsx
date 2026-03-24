"use client";

import { motion } from "motion/react";

type MotionShowreelSectionProps = {
  heading: string;
  caption: string;
  videoSrc: string;
  posterSrc?: string;
  overlayOpacity?: number;
};

export function MotionShowreelSection({ heading, caption, videoSrc, posterSrc, overlayOpacity = 0.24 }: MotionShowreelSectionProps) {
  return (
    <section className="section-padding pt-16 md:pt-20" aria-label="Vídeo de resultados">
      <motion.div
        className="container-width"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65 }}
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-7">
          <h2 className="font-display text-5xl uppercase tracking-[0.02em] text-foreground md:text-7xl">{heading}</h2>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{caption}</p>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden md:aspect-[21/9]">
          <video className="h-full w-full object-cover" src={videoSrc} poster={posterSrc} autoPlay muted loop playsInline />
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }} />
        </div>
      </motion.div>
    </section>
  );
}
