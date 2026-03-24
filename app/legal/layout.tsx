import type { ReactNode } from "react";
import { PublicPageShell } from "@/components/PublicPageShell";

type LegalLayoutProps = {
  children: ReactNode;
};

export default function LegalLayout({ children }: LegalLayoutProps) {
  return <PublicPageShell>{children}</PublicPageShell>;
}