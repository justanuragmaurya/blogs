import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

// Directory containing blog posts
const blogsDirectory = path.join(process.cwd(), "blogs");

export interface BlogPost {
  slug: string;
  title: string;
  description?: string;
  date: string;
  tags?: string[];
  published?: boolean;
  content: string; // raw markdown
  contentHtml: string; // rendered HTML
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description?: string;
  date: string;
  tags?: string[];
}

/**
 * Validates required frontmatter fields and logs warnings for missing optional fields
 */
function validateFrontmatter(
  data: Record<string, unknown>,
  slug: string
): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.title || typeof data.title !== "string") {
    errors.push(`Missing or invalid 'title' field`);
  }

  if (!data.date) {
    errors.push(`Missing 'date' field`);
  } else {
    const dateValue = new Date(data.date as string);
    if (isNaN(dateValue.getTime())) {
      errors.push(`Invalid date format: ${data.date}`);
    }
  }

  // Optional field warnings
  if (!data.description) {
    warnings.push(`Missing 'description' field (recommended for SEO)`);
  }

  // Log warnings
  warnings.forEach((warning) => {
    console.warn(`[blogs/${slug}.md] Warning: ${warning}`);
  });

  // Throw on errors
  if (errors.length > 0) {
    throw new Error(
      `[blogs/${slug}.md] Validation failed:\n  - ${errors.join("\n  - ")}`
    );
  }
}

/**
 * Gets all blog post slugs for static generation
 */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(blogsDirectory)) {
    console.warn(`Blogs directory not found: ${blogsDirectory}`);
    return [];
  }

  const fileNames = fs.readdirSync(blogsDirectory);
  const slugs = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""));

  // Check for duplicate slugs
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) {
      throw new Error(`Duplicate slug detected: ${slug}`);
    }
    seen.add(slug);
  }

  return slugs;
}

/**
 * Converts markdown to HTML with math and code highlighting support
 */
async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return result.toString();
}

/**
 * Gets a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const fullPath = path.join(blogsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // Validate frontmatter
  validateFrontmatter(data, slug);

  // Convert markdown to HTML with math and code highlighting
  const contentHtml = await markdownToHtml(content);

  return {
    slug,
    title: data.title as string,
    description: data.description as string | undefined,
    date: data.date as string,
    tags: data.tags as string[] | undefined,
    published: data.published !== false, // default to true
    content,
    contentHtml,
  };
}

/**
 * Gets all blog posts, sorted by date (newest first)
 * Filters out unpublished posts
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const slugs = getAllSlugs();
  const posts: BlogPost[] = [];

  for (const slug of slugs) {
    const post = await getPostBySlug(slug);
    if (post && post.published !== false) {
      posts.push(post);
    }
  }

  // Sort by date (newest first)
  posts.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return posts;
}

/**
 * Gets metadata for all posts (without content) for listing pages
 */
export async function getAllPostsMeta(): Promise<BlogPostMeta[]> {
  const posts = await getAllPosts();

  return posts.map(({ slug, title, description, date, tags }) => ({
    slug,
    title,
    description,
    date,
    tags,
  }));
}
