import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProjectDetailHero } from "@/components/ProjectDetailHero";
import { ProjectGallery } from "@/components/ProjectGallery";
import { getPublicContent } from "@/src/lib/cms/public-content";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublicContent({ draftEnabled: false }).then(({ projects }) =>
    projects.map((project) => ({ slug: project.slug })),
  );
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { projects } = await getPublicContent({ draftEnabled: false });
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    return {
      title: "Proyecto no encontrado | Nacho Mas Design"
    };
  }

  return {
    title: `${project.title} | Nacho Mas Design`,
    description: project.shortDescription,
    openGraph: {
      title: `${project.title} | Nacho Mas Design`,
      description: project.shortDescription,
      images: [project.coverImage]
    }
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const draft = await draftMode();
  const { content, projects, whatsappUrl } = await getPublicContent({
    draftEnabled: draft.isEnabled,
  });
  const project = projects.find((item) => item.slug === slug);

  if (!project) notFound();

  return (
    <>
      <Navbar
        brand={content.nav.brand}
        links={content.nav.links}
        email={content.contact.email}
        copyEmailLabel={content.nav.copyEmail}
        contactWhatsappLabel={content.nav.contactWhatsapp}
        whatsappUrl={whatsappUrl}
      />

      <main className="pt-24">
        <section className="section-padding pb-16 pt-8">
          <div className="container-width space-y-8">
            <Link href="/works" className="focus-ring inline-flex text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground">
              ← Volver a Works
            </Link>

            <ProjectDetailHero title={project.title} shortDescription={project.shortDescription} image={project.heroImage ?? project.coverImage} />

            <div className="grid gap-12 border-b border-border pb-10 pt-6 md:grid-cols-[0.6fr_1.4fr]">
              <div className="space-y-4 text-xs uppercase tracking-[0.16em] text-muted">
                <p>{project.category}</p>
                {project.year ? <p>{project.year}</p> : null}
                <div className="space-y-2 pt-4">
                  {project.services.map((service) => (
                    <p key={service}>{service}</p>
                  ))}
                </div>
              </div>
              <p className="max-w-4xl text-base leading-relaxed text-foreground/86 md:text-xl">{project.fullDescription}</p>
            </div>

            <ProjectGallery title={project.title} images={project.gallery} />
          </div>
        </section>

        <ContactSection
          heading={content.contact.heading}
          intro={content.contact.intro}
          email={content.contact.email}
          contactLabel={content.contact.contactLabel}
          copyEmailLabel={content.contact.copyEmail}
          whatsappLabel={content.contact.whatsappLabel}
          whatsappUrl={whatsappUrl}
          socials={content.contact.socials}
        />
      </main>

      <Footer brandLine={content.footer.brandLine} copyright={content.footer.copyright} socials={content.contact.socials} />
    </>
  );
}
