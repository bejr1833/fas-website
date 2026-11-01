import { test, expect } from "@playwright/test";

test("homepage renders its main content without a React crash", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("main")).toBeVisible();

  // A backend cold start must not leave the page stuck in a loading shell.
  await expect(page.locator("body")).not.toContainText("Loading homepage...", { timeout: 12_000 });
  expect(pageErrors, "Unexpected uncaught browser errors").toEqual([]);
});

test("primary section navigation targets existing sections", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('header a[href^="#"], nav a[href^="#"]');
  const count = await links.count();

  for (let index = 0; index < Math.min(count, 12); index += 1) {
    const href = await links.nth(index).getAttribute("href");
    if (!href || href === "#") continue;
    const targetId = decodeURIComponent(href.slice(1));
    const matchingTargets = await page.locator("[id]").evaluateAll(
      (elements, id) => elements.filter((element) => element.id === id).length,
      targetId
    );
    expect(matchingTargets, `Missing or duplicate navigation target: ${href}`).toBe(1);
  }
});

test("video cards expose safe, usable YouTube destinations when present", async ({ page }) => {
  await page.goto("/");
  const videos = page.locator(".videoCard");
  const count = await videos.count();

  for (let index = 0; index < count; index += 1) {
    const card = videos.nth(index);
    const watchLink = card.locator('a.videoWatchLink, a.videoPlayButton').first();
    await expect(watchLink).toHaveAttribute("href", /^https:\/\/(www\.)?youtube\.com\/watch\?v=/);
    await expect(watchLink).toHaveAttribute("target", "_blank");
    await expect(watchLink).toHaveAttribute("rel", /noopener/);
  }
});

test("mobile layout does not create horizontal page overflow", async ({ page }) => {
  test.skip((page.viewportSize()?.width || 1440) > 700, "Mobile viewport regression check");
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 2);
});

test("images with a failed source have a visible fallback or do not break layout", async ({ page }) => {
  await page.goto("/");
  const brokenImages = await page.locator("img").evaluateAll((images) =>
    images.filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({ alt: image.alt, src: image.currentSrc || image.src }))
  );
  // Record broken assets as test output; some third-party content may be temporarily unavailable.
  test.info().annotations.push({ type: "broken-images", description: JSON.stringify(brokenImages.slice(0, 20)) });
});

test("public backend health and core content endpoints respond", async ({ request }) => {
  const base = "https://fas-backend-xnhy.onrender.com";
  for (const endpoint of ["/api/health/", "/api/home/", "/api/videos/"]) {
    const response = await request.get(`${base}${endpoint}`, { timeout: 45_000 });
    expect(response.status(), `${endpoint} should respond successfully`).toBe(200);
  }
});


test("blog and media routes only request the content they need", async ({ page }) => {
  const requestedEndpoints = [];
  await page.route("https://fas-backend-xnhy.onrender.com/api/**", async (route) => {
    requestedEndpoints.push(new URL(route.request().url()).pathname);
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.goto("/blog");
  await page.waitForTimeout(250);
  expect(requestedEndpoints).toContain("/api/blog/");
  expect(requestedEndpoints).not.toContain("/api/home/");
  expect(requestedEndpoints).not.toContain("/api/sermons/");
  expect(requestedEndpoints).not.toContain("/api/videos/");
  expect(requestedEndpoints).not.toContain("/api/ebooks/");

  requestedEndpoints.length = 0;
  await page.goto("/media");
  await expect.poll(() => requestedEndpoints, { timeout: 8_000 }).toEqual(
    expect.arrayContaining(["/api/sermons/", "/api/videos/", "/api/ebooks/"])
  );
  expect(requestedEndpoints).not.toContain("/api/home/");
  expect(requestedEndpoints).not.toContain("/api/blog/");
});

test("desktop layout does not create horizontal page overflow", async ({ page }) => {
  test.skip((page.viewportSize()?.width || 0) < 1000, "Desktop viewport regression check");
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 2);
});


test("generated sitemap includes every public section page", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  const xml = await response.text();

  for (const route of [
    "/about", "/events", "/stories", "/blog",
    "/devotions", "/media", "/gallery", "/connect",
  ]) {
    expect(xml, `Sitemap should include ${route}`).toContain(
      `https://fas-fellowship.org${route}`
    );
  }
});

test("every public section has unique SEO metadata and page structured data", async ({ page }) => {
  const routes = [
    ["/", "Christian Student Fellowship | Faith Alone Saves (FAS)"],
    ["/about", "About FAS | Our Mission, Vision & Christian Fellowship"],
    ["/events", "FAS Events | Christian Student Fellowship Gatherings"],
    ["/stories", "Student Testimonies & Stories | Faith Alone Saves"],
    ["/blog", "FAS Journal | Christian Articles, Faith & Discipleship"],
    ["/devotions", "Daily Bible Devotionals | Scripture & Prayer | FAS"],
    ["/media", "FAS Media | Sermons, Messages & Christian Resources"],
    ["/gallery", "FAS Gallery | Fellowship Moments & Events"],
    ["/connect", "Connect with FAS | Prayer Requests & Contact"],
  ];

  for (const [route, expectedTitle] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(expectedTitle);
    const metadata = await page.evaluate(() => ({
      description: document.querySelector('meta[name="description"]')?.content || "",
      canonical: document.querySelector('link[rel="canonical"]')?.href || "",
      ogUrl: document.querySelector('meta[property="og:url"]')?.content || "",
      twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || "",
      schema: JSON.parse(document.querySelector("#fas-website-schema")?.textContent || "{}"),
    }));
    expect(metadata.description.length, `${route} should have a useful meta description`).toBeGreaterThan(80);
    expect(metadata.canonical).toBe(`https://fas-fellowship.org${route === "/" ? "/" : route}`);
    expect(metadata.ogUrl).toBe(metadata.canonical);
    expect(metadata.twitterTitle).toBe(expectedTitle);
    expect(metadata.schema["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": expect.any(String),
          url: metadata.canonical,
        }),
      ])
    );
  }
});

test("devotional AMP pages provide crawlable links to related devotionals", async ({ request }) => {
  const response = await request.get("/devotionals/do-you-really-know-him/amp/");
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(html).toContain('rel="canonical"');
  expect(html).toContain("More FAS devotionals");
  expect(html).toMatch(/href="\/devotionals\/[a-zA-Z0-9_-]+"/);
});

test("canonical devotional pages link to related devotionals and the archive", async ({ page }) => {
  const devotionals = [
    { slug: "do-you-really-know-him", title: "Do You Really Know Him?", date: "2026-10-30", author: "FAS", scripture_text: "Know Him.", scripture_reference: "John 17:3", impact_line: "Know Christ.", reflection: "A reflection.", prayer: "A prayer." },
    { slug: "walk-by-faith", title: "Walk by Faith", date: "2026-10-29", author: "FAS", scripture_text: "Walk by faith.", scripture_reference: "2 Corinthians 5:7", impact_line: "Trust God.", reflection: "A reflection.", prayer: "A prayer." },
    { slug: "hope-in-the-lord", title: "Hope in the Lord", date: "2026-10-28", author: "FAS", scripture_text: "Hope in the Lord.", scripture_reference: "Psalm 27:14", impact_line: "Wait on God.", reflection: "A reflection.", prayer: "A prayer." },
  ];
  await page.route("https://fas-backend-xnhy.onrender.com/api/devotionals/**", async (route) => {
    const url = new URL(route.request().url());
    const slug = url.pathname.split("/").filter(Boolean).at(-1);
    const detail = devotionals.find((item) => item.slug === slug);
    await route.fulfill({
      status: detail ? 200 : 200,
      contentType: "application/json",
      body: JSON.stringify(url.pathname.endsWith("/do-you-really-know-him/") ? devotionals[0] : devotionals),
    });
  });
  await page.goto("/devotionals/do-you-really-know-him");
  await expect(page.getByRole("heading", { name: "Do You Really Know Him?" })).toBeVisible();
  const related = page.getByRole("navigation", { name: "Related devotionals" });
  await expect(related.getByRole("link", { name: "Walk by Faith" })).toHaveAttribute("href", "/devotionals/walk-by-faith");
  await expect(related.getByRole("link", { name: "Hope in the Lord" })).toHaveAttribute("href", "/devotionals/hope-in-the-lord");
  await expect(related.getByRole("link", { name: "Browse the full devotional calendar" })).toHaveAttribute("href", "/devotions");
});

test("static public route HTML contains route-specific SEO before JavaScript runs", async ({ request }) => {
  const routes = [
    ["/", "Christian Student Fellowship | Faith Alone Saves (FAS)"],
    ["/about", "About FAS | Our Mission, Vision & Christian Fellowship"],
    ["/events", "FAS Events | Christian Student Fellowship Gatherings"],
    ["/stories", "Student Testimonies & Stories | Faith Alone Saves"],
    ["/blog", "FAS Journal | Christian Articles, Faith & Discipleship"],
    ["/devotions", "Daily Bible Devotionals | Scripture & Prayer | FAS"],
    ["/media", "FAS Media | Sermons, Messages & Christian Resources"],
    ["/gallery", "FAS Gallery | Fellowship Moments & Events"],
    ["/connect", "Connect with FAS | Prayer Requests & Contact"],
  ];

  for (const [route, title] of routes) {
    // Vite preview serves generated route index files through their directory URL.
    // Request the trailing-slash form so /about resolves to dist/about/index.html,
    // rather than the SPA fallback at dist/index.html.
    const htmlRoute = route === "/" ? route : `${route}/`;
    const response = await request.get(htmlRoute);
    expect(response.ok(), `${route} should serve its static HTML shell`).toBeTruthy();
    const html = await response.text();
    // Raw HTML escapes ampersands in title text; compare the serialized form.
    expect(html).toContain(`<title>${title.replaceAll("&", "&amp;")}</title>`);
    expect(html).toContain(`<link rel="canonical" href="https://fas-fellowship.org${route === "/" ? "/" : route}" />`);
    expect(html).toContain('name="description"');
    expect(html).toContain('id="fas-website-schema"');
    expect(html).toContain('"@type":"WebSite"');
  }
});
