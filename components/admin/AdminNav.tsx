"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Panel de control" },
  { href: "/admin/sections", label: "Secciones" },
  { href: "/admin/projects", label: "Proyectos" },
  { href: "/admin/settings", label: "Ajustes" },
  { href: "/admin/releases", label: "Publicaciones" },
  { href: "/admin/leads", label: "Contactos" },
  { href: "/admin/users", label: "Usuarios" },
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
