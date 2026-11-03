import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SITE_URL = "https://fas-fellowship.org";
const DIST = join(process.cwd(), "dist");

const pages = [
  {
    route: "/",
    title: "FAS Fellowship | Faith Alone Saves",
    description: "Faith Alone Saves (FAS) is a Christian student fellowship helping students grow in Christ through Bible study, prayer, worship, mentorship, and community.",
    schemaType: "WebPage",
  },
  {
    route: "/about",
    title: "About FAS | Our Mission, Vision & Christian Fellowship",
    description: "Discover the mission and vision of Faith Alone Saves, a Christian student fellowship helping students grow in God's Word, worship, mentorship, service, and community.",
    schemaType: "AboutPage",
  },
  {
    route: "/events",
    title: "FAS Events | Christian Student Fellowship Gatherings",
    description: "Explore upcoming and past Faith Alone Saves fellowship gatherings, online Bible meetings, retreats, and student events.",
    schemaType: "CollectionPage",
  },
  {
    route: "/stories",
    title: "Student Testimonies & Stories | Faith Alone Saves",
    description: "Read student testimonies and stories of faith, fellowship, spiritual growth, and God's work through Faith Alone Saves.",
    schemaType: "CollectionPage",
  },
  {
    route: "/blog",
    title: "FAS Journal | Christian Articles, Faith & Discipleship",
    description: "Explore articles, reflections, and biblical encouragement from the Faith Alone Saves student fellowship journal.",
    schemaType: "Blog",
  },
  {
    route: "/devotions",
    title: "Daily Bible Devotionals | Scripture & Prayer | FAS",
    description: "Read daily Bible devotionals from Faith Alone Saves with Scripture, reflection, prayer, and practical steps for Christian living.",
    schemaType: "CollectionPage",
  },
  {
    route: "/media",
    title: "FAS Media | Sermons, Messages & Christian Resources",
    description: "Watch and listen to sermons, messages, and Christian media resources shared by the Faith Alone Saves fellowship.",
    schemaType: "CollectionPage",
  },
  {
    route: "/gallery",
    title: "FAS Gallery | Fellowship Moments & Events",
    description: "Explore moments from Faith Alone Saves gatherings, student fellowship, events, and community life.",
    schemaType: "CollectionPage",
  },
  {
    route: "/connect",
    title: "Connect with FAS | Prayer Requests & Contact",
    description: "Connect with Faith Alone Saves, ask a question, share a testimony, or send a prayer request to the fellowship.",
    schemaType: "ContactPage",
  },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const replaceTag = (html, expression, replacement, label) => {
  if (!expression.test(html)) {
    throw new Error(`Cannot generate static SEO HTML: missing ${label}`);
  }
  return html.replace(expression, replacement);
};

const setMeta = (html, selector, attributes) => {
  const replacement = `<meta ${Object.entries(attributes)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ")} />`;
  return replaceTag(
    html,
    selector,
    replacement,
    selector.toString()
  );
};

const buildSchema = (page) => {
  const url = `${SITE_URL}${page.route === "/" ? "/" : page.route}`;
  const breadcrumbItems = page.route === "/"
    ? []
    : [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: page.title.split("|")[0].trim(), item: url },
      ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "Faith Alone Saves",
        alternateName: "FAS Fellowship",
        description: "Faith Alone Saves is a Christian student fellowship helping campus students grow in God's Word, worship, fellowship, mentorship, and service.",
        inLanguage: "en-IN",
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Faith Alone Saves",
        alternateName: "FAS Fellowship",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/branding/fas-logo.png`,
      },
      {
        "@type": page.schemaType,
        "@id": `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-IN",
        ...(breadcrumbItems.length
          ? { breadcrumb: { "@type": "BreadcrumbList", itemListElement: breadcrumbItems } }
          : {}),
      },
    ],
  };
};

const baseHtml = await readFile(join(DIST, "index.html"), "utf8");

for (const page of pages) {
  const canonical = `${SITE_URL}${page.route === "/" ? "/" : page.route}`;
  let html = baseHtml;

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`, "title");
  html = setMeta(html, /<meta\s+name="description"[^>]*\/?\s*>/i, {
    name: "description",
    content: page.description,
  });
  html = setMeta(html, /<meta\s+name="robots"[^>]*\/?\s*>/i, {
    name: "robots",
    content: "index, follow, max-image-preview:large",
  });
  html = setMeta(html, /<meta\s+property="og:type"[^>]*\/?\s*>/i, {
    property: "og:type",
    content: "website",
  });
  html = setMeta(html, /<meta\s+property="og:title"[^>]*\/?\s*>/i, {
    property: "og:title",
    content: page.title,
  });
  html = setMeta(html, /<meta\s+property="og:description"[^>]*\/?\s*>/i, {
    property: "og:description",
    content: page.description,
  });
  html = setMeta(html, /<meta\s+property="og:url"[^>]*\/?\s*>/i, {
    property: "og:url",
    content: canonical,
  });
  html = setMeta(html, /<meta\s+name="twitter:title"[^>]*\/?\s*>/i, {
    name: "twitter:title",
    content: page.title,
  });
  html = setMeta(html, /<meta\s+name="twitter:description"[^>]*\/?\s*>/i, {
    name: "twitter:description",
    content: page.description,
  });

  html = replaceTag(
    html,
    /<link\s+rel="canonical"[^>]*\/?\s*>/i,
    `<link rel="canonical" href="${canonical}" />`,
    "canonical link"
  );

  const schema = JSON.stringify(buildSchema(page));
  html = replaceTag(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" id="fas-website-schema">${schema}</script>`,
    "structured data"
  );

  const outputPath =
    page.route === "/"
      ? join(DIST, "index.html")
      : join(DIST, page.route.slice(1), "index.html");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}

console.log(`Static SEO: generated crawl-ready metadata and structured data for ${pages.length} public routes.`);
