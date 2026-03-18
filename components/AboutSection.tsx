"use client";

import { motion } from "motion/react";
import { useMemo, useRef } from "react";

import {
  ScrollActivatedText,
  countWords,
} from "@/components/ui/ScrollActivatedText";
import { useScrollWordActivation } from "@/src/lib/animation/use-scroll-word-activation";

type AboutSectionProps = {
  heading: string;
  paragraphs: string[];
};

export function AboutSection({ heading, paragraphs }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  const paragraphMeta = useMemo(() => {
    let cursor = 0;
    return paragraphs.map((paragraph) => {
      const wordCount = countWords(paragraph);
      const startIndex = cursor;
      cursor += wordCount;
      return { paragraph, wordCount, startIndex };
    });
  }, [paragraphs]);

  const totalWords = useMemo(
    () => paragraphMeta.reduce((sum, item) => sum + item.wordCount, 0),
    [paragraphMeta],
  );

  const { activeWordCount } = useScrollWordActivation({
    targetRef: sectionRef,
    totalWords,
  });

  return (
    <section
      ref={sectionRef}
      id="sobre-mi"
      className="section-padding pb-16 pt-24 md:py-32"
    >
      <motion.div
        className="container-width grid gap-10 border-y border-border/70 py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.65 }}
      >
        <h2 className="font-display text-5xl uppercase tracking-[0.02em] text-foreground md:text-7xl">{heading}</h2>
        <div className="space-y-6 text-base leading-relaxed md:text-xl">
          {paragraphMeta.map((item) => (
            <p key={item.startIndex}>
              <ScrollActivatedText
                text={item.paragraph}
                startIndex={item.startIndex}
                activeWordCount={activeWordCount}
                inactiveClassName="font-normal text-muted/65"
                activeClassName="font-medium text-foreground/95"
              />
            </p>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
