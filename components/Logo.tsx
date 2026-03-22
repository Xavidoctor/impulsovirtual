import Image from "next/image";
import Link from "next/link";
import { brandConfig } from "@/content/brand";

type LogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function Logo({ href = "/", className, imageClassName, priority = false }: LogoProps) {
  return (
    <Link href={href} className={className} aria-label={brandConfig.name}>
      <Image
        src={brandConfig.logoPath}
        alt={`Logo ${brandConfig.name}`}
        width={220}
        height={64}
        priority={priority}
        className={imageClassName ?? "h-8 w-auto"}
      />
    </Link>
  );
}
