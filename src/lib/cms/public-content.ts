import "server-only";

import { contentEs, getWhatsappUrl } from "@/content/site-content";
import { projects as fallbackProjects } from "@/content/projects";
import type { PortfolioProject, SiteContent, SocialLink } from "@/types/content";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import type { Tables } from "@/src/types/database.types";

type SectionRow = Tables<"site_sections">;
type SettingRow = Tables<"site_settings">;
type ProjectRow = Tables<"projects">;
type ProjectMediaRow = Tables<"project_media">;

type PublicContentResult = {
  content: SiteContent;
  projects: PortfolioProject[];
  featuredProjects: PortfolioProject[];
  whatsappUrl: string;
  seoGlobal: {
    title: string;
    description: string;
    ogImage: string;
  };
};

type ContentStatus = "draft" | "published" | "archived";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const parsed = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return parsed.length > 0 ? parsed : fallback;
}

function asLinks(value: unknown, fallback: Array<{ label: string; href: string }>) {
  if (!Array.isArray(value)) return fallback;
  const parsed = value
    .map((item) => {
      const obj = asObject(item);
      const label = typeof obj.label === "string" ? obj.label.trim() : "";
      const href = typeof obj.href === "string" ? obj.href.trim() : "";
      return label && href ? { label, href } : null;
    })
    .filter((item): item is { label: string; href: string } => item !== null);

  return parsed.length > 0 ? parsed : fallback;
}

function asGalleryImages(
  value: unknown,
  fallback: Array<{ src: string; alt: string }>,
) {
  if (!Array.isArray(value)) return fallback;
  const parsed = value
    .map((item) => {
      const obj = asObject(item);
      const src = typeof obj.src === "string" ? obj.src.trim() : "";
      const alt = typeof obj.alt === "string" ? obj.alt.trim() : "";
      return src && alt ? { src, alt } : null;
    })
    .filter((item): item is { src: string; alt: string } => item !== null);

  return parsed.length > 0 ? parsed : fallback;
}

function resolveSectionData(
  sections: SectionRow[],
  pageKey: string,
  sectionKey: string,
  draftEnabled: boolean,
) {
  const byKey = sections.filter(
    (section) => section.page_key === pageKey && section.section_key === sectionKey,
  );

  if (draftEnabled) {
    const draft = byKey.find((section) => section.status === "draft");
    if (draft) return draft.data_json;
  }

  const published = byKey.find((section) => section.status === "published");
  return published?.data_json;
}

function mapProjectsFromCms(
  projects: ProjectRow[],
  mediaRows: ProjectMediaRow[],
): PortfolioProject[] {
  const byProject = new Map<string, ProjectMediaRow[]>();
  mediaRows.forEach((media) => {
    const list = byProject.get(media.project_id) ?? [];
    list.push(media);
    byProject.set(media.project_id, list);
  });

  return projects.map((project) => {
    const media = (byProject.get(project.id) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    const cover = media.find((item) => item.role === "cover") ?? media[0];
    const hero = media.find((item) => item.role === "hero") ?? cover;
    const gallery = media
      .filter((item) => item.role === "gallery" || item.role === "detail")
      .map((item) => item.public_url);

    const seo = asObject(project.seo_json);
    const services = asStringArray(seo.services, []);

    return {
      slug: project.slug,
      title: project.title,
      category: project.category ?? "Proyecto",
      shortDescription: project.excerpt ?? "",
      fullDescription: project.body_markdown ?? project.excerpt ?? "",
      coverImage: cover?.public_url ?? "/assets/work-01.png",
      heroImage: hero?.public_url ?? undefined,
      gallery: gallery.length > 0 ? gallery : [cover?.public_url ?? "/assets/work-01.png"],
      year: project.year ? String(project.year) : undefined,
      services,
      featured: project.featured,
    };
  });
}

function applyWorksOrdering(
  projects: PortfolioProject[],
  orderingData: unknown,
): PortfolioProject[] {
  const ordering = asObject(orderingData);
  const mode = asString(ordering.mode, "manual");
  const manual = asStringArray(ordering.manualOrderSlugs, []);

  if (mode === "year_desc") {
    return [...projects].sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0));
  }

  if (mode === "year_asc") {
    return [...projects].sort((a, b) => Number(a.year ?? 0) - Number(b.year ?? 0));
  }

  if (mode === "featured_first") {
    return [...projects].sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  if (manual.length > 0) {
    const rank = new Map(manual.map((slug, index) => [slug, index]));
    return [...projects].sort((a, b) => {
      const ra = rank.has(a.slug) ? (rank.get(a.slug) as number) : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b.slug) ? (rank.get(b.slug) as number) : Number.MAX_SAFE_INTEGER;
      if (ra !== rb) return ra - rb;
      return a.title.localeCompare(b.title);
    });
  }

  return projects;
}

export async function getPublicContent({
  draftEnabled,
}: {
  draftEnabled: boolean;
}): Promise<PublicContentResult> {
  const fallbackContent = contentEs;
  const fallback = {
    content: fallbackContent,
    projects: fallbackProjects,
    featuredProjects: fallbackProjects.filter((project) => project.featured),
    whatsappUrl: getWhatsappUrl(),
    seoGlobal: {
      title: fallbackContent.metadata.title,
      description: fallbackContent.metadata.description,
      ogImage: "/og-cover.svg",
    },
  };

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return fallback;
  }

  const statuses: ContentStatus[] = draftEnabled ? ["draft", "published"] : ["published"];
  const projectStatuses: ContentStatus[] = draftEnabled
    ? ["draft", "published"]
    : ["published"];

  const [sectionsRes, settingsRes, projectsRes] = await Promise.all([
    admin
      .from("site_sections")
      .select("*")
      .in("status", statuses)
      .eq("enabled", true)
      .order("updated_at", { ascending: false }),
    admin.from("site_settings").select("*"),
    admin
      .from("projects")
      .select("*")
      .in("status", projectStatuses)
      .order("updated_at", { ascending: false }),
  ]);

  if (sectionsRes.error || settingsRes.error || projectsRes.error) {
    return fallback;
  }

  const projectIds = (projectsRes.data ?? []).map((project) => project.id);
  const mediaRes =
    projectIds.length > 0
      ? await admin.from("project_media").select("*").in("project_id", projectIds)
      : { data: [] as ProjectMediaRow[], error: null };

  if (mediaRes.error) {
    return fallback;
  }

  const sections = sectionsRes.data ?? [];
  const settings = new Map((settingsRes.data ?? []).map((setting) => [setting.key, setting]));
  const cmsProjects = mapProjectsFromCms(projectsRes.data ?? [], mediaRes.data ?? []);

  const heroData = asObject(resolveSectionData(sections, "home", "hero", draftEnabled));
  const aboutData = asObject(resolveSectionData(sections, "home", "about", draftEnabled));
  const expertiseData = asObject(resolveSectionData(sections, "home", "expertises", draftEnabled));
  const recentWorksData = asObject(resolveSectionData(sections, "home", "recent_works", draftEnabled));
  const showreelData = asObject(resolveSectionData(sections, "home", "showreel", draftEnabled));
  const galleryData = asObject(resolveSectionData(sections, "home", "visual_gallery", draftEnabled));
  const navbarData = asObject(resolveSectionData(sections, "global", "navbar", draftEnabled));
  const footerData = asObject(resolveSectionData(sections, "global", "footer", draftEnabled));
  const worksHeaderData = asObject(
    resolveSectionData(sections, "works", "works_listing_header", draftEnabled),
  );
  const featuredData = asObject(resolveSectionData(sections, "works", "featured_projects", draftEnabled));
  const worksOrderingData = resolveSectionData(sections, "works", "works_ordering", draftEnabled);

  const contactSetting = asObject(settings.get("contact")?.value_json);
  const socialSetting = asObject(settings.get("social_links")?.value_json);
  const seoSetting = asObject(settings.get("seo_global")?.value_json);
  const whatsappSetting = asObject(settings.get("whatsapp")?.value_json);

  const navLinks = asLinks(navbarData.links, fallbackContent.nav.links);
  const socials = asLinks(socialSetting.links, fallbackContent.contact.socials);

  const whatsappNumber = asString(
    whatsappSetting.number,
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "34650304969",
  );
  const whatsappMessage = asString(
    whatsappSetting.message,
    "Hola Nacho, he visto tu portfolio en nachomasdesign.com y me gustaria hablar contigo sobre un proyecto.",
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const orderedProjects = applyWorksOrdering(cmsProjects, worksOrderingData);
  const featuredSlugs = asStringArray(featuredData.projectSlugs, []);
  const featuredProjects =
    featuredSlugs.length > 0
      ? orderedProjects.filter((project) => featuredSlugs.includes(project.slug))
      : orderedProjects.filter((project) => project.featured);

  const showFeaturedOnly = asBoolean(recentWorksData.showFeaturedOnly, true);
  const recentLimit = asNumber(recentWorksData.limit, 3);
  const homeSource = showFeaturedOnly ? featuredProjects : orderedProjects;

  const content: SiteContent = {
    metadata: {
      title: asString(seoSetting.title, fallbackContent.metadata.title),
      description: asString(seoSetting.description, fallbackContent.metadata.description),
    },
    nav: {
      brand: asString(navbarData.brand, fallbackContent.nav.brand),
      links: navLinks,
      copyEmail: asString(navbarData.copyEmail, fallbackContent.nav.copyEmail),
      contactWhatsapp: asString(
        navbarData.contactWhatsapp,
        fallbackContent.nav.contactWhatsapp,
      ),
    },
    hero: {
      label: asString(heroData.label, fallbackContent.hero.label),
      marqueeText: asString(heroData.marqueeText, fallbackContent.hero.marqueeText),
      paragraph: asString(heroData.paragraph, fallbackContent.hero.paragraph),
      disciplines: asStringArray(heroData.disciplines, fallbackContent.hero.disciplines),
      media: {
        type:
          heroData.media && asObject(heroData.media).type === "image" ? "image" : "video",
        videoSrc: asString(asObject(heroData.media).videoSrc, fallbackContent.hero.media.videoSrc ?? ""),
        imageSrc: asString(asObject(heroData.media).imageSrc, fallbackContent.hero.media.imageSrc ?? ""),
        posterSrc: asString(asObject(heroData.media).posterSrc, fallbackContent.hero.media.posterSrc ?? ""),
        fallbackColor: asString(
          asObject(heroData.media).fallbackColor,
          fallbackContent.hero.media.fallbackColor ?? "#0d0d0d",
        ),
        overlayOpacity: asNumber(
          asObject(heroData.media).overlayOpacity,
          fallbackContent.hero.media.overlayOpacity ?? 0.4,
        ),
      },
    },
    works: {
      homeHeading: asString(recentWorksData.heading, fallbackContent.works.homeHeading),
      homeIntro: asString(recentWorksData.intro, fallbackContent.works.homeIntro),
      pageHeading: asString(worksHeaderData.heading, fallbackContent.works.pageHeading),
      pageIntro: asString(worksHeaderData.intro, fallbackContent.works.pageIntro),
    },
    showreel: {
      heading: asString(showreelData.heading, fallbackContent.showreel.heading),
      caption: asString(showreelData.caption, fallbackContent.showreel.caption),
      videoSrc: asString(showreelData.videoSrc, fallbackContent.showreel.videoSrc),
      posterSrc: asString(showreelData.posterSrc, fallbackContent.showreel.posterSrc ?? ""),
      overlayOpacity: asNumber(
        showreelData.overlayOpacity,
        fallbackContent.showreel.overlayOpacity ?? 0.24,
      ),
    },
    aboutStudio: {
      heading: asString(aboutData.heading, fallbackContent.aboutStudio.heading),
      paragraphs: asStringArray(aboutData.paragraphs, fallbackContent.aboutStudio.paragraphs),
    },
    expertise: {
      heading: asString(expertiseData.heading, fallbackContent.expertise.heading),
      intro: asString(expertiseData.intro, fallbackContent.expertise.intro),
      items: asStringArray(expertiseData.items, fallbackContent.expertise.items),
    },
    gallery: {
      heading: asString(galleryData.heading, fallbackContent.gallery.heading),
      images: asGalleryImages(galleryData.images, fallbackContent.gallery.images),
    },
    contact: {
      heading: asString(contactSetting.heading, fallbackContent.contact.heading),
      intro: asString(contactSetting.intro, fallbackContent.contact.intro),
      email: asString(contactSetting.email, fallbackContent.contact.email),
      contactLabel: asString(contactSetting.contactLabel, fallbackContent.contact.contactLabel),
      copyEmail: asString(contactSetting.copyEmail, fallbackContent.contact.copyEmail),
      whatsappLabel: asString(contactSetting.whatsappLabel, fallbackContent.contact.whatsappLabel),
      socials,
    },
    footer: {
      brandLine: asString(footerData.brandLine, fallbackContent.footer.brandLine),
      copyright: asString(footerData.copyright, fallbackContent.footer.copyright),
    },
  };

  if (!content.contact.email) {
    content.contact.email = fallbackContent.contact.email;
  }

  if (!content.nav.links.length) {
    content.nav.links = fallbackContent.nav.links;
  }

  if (!content.contact.socials.length) {
    content.contact.socials = fallbackContent.contact.socials;
  }

  if (!content.contact.whatsappLabel) {
    content.contact.whatsappLabel = fallbackContent.contact.whatsappLabel;
  }

  if (!content.showreel.videoSrc) {
    content.showreel.videoSrc = fallbackContent.showreel.videoSrc;
  }

  if (!content.hero.media.imageSrc && !content.hero.media.videoSrc) {
    content.hero.media.imageSrc = fallbackContent.hero.media.imageSrc;
  }

  if (cmsProjects.length === 0) {
    return {
      content,
      projects: fallbackProjects,
      featuredProjects: fallbackProjects.filter((project) => project.featured).slice(0, recentLimit),
      whatsappUrl,
      seoGlobal: {
        title: content.metadata.title,
        description: content.metadata.description,
        ogImage: asString(seoSetting.ogImage, "/og-cover.svg"),
      },
    };
  }

  const homeFeatured = homeSource.slice(0, recentLimit);

  return {
    content,
    projects: orderedProjects,
    featuredProjects: homeFeatured,
    whatsappUrl,
    seoGlobal: {
      title: content.metadata.title,
      description: content.metadata.description,
      ogImage: asString(seoSetting.ogImage, "/og-cover.svg"),
    },
  };
}
