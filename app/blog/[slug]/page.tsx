import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/PublicPageShell";
import { Reveal } from "@/components/ui/Reveal";
import { getCanonicalUrl } from "@/content/brand";
import { blogPostBySlug, blogPreviews } from "@/content/blog-posts";
import { getBlogPostBySlug, listBlogPosts } from "@/src/lib/domain/blog";
import { getPublicSiteContext } from "@/src/lib/domain/public-site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateInput: string) {
  return new Date(dateInput).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseContentBlocks(content: string) {
  return content
    .split("\n\n")
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

export async function generateStaticParams() {
  const domainPosts = await listBlogPosts({ includeUnpublished: false, limit: 100 });
  if (domainPosts.length > 0) {
    return domainPosts.map((post) => ({ slug: post.slug }));
  }

  return blogPreviews.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonical = getCanonicalUrl(`/blog/${slug}`);
  const [post, site] = await Promise.all([getBlogPostBySlug(slug), getPublicSiteContext()]);
  const fallback = blogPostBySlug(slug);

  if (!post && !fallback) {
    return {
      title: "Artículo no encontrado",
      alternates: {
        canonical,
      },
    };
  }

  const title = post?.seo_title || post?.title || fallback!.title;
  const description = post?.seo_description || post?.excerpt || fallback!.excerpt;
  const image = post?.og_image_url || post?.cover_image_url || site.seo.ogImage;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | ${site.brandName}`,
      description,
      images: [image],
      url: canonical,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const domainPost = await getBlogPostBySlug(slug);
  const fallbackPost = blogPostBySlug(slug);
  const post = domainPost
    ? {
        title: domainPost.title,
        excerpt: domainPost.excerpt,
        publishedAt: (domainPost.published_at ?? domainPost.created_at).slice(0, 10),
        coverImage: domainPost.cover_image_url,
        category: domainPost.category?.name ?? "Análisis",
        author: domainPost.author_name ?? "Impulso Virtual",
        content: domainPost.content,
      }
    : fallbackPost
      ? {
          title: fallbackPost.title,
          excerpt: fallbackPost.excerpt,
          publishedAt: fallbackPost.publishedAt,
          coverImage: null,
          category: "Análisis",
          author: "Impulso Virtual",
          content:
            "Contenido de ejemplo para esta entrada.\n\nEn la siguiente fase conectaremos el editor enriquecido y bloques dinámicos.",
        }
      : null;

  if (!post) notFound();

  const blocks = parseContentBlocks(post.content);

  return (
    <PublicPageShell>
      <article className="section-padding pb-14">
        <div className="container-width space-y-8">
          <Reveal className="page-intro">
            <p className="editorial-kicker">{post.category}</p>
            <h1 className="hero-title max-w-5xl font-display leading-[0.94]">{post.title}</h1>
            <p className="section-copy">{post.excerpt}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.16em] text-muted">
              <span>{formatDate(post.publishedAt)}</span>
              <span>{post.author}</span>
            </div>
          </Reveal>

          {"coverImage" in post && post.coverImage ? (
            <Reveal>
              <div className="premium-panel overflow-hidden p-3">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="96vw"
                  className="h-[22rem] w-full rounded-xl object-cover md:h-[30rem]"
                />
              </div>
            </Reveal>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-start">
            <Reveal>
              <div className="premium-card space-y-6 p-7 md:p-8">
                {blocks.map((block, index) => (
                  <p key={`${post.title}-block-${index}`} className="text-[1.02rem] leading-8 text-foreground/88 md:text-[1.06rem]">
                    {block}
                  </p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <aside className="premium-card sticky top-24 space-y-5 p-5">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Autor</p>
                  <p className="text-sm text-foreground">{post.author}</p>
                </div>
                <div className="subtle-divider" />
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Publicado</p>
                  <p className="text-sm text-muted">{formatDate(post.publishedAt)}</p>
                </div>
                <div className="subtle-divider" />
                <Link href="/solicitar-propuesta" className="focus-ring btn-secondary w-full">
                  Hablar con el estudio
                </Link>
              </aside>
            </Reveal>
          </div>

          <Reveal>
            <Link href="/blog" className="focus-ring lift-link">
              ← Volver al blog
            </Link>
          </Reveal>
        </div>
      </article>
    </PublicPageShell>
  );
}
