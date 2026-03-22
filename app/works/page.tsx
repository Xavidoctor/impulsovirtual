import { permanentRedirect } from "next/navigation";

export default function LegacyWorksRedirectPage() {
  permanentRedirect("/proyectos");
}
