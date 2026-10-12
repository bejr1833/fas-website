import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SITE_URL = "https://fas-fellowship.org";
const API_BASE_URL =
  process.env.VITE_API_BASE_URL ||
  "https://fas-backend-xnhy.onrender.com";
const DIST = join(process.cwd(), "dist");

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const safeSlug = (value) => {
  const slug = String(value || "").trim();
  return /^[a-zA-Z0-9_-]+$/.test(slug) ? slug : "";
};

const plainText = (value = "") =>
  String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const dateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
};

const fetchList = async (path) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${path} returned HTTP ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error(`${path} did not return a JSON array`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
};

const renderBlogContent = (content = "") =>
  String(content)
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      if (paragraph.startsWith("### ")) {
        return `<h3>${escapeHtml(paragraph.slice(4))}</h3>`;
      }
      if (paragraph.startsWith("## ")) {
        return `<h2>${escapeHtml(paragraph.slice(3))}</h2>`;
      }
      return `<p>${paragraph
        .split(/\r?\n/)
        .map(escapeHtml)
        .join("<br>")}</p>`;
    })
    .join("\n");

const renderParagraphs = (value = "") =>
  String(value)
    .split(/\r?\n\s*\r?\n|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("\n");

const ampStyles = `
  body{margin:0;background:#f7f5f1;color:#202321;font-family:Arial,Helvetica,sans-serif;line-height:1.75}
  .top{background:#111415;color:#f8f5ee;padding:22px 20px;border-bottom:3px solid #b52a2a}
  .brand{font-size:12px;letter-spacing:.16em;font-weight:800;color:#f1d9a0;text-decoration:none}
  main{max-width:760px;margin:0 auto;padding:28px 22px 52px}
  .eyebrow{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#a52a2a}
  h1{font-size:clamp(30px,7vw,46px);line-height:1.12;letter-spacing:-.03em;margin:12px 0 16px;color:#171a19}
  h2{font-size:25px;line-height:1.25;margin:30px 0 10px}
  h3{font-size:20px;line-height:1.3;margin:26px 0 8px}
  p{font-size:17px;margin:0 0 18px}
  .summary{font-size:19px;color:#505652;border-left:3px solid #b52a2a;padding-left:16px;margin:24px 0}
  .meta{font-size:13px;color:#646a65;margin:0 0 22px}
  .cover{margin:24px 0;border-radius:14px;overflow:hidden}
  .scripture{padding:20px;background:#eee7d8;border-left:3px solid #b88932;border-radius:8px;margin:24px 0}
  .scripture p{font-family:Georgia,serif;font-size:20px;margin:8px 0}
  .impact{padding:18px;background:#f0e7e4;border-radius:8px;margin:24px 0}
  .prayer{padding:20px;background:#ece8df;border-radius:8px;margin:24px 0}
  .prayer p{font-family:Georgia,serif;font-style:italic}
  footer{border-top:1px solid #d8d5cf;margin-top:36px;padding-top:20px;color:#686d68;font-size:12px}
  footer a{color:#a52a2a;font-weight:700;text-decoration:none}
  @media(min-width:600px){main{padding:44px 32px 64px}}
`;

const boilerplate = `<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>`;

const ampDocument = ({ title, description, canonical, image, schema, content }) => {
  const socialImage = image
    ? `<meta property="og:image" content="${escapeHtml(image)}">`
    : "";
  const schemaText = JSON.stringify(schema).replace(/</g, "\\u003c");
  return `<!doctype html>
<html amp lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Faith Alone Saves">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${socialImage}
<script async src="https://cdn.ampproject.org/v0.js"></script>
${boilerplate}
<style amp-custom>${ampStyles}</style>
<script type="application/ld+json">${schemaText}</script>
</head>
<body>
<header class="top"><a class="brand" href="/">FAITH ALONE SAVES · FAS FELLOWSHIP</a></header>
<main>${content}
<footer><p>Faith Alone Saves · Love in Fellowship &amp; Truth</p><a href="${escapeHtml(canonical)}">View the full FAS page</a> · <a href="/">Visit FAS</a></footer>
</main>
</body>
</html>`;
};

const injectCanonicalHead = (shell, { title, description, canonical, ampUrl, image, schema }) => {
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/?\s*>/i, '<meta property="og:type" content="article" />')
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  if (image) {
    html = html.replace(/<meta property="og:image" content="[^"]*"\s*\/?\s*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  }
  html = html.replace("</head>", `<link rel="amphtml" href="${escapeHtml(ampUrl)}" />\n<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>\n</head>`);
  return html;
};

const writePage = async (relativePath, html) => {
  const output = join(DIST, relativePath);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html, "utf8");
};

const shell = await readFile(join(DIST, "index.html"), "utf8");
const [posts, devotionals] = await Promise.all([
  fetchList("/api/blog/"),
  fetchList("/api/devotionals/"),
]);

let generated = 0;
for (const post of posts) {
  const slug = safeSlug(post?.slug);
  if (!slug || !post?.title) continue;
  const canonical = `${SITE_URL}/blog/${encodeURIComponent(slug)}`;
  const ampUrl = `${canonical}/amp/`;
  const title = `${plainText(post.title)} | Faith Alone Saves`;
  const description = plainText(post.excerpt || post.content).slice(0, 160) ||
    "Christian teaching and encouragement from Faith Alone Saves.";
  const published = post.published_at || post.created_at || undefined;
  const modified = post.updated_at || published;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: plainText(post.title),
    description,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: {
      "@type": "Organization",
      name: "Faith Alone Saves",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/branding/fas-logo.png` },
    },
    ...(post.cover_image_url ? { image: [post.cover_image_url] } : {}),
    ...(post.author ? { author: { "@type": "Person", name: plainText(post.author) } } : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
  };
  const image = post.cover_image_url || "";
  const content = `
<div class="eyebrow">FAS BLOG</div>
<h1>${escapeHtml(plainText(post.title))}</h1>
<div class="meta">${escapeHtml(dateLabel(published))}${post.author ? ` · ${escapeHtml(plainText(post.author))}` : ""}</div>
${image ? `<div class="cover"><amp-img src="${escapeHtml(image)}" alt="${escapeHtml(plainText(post.title))}" width="1200" height="675" layout="responsive"></amp-img></div>` : ""}
${post.excerpt ? `<div class="summary">${escapeHtml(plainText(post.excerpt))}</div>` : ""}
<article>${renderBlogContent(post.content || post.body || "")}</article>`;
  const ampHtml = ampDocument({ title, description, canonical, image, schema, content });
  const canonicalHtml = injectCanonicalHead(shell, { title, description, canonical, ampUrl, image, schema });
  await Promise.all([
    writePage(`blog/${slug}/index.html`, canonicalHtml),
    writePage(`blog/${slug}/amp/index.html`, ampHtml),
  ]);
  generated += 1;
}

for (const devotional of devotionals) {
  const slug = safeSlug(devotional?.slug);
  if (!slug || !devotional?.title) continue;
  const canonical = `${SITE_URL}/devotionals/${encodeURIComponent(slug)}`;
  const ampUrl = `${canonical}/amp/`;
  const title = `${plainText(devotional.title)} | FAS Daily Devotional | Faith Alone Saves`;
  const description = plainText(
    devotional.impact_line || devotional.reflection || devotional.scripture_reference
  ).slice(0, 160) || "A daily Scripture-led devotional from Faith Alone Saves.";
  const published = devotional.date || devotional.published_at || devotional.created_at || undefined;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: plainText(devotional.title),
    description,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: {
      "@type": "Organization",
      name: "Faith Alone Saves",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/branding/fas-logo.png` },
    },
    ...(published ? { datePublished: published } : {}),
  };
  const content = `
<div class="eyebrow">FAS DAILY DEVOTIONAL</div>
<h1>${escapeHtml(plainText(devotional.title))}</h1>
<div class="meta">${escapeHtml(dateLabel(published))}</div>
${devotional.scripture_reference || devotional.scripture_text ? `<section class="scripture"><div class="eyebrow">SCRIPTURE</div>${devotional.scripture_reference ? `<p><strong>${escapeHtml(plainText(devotional.scripture_reference))}</strong></p>` : ""}${devotional.scripture_text ? `<p>${escapeHtml(plainText(devotional.scripture_text))}</p>` : ""}</section>` : ""}
${devotional.impact_line ? `<section class="impact"><div class="eyebrow">THE IMPACT</div><p>${escapeHtml(plainText(devotional.impact_line))}</p></section>` : ""}
<article>${renderParagraphs(devotional.reflection || devotional.content || "")}</article>
${devotional.prayer ? `<section class="prayer"><div class="eyebrow">PRAYER</div>${renderParagraphs(devotional.prayer)}</section>` : ""}`;
  const ampHtml = ampDocument({ title, description, canonical, image: "", schema, content });
  const canonicalHtml = injectCanonicalHead(shell, {
    title,
    description,
    canonical,
    ampUrl,
    image: `${SITE_URL}/branding/fas-logo.png`,
    schema,
  });
  await Promise.all([
    writePage(`devotionals/${slug}/index.html`, canonicalHtml),
    writePage(`devotionals/${slug}/amp/index.html`, ampHtml),
  ]);
  generated += 1;
}

console.log(`AMP generation complete: ${generated} content pages paired with AMP versions.`);
