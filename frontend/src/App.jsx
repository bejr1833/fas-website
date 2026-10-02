import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Instagram,
  Mail,
  Menu,
  Play,
  Quote,
  Users,
  Youtube,
  X
} from "lucide-react";

const fallback = {
  organization_name: "Faith Alone Saves",
  tagline: "LOVE IN FELLOWSHIP & TRUTH",
  hero_title: "Growing together in Christ.",
  hero_intro:
    "Equipping campus students to grow in God's Word, use their spiritual gifts, and selflessly impact their campuses.",
  vision:
    "To equip campus students wholistically - grounding them in God's Word, helping them worship and exercise their spiritual gifts, and inspiring them to selflessly expand God's Kingdom.",
  mission:
    "Connecting students through online meetings, in-person gatherings, and retreats; nurturing them wholistically through God's Word and mentorship; and creating opportunities for them to use their spiritual gifts to lead, serve, and selflessly impact their campuses.",
  tuesday_time: "Every Tuesday - 7:00 PM",
  whatsapp_url: "",
  instagram_url: "",
  youtube_url: "",
  email: ""
};

function App() {
  const [data, setData] = useState({
    settings: fallback,
    slides: [],
    upcoming_events: [],
    gallery: [],
    stories: [],
    blog: [],
    sermons: [],
    videos: [],
    ebooks: []
  });

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [blogPost, setBlogPost] = useState(null);
  const [blogLoading, setBlogLoading] = useState(false);

  const [galleryCategory, setGalleryCategory] = useState("all");
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(0);

  const galleryCategories = [
    { value: "all", label: "All" },
    { value: "retreats", label: "Retreats" },
    { value: "events", label: "FAS Events" },
    { value: "camps-conferences", label: "Camps & Conferences" },
    { value: "cottage-prayer", label: "Cottage Prayer & Fellowship" },
    { value: "bible-study", label: "Bible Study" },
    { value: "worship-prayer", label: "Worship & Prayer" },
    { value: "outreach-mission", label: "Outreach & Mission" },
    { value: "fellowship-gatherings", label: "Fellowship & Gatherings" }
  ];

  const filteredGallery =
    galleryCategory === "all"
      ? data.gallery
      : data.gallery.filter(
          (image) => image.category === galleryCategory
        );

  const openGalleryLightbox = (index) => {
    setGalleryLightboxIndex(index);
    setGalleryLightboxOpen(true);
  };

  const closeGalleryLightbox = () => {
    setGalleryLightboxOpen(false);
  };

  const showPreviousGalleryImage = () => {
    setGalleryLightboxIndex((current) =>
      filteredGallery.length
        ? (current - 1 + filteredGallery.length) % filteredGallery.length
        : 0
    );
  };

  const showNextGalleryImage = () => {
    setGalleryLightboxIndex((current) =>
      filteredGallery.length
        ? (current + 1) % filteredGallery.length
        : 0
    );
  };

  useEffect(() => {
    if (!galleryLightboxOpen) {
      return;
    }

    const handleGalleryKeyDown = (event) => {
      if (event.key === "Escape") {
        closeGalleryLightbox();
      } else if (event.key === "ArrowLeft") {
        showPreviousGalleryImage();
      } else if (event.key === "ArrowRight") {
        showNextGalleryImage();
      }
    };

    window.addEventListener("keydown", handleGalleryKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGalleryKeyDown);
    };
  }, [galleryLightboxOpen, filteredGallery.length]);

  useEffect(() => {
    fetch("/api/home/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("API unavailable");
        }
        return response.json();
      })
      .then((result) => {
        setData((current) => ({
          settings: result.settings || fallback,
          slides: result.slides || [],
          upcoming_events: result.upcoming_events || [],
          gallery: result.gallery || [],
          stories: result.stories || [],
          blog: current.blog || [],
          sermons: current.sermons || [],
          videos: current.videos || [],
          ebooks: current.ebooks || []
        }));
      })
      .catch(() => {
        setData((current) => ({
          settings: fallback,
          slides: [],
          upcoming_events: [],
          gallery: [],
          stories: [],
          blog: current.blog || [],
          sermons: current.sermons || [],
          videos: current.videos || [],
          ebooks: current.ebooks || []
        }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/blog/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Blog API unavailable");
        }
        return response.json();
      })
      .then((result) => {
        setData((current) => ({
          ...current,
          blog: result || []
        }));
      })
      .catch(() => {
        setData((current) => ({
          ...current,
          blog: [],
    
        }));
      });
  }, []);
  useEffect(() => {
    fetch("/api/sermons/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Sermons API unavailable");
        }
        return response.json();
      })
      .then((result) => {
        setData((current) => ({
          ...current,
          sermons: result || []
        }));
      })
      .catch(() => {
        setData((current) => ({
          ...current,
          sermons: []
        }));
      });
  }, []);
  useEffect(() => {
    fetch("/api/videos/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Videos API unavailable");
        }
        return response.json();
      })
      .then((result) => {
        setData((current) => ({
          ...current,
          videos: result || []
        }));
      })
      .catch(() => {
        setData((current) => ({
          ...current,
          videos: []
        }));
      });
  }, []);

  useEffect(() => {
    fetch("/api/ebooks/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("E-books API unavailable");
        }
        return response.json();
      })
      .then((result) => {
        setData((current) => ({
          ...current,
          ebooks: result
        }));
      })
      .catch(() => {
        setData((current) => ({
          ...current,
          ebooks: []
        }));
      });
  }, []);

  useEffect(() => {
    const pathName = window.location.pathname;
    const isBlogArticle = pathName.startsWith("/blog/");

    if (!isBlogArticle) {
      return;
    }

    const slug = pathName
      .replace("/blog/", "")
      .replace(/\/+$/, "");

    if (!slug) {
      return;
    }

    setBlogLoading(true);

    fetch(`/api/blog/${slug}/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Blog article unavailable");
        }

        return response.json();
      })
      .then((result) => {
        setBlogPost(result);
      })
      .catch(() => {
        setBlogPost(null);
      })
      .finally(() => {
        setBlogLoading(false);
      });
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll(
      ".reveal-section, .reveal-item"
    );

    if (!items.length) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      items.forEach((element) => {
        element.classList.add("is-visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            "is-visible",
            entry.isIntersecting
          );
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    items.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [data]);

  const settings = {
    ...fallback,
    ...(data.settings || {})
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const isBlogArticle = window.location.pathname.startsWith("/blog/");

  if (isBlogArticle) {
    return (
      <div className="site blogArticlePage">
        <header className="navbar">
          <a href="/" className="brand">
            <img
              src="/branding/fas-logo.png"
              alt="Faith Alone Saves"
            />
          </a>

          <a href="/" className="textBtn">
            Back to FAS <ArrowRight size={16} />
          </a>
        </header>

        <main className="blogArticle">
          {blogLoading ? (
            <div className="blogArticleState">
              <p>Loading article...</p>
            </div>
          ) : !blogPost ? (
            <div className="blogArticleState">
              <span className="sectionLabel">FAS BLOG</span>
              <h1>Article not found</h1>
              <p>
                This blog article could not be found or is no longer published.
              </p>
              <a href="/" className="primaryBtn">
                Back to FAS <ArrowRight size={17} />
              </a>
            </div>
          ) : (
            <article className="blogArticleContent">
              <div className="blogArticleHeader">
                <span className="blogCategory">
                  {(blogPost.category || "other").replace("-", " ")}
                </span>

                <h1>{blogPost.title}</h1>

                {blogPost.excerpt && (
                  <p className="blogArticleExcerpt">
                    {blogPost.excerpt}
                  </p>
                )}

                <div className="blogArticleMeta">
                  <span>{blogPost.author}</span>

                  {blogPost.published_at && (
                    <span>
                      {new Date(blogPost.published_at).toLocaleDateString(
                        "en-US",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        }
                      )}
                    </span>
                  )}
                </div>
              </div>

              {blogPost.cover_image_url && (
                <div className="blogArticleCover">
                  <img
                    src={blogPost.cover_image_url}
                    alt={blogPost.title}
                  />
                </div>
              )}

              <div className="blogArticleBody">
                {blogPost.content
                  .split(/\n\s*\n/)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>

              <div className="blogArticleFooter">
                <a href="/" className="primaryBtn">
                  <ArrowRight
                    size={17}
                    style={{ transform: "rotate(180deg)" }}
                  />
                  Back to FAS Blog
                </a>
              </div>
            </article>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="site">
      <header className="navbar">
        <a
          href="#top"
          className="brand"
          onClick={closeMenu}
        >
          <img
            src="/branding/fas-logo.png"
            alt="Faith Alone Saves"
          />
        </a>

        <nav className={menuOpen ? "mobileOpen" : ""}>
          <a href="#about" onClick={closeMenu}>
            About
          </a>

          <a href="#vision" onClick={closeMenu}>
            Vision
          </a>

          <a href="#mission" onClick={closeMenu}>
            Mission
          </a>

          <a href="#events" onClick={closeMenu}>
            Events
          </a>

          <a href="#blog" onClick={closeMenu}>
            Blog
          </a>

          <a href="#sermons" onClick={closeMenu}>
            Sermons
          </a>

          <a href="#videos" onClick={closeMenu}>
            Videos
          </a>

          <a href="#stories" onClick={closeMenu}>
            Stories
          </a>

          <a href="#gallery" onClick={closeMenu}>
            Gallery
          </a>
        </nav>

        <a
          className="navCta"
          href="#connect"
          onClick={closeMenu}
        >
          Connect
          <ArrowRight size={16} />
        </a>

        <button
          className="menuBtn"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <main id="top">
        <section className="hero reveal-section">
          <div className="heroCopy reveal-item reveal-left">
            <span className="eyebrow">
              FAITH - FELLOWSHIP - TRUTH
            </span>

            <h1>{settings.hero_title}</h1>

            <p>{settings.hero_intro}</p>

            <div className="heroActions">
              <a
                className="primaryBtn"
                href="#events"
              >
                Explore Events
                <ArrowRight size={17} />
              </a>

              <a
                className="textBtn"
                href="#about"
              >
                Discover FAS
              </a>
            </div>

            <div className="heroMeta">
              <span className="goldDot"></span>
              {settings.tuesday_time}
            </div>
          </div>

          <div className="heroNext reveal-item reveal-right">
            <div className="heroNextTop">
              <span className="heroNextLabel">NEXT GATHERING</span>
              <span className="heroNextDot"></span>
            </div>

            {data.upcoming_events.length > 0 ? (
              <>
                <div className="heroNextDate">
                  <strong>
                    {new Date(
                      data.upcoming_events[0].date + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      day: "2-digit",
                    })}
                  </strong>

                  <span>
                    {new Date(
                      data.upcoming_events[0].date + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </span>
                </div>

                <div className="heroNextContent">
                  <span className="heroNextType">
                    {data.upcoming_events[0].mode || "FAS GATHERING"}
                  </span>

                  <h2>{data.upcoming_events[0].title}</h2>

                  <p>
                    {data.upcoming_events[0].time ||
                      "Time to be announced"}
                  </p>
                </div>

                <a
                  className="heroNextLink"
                  href="#events"
                >
                  View Event
                  <ArrowRight size={16} />
                </a>
              </>
            ) : (
              <div className="heroNextEmpty">
                <span className="heroNextType">WEEKLY FELLOWSHIP</span>
                <h2>Every Tuesday</h2>

                <p>
                  Join us at 7:00 PM for Bible study, worship,
                  fellowship and conversations rooted in God's Word.
                </p>
                <a className="heroNextLink" href="#about">
                  Discover FAS
                  <ArrowRight size={16} />
                </a>
              </div>
            )}

            <div className="heroNextWatermark">FAS</div>
          </div>
        </section>
        {(data.blog || []).length > 0 && (
          <section className="latestBlogStrip reveal-section">
            <div className="latestBlogInner">
              <div className="latestBlogLabel">
                <span className="latestBlogPulse"></span>
                LATEST FROM FAS BLOG
              </div>

              <div className="latestBlogContent">
                <div className="latestBlogCopy">
                  <span className="latestBlogCategory">
                    {(data.blog[0].category || "FAS BLOG").replace("-", " ")}
                  </span>

                  <h2>{data.blog[0].title}</h2>

                  {data.blog[0].excerpt && (
                    <p>{data.blog[0].excerpt}</p>
                  )}
                </div>

                <a
                  href={`/blog/${data.blog[0].slug}`}
                  className="latestBlogButton"
                >
                  Read article
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </section>
        )}

        <section className="homepageSlideshow reveal-section">
          <div className="slideshowHeader">
            <div>
              <div className="sectionLabel">
                FAS UPDATES
              </div>

              <h2>
                Highlights & <em>Updates</em>
              </h2>
            </div>
            {data.slides.length > 1 && (
              <div className="slideshowCounter">
                {currentSlide + 1} / {data.slides.length}
              </div>
            )}
          </div>

            <div
              className="slideshowFrame"
              onMouseEnter={(event) => {
                event.currentTarget.classList.add("isPaused");
              }}
              onMouseLeave={(event) => {
                event.currentTarget.classList.remove("isPaused");
              }}
            >
              {data.slides.map((slide, index) => (
                <article
                  className={`slide ${
                    index === currentSlide ? "active" : ""
                  }`}
                  key={slide.id}
                >
                  <img
                    src={slide.image_url}
                    alt={slide.title || "FAS update"}
                  />

                  <div className="slideOverlay">
                    <span className="slideCategory">
                      {slide.category || "Update"}
                    </span>

                    {slide.title && (
                      <h3>{slide.title}</h3>
                    )}

                    {slide.description && (
                      <p>{slide.description}</p>
                    )}

                    {slide.button_url && (
                      <a
                        className="primaryBtn slideButton"
                        href={slide.button_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {slide.button_text || "Learn More"}
                        <ArrowRight size={16} />
                      </a>
                    )}
                  </div>
                </article>
              ))}

              {data.slides.length > 1 && (
                <>
                  <button
                    className="slideArrow slidePrevious"
                    type="button"
                    aria-label="Previous slide"
                    onClick={() =>
                      setCurrentSlide(
                        (currentSlide - 1 + data.slides.length) %
                          data.slides.length
                      )
                    }
                  >
                    <ArrowRight size={20} />
                  </button>

                  <button
                    className="slideArrow slideNext"
                    type="button"
                    aria-label="Next slide"
                    onClick={() =>
                      setCurrentSlide(
                        (currentSlide + 1) % data.slides.length
                      )
                    }
                  >
                    <ArrowRight size={20} />
                  </button>

                  <div className="slideDots">
                    {data.slides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        className={
                          index === currentSlide
                            ? "active"
                            : ""
                        }
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() => setCurrentSlide(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

        <section
          id="about"
          className="section introSection reveal-section"
        >
          <div className="sectionLabel">
            WHY FAS
          </div>

          <div className="introGrid">
            <h2>
              A fellowship for students who want to{" "}
              <em>know, grow and serve.</em>
            </h2>

            <p>
              FAS exists to build a Christ-centered
              student community where God's Word shapes
              faith, worship, leadership and everyday
              campus life.
            </p>
          </div>

          <div className="pillars stagger-group">
            <article className="reveal-item">
              <span>01</span>
              <h3>Enlighten</h3>
              <p>
                Ground students in God's Word and truth.
              </p>
            </article>

            <article className="reveal-item">
              <span>02</span>
              <h3>Nourish</h3>
              <p>
                Nurture students through Scripture,
                mentorship and fellowship.
              </p>
            </article>

            <article className="reveal-item">
              <span>03</span>
              <h3>Encourage</h3>
              <p>
                Help students exercise spiritual gifts
                and selflessly serve.
              </p>
            </article>
          </div>
        </section>

        <section
          id="vision"
          className="darkSection reveal-section"
        >
          <div className="sectionLabel light">
            OUR VISION
          </div>

          <div className="quoteLayout reveal-item reveal-up">
            <Quote
              className="quoteIcon"
              size={42}
            />

            <div>
              <h2>
                Equipping campus students{" "}
                <em>wholistically.</em>
              </h2>

              <p>{settings.vision}</p>
            </div>
          </div>
        </section>

        <section
          id="mission"
          className="section reveal-section"
        >
          <div className="sectionLabel">
            OUR MISSION
          </div>

          <h2>
            Connect. Nurture. Equip.{" "}
            <em>Impact.</em>
          </h2>

          <p className="lead">
            {settings.mission}
          </p>

          <div className="missionGrid stagger-group">
            <div className="reveal-item">
              <Users size={20} />
              <h3>Connect</h3>
              <p>
                Online meetings, in-person gatherings
                and retreats.
              </p>
            </div>

            <div className="reveal-item">
              <Play size={20} />
              <h3>Nurture</h3>
              <p>
                God's Word, mentorship and meaningful
                fellowship.
              </p>
            </div>

            <div className="reveal-item">
              <ArrowRight size={20} />
              <h3>Equip</h3>
              <p>
                Opportunities to lead, serve and
                exercise spiritual gifts.
              </p>
            </div>

            <div className="reveal-item">
              <CalendarDays size={20} />
              <h3>Impact</h3>
              <p>
                Students equipped to selflessly impact
                their campuses.
              </p>
            </div>
          </div>
        </section>

        <section
          id="events"
          className="section eventsSection reveal-section"
        >
          <div className="sectionTop">
            <div>
              <div className="sectionLabel">
                WHAT'S NEXT
              </div>

              <h2>
                Upcoming <em>Events</em>
              </h2>
            </div>

            <a
              className="textBtn"
              href="/events"
            >
              View all events
              <ArrowRight size={16} />
            </a>
          </div>

          {loading ? (
            <div className="emptyState">
              <CalendarDays size={24} />
              <p>Loading upcoming events...</p>
            </div>
          ) : data.upcoming_events.length === 0 ? (
            <div className="emptyState">
              <CalendarDays size={24} />
              <p>
                Upcoming FAS events will appear here.
              </p>
            </div>
          ) : (
            <div className="eventGrid">
              {data.upcoming_events.map((event) => (
                <article
                  className="eventCard reveal-item"
                  key={event.id}
                >
                  <div className="eventDate">
                    <strong>
                      {new Date(
                        event.date + "T00:00:00"
                      ).toLocaleDateString(
                        "en-US",
                        {
                          day: "2-digit"
                        }
                      )}
                    </strong>

                    <span>
                      {new Date(
                        event.date + "T00:00:00"
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short"
                        }
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="eventType">
                      {(event.event_type || "event")
                        .replace("-", " ")}
                    </span>

                    <h3>{event.title}</h3>

                    <p>
                      {event.time ||
                        "Time to be announced"}
                      {" - "}
                      {event.mode ||
                        "Details to be announced"}
                    </p>

                    {event.description && (
                      <p className="muted">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {event.registration_url && (
                    <a
                      className="circleArrow"
                      href={event.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Register for ${event.title}`}
                    >
                      <ArrowRight size={18} />
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

                <section
          id="blog"
          className="section blogSection reveal-section"
        >
          <div className="sectionTop">
            <div>
              <div className="sectionLabel">
                FAS BLOG
              </div>

              <h2>
                Reflections on <em>faith and life.</em>
              </h2>
            </div>
          </div>

          {(data.blog || []).length === 0 ? (
            <div className="emptyState">
              <p>FAS blog posts will appear here.</p>
            </div>
          ) : (
            <div className="blogGrid">
              {(data.blog || []).map((post) => (
                <article
                  className="blogCard reveal-item"
                  key={post.id}
                >
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                    />
                  )}

                  <div className="blogCardContent">
                    <span className="blogCategory">
                      {(post.category || "other")
                        .replace("-", " ")}
                    </span>

                    <h3>{post.title}</h3>

                    {post.excerpt && (
                      <p>{post.excerpt}</p>
                    )}

                    <div className="blogMeta">
                      <span>{post.author}</span>

                      <a
                        href={`/blog/${post.slug}`}
                        className="textBtn"
                      >
                        Read article
                        <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>


        <section
          id="sermons"
          className="section sermonSection reveal-section"
        >
          <div className="sectionTop">
            <div>
              <div className="sectionLabel">
                SERMON LIBRARY
              </div>
              <h2>
                Messages for{" "}
                <em>faith and life.</em>
              </h2>
            </div>
          </div>

          {(data.sermons || []).length === 0 ? (
            <div className="emptyState">
              <p>Sermons will appear here.</p>
            </div>
          ) : (
            <div className="sermonGrid">
              {(data.sermons || []).map((sermon) => (
                <article className="sermonCard reveal-item" key={sermon.id}>
                  <div className="sermonCardTop">
                    <span className="sermonCategory">
                      {(sermon.category || "sermon").replace("-", " ")}
                    </span>
                    {sermon.is_featured && (
                      <span className="sermonFeaturedLabel">FEATURED</span>
                    )}
                  </div>

                  <h3>{sermon.title}</h3>

                  <div className="sermonSpeaker">
                    <span>Speaker</span>
                    <strong>{sermon.speaker}</strong>
                  </div>

                  {sermon.description && <p>{sermon.description}</p>}

                  <div className="sermonCardFooter">
                    {sermon.published_at && (
                      <span>
                        {new Date(sermon.published_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    )}

                    {sermon.pdf_file_url && (
                      <a
                        href={sermon.pdf_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="primaryBtn sermonOpenBtn"
                      >
                        Open PDF
                        <ArrowRight size={16} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          id="videos"
          className="section videoSection reveal-section"
        >
          <div className="sectionTop">
            <div>
              <div className="sectionLabel">
                VIDEO LIBRARY
              </div>
              <h2>
                Watch, learn, and <em>grow.</em>
              </h2>
            </div>
          </div>

          {(data.videos || []).length === 0 ? (
            <div className="emptyState">
              <p>Videos will appear here.</p>
            </div>
          ) : (
            <div className="videoGrid">
              {(data.videos || []).map((video) => (
                <article
                  className="videoCard reveal-item"
                  key={video.id}
                >
                  <div className="videoThumbnail">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                      />
                    ) : (
                      <div className="videoThumbnailPlaceholder">
                        <span>FAS</span>
                      </div>
                    )}

                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="videoPlayButton"
                      aria-label={`Watch ${video.title}`}
                    >
                      <Play size={20} fill="currentColor" />
                    </a>

                    {video.is_featured && (
                      <span className="videoFeaturedLabel">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="videoCardBody">
                    <div className="videoCardTop">
                      <span className="videoCategory">
                        {(video.category || "other").replace("-", " ")}
                      </span>

                      {video.published_at && (
                        <span className="videoDate">
                          {new Date(
                            video.published_at
                          ).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>

                    <h3>{video.title}</h3>

                    <div className="videoSpeaker">
                      <span>Speaker</span>
                      <strong>{video.speaker}</strong>
                    </div>

                    {video.description && (
                      <p>{video.description}</p>
                    )}

                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="videoWatchLink"
                    >
                      Watch on YouTube
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          id="ebooks"
          className="section ebookSection reveal-section"
        >
          <div className="sectionTop">
            <div>
              <div className="sectionLabel">E-BOOK LIBRARY</div>
              <h2>Read, reflect, and <em>grow.</em></h2>
            </div>
          </div>

          {(data.ebooks || []).length === 0 ? (
            <div className="emptyState">
              <p>E-books will appear here.</p>
            </div>
          ) : (
            <div className="ebookGrid">
              {(data.ebooks || []).map((ebook) => (
                <article className="ebookCard reveal-item" key={ebook.id}>
                  <div className="ebookCover">
                    {ebook.cover_image_url ? (
                      <img
                        src={ebook.cover_image_url}
                        alt={ebook.title}
                      />
                    ) : (
                      <div className="ebookCoverPlaceholder">
                        <span>FAS</span>
                        <small>E-BOOK</small>
                      </div>
                    )}

                    {ebook.is_featured && (
                      <span className="ebookFeaturedLabel">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <div className="ebookCardBody">
                    <div className="ebookCardTop">
                      <span className="ebookCategory">
                        {(ebook.category || "other").replace("-", " ")}
                      </span>

                      {ebook.published_at && (
                        <span className="ebookDate">
                          {new Date(ebook.published_at).toLocaleDateString(
                            "en-US",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            }
                          )}
                        </span>
                      )}
                    </div>

                    <h3>{ebook.title}</h3>

                    <div className="ebookAuthor">
                      <span>Author</span>
                      <strong>{ebook.author}</strong>
                    </div>

                    {ebook.description && (
                      <p>{ebook.description}</p>
                    )}

                    <a
                      href={ebook.ebook_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ebookReadLink"
                    >
                      Open E-book <ArrowRight size={16} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          id="stories"
          className="section storiesSection reveal-section"
        >
          <div className="sectionTop">
            <div>
              <div className="sectionLabel">STUDENT STORIES</div>
              <h2>Stories of <em>faith.</em></h2>
              <p className="storiesIntro">
                Real experiences from students growing in faith, fellowship, and life with Christ.
              </p>
            </div>
          </div>

          {data.stories.length === 0 ? (
            <div className="emptyState">
              <p>Student stories will appear here as FAS students share their experiences.</p>
            </div>
          ) : (
            <div className="storiesGrid">
              {data.stories.map((story) => (
                <article className="storyCard reveal-item" key={story.id}>
                  <div className="storyCardTop">
                    <div className="storyAvatar">
                      {story.photo ? (
                        <img src={story.photo} alt={story.student_name} />
                      ) : (
                        <span>
                          {story.student_name?.charAt(0)?.toUpperCase() || "F"}
                        </span>
                      )}
                    </div>

                    <div className="storyIdentity">
                      <h3>{story.student_name}</h3>
                      {story.college && <span>{story.college}</span>}
                    </div>
                  </div>

                  <div className="storyQuoteMark">â€œ</div>

                  <p className="storyText">
                    {story.testimony}
                  </p>

                  <div className="storyCardFooter">
                    <span>FAS Student Story</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section
          id="gallery"
          className="section gallerySection reveal-section"
        >
          <div className="sectionTop">
            <div>
              <div className="sectionLabel">
                FAS MOMENTS
              </div>

              <h2>
                Fellowship in{" "}
                <em>action.</em>
              </h2>

              <p className="galleryIntro">
                Moments of fellowship, worship, learning,
                service, and life together.
              </p>
            </div>
          </div>

          {data.gallery.length === 0 ? (
            <div className="emptyState">
              <p>
                FAS gallery moments will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="galleryFilters" role="tablist" aria-label="Gallery categories">
                {galleryCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    className={`galleryFilter ${
                      galleryCategory === category.value
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setGalleryCategory(category.value);
                      setGalleryLightboxIndex(0);
                    }}
                    role="tab"
                    aria-selected={
                      galleryCategory === category.value
                    }
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {filteredGallery.length === 0 ? (
                <div className="emptyState galleryEmptyState">
                  <p>
                    No photos have been added to this category yet.
                  </p>
                </div>
              ) : (
                <div className="galleryGrid">
                  {filteredGallery.map((image, index) => (
                    <button
                      type="button"
                      className="galleryCard reveal-item"
                      key={image.id}
                      onClick={() => openGalleryLightbox(index)}
                      aria-label={`Open ${image.title || "FAS fellowship moment"}`}
                    >
                      <div className="galleryImageWrap">
                        <img
                          src={image.image}
                          alt={
                            image.title ||
                            "FAS fellowship moment"
                          }
                        />

                        <div className="galleryCardOverlay">
                          <span className="galleryCardCategory">
                            {galleryCategories.find(
                              (category) =>
                                category.value === image.category
                            )?.label || "FAS Moment"}
                          </span>

                          <strong>
                            {image.title ||
                              "FAS fellowship moment"}
                          </strong>

                          {image.caption && (
                            <span className="galleryCardCaption">
                              {image.caption}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {galleryLightboxOpen &&
            filteredGallery.length > 0 && (
              <div
                className="galleryLightbox"
                role="dialog"
                aria-modal="true"
                aria-label="FAS gallery slideshow"
                onClick={closeGalleryLightbox}
              >
                <button
                  type="button"
                  className="galleryLightboxClose"
                  onClick={closeGalleryLightbox}
                  aria-label="Close gallery"
                >
                  <X size={24} />
                </button>

                <button
                  type="button"
                  className="galleryLightboxArrow galleryLightboxPrev"
                  onClick={(event) => {
                    event.stopPropagation();
                    showPreviousGalleryImage();
                  }}
                  aria-label="Previous image"
                >
                  <ArrowRight
                    size={28}
                    style={{ transform: "rotate(180deg)" }}
                  />
                </button>

                <div
                  className="galleryLightboxContent"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="galleryLightboxImageWrap">
                    <img
                      src={
                        filteredGallery[
                          galleryLightboxIndex
                        ]?.image
                      }
                      alt={
                        filteredGallery[
                          galleryLightboxIndex
                        ]?.title ||
                        "FAS fellowship moment"
                      }
                    />
                  </div>

                  <div className="galleryLightboxInfo">
                    <div>
                      <span className="galleryLightboxCategory">
                        {galleryCategories.find(
                          (category) =>
                            category.value ===
                            filteredGallery[
                              galleryLightboxIndex
                            ]?.category
                        )?.label || "FAS Moment"}
                      </span>

                      <h3>
                        {filteredGallery[
                          galleryLightboxIndex
                        ]?.title ||
                          "FAS fellowship moment"}
                      </h3>

                      {filteredGallery[
                        galleryLightboxIndex
                      ]?.caption && (
                        <p>
                          {
                            filteredGallery[
                              galleryLightboxIndex
                            ].caption
                          }
                        </p>
                      )}
                    </div>

                    <span className="galleryLightboxCounter">
                      {galleryLightboxIndex + 1} /{" "}
                      {filteredGallery.length}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="galleryLightboxArrow galleryLightboxNext"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNextGalleryImage();
                  }}
                  aria-label="Next image"
                >
                  <ArrowRight size={28} />
                </button>
              </div>
            )}
        </section>

        <section
          id="connect"
          className="section supportSection reveal-section"
        >
          <div className="supportCard">
            <div>
              <div className="sectionLabel">
                CONNECT WITH FAS
              </div>

              <h2>
                Come grow with us.
              </h2>

              <p>
                Join our fellowship, participate in
                Bible studies, connect with students
                and discover opportunities to serve.
              </p>
            </div>

            <div className="supportLinks">
              {settings.whatsapp_url && (
                <a
                  href={settings.whatsapp_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Users size={18} />
                  WhatsApp
                </a>
              )}

              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Instagram size={18} />
                  Instagram
                </a>
              )}

              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Youtube size={18} />
                  YouTube
                </a>
              )}

              {settings.email && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(settings.email)}`} target="_blank" rel="noreferrer"
                >
                  <Mail size={18} />
                  Email
                </a>
              )}

              {!settings.whatsapp_url &&
                !settings.instagram_url &&
                !settings.youtube_url &&
                !settings.email && (
                  <p className="muted">
                    Contact details will appear
                    here once configured in the
                    FAS admin panel.
                  </p>
                )}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div>
          <img
            src="/branding/fas-logo.png"
            alt="FAS"
          />

          <p>{settings.tagline}</p>
        </div>

        <div>
          <strong>
            Faith Alone Saves
          </strong>

          <span>
            Copyright {new Date().getFullYear()} FAS.
            All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;


































