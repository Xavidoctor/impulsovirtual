"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Panel de control" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/quote-requests", label: "Quote requests" },
  { href: "/admin/services", label: "Servicios" },
  { href: "/admin/projects", label: "Proyectos" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/settings", label: "Ajustes" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/guia", label: "Guia" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
