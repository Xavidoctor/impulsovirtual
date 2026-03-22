import { permanentRedirect } from "next/navigation";

type LegacyWorkDetailRedirectProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyWorkDetailRedirectPage({
  params,
}: LegacyWorkDetailRedirectProps) {
  const { slug } = await params;
  permanentRedirect(`/proyectos/${slug}`);
}
