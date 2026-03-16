import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

type AdminShellProps = {
  email: string;
  role: "admin" | "editor";
  children: ReactNode;
};

export function AdminShell({ email, role, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-white/10 px-4 py-5 lg:border-b-0 lg:border-r">
          <div className="mb-6 px-2">
            <p className="font-display text-2xl tracking-wide">NMD</p>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Panel de control
            </p>
          </div>
          <AdminNav />
        </aside>

        <div className="min-w-0">
          <AdminTopbar email={email} role={role} />
          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
