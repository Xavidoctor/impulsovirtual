"use client";

import { motion } from "motion/react";
import { useMemo, useRef } from "react";

import {
  ScrollActivatedText,
  countWords,
} from "@/components/ui/ScrollActivatedText";
import { useScrollWordActivation } from "@/src/lib/animation/use-scroll-word-activation";

type ExpertiseSectionProps = {
  heading: string;
  intro: string;
  items: string[];
};

export function ExpertiseSection({ heading, intro, items }: ExpertiseSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  const introWordCount = useMemo(() => countWords(intro), [intro]);

  const itemMeta = useMemo(() => {
    let cursor = introWordCount;
    return items.map((item) => {
      const wordCount = countWords(item);
      const startIndex = cursor;
      cursor += wordCount;
      return { item, wordCount, startIndex };
    });
  }, [items, introWordCount]);

  const totalWords = useMemo(
    () => introWordCount + itemMeta.reduce((sum, item) => sum + item.wordCount, 0),
    [introWordCount, itemMeta],
  );

  const { activeWordCount } = useScrollWordActivation({
    targetRef: sectionRef,
    totalWords,
  });

  return (
    <section ref={sectionRef} className="section-padding pt-14 md:pt-20">
      <div className="container-width grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
          className="space-y-6"
        >
          <h2 className="font-display text-5xl uppercase tracking-[0.02em] text-foreground md:text-7xl">{heading}</h2>
          <p className="max-w-lg text-base leading-relaxed md:text-lg">
            <ScrollActivatedText
              text={intro}
              startIndex={0}
              activeWordCount={activeWordCount}
              inactiveClassName="font-normal text-muted/65"
              activeClassName="font-medium text-foreground/95"
            />
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="grid gap-0 border-t border-border/70 md:grid-cols-2"
        >
          {itemMeta.map((item) => (
            <li key={item.startIndex} className="border-b border-border/70 py-5 text-xs uppercase tracking-[0.2em] md:pr-8">
              <ScrollActivatedText
                text={item.item}
                startIndex={item.startIndex}
                activeWordCount={activeWordCount}
                inactiveClassName="font-normal text-foreground/45"
                activeClassName="font-medium text-foreground"
              />
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
