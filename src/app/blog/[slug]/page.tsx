import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getPostBySlug } from "@/lib/blogs";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "ERR_NOT_FOUND",
    };
  }

  return {
    title: `${post.title.toUpperCase()} | LOG`,
    description: post.description,
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, '.');
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-full p-6 md:p-12 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8 flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link href="/blog" className="hover:text-primary transition-colors hover:underline">
                ../BLOGS
            </Link>
            <span>/</span>
            <span className="text-foreground">{post.slug.toUpperCase()}</span>
        </nav>

        <article className="bg-black/60 p-8 md:p-10 border border-border/40 backdrop-blur-sm">
            <header className="mb-12 border-b border-dashed border-border pb-8">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-6 font-mono text-xs text-primary">
                    <time dateTime={post.date} className="px-2 py-1 border border-primary/30 bg-primary/10">
                        DATE: {formatDate(post.date)}
                    </time>
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2">
                            {post.tags.map((tag) => (
                                <span key={tag} className="uppercase">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
                
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight uppercase leading-tight mb-6">
                    {post.title}
                </h1>
                
                {post.description && (
                    <p className="text-lg text-muted-foreground font-mono border-l-2 border-primary pl-4 opacity-80">
                        {post.description}
                    </p>
                )}
            </header>

            <div className="prose prose-invert prose-orange max-w-none font-mono text-sm leading-relaxed prose-headings:font-sans prose-headings:uppercase prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-code:bg-primary/10 prose-code:border prose-code:border-primary/20 prose-code:px-1 prose-pre:bg-black prose-pre:border prose-pre:border-border">
            <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            </div>
            
            <footer className="mt-16 pt-8 border-t border-border flex justify-between items-center">
                <div className="text-xs font-mono text-muted-foreground">
                    END_OF_FILE
                </div>
                <Link href="/blog" className="px-4 py-2 border border-border hover:border-primary hover:bg-primary hover:text-black transition-all text-xs font-bold uppercase tracking-wider">
                    ← Return to Index
                </Link>
            </footer>
        </article>
      </div>
    </div>
  );
}
