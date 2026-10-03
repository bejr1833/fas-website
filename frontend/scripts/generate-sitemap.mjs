import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SITE_URL = "https://fas-fellowship.org";
const API_BASE_URL =
  process.env.VITE_API_BASE_URL ||
  "https://fas-backend-xnhy.onrender.com";

const outputPath = join(process.cwd(), "public", "sitemap.xml");

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString().slice(0, 10);
};

const fetchBlogs = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/blog/`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Blog API returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } finally {
    clearTimeout(timeout);
  }
};

const buildSitemap = (posts) => {
  const urls = [
    {
      loc: `${SITE_URL}/`,
      lastmod: new Date().toISOString().slice(0, 10),
    },
    ...posts
      .filter((post) => post?.slug)
      .map((post) => ({
        loc: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
        lastmod: normalizeDate(post.updated_at || post.published_at),
      })),
  ];

  const uniqueUrls = Array.from(
    new Map(urls.map((item) => [item.loc, item])).values()
  );

  const entries = uniqueUrls
    .map(
      ({ loc, lastmod }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>\n    ` : ""}</url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
};

let posts = [];

try {
  posts = await fetchBlogs();
  console.log(`Sitemap: found ${posts.length} blog posts.`);
} catch (error) {
  console.error(
    "Sitemap: could not reach the blog API during build.",
    error?.message || error
  );
  process.exit(1);
}

await mkdir(join(process.cwd(), "public"), { recursive: true });
await writeFile(outputPath, buildSitemap(posts), "utf8");

console.log(`Sitemap written to ${outputPath} with ${posts.length + 1} URL(s).`);
