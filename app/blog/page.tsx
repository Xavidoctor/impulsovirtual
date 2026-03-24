import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/PublicPageShell";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { blogPreviews } from "@/content/blog-posts";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";
import { listBlogPosts } from "@/src/lib/domain/blog";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteContext();
  const canonical = getCanonicalUrl("/blog");
  return {
    title: "Blog",
    description: "Ideas, guías y estrategia digital para empresas y marcas premium.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Blog | ${site.brandName}`,
      description: "Ideas, guías y estrategia digital para empresas y marcas premium.",
      images: [site.seo.ogImage],
      url: canonical,
    },
  };
}

export default async function BlogPage() {
  const domainPosts = await listBlogPosts({ includeUnpublished: false, limit: 40 });
  const posts =
    domainPosts.length > 0
      ? domainPosts.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          category: post.category?.name ?? "Análisis",
          coverImage: post.cover_image_url,
          author: post.author_name ?? "Impulso Virtual",
          publishedAt: (post.published_at ?? post.created_at).slice(0, 10),
        }))
      : blogPreviews.map((post) => ({
          id: post.slug,
          ...post,
          coverImage: null,
          author: "Impulso Virtual",
          category: "Análisis",
        }));

  const featuredPost = posts[0] ?? null;
  const secondaryPosts = posts.slice(1);

  return (
    <PublicPageShell>
      <section className="section-padding pb-14">
        <div className="container-width space-y-10">
          <Reveal className="page-intro">
            <p className="editorial-kicker">Editorial</p>
            <h1 className="hero-title font-display">Análisis y criterio digital</h1>
            <p className="section-copy">
              Ideas prácticas sobre estrategia, web premium y posicionamiento para negocios que
              quieren captar mejor y vender con más claridad.
            </p>
          </Reveal>

          {featuredPost ? (
            <Reveal>
              <article className="premium-panel overflow-hidden p-6 md:p-8">
                <div className="noise-overlay" />
                <div className="relative z-[1] grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
                  <div className="space-y-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-accent">
                      Artículo destacado
                    </p>
                    <h2 className="text-3xl font-display text-foreground md:text-5xl">
                      {featuredPost.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted">{featuredPost.excerpt}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.16em] text-muted">
                      <span>{featuredPost.publishedAt}</span>
                      <span>{featuredPost.category}</span>
                      <span>{featuredPost.author}</span>
                    </div>
                    <Link href={`/blog/${featuredPost.slug}`} className="focus-ring btn-primary">
                      Leer artículo
                    </Link>
                  </div>

                  <div className="premium-card overflow-hidden p-3">
                    {featuredPost.coverImage ? (
                      <img
                        src={featuredPost.coverImage}
                        alt={featuredPost.title}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        sizes="(min-width: 768px) 45vw, 95vw"
                        className="h-64 w-full rounded-lg object-cover md:h-72"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-xs uppercase tracking-[0.16em] text-muted md:h-72">
                        Editorial Impulso Virtual
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {secondaryPosts.map((post, index) => (
              <Reveal key={post.id} delay={index * 0.06}>
                <article className="premium-card elevate-hover h-full p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                      {post.category}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                      {post.publishedAt}
                    </p>
                  </div>
                  <h2 className="mt-4 text-2xl font-display text-foreground">{post.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} className="focus-ring mt-6 lift-link">
                    Leer artículo
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="premium-card p-6 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
                    Siguiente paso
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    Si quieres llevar estas ideas a tu negocio, podemos traducirlas en un plan de
                    acción concreto.
                  </p>
                </div>
                <Link href="/solicitar-propuesta" className="focus-ring btn-secondary">
                  Solicitar propuesta
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicPageShell>
  );
}
