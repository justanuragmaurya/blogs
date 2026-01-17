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

export default async function Home() {
  const posts = await getAllPostsMeta();
  const recentPosts = posts.slice(0, 5);

  return (
    <div className="min-h-full p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 border-l-2 border-primary pl-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase mb-4 text-white">
            Anurag <span className="text-primary">Maurya</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-mono max-w-2xl">
            // FULL STACK ENGINEER
            <br />
            // BUILDING DIGITAL SYSTEMS
          </p>
        </header>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-2">
            <h2 className="text-xl font-bold uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-primary"></span>
              Recent Logs
            </h2>
            <Link
              href="/blog"
              className="text-xs font-mono text-primary hover:text-white transition-colors uppercase tracking-wider"
            >
              [ View All Logs ]
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="p-4 border border-dashed border-border text-muted-foreground font-mono text-sm">
              NO LOGS FOUND IN DATABASE.
            </div>
          ) : (
            <div className="grid gap-4">
              {recentPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <article className="border border-border bg-black/40 p-5 hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-primary text-xs font-mono">↗ OPEN</span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 mb-2">
                        <time
                            dateTime={post.date}
                            className="text-xs font-mono text-primary/80 shrink-0"
                        >
                            {formatDate(post.date)}
                        </time>
                        <h3 className="text-lg font-bold uppercase group-hover:text-primary transition-colors">
                            {post.title}
                        </h3>
                    </div>
                    
                    {post.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 md:pl-26 font-mono opacity-80">
                        {post.description}
                      </p>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
