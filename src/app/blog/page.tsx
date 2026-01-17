import Link from "next/link";
import { getAllPostsMeta } from "@/lib/blogs";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, '.');
}

export default async function BlogIndex() {
  const posts = await getAllPostsMeta();

  return (
    <div className="min-h-full p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex items-end justify-between border-b border-primary/30 pb-4">
          <div>
            <div className="text-xs font-mono text-primary mb-2">DIR: /ROOT/BLOGS</div>
            <h1 className="text-4xl font-bold tracking-tight">
              My Blogs
            </h1>
          </div>
          <div className="text-xs font-mono text-muted-foreground text-right hidden md:block">
            ENTRIES: {posts.length}
            <br/>
            STATUS: READ_ONLY
          </div>
        </header>

        {posts.length === 0 ? (
           <div className="p-8 border border-dashed border-border text-center">
            <p className="text-muted-foreground font-mono">DIRECTORY EMPTY.</p>
          </div>
        ) : (
          <div className="space-y-px bg-border/30 border border-border/30">
            {posts.map((post) => (
              <article key={post.slug} className="group relative bg-background hover:bg-accent/5 transition-colors">
                <Link href={`/blog/${post.slug}`} className="block p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                            <span className="text-primary">{formatDate(post.date)}</span>
                            <span>//</span>
                            <div className="flex gap-2">
                                {post.tags?.map(tag => (
                                    <span key={tag} className="uppercase text-xs opacity-70">#{tag}</span>
                                ))}
                            </div>
                        </div>
                        <h2 className="text-xl font-bold uppercase group-hover:text-primary transition-colors">
                            {post.title}
                        </h2>
                        {post.description && (
                            <p className="text-sm text-muted-foreground font-mono line-clamp-1 opacity-70">
                                {post.description}
                            </p>
                        )}
                    </div>
                    <div className="shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                        → ACCESS
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
