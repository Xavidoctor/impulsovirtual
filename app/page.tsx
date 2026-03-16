import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { ExpertiseSection } from "@/components/ExpertiseSection";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { MotionShowreelSection } from "@/components/MotionShowreelSection";
import { Navbar } from "@/components/Navbar";
import { VisualGallery } from "@/components/VisualGallery";
import { WorksSection } from "@/components/WorksSection";
import { draftMode } from "next/headers";
import { getPublicContent } from "@/src/lib/cms/public-content";

export default async function HomePage() {
  const draft = await draftMode();
  const { content, featuredProjects, whatsappUrl } = await getPublicContent({
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

      <main>
        <HeroSection
          label={content.hero.label}
          marqueeText={content.hero.marqueeText}
          paragraph={content.hero.paragraph}
          disciplines={content.hero.disciplines}
          media={content.hero.media}
        />

        <WorksSection
          heading={content.works.homeHeading}
          intro={content.works.homeIntro}
          items={featuredProjects}
          sectionId="proyectos"
        />

        <MotionShowreelSection
          heading={content.showreel.heading}
          caption={content.showreel.caption}
          videoSrc={content.showreel.videoSrc}
          posterSrc={content.showreel.posterSrc}
          overlayOpacity={content.showreel.overlayOpacity}
        />

        <AboutSection heading={content.aboutStudio.heading} paragraphs={content.aboutStudio.paragraphs} />

        <ExpertiseSection heading={content.expertise.heading} intro={content.expertise.intro} items={content.expertise.items} />

        <VisualGallery heading={content.gallery.heading} items={content.gallery.images} />

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
