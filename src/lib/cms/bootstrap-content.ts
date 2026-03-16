import "server-only";

import { contentEs } from "@/content/site-content";
import { projects as fallbackProjects } from "@/content/projects";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { parseSectionData } from "@/src/lib/validators/section-schemas";
import { buildDeterministicMediaStorageKey } from "@/src/lib/r2/keys";
import type { TablesInsert } from "@/src/types/database.types";

type BootstrapReport = {
  sections: { inserted: number; updated: number; skipped: number };
  settings: { inserted: number; updated: number; skipped: number };
  projects: { inserted: number; updated: number; skipped: number };
  media: { inserted: number; updated: number; skipped: number };
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

function isEquivalent(a: unknown, b: unknown) {
  return stableStringify(a) === stableStringify(b);
}

function buildBootstrapSections(actorId: string): TablesInsert<"site_sections">[] {
  const sections = [
    {
      page_key: "home",
      section_key: "hero",
      position: 10,
      enabled: true,
      status: "published",
      data_json: parseSectionData("hero", contentEs.hero),
      updated_by: actorId,
    },
    {
      page_key: "home",
      section_key: "about",
      position: 40,
      enabled: true,
      status: "published",
      data_json: parseSectionData("about", contentEs.aboutStudio),
      updated_by: actorId,
    },
    {
      page_key: "home",
      section_key: "expertises",
      position: 50,
      enabled: true,
      status: "published",
      data_json: parseSectionData("expertises", contentEs.expertise),
      updated_by: actorId,
    },
    {
      page_key: "home",
      section_key: "recent_works",
      position: 20,
      enabled: true,
      status: "published",
      data_json: parseSectionData("recent_works", {
        heading: contentEs.works.homeHeading,
        intro: contentEs.works.homeIntro,
        showFeaturedOnly: true,
        limit: 3,
      }),
      updated_by: actorId,
    },
    {
      page_key: "home",
      section_key: "showreel",
      position: 30,
      enabled: true,
      status: "published",
      data_json: parseSectionData("showreel", contentEs.showreel),
      updated_by: actorId,
    },
    {
      page_key: "home",
      section_key: "visual_gallery",
      position: 60,
      enabled: true,
      status: "published",
      data_json: parseSectionData("visual_gallery", contentEs.gallery),
      updated_by: actorId,
    },
    {
      page_key: "global",
      section_key: "navbar",
      position: 10,
      enabled: true,
      status: "published",
      data_json: parseSectionData("navbar", contentEs.nav),
      updated_by: actorId,
    },
    {
      page_key: "global",
      section_key: "footer",
      position: 90,
      enabled: true,
      status: "published",
      data_json: parseSectionData("footer", {
        ...contentEs.footer,
        links: contentEs.contact.socials,
      }),
      updated_by: actorId,
    },
    {
      page_key: "works",
      section_key: "works_listing_header",
      position: 10,
      enabled: true,
      status: "published",
      data_json: parseSectionData("works_listing_header", {
        heading: contentEs.works.pageHeading,
        intro: contentEs.works.pageIntro,
      }),
      updated_by: actorId,
    },
    {
      page_key: "works",
      section_key: "featured_projects",
      position: 20,
      enabled: true,
      status: "published",
      data_json: parseSectionData("featured_projects", {
        heading: "Featured",
        projectSlugs: fallbackProjects.filter((project) => project.featured).map((project) => project.slug),
      }),
      updated_by: actorId,
    },
    {
      page_key: "works",
      section_key: "works_ordering",
      position: 30,
      enabled: true,
      status: "published",
      data_json: parseSectionData("works_ordering", {
        mode: "manual",
        manualOrderSlugs: fallbackProjects.map((project) => project.slug),
      }),
      updated_by: actorId,
    },
  ] satisfies TablesInsert<"site_sections">[];

  return sections;
}

function buildBootstrapSettings(actorId: string): TablesInsert<"site_settings">[] {
  return [
    {
      key: "contact",
      value_json: {
        heading: contentEs.contact.heading,
        intro: contentEs.contact.intro,
        email: contentEs.contact.email,
        contactLabel: contentEs.contact.contactLabel,
        copyEmail: contentEs.contact.copyEmail,
        whatsappLabel: contentEs.contact.whatsappLabel,
      },
      updated_by: actorId,
    },
    {
      key: "social_links",
      value_json: {
        links: contentEs.contact.socials,
      },
      updated_by: actorId,
    },
    {
      key: "seo_global",
      value_json: {
        title: contentEs.metadata.title,
        description: contentEs.metadata.description,
        ogImage: "/og-cover.svg",
      },
      updated_by: actorId,
    },
    {
      key: "navigation",
      value_json: {
        brand: contentEs.nav.brand,
        links: contentEs.nav.links,
      },
      updated_by: actorId,
    },
    {
      key: "whatsapp",
      value_json: {
        number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "34650304969",
        message:
          "Hola Nacho, he visto tu portfolio en nachomasdesign.com y me gustaria hablar contigo sobre un proyecto.",
      },
      updated_by: actorId,
    },
  ];
}

function buildBootstrapProjects(actorId: string): TablesInsert<"projects">[] {
  const nowIso = new Date().toISOString();
  return fallbackProjects.map((project) => ({
    slug: project.slug,
    title: project.title,
    subtitle: null,
    excerpt: project.shortDescription,
    body_markdown: project.fullDescription,
    year: project.year ? Number(project.year) : null,
    client_name: null,
    category: project.category,
    featured: project.featured,
    status: "published",
    seo_json: {
      title: project.title,
      description: project.shortDescription,
      ogImage: project.coverImage,
      services: project.services,
    },
    published_at: nowIso,
    updated_by: actorId,
  }));
}

function buildBootstrapProjectMedia(projectIdBySlug: Record<string, string>) {
  const rows: TablesInsert<"project_media">[] = [];

  fallbackProjects.forEach((project) => {
    const projectId = projectIdBySlug[project.slug];
    if (!projectId) return;

    rows.push({
      project_id: projectId,
      kind: "image",
      role: "cover",
      storage_key: buildDeterministicMediaStorageKey({
        scope: "legacy",
        projectRef: project.slug,
        role: "cover",
        kind: "image",
        source: project.coverImage,
      }),
      public_url: project.coverImage,
      alt_text: project.title,
      caption: null,
      sort_order: 0,
    });

    if (project.heroImage) {
      rows.push({
        project_id: projectId,
        kind: "image",
        role: "hero",
        storage_key: buildDeterministicMediaStorageKey({
          scope: "legacy",
          projectRef: project.slug,
          role: "hero",
          kind: "image",
          source: project.heroImage,
        }),
        public_url: project.heroImage,
        alt_text: `${project.title} hero`,
        caption: null,
        sort_order: 1,
      });
    }

    project.gallery.forEach((url, index) => {
      rows.push({
        project_id: projectId,
        kind: "image",
        role: "gallery",
        storage_key: buildDeterministicMediaStorageKey({
          scope: "legacy",
          projectRef: project.slug,
          role: "gallery",
          kind: "image",
          source: url,
          index,
        }),
        public_url: url,
        alt_text: `${project.title} galeria ${index + 1}`,
        caption: null,
        sort_order: index + 10,
      });
    });
  });

  return rows;
}

export async function bootstrapContentFromFrontend(actorId: string) {
  const admin = createSupabaseAdminClient();

  const report: BootstrapReport = {
    sections: { inserted: 0, updated: 0, skipped: 0 },
    settings: { inserted: 0, updated: 0, skipped: 0 },
    projects: { inserted: 0, updated: 0, skipped: 0 },
    media: { inserted: 0, updated: 0, skipped: 0 },
  };

  for (const row of buildBootstrapSections(actorId)) {
    const { data: existing, error: findError } = await admin
      .from("site_sections")
      .select("*")
      .eq("page_key", row.page_key)
      .eq("section_key", row.section_key)
      .eq("status", "published")
      .maybeSingle();

    if (findError) throw new Error(`Bootstrap section lookup failed: ${findError.message}`);

    if (existing) {
      report.sections.skipped += 1;
      continue;
    }

    const { error } = await admin.from("site_sections").insert(row);
    if (error) throw new Error(`Bootstrap section insert failed: ${error.message}`);
    report.sections.inserted += 1;
  }

  for (const row of buildBootstrapSettings(actorId)) {
    const { data: existing, error: findError } = await admin
      .from("site_settings")
      .select("*")
      .eq("key", row.key)
      .maybeSingle();

    if (findError) throw new Error(`Bootstrap setting lookup failed: ${findError.message}`);

    if (existing) {
      if (isEquivalent(existing.value_json, row.value_json)) {
        report.settings.skipped += 1;
      } else {
        report.settings.skipped += 1;
      }
      continue;
    }

    const { error } = await admin.from("site_settings").insert(row);
    if (error) throw new Error(`Bootstrap setting insert failed: ${error.message}`);
    report.settings.inserted += 1;
  }

  for (const row of buildBootstrapProjects(actorId)) {
    const { data: existing, error: findError } = await admin
      .from("projects")
      .select("*")
      .eq("slug", row.slug)
      .maybeSingle();

    if (findError) throw new Error(`Bootstrap project lookup failed: ${findError.message}`);

    if (existing) {
      report.projects.skipped += 1;
      continue;
    }

    const { error } = await admin.from("projects").insert(row);
    if (error) throw new Error(`Bootstrap project insert failed: ${error.message}`);
    report.projects.inserted += 1;
  }

  const slugs = fallbackProjects.map((project) => project.slug);
  const { data: projects, error: projectsLoadError } = await admin
    .from("projects")
    .select("id, slug")
    .in("slug", slugs);

  if (projectsLoadError) {
    throw new Error(`Bootstrap project id load failed: ${projectsLoadError.message}`);
  }

  const projectIdBySlug = Object.fromEntries((projects ?? []).map((p) => [p.slug, p.id]));
  for (const row of buildBootstrapProjectMedia(projectIdBySlug)) {
    const { data: existing, error: findError } = await admin
      .from("project_media")
      .select("id")
      .eq("storage_key", row.storage_key)
      .maybeSingle();

    if (findError) throw new Error(`Bootstrap media lookup failed: ${findError.message}`);

    if (existing) {
      report.media.skipped += 1;
      continue;
    }

    const { error } = await admin.from("project_media").insert(row);
    if (error) throw new Error(`Bootstrap media insert failed: ${error.message}`);
    report.media.inserted += 1;
  }

  return report;
}
