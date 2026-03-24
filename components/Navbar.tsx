"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "@/components/Logo";

type NavbarProps = {
  links: Array<{ label: string; href: string }>;
  primaryCta: { label: string; href: string };
};

export function Navbar({ links, primaryCta }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container-width pt-3.5 md:pt-5">
        <nav
          className={`relative flex h-[62px] items-center justify-between rounded-full border px-4 md:h-[66px] md:px-6 transition-all duration-300 ${
            scrolled
              ? "border-white/15 bg-[#090f11]/88 shadow-[0_14px_42px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              : "border-white/10 bg-[#0c1215]/58 backdrop-blur-lg"
          }`}
          aria-label="Navegacion principal"
        >
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-accent/15 via-transparent to-transparent" />
          <Logo
            className="focus-ring relative inline-flex items-center"
            imageClassName="h-10 w-auto md:h-11"
            priority
          />

          <div className="relative hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-cta={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`focus-ring text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="relative hidden items-center gap-3 md:flex">
            <Link
              href={primaryCta.href}
              data-cta="nav-primary"
              className="focus-ring rounded-full border border-accent/35 bg-accentSoft px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground hover:border-accent/55"
            >
              {primaryCta.label}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Abrir menu"
            className="focus-ring relative rounded-full border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-foreground md:hidden"
          >
            {open ? "Cerrar" : "Menu"}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24 }}
            className="container-width mt-3 md:hidden"
          >
            <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0b1114]/95 p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-cta={`menu-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setOpen(false)}
                    className={`text-sm uppercase tracking-[0.14em] ${
                      pathname === link.href ? "text-foreground" : "text-foreground/78"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="subtle-divider" />

              <div className="flex flex-col gap-3">
                <Link
                  href={primaryCta.href}
                  data-cta="menu-primary"
                  className="btn-primary w-fit"
                  onClick={() => setOpen(false)}
                >
                  {primaryCta.label}
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
