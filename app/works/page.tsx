import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { WorksSection } from "@/components/WorksSection";
import { getPublicContent } from "@/src/lib/cms/public-content";

export async function generateMetadata(): Promise<Metadata> {
  const draft = await draftMode();
  const { content } = await getPublicContent({
    draftEnabled: draft.isEnabled,
  });

  return {
    title: `${content.works.pageHeading} | Nacho Mas Design`,
    description: content.works.pageIntro,
  };
}

export default async function WorksPage() {
  const draft = await draftMode();
  const { content, projects, whatsappUrl } = await getPublicContent({
    draftEnabled: draft.isEnabled,
  });

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
        <WorksSection heading={content.works.pageHeading} intro={content.works.pageIntro} items={projects} />

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
