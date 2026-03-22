import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/content/brand";
import { blogPreviews } from "@/content/blog-posts";
import { projects as fallbackProjects } from "@/content/projects";
import { servicePreviews } from "@/content/services";
import { listBlogPosts } from "@/src/lib/domain/blog";
import { listProjects } from "@/src/lib/domain/projects";
import { listPublishedServices } from "@/src/lib/domain/services";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const [projects, services, blogPosts] = await Promise.all([
    listProjects({ includeUnpublished: false, includeMedia: false }),
    listPublishedServices(),
    listBlogPosts({ includeUnpublished: false, limit: 500 }),
  ]);

  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1
    },
    {
      url: `${siteUrl}/proyectos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/servicios`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9
    },
    {
      url: `${siteUrl}/sobre-mi`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: `${siteUrl}/contacto`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8
    },
    {
      url: `${siteUrl}/solicitar-propuesta`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8
    }
  ];

  const projectsForSitemap =
    projects.length > 0
      ? projects.map((project) => ({
          slug: project.slug,
          lastModified: project.updated_at ?? project.created_at,
        }))
      : fallbackProjects.map((project) => ({
          slug: project.slug,
          lastModified: now.toISOString(),
        }));
  const projectRoutes: MetadataRoute.Sitemap = projectsForSitemap.map((project) => ({
    url: `${siteUrl}/proyectos/${project.slug}`,
    lastModified: new Date(project.lastModified),
    changeFrequency: "monthly",
    priority: 0.8
  }));
  const servicesForSitemap =
    services.length > 0
      ? services.map((service) => ({
          slug: service.slug,
          lastModified: service.updated_at ?? service.created_at,
        }))
      : servicePreviews.map((service) => ({
          slug: service.slug,
          lastModified: now.toISOString(),
        }));
  const postsForSitemap =
    blogPosts.length > 0
      ? blogPosts.map((post) => ({
          slug: post.slug,
          publishedAt: post.published_at ?? post.created_at,
        }))
      : blogPreviews;

  const serviceRoutes: MetadataRoute.Sitemap = servicesForSitemap.map((service) => ({
    url: `${siteUrl}/servicios/${service.slug}`,
    lastModified: new Date(service.lastModified),
    changeFrequency: "monthly",
    priority: 0.75
  }));
  const blogRoutes: MetadataRoute.Sitemap = postsForSitemap.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7
  }));

  return [...baseRoutes, ...projectRoutes, ...serviceRoutes, ...blogRoutes];
}
