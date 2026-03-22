"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { PortfolioProject } from "@/types/content";

type WorksSectionProps = {
  heading: string;
  intro: string;
  items: PortfolioProject[];
  sectionId?: string;
  basePath?: string;
};

export function WorksSection({
  heading,
  intro,
  items,
  sectionId,
  basePath = "/proyectos",
}: WorksSectionProps) {
  return (
    <section id={sectionId} className="section-padding pt-16 md:pt-24">
      <div className="container-width">
        <div className="mb-16 grid gap-7 border-t border-border pt-8 lg:grid-cols-[1fr_0.8fr]">
          <h2 className="font-display text-5xl uppercase tracking-[0.02em] text-foreground md:text-8xl">{heading}</h2>
          <p className="max-w-xl text-base leading-relaxed text-muted md:text-lg">{intro}</p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {items.map((item, index) => (
            <motion.article
              key={item.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              className="grid gap-8 border-t border-border pt-8 md:gap-12 lg:grid-cols-12"
            >
              <div className={`space-y-5 lg:col-span-4 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                <p className="editorial-kicker">{item.category}</p>
                <h3 className="font-display text-4xl uppercase leading-[0.96] tracking-[0.02em] text-foreground md:text-6xl">{item.title}</h3>
                <p className="max-w-md text-sm leading-relaxed text-muted">{item.shortDescription}</p>
                <Link href={`${basePath}/${item.slug}`} className="focus-ring inline-flex text-xs uppercase tracking-[0.2em] text-foreground transition-opacity hover:opacity-65">
                  Ver proyecto
                </Link>
              </div>

              <Link
                href={`${basePath}/${item.slug}`}
                className={`relative aspect-[16/10] overflow-hidden lg:col-span-8 ${index % 2 === 1 ? "lg:order-1" : ""}`}
              >
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
