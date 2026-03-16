"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type NavbarProps = {
  brand: string;
  links: Array<{ label: string; href: string }>;
  email: string;
  copyEmailLabel: string;
  contactWhatsappLabel: string;
  whatsappUrl: string;
};

export function Navbar({ brand, links, email, copyEmailLabel, contactWhatsappLabel, whatsappUrl }: NavbarProps) {
  void email;
  void copyEmailLabel;
  void contactWhatsappLabel;
  void whatsappUrl;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className={`container-width flex h-20 items-center justify-between transition-colors duration-300 ${
          scrolled ? "border-b border-border bg-background/95" : "bg-transparent"
        }`}
        aria-label="Navegacion principal"
      >
        <Link href="/" className={`focus-ring text-sm uppercase tracking-[0.14em] ${scrolled ? "text-foreground" : "text-white/88"}`}>
          {brand}
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-ring text-[11px] uppercase tracking-[0.2em] transition-colors ${
                scrolled ? "text-muted hover:text-foreground" : "text-white/72 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="#contacto"
            className={`focus-ring text-[11px] uppercase tracking-[0.2em] transition-opacity ${
              scrolled ? "text-foreground hover:opacity-70" : "text-white/92 hover:opacity-80"
            }`}
          >
            Contacto
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Abrir menu"
          className={`focus-ring text-[11px] uppercase tracking-[0.2em] md:hidden ${scrolled ? "text-foreground" : "text-white/90"}`}
        >
          {open ? "Cerrar" : "Menu"}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24 }}
            className="border-b border-border bg-background md:hidden"
          >
            <div className="container-width space-y-6 py-6">
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm uppercase tracking-[0.14em] text-foreground">
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-5">
                <Link href="#contacto" className="w-fit text-sm text-foreground" onClick={() => setOpen(false)}>
                  Contacto
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
