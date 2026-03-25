"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CmsServiceIcon } from "@/components/services/CmsServiceIcon";
import { Reveal } from "@/components/ui/Reveal";
import type { ServiceEntity } from "@/src/types/entities";

type FeaturedService = Pick<
  ServiceEntity,
  | "id"
  | "slug"
  | "title"
  | "subtitle"
  | "short_description"
  | "full_description"
  | "cover_image_url"
  | "icon_name"
>;

function sanitizeLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractServiceHighlights(service: FeaturedService) {
  const raw = `${service.full_description ?? ""}\n${service.short_description ?? ""}`;
  const parts = raw
    .split(/\n|•|·|;/g)
    .map((part) => sanitizeLine(part))
    .filter((part) => part.length > 18);

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const item of parts) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= 4) break;
  }

  if (unique.length > 0) return unique;

  return [sanitizeLine(service.short_description || "Servicio con enfoque estratégico y ejecución técnica.")];
}

export function FeaturedServicesInteractive({ services }: { services: FeaturedService[] }) {
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  const activeService = useMemo(
    () => services.find((service) => service.id === activeServiceId) ?? null,
    [activeServiceId, services],
  );

  useEffect(() => {
    if (!activeService) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [activeService]);

  useEffect(() => {
    if (!activeService) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveServiceId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeService]);

  return (
    <>
      <div className="services-power-grid">
        {services.map((service, index) => {
          const description =
            service.short_description ||
            "Servicio diseñado para construir una base digital sólida y orientada a resultados.";

          return (
            <Reveal key={service.id} delay={index * 0.07}>
              <button
                type="button"
                onClick={() => setActiveServiceId(service.id)}
                aria-haspopup="dialog"
                aria-controls="service-detail-dialog"
                className="focus-ring service-power-card service-power-trigger h-full w-full text-left"
              >
                <div className="service-power-image-wrap">
                  {service.cover_image_url ? (
                    <img
                      src={service.cover_image_url}
                      alt={`Preview visual del servicio ${service.title}`}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 1280px) 31vw, (min-width: 768px) 47vw, 94vw"
                      className="service-power-image"
                    />
                  ) : (
                    <div className="service-power-placeholder" aria-hidden>
                      <span className="service-power-placeholder-label">Imagen de servicio</span>
                    </div>
                  )}
                  <div className="service-power-image-overlay" aria-hidden />
                  <div className="service-power-meta" aria-hidden>
                    <p className="service-power-number">0{index + 1}</p>
                    <span className="service-power-icon">
                      <CmsServiceIcon iconName={service.icon_name} className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                </div>

                <div className="service-power-body">
                  <p className="service-power-kicker">{service.subtitle || "Servicio premium"}</p>
                  <h3 className="service-power-title font-display">{service.title}</h3>
                  <p className="service-power-description">{description}</p>
                  <span className="service-power-link">Abrir detalle</span>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      {activeService ? (
        <>
          <button
            type="button"
            aria-label="Cerrar detalle del servicio"
            className="fixed inset-0 z-[74] bg-black/70 backdrop-blur-[2px]"
            onClick={() => setActiveServiceId(null)}
          />

          <section
            id="service-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-detail-title"
            className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+0.45rem)] z-[75] md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(760px,calc(100vw-3rem))] md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <div className="service-detail-panel">
              <div className="service-detail-header">
                <p className="service-detail-kicker">{activeService.subtitle || "Servicio destacado"}</p>
                <button
                  type="button"
                  onClick={() => setActiveServiceId(null)}
                  className="focus-ring service-detail-close"
                >
                  Cerrar
                </button>
              </div>

              <div className="service-detail-content">
                <h3 id="service-detail-title" className="text-3xl font-display text-foreground md:text-4xl">
                  {activeService.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/78 md:text-[15px]">
                  {activeService.full_description || activeService.short_description}
                </p>

                <div className="mt-6 space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Entregables clave</p>
                  <ul className="service-detail-list">
                    {extractServiceHighlights(activeService).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/solicitar-propuesta?servicio=${encodeURIComponent(activeService.slug)}`}
                    className="focus-ring btn-primary"
                  >
                    Solicitar propuesta
                  </Link>
                  <Link href={`/servicios/${activeService.slug}`} className="focus-ring btn-secondary">
                    Ver página del servicio
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
