import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

import { Fragment, useEffect, useRef, useState } from "react";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://fas-backend-xnhy.onrender.com";

// Keep fresh content for 24h and allow up to 7 days of stale content during backend cold starts.
const CONTENT_STALE_TTL = 7 * 24 * 60 * 60 * 1000;

function readContentCache(key) {
  try {
    const raw = localStorage.getItem(`fas-content-cache:${key}`);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (!cached || !cached.data || Date.now() - cached.timestamp > CONTENT_STALE_TTL) {
      return null;
    }

    return cached.data;
  } catch {
    return null;
  }
}

function writeContentCache(key, data) {
  try {
    localStorage.setItem(
      `fas-content-cache:${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage quota/privacy errors.
  }
}

async function fetchJsonWithRetry(path, attempts = 5, cacheKey = null) {
  // Keep retries bounded so a cold backend cannot be overwhelmed by one browser.
  const maxAttempts = Math.min(Math.max(Number(attempts) || 1, 1), 5);
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(path, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      if (cacheKey) writeContentCache(cacheKey, data);
      return data;
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts - 1) {
        break;
      }

      const retryDelay = Math.min(
        1200 * Math.pow(1.6, attempt),
        6000
      );

      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay)
      );
    }
  }

  throw lastError || new Error("Request failed");
}
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Moon,
  Play,
  Quote,
  Share2,
  Heart,
  MessageCircle,
  Sparkles,
  Send,
  UserRound,
  Sun,
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

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return false;

  const getTargetTop = () => {
    const header = document.querySelector(".navbar");
    const headerHeight = header?.getBoundingClientRect().height || 82;
    const extraOffset = window.innerWidth <= 850 ? 12 : 16;
    return Math.max(
      0,
      window.scrollY + element.getBoundingClientRect().top - headerHeight - extraOffset
    );
  };

  const scrollToTarget = (behavior = "smooth") => {
    window.scrollTo({ top: getTargetTop(), behavior });
  };

  // Scroll after the current layout pass and keep correcting briefly while
  // images/sliders above the target finish settling. This prevents the CTA
  // from stopping at the Highlights & Updates section on mobile.
  const correctionDelays = [0, 120, 300, 600, 1000, 1500];

  correctionDelays.forEach((delay) => {
    window.setTimeout(() => {
      if (document.getElementById(id) !== element) return;
      window.scrollTo({
        top: getTargetTop(),
        behavior: delay === 0 ? "smooth" : "auto",
      });
    }, delay);
  });

  return true;
}

function parseEventTimeRange(timeText = "") {
  const matches = [...String(timeText).matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi)];
  if (!matches.length) return null;

  const toMinutes = (match) => {
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const meridiem = match[3].toLowerCase();
    if (hour === 12) hour = 0;
    if (meridiem === "pm") hour += 12;
    return hour * 60 + minute;
  };

  return {
    start: toMinutes(matches[0]),
    end: matches[1] ? toMinutes(matches[1]) : null
  };
}

function getNextEvent(events = [], now = new Date()) {
  return events.find((event) => getEventStatus(event, now).key !== "ended") || null;
}

function getEventStatus(event, now = new Date()) {
  if (!event?.date) {
    return { key: "upcoming", label: "UPCOMING", button: "View Event", detail: "" };
  }

  const eventDate = new Date(`${event.date}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const daysAway = Math.round((target - today) / 86400000);

  if (daysAway < 0) {
    return { key: "ended", label: "EVENT ENDED", button: "Event Ended", detail: "" };
  }

  if (daysAway > 0) {
    const label =
      daysAway === 1
        ? "TOMORROW"
        : daysAway <= 14
          ? `IN ${daysAway} DAYS`
          : target.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();

    return {
      key: "upcoming",
      label,
      button: event.meeting_url ? "Join Google Meet" : "View Event",
      detail: daysAway === 1 ? "Happening tomorrow" : `${daysAway} days to go`
    };
  }

  const range = parseEventTimeRange(event.time);
  if (!range) {
    return {
      key: "today",
      label: "TODAY",
      button: event.meeting_url ? "Join Today" : "View Today",
      detail: "Happening today"
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutes = range.end ?? range.start + 120;

  if (currentMinutes < range.start) {
    const minutesUntil = range.start - currentMinutes;
    const hours = Math.floor(minutesUntil / 60);
    const minutes = minutesUntil % 60;
    const detail =
      hours > 0
        ? `Starts in ${hours}h${minutes ? ` ${minutes}m` : ""}`
        : `Starts in ${minutes}m`;

    return {
      key: "today",
      label: "TODAY",
      button: event.meeting_url ? "Join Today" : "View Today",
      detail
    };
  }

  if (currentMinutes <= endMinutes) {
    return {
      key: "live",
      label: "LIVE NOW",
      button: event.meeting_url ? "Join Live Now" : "View Event",
      detail: "FAS gathering is live"
    };
  }

  return {
    key: "ended",
    label: "EVENT ENDED",
    button: "Event Ended",
    detail: "Today's gathering has ended"
  };
}


function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    return dayNumber >= 1 && dayNumber <= daysInMonth
      ? new Date(year, month, dayNumber)
      : null;
  });
}

function useAutoCarousel(selector, itemSelector, dependency, interval = 4500) {
  useEffect(() => {
    const carousel = document.querySelector(selector);
    if (!carousel) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (reduceMotionQuery.matches) return;

    let timer = null;
    let paused = false;

    const getItems = () => Array.from(carousel.querySelectorAll(itemSelector));

    const slideNext = () => {
      if (paused) return;

      const items = getItems();
      if (items.length <= 1) return;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll <= 2) return;

      const currentLeft = carousel.scrollLeft;
      const nextItem = items.find(
        (item) => item.offsetLeft > currentLeft + 8
      );

      if (!nextItem || currentLeft >= maxScroll - 10) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carousel.scrollTo({
          left: Math.min(nextItem.offsetLeft, maxScroll),
          behavior: "smooth"
        });
      }
    };

    const startTimer = () => {
      window.clearInterval(timer);
      timer = window.setInterval(slideNext, interval);
    };

    const pause = () => {
      paused = true;
      window.clearInterval(timer);
    };

    const resume = () => {
      paused = false;
      startTimer();
    };

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("touchstart", pause, { passive: true });
    carousel.addEventListener("touchend", resume, { passive: true });
    carousel.addEventListener("focusin", pause);
    carousel.addEventListener("focusout", resume);

    startTimer();

    return () => {
      window.clearInterval(timer);
      carousel.removeEventListener("mouseenter", pause);
      carousel.removeEventListener("mouseleave", resume);
      carousel.removeEventListener("touchstart", pause);
      carousel.removeEventListener("touchend", resume);
      carousel.removeEventListener("focusin", pause);
      carousel.removeEventListener("focusout", resume);
    };
  }, [selector, itemSelector, dependency, interval]);
}


function EbookReader({ ebook, onClose }) {
  const readerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const loadingTaskRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = Number(
        localStorage.getItem(\`fas-ebook-page:\${ebook.id}\`) || 1
      );
      return Number.isFinite(saved) && saved > 0 ? saved : 1;
    } catch {
      return 1;
    }
  });
  const [scale, setScale] = useState(1.05);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    try {
      const loadingTask = pdfjsLib.getDocument({
        url: ebook.ebook_file_url,
        withCredentials: false,
      });
      loadingTaskRef.current = loadingTask;

      loadingTask.promise
        .then((documentProxy) => {
          if (cancelled) {
            documentProxy.destroy();
            return;
          }

          setPdf(documentProxy);
          setCurrentPage((page) =>
            Math.min(Math.max(page, 1), documentProxy.numPages)
          );
          setLoading(false);
        })
        .catch((loadError) => {
          if (cancelled) return;
          console.error("FAS eBook reader error:", loadError);
          setError(
            "This book could not be loaded inside the reader. You can still open the original PDF."
          );
          setLoading(false);
        });
    } catch (loadError) {
      console.error("FAS eBook reader setup error:", loadError);
      setError(
        "This book could not be loaded inside the reader. You can still open the original PDF."
      );
      setLoading(false);
    }

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
    };
  }, [ebook.id, ebook.ebook_file_url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let cancelled = false;
    setRendering(true);

    const renderPage = async () => {
      try {
        renderTaskRef.current?.cancel();

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = \`\${Math.floor(viewport.width)}px\`;
        canvas.style.height = \`\${Math.floor(viewport.height)}px\`;

        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport,
          transform:
            outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : null,
        });

        await renderTaskRef.current.promise;

        if (!cancelled) {
          try {
            localStorage.setItem(
              \`fas-ebook-page:\${ebook.id}\`,
              String(currentPage)
            );
          } catch {
            // Ignore localStorage errors.
          }
        }
      } catch (renderError) {
        if (renderError?.name !== "RenderingCancelledException" && !cancelled) {
          console.error("FAS eBook page render error:", renderError);
          setError("We could not render this page. Please try another zoom level.");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdf, currentPage, scale, ebook.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }

      if (event.key === "ArrowLeft") {
        setCurrentPage((page) => Math.max(1, page - 1));
      }

      if (event.key === "ArrowRight") {
        setCurrentPage((page) => Math.min(pdf?.numPages || page, page + 1));
      }

      if (event.key === "+" || event.key === "=") {
        setScale((value) => Math.min(2, Number((value + 0.1).toFixed(2))));
      }

      if (event.key === "-") {
        setScale((value) => Math.max(0.65, Number((value - 0.1).toFixed(2))));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, pdf]);

  useEffect(() => {
    const handleFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === readerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => document.removeEventListener("fullscreenchange", handleFullscreen);
  }, []);

  const changePage = (nextPage) => {
    if (!pdf) return;
    setCurrentPage(Math.min(Math.max(nextPage, 1), pdf.numPages));
  };

  const toggleFullscreen = async () => {
    if (!readerRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else {
        await readerRef.current.requestFullscreen?.();
      }
    } catch (fullscreenError) {
      console.error("FAS eBook fullscreen error:", fullscreenError);
    }
  };

  const zoomOut = () =>
    setScale((value) => Math.max(0.65, Number((value - 0.1).toFixed(2))));
  const zoomIn = () =>
    setScale((value) => Math.min(2, Number((value + 0.1).toFixed(2))));

  return (
    <div
      className="ebookReaderOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={\`Reading \${ebook.title}\`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ebookReader" ref={readerRef}>
        <header className="ebookReaderHeader">
          <div className="ebookReaderTitle">
            <span className="ebookReaderEyebrow">FAS E-BOOK READER</span>
            <h2>{ebook.title}</h2>
            <span>{ebook.author}</span>
          </div>

          <div className="ebookReaderHeaderActions">
            <a
              href={ebook.ebook_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ebookReaderIconButton"
              aria-label="Open original PDF"
              title="Open original PDF"
            >
              <ArrowRight size={18} />
            </a>
            <button
              type="button"
              className="ebookReaderIconButton"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <X size={18} /> : <Sparkles size={18} />}
            </button>
            <button
              type="button"
              className="ebookReaderClose"
              onClick={onClose}
              aria-label="Close reader"
              title="Close reader"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="ebookReaderToolbar">
          <div className="ebookReaderPageControls">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={!pdf || currentPage <= 1 || rendering}
              aria-label="Previous page"
            >
              <ArrowLeft size={17} />
            </button>

            <label>
              <span className="srOnly">Page number</span>
              <input
                type="number"
                min="1"
                max={pdf?.numPages || 1}
                value={currentPage}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value)) changePage(value);
                }}
              />
              <span>of {pdf?.numPages || "—"}</span>
            </label>

            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={!pdf || currentPage >= (pdf?.numPages || 1) || rendering}
              aria-label="Next page"
            >
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="ebookReaderZoomControls">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.65}
              aria-label="Zoom out"
            >
              −
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          <div className="ebookReaderUtilityControls">
            <a
              href={ebook.ebook_file_url}
              download
              className="ebookReaderDownload"
              aria-label="Download book"
            >
              Download
            </a>
          </div>
        </div>

        <main className="ebookReaderStage">
          {loading && (
            <div className="ebookReaderState">
              <div className="ebookReaderSpinner" />
              <strong>Preparing your book…</strong>
              <span>Loading the first page.</span>
            </div>
          )}

          {!loading && error && (
            <div className="ebookReaderState ebookReaderError">
              <strong>Reader unavailable</strong>
              <span>{error}</span>
              <a
                href={ebook.ebook_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="primaryBtn"
              >
                Open PDF
              </a>
            </div>
          )}

          {!loading && !error && (
            <div className="ebookReaderCanvasWrap">
              <canvas
                ref={canvasRef}
                className="ebookReaderCanvas"
                aria-label={\`Page \${currentPage} of \${pdf?.numPages || 1}\`}
              />
            </div>
          )}
        </main>

        <footer className="ebookReaderFooter">
          <span>Use ← → to turn pages</span>
          <span>+ / − to zoom</span>
          {rendering && <span>Rendering page…</span>}
        </footer>
      </div>
    </div>
  );
}

function App() {
  const cachedHome = readContentCache("home");
  const cachedBlog = readContentCache("blog");
  const cachedSermons = readContentCache("sermons");
  const cachedVideos = readContentCache("videos");
  const cachedEbooks = readContentCache("ebooks");

  const [data, setData] = useState({
    settings: cachedHome?.settings || fallback,
    slides: cachedHome?.slides || [],
    upcoming_events: cachedHome?.upcoming_events || [],
    past_events: cachedHome?.past_events || [],
    gallery: cachedHome?.gallery || [],
    stories: cachedHome?.stories || [],
    blog: cachedBlog || [],
    sermons: cachedSermons || [],
    videos: cachedVideos || [],
    ebooks: cachedEbooks || [],
    devotional: cachedHome?.devotional || null,
    devotionals: cachedHome?.devotionals || []
  });

  const [loading, setLoading] = useState(!cachedHome);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [blogPost, setBlogPost] = useState(null);
  const [devotionalPost, setDevotionalPost] = useState(null);
  const [devotionalLoading, setDevotionalLoading] = useState(false);
  const [devotionalShareStatus, setDevotionalShareStatus] = useState("");
  const [sermonShareStatus, setSermonShareStatus] = useState("");
  const [devotionMonth, setDevotionMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogEngagement, setBlogEngagement] = useState({
    comments: [],
    reaction_counts: { like: 0, amen: 0, encouraged: 0 },
    total_reactions: 0,
    active_reaction: null
  });
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState("");
  const [reactionSubmitting, setReactionSubmitting] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [eventClock, setEventClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setEventClock(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useAutoCarousel("#story .storyTimeline", ":scope > .storyMilestone", 0, 5600);
  const visibleUpcomingEvents = data.upcoming_events.filter(
    (event) => getEventStatus(event, eventClock).key !== "ended"
  );
  const endedTodayEvents = data.upcoming_events.filter(
    (event) => getEventStatus(event, eventClock).key === "ended"
  );
  const pastEvents = [
    ...endedTodayEvents,
    ...(Array.isArray(data.past_events) ? data.past_events : [])
  ].filter((event, index, all) => all.findIndex((item) => item.id === event.id) === index)
    .sort((a, b) => {
      const dateDiff = String(b.date || "").localeCompare(String(a.date || ""));
      return dateDiff !== 0 ? dateDiff : String(b.time || "").localeCompare(String(a.time || ""));
    });

  useAutoCarousel("#events .eventGrid", ":scope > .eventCard", visibleUpcomingEvents.length, 4800);
  useAutoCarousel("#sermons .sermonGrid", ":scope > .sermonCard", data.sermons.length, 5000);
  useAutoCarousel("#ebooks .ebookGrid", ":scope > .ebookCard", data.ebooks.length, 5000);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("fas-theme");
      if (saved === "dark" || saved === "light") {
        return saved === "dark";
      }
    } catch (error) {
      // Ignore storage access errors and use the system preference.
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const timer = window.setTimeout(() => {
      scrollToSection(hash);
    }, 180);

    return () => window.clearTimeout(timer);
  }, []);

  // Automatically rotate Highlights & Updates while preserving manual controls.
  useEffect(() => {
    if (data.slides.length <= 1) return;

    const frame = document.querySelector(".slideshowFrame");
    if (!frame) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (reduceMotionQuery.matches) return;

    let paused = false;
    let timer = null;

    const advance = () => {
      if (!paused) {
        setCurrentSlide((current) =>
          (current + 1) % data.slides.length
        );
      }
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(advance, 5200);
    };

    const pause = () => {
      paused = true;
      window.clearInterval(timer);
    };

    const resume = () => {
      paused = false;
      start();
    };

    frame.addEventListener("mouseenter", pause);
    frame.addEventListener("mouseleave", resume);
    frame.addEventListener("touchstart", pause, { passive: true });
    frame.addEventListener("touchend", resume, { passive: true });
    frame.addEventListener("focusin", pause);
    frame.addEventListener("focusout", resume);

    start();

    return () => {
      window.clearInterval(timer);
      frame.removeEventListener("mouseenter", pause);
      frame.removeEventListener("mouseleave", resume);
      frame.removeEventListener("touchstart", pause);
      frame.removeEventListener("touchend", resume);
      frame.removeEventListener("focusin", pause);
      frame.removeEventListener("focusout", resume);
    };
  }, [data.slides.length]);

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);

    try {
      localStorage.setItem("fas-theme", theme);
    } catch (error) {
      // Theme still works for the current session if storage is unavailable.
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((value) => {
      const nextThemeIsDark = !value;
      const root = document.documentElement;

      root.classList.remove(
        "theme-transitioning",
        "theme-transition-to-dark",
        "theme-transition-to-light"
      );
      root.classList.add(
        "theme-transitioning",
        nextThemeIsDark
          ? "theme-transition-to-dark"
          : "theme-transition-to-light"
      );

      window.setTimeout(() => {
        root.classList.remove(
          "theme-transitioning",
          "theme-transition-to-dark",
          "theme-transition-to-light"
        );
      }, 450);

      return nextThemeIsDark;
    });
  };
  useEffect(() => {
    const carousel = document.querySelector(".storiesGrid");

    if (!carousel) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (reduceMotionQuery.matches) {
      return;
    }

    let timer = null;
    let paused = false;

    const getStep = () => {
      const card = carousel.querySelector(".storyCard");

      if (!card) return carousel.clientWidth;

      const styles = window.getComputedStyle(carousel);
      const gap = parseFloat(styles.columnGap || styles.gap || "0");

      return card.getBoundingClientRect().width + gap;
    };

    const slideNext = () => {
      if (paused) return;

      const step = getStep();
      const maxScroll =
        carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScroll - 10) {
        carousel.scrollTo({
          left: 0,
          behavior: "smooth"
        });
      } else {
        carousel.scrollBy({
          left: step,
          behavior: "smooth"
        });
      }
    };

    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(slideNext, 4500);
    };

    const pause = () => {
      paused = true;
      clearInterval(timer);
    };

    const resume = () => {
      paused = false;
      startTimer();
    };

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("touchstart", pause, {
      passive: true
    });
    carousel.addEventListener("touchend", resume, {
      passive: true
    });

    startTimer();

    return () => {
      clearInterval(timer);
      carousel.removeEventListener("mouseenter", pause);
      carousel.removeEventListener("mouseleave", resume);
      carousel.removeEventListener("touchstart", pause);
      carousel.removeEventListener("touchend", resume);
    };
  }, [data.stories]);

  useEffect(() => {
    const carousel = document.querySelector(".blogCarousel");

    if (!carousel || data.blog.length <= 1) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (reduceMotionQuery.matches) return;

    let timer = null;
    let paused = false;

    const getStep = () => {
      const card = carousel.querySelector(".blogCard");
      if (!card) return carousel.clientWidth;

      const styles = window.getComputedStyle(carousel);
      const gap = parseFloat(styles.columnGap || styles.gap || "0");
      return card.getBoundingClientRect().width + gap;
    };

    const slideNext = () => {
      if (paused) return;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (carousel.scrollLeft >= maxScroll - 10) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carousel.scrollBy({ left: getStep(), behavior: "smooth" });
      }
    };

    const startTimer = () => {
      clearInterval(timer);
      timer = window.setInterval(slideNext, 5000);
    };

    const pause = () => {
      paused = true;
      clearInterval(timer);
    };

    const resume = () => {
      paused = false;
      startTimer();
    };

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("touchstart", pause, { passive: true });
    carousel.addEventListener("touchend", resume, { passive: true });

    startTimer();

    return () => {
      clearInterval(timer);
      carousel.removeEventListener("mouseenter", pause);
      carousel.removeEventListener("mouseleave", resume);
      carousel.removeEventListener("touchstart", pause);
      carousel.removeEventListener("touchend", resume);
    };
  }, [data.blog]);

  useEffect(() => {
    if (!selectedStory) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedStory(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedStory]);
  const [contactRequestType, setContactRequestType] = useState("prayer");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (contactSubmitting) {
      return;
    }

    setContactSubmitting(true);
    setContactFeedback(null);

    try {
      const response = await fetch(`${API_BASE}/api/contact/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          request_type: contactRequestType,
          message: contactMessage.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const firstError = errorData
          ? Object.values(errorData).flat()?.[0]
          : null;
        throw new Error(
          firstError || "Unable to send your request right now."
        );
      }

      setContactFeedback({
        type: "success",
        message:
          contactRequestType === "prayer"
            ? "Your prayer request has been received. We will keep it in prayer."
            : "Your message has been received. Thank you for reaching out to FAS.",
      });

      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactMessage("");
    } catch (error) {
      setContactFeedback({
        type: "error",
        message:
          error?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setContactSubmitting(false);
    }
  };

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

  useEffect(() => {
    const carousel = document.querySelector(".videoGrid");

    if (!carousel || data.videos.length <= 1) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (reduceMotionQuery.matches) {
      return;
    }

    let timer = null;
    let paused = false;

    const getStep = () => {
      const card = carousel.querySelector(".videoCard");

      if (!card) return carousel.clientWidth;

      const styles = window.getComputedStyle(carousel);
      const gap = parseFloat(styles.columnGap || styles.gap || "0");

      return card.getBoundingClientRect().width + gap;
    };

    const slideNext = () => {
      if (paused) return;

      const step = getStep();
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScroll - 10) {
        carousel.scrollTo({
          left: 0,
          behavior: "smooth"
        });
      } else {
        carousel.scrollBy({
          left: step,
          behavior: "smooth"
        });
      }
    };

    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(slideNext, 4500);
    };

    const pause = () => {
      paused = true;
      clearInterval(timer);
    };

    const resume = () => {
      paused = false;
      startTimer();
    };

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("touchstart", pause, { passive: true });
    carousel.addEventListener("touchend", resume, { passive: true });

    startTimer();

    return () => {
      clearInterval(timer);
      carousel.removeEventListener("mouseenter", pause);
      carousel.removeEventListener("mouseleave", resume);
      carousel.removeEventListener("touchstart", pause);
      carousel.removeEventListener("touchend", resume);
    };
  }, [data.videos.length]);

  useEffect(() => {
    const carousel = document.querySelector(".galleryGrid");

    if (!carousel || filteredGallery.length <= 1) return;

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (reduceMotionQuery.matches) {
      return;
    }

    let timer = null;
    let paused = false;

    const getStep = () => {
      const card = carousel.querySelector(".galleryCard");

      if (!card) return carousel.clientWidth;

      const styles = window.getComputedStyle(carousel);
      const gap = parseFloat(styles.columnGap || styles.gap || "0");

      return card.getBoundingClientRect().width + gap;
    };

    const slideNext = () => {
      if (paused) return;

      const step = getStep();
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScroll - 10) {
        carousel.scrollTo({
          left: 0,
          behavior: "smooth"
        });
      } else {
        carousel.scrollBy({
          left: step,
          behavior: "smooth"
        });
      }
    };

    const startTimer = () => {
      clearInterval(timer);
      timer = setInterval(slideNext, 4500);
    };

    const pause = () => {
      paused = true;
      clearInterval(timer);
    };

    const resume = () => {
      paused = false;
      startTimer();
    };

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("touchstart", pause, {
      passive: true
    });
    carousel.addEventListener("touchend", resume, {
      passive: true
    });

    startTimer();

    return () => {
      clearInterval(timer);
      carousel.removeEventListener("mouseenter", pause);
      carousel.removeEventListener("mouseleave", resume);
      carousel.removeEventListener("touchstart", pause);
      carousel.removeEventListener("touchend", resume);
    };
  }, [filteredGallery.length, galleryCategory]);

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
    fetchJsonWithRetry(`${API_BASE}/api/home/`, 14, "home")
      .then((result) => {
        setData((current) => ({
          settings: result.settings || fallback,
          slides: result.slides || [],
          upcoming_events: result.upcoming_events || [],
          past_events: result.past_events || [],
          gallery: result.gallery || [],
          stories: result.stories || [],
          blog: current.blog || [],
          sermons: current.sermons || [],
          videos: current.videos || [],
          ebooks: current.ebooks || [],
          devotional: result.devotional || current.devotional || null,
          devotionals: Array.isArray(result.devotionals) ? result.devotionals : (current.devotionals || []),
  next_devotional: result.next_devotional || current.next_devotional || null
        }));
      })
      .catch(() => {
        // Keep the existing homepage data if the API is temporarily unavailable.
        // This prevents valid content from disappearing during backend cold starts.
        setData((current) => ({
          ...current,
          settings: current.settings || fallback
        }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchJsonWithRetry(`${API_BASE}/api/blog/`, 14, "blog")
      .then((result) => {
        setData((current) => ({
          ...current,
          blog: result || []
        }));
      })
      .catch(() => {
        // Preserve previously loaded content when the API is temporarily unavailable.
      });
  }, []);
  useEffect(() => {
    fetchJsonWithRetry(`${API_BASE}/api/sermons/`, 14, "sermons")
      .then((result) => {
        setData((current) => ({
          ...current,
          sermons: result || []
        }));
      })
      .catch(() => {
        // Preserve previously loaded content when the API is temporarily unavailable.
      });
  }, []);
  useEffect(() => {
    fetchJsonWithRetry(`${API_BASE}/api/videos/`, 14, "videos")
      .then((result) => {
        setData((current) => ({
          ...current,
          videos: result || []
        }));
      })
      .catch(() => {
        // Preserve previously loaded content when the API is temporarily unavailable.
      });
  }, []);

  useEffect(() => {
    fetchJsonWithRetry(`${API_BASE}/api/ebooks/`, 14, "ebooks")
      .then((result) => {
        setData((current) => ({
          ...current,
          ebooks: result
        }));
      })
      .catch(() => {
        // Preserve previously loaded content when the API is temporarily unavailable.
      });
  }, []);

  useEffect(() => {
    const pathName = window.location.pathname;
    const isDevotionalDetail = pathName.startsWith("/devotionals/");

    if (!isDevotionalDetail) return;

    const slug = pathName.replace("/devotionals/", "").replace(/\/+$/, "");
    if (!slug) return;

    setDevotionalLoading(true);
    fetchJsonWithRetry(
      `${API_BASE}/api/devotionals/${encodeURIComponent(slug)}/`,
      14,
      `devotional:${slug}`
    )
      .then((result) => setDevotionalPost(result))
      .catch(() => setDevotionalPost(null))
      .finally(() => setDevotionalLoading(false));
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
    loadBlogEngagement(slug);

    fetchJsonWithRetry(
      `${API_BASE}/api/blog/${slug}/`,
      14,
      `blog:${slug}`
    )
      .then((result) => {
        setBlogPost(result);
      })
      .catch(() => {
        setBlogPost(null);

        const robotsMeta = document.head.querySelector('meta[name="robots"]');
        if (robotsMeta) {
          robotsMeta.setAttribute(
            "content",
            "noindex, follow, max-image-preview:large"
          );
        }
      })
      .finally(() => {
        setBlogLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!blogPost || !window.location.pathname.startsWith("/blog/")) {
      return;
    }

    const canonicalUrl = `https://fas-fellowship.org/blog/${encodeURIComponent(
      blogPost.slug || window.location.pathname.replace("/blog/", "").replace(/\/+$/, "")
    )}`;
    const description =
      blogPost.excerpt ||
      blogPost.content?.replace(/\s+/g, " ").trim().slice(0, 160) ||
      "Read Christian teaching, encouragement, and fellowship resources from Faith Alone Saves.";

    document.title = `${blogPost.title} | Faith Alone Saves`;

    const setMeta = (selector, attributes) => {
      let element = document.head.querySelector(selector);

      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }

      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    };

    const setLink = (selector, attributes) => {
      let element = document.head.querySelector(selector);

      if (!element) {
        element = document.createElement("link");
        document.head.appendChild(element);
      }

      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    };

    setMeta('meta[name="description"]', {
      name: "description",
      content: description
    });
    setMeta('meta[name="robots"]', {
      name: "robots",
      content: "index, follow, max-image-preview:large"
    });

    setMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "article"
    });
    setMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "Faith Alone Saves"
    });
    setMeta('meta[property="og:title"]', {
      property: "og:title",
      content: blogPost.title
    });
    setMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description
    });
    setMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl
    });

    if (blogPost.cover_image_url) {
      setMeta('meta[property="og:image"]', {
        property: "og:image",
        content: blogPost.cover_image_url
      });
      setMeta('meta[property="og:image:alt"]', {
        property: "og:image:alt",
        content: blogPost.title
      });
    }

    setMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image"
    });
    setMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: blogPost.title
    });
    setMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description
    });

    if (blogPost.cover_image_url) {
      setMeta('meta[name="twitter:image"]', {
        name: "twitter:image",
        content: blogPost.cover_image_url
      });
    }

    setLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl
    });

    const schemaId = "fas-blog-article-schema";
    let schema = document.getElementById(schemaId);

    if (!schema) {
      schema = document.createElement("script");
      schema.id = schemaId;
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }

    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blogPost.title,
      description,
      url: canonicalUrl,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      ...(blogPost.cover_image_url
        ? { image: [blogPost.cover_image_url] }
        : {}),
      ...(blogPost.author
        ? {
            author: {
              "@type": "Person",
              name: blogPost.author
            }
          }
        : {}),
      ...(blogPost.published_at
        ? { datePublished: blogPost.published_at }
        : {}),
      ...(blogPost.updated_at || blogPost.published_at
        ? {
            dateModified:
              blogPost.updated_at || blogPost.published_at
          }
        : {}),
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Faith Alone Saves",
            item: "https://fas-fellowship.org/"
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "FAS Blog",
            item: "https://fas-fellowship.org/#blog"
          },
          {
            "@type": "ListItem",
            position: 3,
            name: blogPost.title,
            item: canonicalUrl
          }
        ]
      },
      publisher: {
        "@type": "Organization",
        name: "Faith Alone Saves",
        url: "https://fas-fellowship.org/",
        logo: {
          "@type": "ImageObject",
          url: "https://fas-fellowship.org/branding/fas-logo.png"
        }
      }
    });
  }, [blogPost]);

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

  useEffect(() => {
    if (!data.stories.length) return;

    const openStoryFromHash = () => {
      const match = window.location.hash.match(/^#story-(.+)$/);
      if (!match) return;

      const story = data.stories.find(
        (item) => String(item.id) === String(match[1])
      );

      if (story) {
        setSelectedStory(story);
      }
    };

    openStoryFromHash();
    window.addEventListener("hashchange", openStoryFromHash);

    return () => {
      window.removeEventListener("hashchange", openStoryFromHash);
    };
  }, [data.stories]);
  useEffect(() => {
    if (window.location.pathname.startsWith("/blog/") || window.location.pathname.startsWith("/devotionals/")) {
      return;
    }

    document.title = "Faith Alone Saves | FAS Fellowship";

    const schemaId = "fas-website-schema";
    let schema = document.getElementById(schemaId);

    if (!schema) {
      schema = document.createElement("script");
      schema.id = schemaId;
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }

    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://fas-fellowship.org/#website",
          url: "https://fas-fellowship.org/",
          name: "Faith Alone Saves",
          alternateName: "FAS Fellowship",
          description:
            "Faith Alone Saves is a Christian student fellowship helping campus students grow in God's Word, worship, fellowship, mentorship, and service."
        },
        {
          "@type": "Organization",
          "@id": "https://fas-fellowship.org/#organization",
          name: "Faith Alone Saves",
          alternateName: "FAS Fellowship",
          url: "https://fas-fellowship.org/",
          logo: {
            "@type": "ImageObject",
            url: "https://fas-fellowship.org/branding/fas-logo.png"
          }
        }
      ]
    });
  }, []);

  const settings = {
    ...fallback,
    ...(data.settings || {})
  };

    const shareSermon = async (sermon) => {
    if (!sermon) return;

    const url = window.location.origin + "/#sermons";
    const title = sermon.title + " — FAS Sermon Library";
    const text = sermon.speaker
      ? sermon.title + " · " + sermon.speaker + " · Faith Alone Saves"
      : sermon.title + " · Faith Alone Saves Sermon Library";

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setSermonShareStatus("Shared");
        window.setTimeout(() => setSermonShareStatus(""), 2200);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setSermonShareStatus("Link copied");
        window.setTimeout(() => setSermonShareStatus(""), 2200);
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }

    window.prompt("Copy this sermon link:", url);
  };

  const shareDevotional = async () => {
    if (!devotionalPost) return;

    const url = window.location.href;
    const title = `${devotionalPost.title} — FAS Daily Devotional`;
    const text = devotionalPost.scripture_reference
      ? `${devotionalPost.title} · ${devotionalPost.scripture_reference} · Faith Alone Saves`
      : `Read "${devotionalPost.title}" from FAS Daily Devotional.`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setDevotionalShareStatus("Shared");
        window.setTimeout(() => setDevotionalShareStatus(""), 2200);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setDevotionalShareStatus("Link copied");
        window.setTimeout(() => setDevotionalShareStatus(""), 2200);
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  };

    const shareStory = async (story) => {
    const url = `${window.location.origin}/#story-${story.id}`;
    const title = `${story.student_name} — FAS Student Testimony`;
    const text = story.impact_statement
      ? `${story.impact_statement} — ${story.student_name}`
      : `Read ${story.student_name}'s testimony on FAS.`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        window.alert("Testimony link copied.");
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }

    window.prompt("Copy this testimony link:", url);
  };
  const closeMenu = () => {
    setMenuOpen(false);
  };

  const getVisitorKey = () => {
    const storageKey = "fas-blog-visitor-key";
    try {
      let key = localStorage.getItem(storageKey);
      if (key) {
        key = key.replace(/[^a-zA-Z0-9]/g, "");
        if (key.length < 16) key = "";
      }

      if (!key) {
        key = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(storageKey, key);
      }

      return key;
    } catch {
      return "guest" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
  };

  const loadBlogEngagement = async (slug) => {
    try {
      const visitorKey = getVisitorKey();
      const result = await fetchJsonWithRetry(
        `${API_BASE}/api/blog/${encodeURIComponent(slug)}/engagement/?visitor_key=${encodeURIComponent(visitorKey)}`
      );
      setBlogEngagement(result);
    } catch {
      setBlogEngagement({
        comments: [],
        reaction_counts: { like: 0, amen: 0, encouraged: 0 },
        total_reactions: 0,
        active_reaction: null
      });
    }
  };

  const submitBlogComment = async (event) => {
    event.preventDefault();
    if (commentSubmitting || !commentName.trim() || !commentText.trim()) return;

    setCommentSubmitting(true);
    setCommentFeedback("");

    try {
      const response = await fetch(
        `${API_BASE}/api/blog/${encodeURIComponent(blogPost.slug)}/engagement/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: commentName.trim(),
            email: commentEmail.trim(),
            comment: commentText.trim()
          })
        }
      );

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.comment?.[0] || "Unable to post your comment.");
      }

      setBlogEngagement((current) => ({
        ...current,
        comments: [result, ...(current.comments || [])]
      }));
      setCommentName("");
      setCommentEmail("");
      setCommentText("");
      setCommentFeedback("Your comment has been posted. Thank you for joining the conversation.");
    } catch (error) {
      setCommentFeedback(error?.message || "Unable to post your comment right now.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const reactToBlog = async (reaction) => {
    if (reactionSubmitting || !blogPost) return;
    setReactionSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/blog/${encodeURIComponent(blogPost.slug)}/react/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reaction,
            visitor_key: getVisitorKey()
          })
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.detail || "Unable to save reaction.");
      setBlogEngagement((current) => ({ ...current, ...result }));
    } catch {
      // Keep the article usable if engagement is temporarily unavailable.
    } finally {
      setReactionSubmitting(false);
    }
  };




  const isEventsPage = window.location.pathname === "/events" || window.location.pathname === "/events/";
  const isDevotionsCalendarPage =
    window.location.pathname === "/devotions" ||
    window.location.pathname === "/devotions/" ||
    window.location.pathname === "/devotionals" ||
    window.location.pathname === "/devotionals/";
  const isDevotionalPage = window.location.pathname.startsWith("/devotionals/");
  const isBlogArticle = window.location.pathname.startsWith("/blog/");
  const coverWords = (blogPost?.title || "Faith Alone Saves").trim().split(/\s+/);
  const coverSplit = Math.max(1, Math.ceil(coverWords.length / 2));
  const coverLead = coverWords.slice(0, coverSplit).join(" ");
  const coverAccent = coverWords.slice(coverSplit).join(" ");


  if (isDevotionsCalendarPage) {
    const today = new Date();
    const todayKey = toDateKey(today);
    const devotionalStartDate = new Date(2026, 9, 7);
    const devotionalStartKey = toDateKey(devotionalStartDate);
    const devotionalHasStarted = todayKey >= devotionalStartKey;
    const calendarDevotionals = Array.isArray(data.devotionals) ? data.devotionals : [];
    const devotionByDate = calendarDevotionals.reduce((map, devotional) => {
      map[devotional.date] = devotional;
      return map;
    }, {});
    const todaysDevotional = devotionalHasStarted ? (devotionByDate[todayKey] || null) : null;
    const scheduledNextDevotional = data.next_devotional || null;
    const nextDevotionalIsLaunchDay =
      !devotionalHasStarted &&
      scheduledNextDevotional?.date === devotionalStartKey;
    const nextDevotionalDate = scheduledNextDevotional && !nextDevotionalIsLaunchDay
      ? fromDateKey(scheduledNextDevotional.date)
      : (!devotionalHasStarted
        ? new Date(
            devotionalStartDate.getFullYear(),
            devotionalStartDate.getMonth(),
            devotionalStartDate.getDate() + 1
          )
        : null);
    const nextDevotionalTime = scheduledNextDevotional && !nextDevotionalIsLaunchDay
      ? String(scheduledNextDevotional.release_time || "05:00:00").slice(0, 5)
      : "05:00";
    const upcomingDevotionals = calendarDevotionals
      .filter((devotional) => devotional.date > todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    const calendarDays = getCalendarDays(devotionMonth);
    const monthLabel = devotionMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
    const isCurrentMonth =
      devotionMonth.getFullYear() === today.getFullYear() &&
      devotionMonth.getMonth() === today.getMonth();

    const shiftMonth = (amount) => {
      setDevotionMonth(
        (current) => new Date(current.getFullYear(), current.getMonth() + amount, 1)
      );
    };

    const jumpToToday = () => {
      setDevotionMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    return (
      <div className={`site devotionsPage ${darkMode ? "devotionsPageDark" : "devotionsPageLight"}`}>
        <header className="navbar">
          <a href="/" className="brand" aria-label="Faith Alone Saves home">
            <img src="/branding/fas-logo.png" alt="Faith Alone Saves" />
          </a>
          <div className="navActions">
            <button
              type="button"
              className="themeToggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a href="/" className="textBtn">
              Back to FAS <ArrowRight size={16} />
            </a>
          </div>
        </header>

        <main className="devotionsPageMain">
          <section className="devotionsHero">
            <div className="devotionsHeroCopy">
              <span className="sectionLabel">FAS DAILY DEVOTIONAL</span>
              <h1>A daily walk with <em>God's Word.</em></h1>
              <p>
                Set aside a few quiet minutes each day for Scripture, reflection,
                prayer, and a practical step of faith.
              </p>
            </div>
            <div className="devotionsHeroBadge">
              <span className="devotionsHeroBadgeDot"></span>
              <span>{devotionalHasStarted ? "DAILY DEVOTIONAL" : "STARTING TOMORROW"}</span>
              <strong>{(devotionalHasStarted ? today : devotionalStartDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</strong>
            </div>
          </section>

          <section className="devotionsTodayCard" aria-labelledby="today-devotional-title">
            <div className="devotionsTodayEyebrow">
              <span className="devotionsTodayMark"></span>
              {devotionalHasStarted ? "TODAY'S DEVOTIONAL" : "THE FIRST DEVOTIONAL"}
            </div>
            {loading ? (
              <div className="devotionsTodayLoading">
                <span className="devotionsLoadingOrb"></span>
                <p>Preparing today's devotional...</p>
              </div>
            ) : todaysDevotional ? (
              <div className="devotionsTodayContent">
                <div className="devotionsTodayDate">
                  <strong>{today.toLocaleDateString("en-US", { day: "2-digit" })}</strong>
                  <span>{today.toLocaleDateString("en-US", { month: "short" })}</span>
                </div>
                <div className="devotionsTodayMain">
                  <span className="devotionsTodayReference">{todaysDevotional.scripture_reference}</span>
                  <h2 id="today-devotional-title">{todaysDevotional.title}</h2>
                  <p className="devotionsTodayVerse">“{todaysDevotional.scripture_text}”</p>
                  <p className="devotionsTodayImpact">{todaysDevotional.impact_line}</p>
                  <a className="devotionsTodayLink" href={`/devotionals/${todaysDevotional.slug}`}>
                    Read today's devotional <ArrowRight size={17} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="devotionsTodayEmpty">
                <div>
                  <span className="devotionsTodayReference">PREPARING THE NEXT WORD</span>
                  <h2 id="today-devotional-title">{devotionalHasStarted ? "Today's devotional is coming soon." : "FAS devotionals begin tomorrow."}</h2>
                  <p>{devotionalHasStarted ? "The FAS team is preparing a Scripture-led reflection for today. Please check back soon." : "Starting 7 October 2026, join us each day for Scripture, reflection, prayer, and a practical step of faith."}</p>
                </div>
              </div>
            )}
          </section>

          <section className="devotionsCalendarShell" aria-labelledby="devotions-calendar-title">
            <div className="devotionsCalendarHeader">
              <div>
                <span className="devotionsCalendarKicker">THE FAS READING CALENDAR</span>
                <h2 id="devotions-calendar-title">{monthLabel}</h2>
              </div>
              <div className="devotionsCalendarControls">
                <button type="button" onClick={() => shiftMonth(-1)} disabled={isCurrentMonth} aria-label="Previous month">
                  <ArrowRight size={18} style={{ transform: "rotate(180deg)" }} />
                </button>
                <button type="button" className="devotionsTodayBtn" onClick={jumpToToday}>
                  Today
                </button>
                <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="devotionsCalendarLegend">
              <span><i className="devotionLegendDot devotionLegendDot--published"></i> Devotional available</span>
              <span><i className="devotionLegendDot devotionLegendDot--today"></i> Today</span>
              <span><i className="devotionLegendDot devotionLegendDot--future"></i> Coming soon</span>
            </div>

            {loading ? (
              <div className="devotionsCalendarLoading">
                <span className="devotionsLoadingOrb"></span>
                <p>Preparing the FAS devotional calendar...</p>
              </div>
            ) : (
              <div className="devotionsCalendarGrid" role="grid" aria-label={`FAS devotionals for ${monthLabel}`}>
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                  <div className="devotionsWeekday" role="columnheader" key={day}>{day}</div>
                ))}

                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div className="devotionDay devotionDay--empty" key={`empty-${index}`} aria-hidden="true"></div>;
                  }

                  const dateKey = toDateKey(date);
                  const devotional = devotionByDate[dateKey];
                  const isToday = dateKey === todayKey;
                  const isBeforeStart = dateKey < devotionalStartKey;
                  const isPast = dateKey < todayKey;
                  const isFuture = dateKey >= devotionalStartKey && dateKey > todayKey;

                  const dayClass = [
                    "devotionDay",
                    isToday ? "devotionDay--today" : "",
                    devotional ? "devotionDay--published" : "",
                    isFuture && !devotional ? "devotionDay--future" : "",
                    (isPast || isBeforeStart) && !devotional ? "devotionDay--past" : ""
                  ].filter(Boolean).join(" ");

                  return (
                    <div
                      className={dayClass}
                      role="gridcell"
                      key={dateKey}
                      aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${devotional ? `: ${devotional.title}` : isFuture ? ": devotional coming soon" : isBeforeStart ? ": devotional series has not started" : ""}`}
                    >
                      <div className="devotionDayTop">
                        <span className="devotionDayNumber">{date.getDate()}</span>
                        {isToday && <span className="devotionTodayPill">TODAY</span>}
                      </div>

                      {devotional ? (
                        <a
                          href={`/devotionals/${devotional.slug}`}
                          className="devotionDayLink"
                          aria-label={`${devotional.title} — ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                        >
                          <span className="devotionDayTitle">{devotional.title}</span>
                          <span className="devotionDayArrow"><ArrowRight size={13} /></span>
                        </a>
                      ) : isFuture ? (
                        <span className="devotionDayPlaceholder" aria-label="Devotional coming soon">•</span>
                      ) : (
                        <span className="devotionDayPlaceholder devotionDayPlaceholder--past">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="devotionsUpcoming" aria-labelledby="devotions-upcoming-title">
            <div className="devotionsUpcomingHeader">
              <div>
                <span className="sectionLabel">KEEP WALKING</span>
                <h2 id="devotions-upcoming-title">Coming next</h2>
              </div>
              <p>New Scripture-led reflections will appear here as the journey grows.</p>
            </div>
            {upcomingDevotionals.length > 0 ? (
              <div className="devotionsUpcomingList">
                {upcomingDevotionals.map((devotional) => (
                  <a
                    key={devotional.slug}
                    href={`/devotionals/${devotional.slug}`}
                    className="devotionsUpcomingItem"
                  >
                    <div className="devotionsUpcomingDate">
                      <strong>{fromDateKey(devotional.date).toLocaleDateString("en-US", { day: "2-digit" })}</strong>
                      <span>{fromDateKey(devotional.date).toLocaleDateString("en-US", { month: "short" })}</span>
                    </div>
                    <div className="devotionsUpcomingCopy">
                      <span>{devotional.scripture_reference}</span>
                      <h3>{devotional.title}</h3>
                    </div>
                    <ArrowRight size={18} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="devotionsUpcomingEmpty">
                <span>•</span>
                <p>
                  {nextDevotionalDate
                    ? <>
                        The next devotional will appear on{" "}
                        <strong>
                          {nextDevotionalDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </strong>{" "}
                        at <strong>{nextDevotionalTime} AM IST</strong>.
                      </>
                    : "The next devotional will appear here when it is scheduled."}
                </p>
              </div>
            )}
          </section>

          <section className="devotionsCalendarFooter">
            <div>
              <span className="sectionLabel">A JOURNEY, NOT A CHECKLIST</span>
              <h2>One day. One Scripture. One step closer.</h2>
            </div>
            <p>
              New devotionals can be published day by day from the FAS admin,
              while this calendar remains available for the months and years ahead.
            </p>
          </section>
        </main>
      </div>
    );
  }

  if (isDevotionalPage) {
    return (
      <div className={`site devotionalPage ${darkMode ? "devotionalPageDark" : "devotionalPageLight"}`}>
        <header className="navbar">
          <a href="/" className="brand" aria-label="Faith Alone Saves home">
            <img src="/branding/fas-logo.png" alt="Faith Alone Saves" />
          </a>
          <div className="navActions">
            <button type="button" className="themeToggle" onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a href="/devotions" className="textBtn">Devotion Calendar <ArrowRight size={16} /></a>
          </div>
        </header>
        <main className="devotionalPageMain">
          {devotionalLoading ? (
            <div className="devotionalState"><span className="sectionLabel">FAS DAILY DEVOTIONAL</span><p>Preparing today's devotional...</p></div>
          ) : !devotionalPost ? (
            <div className="devotionalState"><span className="sectionLabel">FAS DAILY DEVOTIONAL</span><h1>Devotional not found</h1><p>This devotional is no longer published or could not be loaded.</p><a href="/" className="primaryBtn">Back to FAS <ArrowRight size={17} /></a></div>
          ) : (
            <article className="devotionalArticle">
              <div className="devotionalArticleEyebrow">FAS DAILY DEVOTIONAL</div>
              <div className="devotionalArticleDate">
                {new Date(devotionalPost.date + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                <span>·</span><span>3 min read</span>
              </div>
              <h1>{devotionalPost.title}</h1>
              <div className="devotionalByline">By <strong>{devotionalPost.author}</strong></div>
              <button
                type="button"
                className="devotionalShareButton"
                onClick={shareDevotional}
                aria-label="Share this devotional"
                title="Share this devotional"
              >
                <Share2 size={16} />
                <span>{devotionalShareStatus || "Share devotional"}</span>
              </button>
              <div className="devotionalScripture">
                <span>“</span>
                <p>{devotionalPost.scripture_text}</p>
                <strong>{devotionalPost.scripture_reference}</strong>
                {devotionalPost.scripture_text_telugu && (
                  <div className="devotionalTeluguVerse">
                    <span>తెలుగు వాక్యము</span>
                    <p>{devotionalPost.scripture_text_telugu}</p>
                  </div>
                )}
              </div>
              <div className="devotionalImpact"><span>THE IMPACT</span><strong>{devotionalPost.impact_line}</strong></div>
              <div className="devotionalBody">
                <span className="devotionalBodyLabel">REFLECTION</span>
                {devotionalPost.reflection.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)}
                <div className="devotionalPrayer">
                  <span>PRAYER</span>
                  {devotionalPost.prayer.split(/\r?\n\s*\r?\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)}
                </div>
                {devotionalPost.application && <div className="devotionalApplication"><span>LIVE IT OUT</span><p>{devotionalPost.application}</p></div>}
              </div>
              <div className="devotionalFooter">FAITH · FELLOWSHIP · TRUTH <span>FAS</span></div>
            </article>
          )}
        </main>
      </div>
    );
  }

  if (isEventsPage) {
    return (
      <div className={`site eventsPage ${darkMode ? "eventsPageDark" : "eventsPageLight"}`}>
        <header className="navbar">
          <a href="/" className="brand" aria-label="Faith Alone Saves home">
            <img src="/branding/fas-logo.png" alt="Faith Alone Saves" />
          </a>
          <div className="navActions">
            <button type="button" className="themeToggle" onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a href="/#events" className="textBtn">Back to FAS <ArrowRight size={16} /></a>
          </div>
        </header>
        <main className="eventsPageMain">
          <div className="eventsPageHero">
            <span className="sectionLabel">WHAT'S NEXT</span>
            <h1>Upcoming <em>Events</em></h1>
            <p>Gather with FAS for Scripture, worship, fellowship and conversations that point us back to Christ.</p>
          </div>
          {loading ? (
            <div className="emptyState"><CalendarDays size={24} /><p>Loading upcoming events...</p></div>
          ) : visibleUpcomingEvents.length === 0 ? (
            <div className="emptyState"><CalendarDays size={24} /><p>No upcoming FAS events are currently scheduled.</p></div>
          ) : (
            <div className="eventGrid eventsPageGrid">
              {visibleUpcomingEvents.map((event) => {
                const eventStatus = getEventStatus(event, eventClock);
                const canJoinEvent = Boolean(event.meeting_url) && eventStatus.key !== "ended";

                return (
                <article className="eventCard eventCardPremium reveal-item" key={event.id}>
                  <div className="eventDate">
                    <span className="eventDateMonth">{new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}</span>
                    <strong>{new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { day: "2-digit" })}</strong>
                    <span className="eventDateDay">{new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</span>
                  </div>
                  <div className="eventCardMain">
                    <div className="eventCardTopline">
                      <span className="eventType">{(event.event_type || "event").replace(/-/g, " ")}</span>
                      {event.mode && <span className="eventModeBadge">{event.mode}</span>}
                      {event.meeting_url && <span className="eventLiveBadge"><span className="eventLiveDot"></span>Google Meet</span>}
                    </div>
                    <div className={`eventPageStatus eventPageStatus--${eventStatus.key}`}>
                      <span className="eventPageStatusDot"></span>
                      <strong>{eventStatus.label}</strong>
                      {eventStatus.detail && <span>{eventStatus.detail}</span>}
                    </div>
                    <h2>{event.title}</h2>
                    <div className="eventMetaRow eventMetaPremium">
                      {event.time && <span className="eventTimeChip"><Clock3 size={14} /><span><small>TIME</small><strong>{event.time}</strong></span></span>}
                      {event.location && <span className="eventLocationChip"><MapPin size={14} /><span>{event.location}</span></span>}
                    </div>
                    {event.speaker_name && <div className="eventSpeaker"><span className="eventSpeakerIcon"><UserRound size={14} /></span><span><small>Speaker</small><strong>{event.speaker_name}</strong></span></div>}
                    {event.description && <p className="muted">{event.description}</p>}
                  </div>
                  <div className="eventCardAction">
                    <div className="eventActionStack">
                      <span className="eventActionHint">EVENT DETAILS</span>
                      <button type="button" className="eventDetailsBtn" onClick={() => setSelectedEvent(event)}>More Details <ArrowRight size={16} /></button>
                      {canJoinEvent ? (
                        <a className={`eventJoinBtn eventJoinBtn--${eventStatus.key}`} href={event.meeting_url} target="_blank" rel="noopener noreferrer">
                          {eventStatus.button}
                          <ArrowRight size={16} />
                        </a>
                      ) : eventStatus.key === "ended" ? (
                        <span className="eventJoinBtn eventJoinBtn--ended" aria-disabled="true">
                          Event Ended
                          <span className="eventEndedCheck">✓</span>
                        </span>
                      ) : !event.meeting_url && event.registration_url ? (
                        <a className="eventJoinBtn eventRegisterBtn" href={event.registration_url} target="_blank" rel="noopener noreferrer">Register / View <ArrowRight size={16} /></a>
                      ) : null}
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}

          {pastEvents.length > 0 && (
            <section className="pastEventsSection" aria-labelledby="past-events-title">
              <div className="pastEventsHeader">
                <div>
                  <span className="sectionLabel">LOOKING BACK</span>
                  <h2 id="past-events-title">Past <em>Events</em></h2>
                </div>
                <p>Previous FAS gatherings remain here as a record of our fellowship, teaching, and shared journey.</p>
              </div>
              <div className="pastEventsList">
                {pastEvents.map((event) => (
                  <article className="pastEventCard" key={event.id}>
                    <div className="pastEventDate">
                      <strong>{new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { day: "2-digit" })}</strong>
                      <span>{new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="pastEventCopy">
                      <span>{(event.event_type || "event").replace(/-/g, " ")}</span>
                      <h3>{event.title}</h3>
                      {event.speaker_name && <p>With {event.speaker_name}</p>}
                    </div>
                    <button type="button" className="pastEventDetailsBtn" onClick={() => setSelectedEvent(event)}>
                      View details <ArrowRight size={15} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
        {selectedEbook && (
          <EbookReader
            ebook={selectedEbook}
            onClose={() => setSelectedEbook(null)}
          />
        )}

        {selectedEvent && (
          <div className="eventDetailsModalOverlay" role="dialog" aria-modal="true" aria-label={`Event details for ${selectedEvent.title}`} onClick={() => setSelectedEvent(null)}>
            <div className="eventDetailsModal" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="eventDetailsModalClose" onClick={() => setSelectedEvent(null)} aria-label="Close event details"><X size={22} /></button>
              <div className="eventDetailsModalMedia">
                {selectedEvent.image_url ? <><img className="eventDetailsModalMediaBackdrop" src={selectedEvent.image_url} aria-hidden="true" loading="eager" decoding="async" alt="" /><img className="eventDetailsModalMediaImage" src={selectedEvent.image_url} loading="eager" decoding="async" alt={selectedEvent.title} /></> : <div className="eventDetailsPosterFallback"><span>FAS</span><small>EVENT POSTER</small></div>}
                <div className="eventDetailsModalMediaOverlay"><span>{(selectedEvent.event_type || "event").replace(/-/g, " ")}</span>{selectedEvent.mode && <strong>{selectedEvent.mode}</strong>}</div>
              </div>
              <div className="eventDetailsModalBody">
                <div className="eventDetailsModalEyebrow">FAS GATHERING</div><h2>{selectedEvent.title}</h2>
                <div className="eventDetailsModalMeta">
                  <div><CalendarDays size={17} /><span>{new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></div>
                  {selectedEvent.time && <div><span className="eventMetaBullet">TIME</span><span>{selectedEvent.time}</span></div>}
                  {selectedEvent.location && <div><span className="eventMetaBullet">LOCATION</span><span>{selectedEvent.location}</span></div>}
                </div>
                {selectedEvent.speaker_name && <div className="eventDetailsSpeaker"><span className="eventDetailsSpeakerIcon"><UserRound size={17} /></span><span><small>SPEAKER</small><strong>{selectedEvent.speaker_name}</strong></span></div>}
                {selectedEvent.description && <div className="eventDetailsDescription"><span className="eventDetailsLabel">ABOUT THIS GATHERING</span><p>{selectedEvent.description}</p></div>}
                <div className="eventDetailsActions">
                  {selectedEvent.meeting_url && <a className="eventDetailsPrimary" href={selectedEvent.meeting_url} target="_blank" rel="noopener noreferrer">Join Google Meet <ArrowRight size={17} /></a>}
                  {selectedEvent.registration_url && <a className="eventDetailsSecondary" href={selectedEvent.registration_url} target="_blank" rel="noopener noreferrer">Register / More Information <ArrowRight size={17} /></a>}
                </div>
                <div className="eventDetailsFooter"><span>FAITH · FELLOWSHIP · TRUTH</span><span>FAS</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isBlogArticle) {
    return (
      <div className={`site blogArticlePage ${darkMode ? "blogArticleDark" : "blogArticleLight"}`}>
        <header className="navbar">
          <a href="/" className="brand">
            <img
              src="/branding/fas-logo.png"
              alt="Faith Alone Saves"
            />
          </a>

          <div className="navActions">
            <button
              type="button"
              className="themeToggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a href="/" className="textBtn">
              Back to FAS <ArrowRight size={16} />
            </a>
          </div>
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
              <nav className="blogBreadcrumbs" aria-label="Breadcrumb">
                <a href="/">Faith Alone Saves</a>
                <span aria-hidden="true">/</span>
                <a href="/#blog">FAS Blog</a>
                <span aria-hidden="true">/</span>
                <span>{blogPost.title}</span>
              </nav>

              <div className="blogArticleHeader">
                <div className="blogArticleTopCover">
                  {blogPost.cover_image_url ? (
                    <figure className="blogArticleCover blogArticleCoverPhoto">
                      <img
                        src={blogPost.cover_image_url}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        alt={blogPost.title + " — Faith Alone Saves"}
                      />
                      <figcaption>Faith Alone Saves · FAS Journal</figcaption>
                    </figure>
                  ) : (
                    <div className="blogArticleCover blogArticleCoverFallback" aria-label={blogPost.title}>
                      <div className="blogArticleCoverGlow"></div>
                      <div className="blogArticleCoverOrnament">
                        <span></span>
                        <i></i>
                        <span></span>
                      </div>
                      <div className="blogArticleCoverEdition">
                        FAS JOURNAL · {(blogPost.category || "REFLECTION").replace("-", " ").toUpperCase()}
                      </div>
                      <div className="blogArticleCoverTitle">
                        <span>{coverLead}</span>
                        {coverAccent && <em>{coverAccent}</em>}
                      </div>
                      <div className="blogArticleCoverVerse">FAITH · FELLOWSHIP · TRUTH</div>
                      <div className="blogArticleCoverLine"></div>
                    </div>
                  )}
                </div>

                <div className="blogArticleMeta">
                  <span className="blogArticleAuthor">
                    <span className="blogArticleAuthorLabel">BY</span>
                    <strong>{blogPost.author}</strong>
                  </span>
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

                <div className="blogArticleHeaderRule" aria-hidden="true">
                  <span></span>
                </div>
              </div>

              <div className="blogArticleBody">
                <div className="articleIntro" aria-label="Article summary">
                  <span className="articleIntroEyebrow">IN THIS ARTICLE</span>
                  <p>
                    {blogPost.excerpt ||
                      "A reflection from Faith Alone Saves on faith, Scripture, and Christian life."}
                  </p>
                </div>

                {blogPost.content
                  ?.split(/\r?\n\s*\r?\n/)
                  .filter((paragraph) => paragraph.trim())
                  .map((paragraph, index) => {
                    const cleanParagraph = paragraph.trim();

                    if (cleanParagraph.startsWith("### ")) {
                      return (
                        <h3 key={index}>
                          {cleanParagraph.replace(/^### /, "")}
                        </h3>
                      );
                    }

                    if (cleanParagraph.startsWith("## ")) {
                      return (
                        <h2 key={index}>
                          {cleanParagraph.replace(/^## /, "")}
                        </h2>
                      );
                    }

                    return (
                      <p key={index}>
                        {paragraph
                          .split(/\r?\n/)
                          .map((line, lineIndex, lines) => (
                            <Fragment key={lineIndex}>
                              {line}
                              {lineIndex < lines.length - 1 && <br />}
                            </Fragment>
                          ))}
                      </p>
                    );
                  })}
              </div>

              <section className="blogEngagement" aria-labelledby="blog-engagement-title">
                <div className="blogEngagementHeader">
                  <div>
                    <span className="blogEngagementEyebrow">JOIN THE CONVERSATION</span>
                    <h2 id="blog-engagement-title">What did this reflection stir in you?</h2>
                    <p>Share a thought, encouragement, or a Scripture that spoke to you.</p>
                  </div>
                  <div className="blogEngagementCount">
                    <strong>{blogEngagement.comments.length}</strong>
                    <span>COMMENTS</span>
                  </div>
                </div>

                <div className="blogReactionBar">
                  <span className="blogReactionPrompt">Respond with a little love</span>
                  <div className="blogReactionActions">
                    {[
                      ["like", "Like", Heart],
                      ["amen", "Amen", Sparkles],
                      ["encouraged", "Encouraged", MessageCircle]
                    ].map(([key, label, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        className={`blogReactionBtn ${blogEngagement.active_reaction === key ? "active" : ""}`}
                        onClick={() => reactToBlog(key)}
                        disabled={reactionSubmitting}
                        aria-pressed={blogEngagement.active_reaction === key}
                      >
                        <Icon size={17} />
                        <span>{label}</span>
                        <strong>{blogEngagement.reaction_counts?.[key] || 0}</strong>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="blogCommentsLayout">
                  <form className="blogCommentForm" onSubmit={submitBlogComment}>
                    <div className="blogCommentFormTop">
                      <div>
                        <span className="blogFormKicker">LEAVE A THOUGHT</span>
                        <h3>Join the FAS community</h3>
                      </div>
                      <MessageCircle size={23} />
                    </div>
                    <div className="blogFormGrid">
                      <label>
                        <span>Name</span>
                        <input
                          value={commentName}
                          onChange={(event) => setCommentName(event.target.value)}
                          maxLength={80}
                          required
                          placeholder="Your name"
                        />
                      </label>
                      <label>
                        <span>Email <small>(optional)</small></span>
                        <input
                          type="email"
                          value={commentEmail}
                          onChange={(event) => setCommentEmail(event.target.value)}
                          placeholder="you@example.com"
                        />
                      </label>
                    </div>
                    <label>
                      <span>Your comment</span>
                      <textarea
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        maxLength={2000}
                        required
                        rows={5}
                        placeholder="Share your reflection, encouragement, or Scripture..."
                      />
                    </label>
                    <div className="blogCommentSubmitRow">
                      <small>Your email stays private and is never displayed publicly.</small>
                      <button className="primaryBtn" type="submit" disabled={commentSubmitting}>
                        {commentSubmitting ? "Posting..." : "Post Comment"}
                        <Send size={16} />
                      </button>
                    </div>
                    {commentFeedback && <p className="blogCommentFeedback" role="status">{commentFeedback}</p>}
                  </form>

                  <div className="blogCommentsList">
                    {blogEngagement.comments.length === 0 ? (
                      <div className="blogCommentsEmpty">
                        <Quote size={20} />
                        <p>Be the first to share a thought on this article.</p>
                      </div>
                    ) : (
                      blogEngagement.comments.map((comment) => (
                        <article className="blogCommentCard" key={comment.id}>
                          <div className="blogCommentAvatar">{comment.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="blogCommentMeta">
                              <strong>{comment.name}</strong>
                              <time dateTime={comment.created_at}>
                                {new Date(comment.created_at).toLocaleDateString("en-US", {
                                  day: "numeric", month: "short", year: "numeric"
                                })}
                              </time>
                            </div>
                            <p>{comment.comment}</p>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </section>

              {(data.blog || []).filter((post) => String(post.slug) !== String(blogPost.slug)).length > 0 && (
                <section className="relatedArticles" aria-labelledby="related-articles-title">
                  <div className="sectionLabel">KEEP READING</div>
                  <h2 id="related-articles-title">More from the FAS Blog</h2>
                  <div className="relatedArticlesGrid">
                    {(data.blog || [])
                      .filter((post) => String(post.slug) !== String(blogPost.slug))
                      .slice(0, 3)
                      .map((post) => (
                        <article className="relatedArticleCard" key={post.id}>
                          <span className="blogCategory">
                            {(post.category || "other").replace("-", " ")}
                          </span>
                          <h3>{post.title}</h3>
                          {post.excerpt && <p>{post.excerpt}</p>}
                          <a href={`/blog/${post.slug}`} className="textBtn">
                            Read related article <ArrowRight size={16} />
                          </a>
                        </article>
                      ))}
                  </div>
                </section>
              )}

              <div className="blogArticleFooter">
                <div className="blogShare">
                  <div className="blogShareLabel">
                    Share this article
                  </div>

                  <div className="blogShareActions">
                    <button
                      type="button"
                      className="blogShareBtn"
                      onClick={() => {
                        const url = window.location.href;
                        const text = `${blogPost.title} — ${url}`;
                        window.open(
                          `https://wa.me/?text=${encodeURIComponent(text)}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      WhatsApp
                    </button>

                    <button
                      type="button"
                      className="blogShareBtn"
                      onClick={() => {
                        const url = window.location.href;
                        window.open(
                          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      Facebook
                    </button>

                    <button
                      type="button"
                      className="blogShareBtn"
                      onClick={() => {
                        const url = window.location.href;
                        window.open(
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(blogPost.title)}&url=${encodeURIComponent(url)}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      X
                    </button>

                    <button
                      type="button"
                      className="blogShareBtn"
                      onClick={() => {
                        const url = window.location.href;
                        window.open(
                          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(blogPost.title)}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      Telegram
                    </button>

                    <button
                      type="button"
                      className="blogShareBtn"
                      onClick={() => {
                        const url = window.location.href;
                        window.open(
                          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      LinkedIn
                    </button>

                    <button
                      type="button"
                      className="blogShareBtn"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            window.location.href
                          );
                          window.alert("Article link copied.");
                        } catch {
                          window.prompt(
                            "Copy this article link:",
                            window.location.href
                          );
                        }
                      }}
                    >
                      Copy Link
                    </button>

                    {typeof navigator !== "undefined" &&
                      navigator.share && (
                        <button
                          type="button"
                          className="blogShareBtn blogNativeShare"
                          onClick={async () => {
                            try {
                              await navigator.share({
                                title: blogPost.title,
                                text: blogPost.excerpt || blogPost.title,
                                url: window.location.href
                              });
                            } catch {
                              // User cancelled the native share sheet.
                            }
                          }}
                        >
                          <Share2 size={15} />
                          Share
                        </button>
                      )}
                  </div>
                </div>

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
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        </a>

        <nav
          id="main-navigation"
          className={menuOpen ? "mobileOpen" : ""}
        >
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

          <a href="/devotions" onClick={closeMenu}>
            Devotions
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

          <a
            href="#connect"
            className="mobileConnectLink"
            onClick={closeMenu}
          >
            <span>Connect with FAS</span>
            <ArrowRight size={16} />
          </a>

        </nav>

        <div className="navActions">
          <button
            type="button"
            className="themeToggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <a
            className="navCta"
            href="#connect"
            onClick={closeMenu}
          >
            Connect
            <ArrowRight size={16} />
          </a>
        </div>

        <button
          className="menuBtn"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
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
                onClick={(event) => {
                  event.preventDefault();
                  window.history.replaceState(null, "", "#events");
                  scrollToSection("events");
                }}
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
              <span className="heroNextLabel">{getNextEvent(data.upcoming_events, eventClock) ? "NEXT GATHERING" : "UPCOMING GATHERING"}</span>
              <span className="heroNextDot"></span>
            </div>

            {getNextEvent(data.upcoming_events, eventClock) ? (() => {
              const featuredEvent = getNextEvent(data.upcoming_events, eventClock);
              const eventStatus = getEventStatus(featuredEvent, eventClock);
              const canJoin = Boolean(featuredEvent.meeting_url) && eventStatus.key !== "ended";

              return (
                <>
                  <div className="heroNextDate">
                    <strong>
                      {new Date(
                        featuredEvent.date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        day: "2-digit",
                      })}
                    </strong>

                    <span>
                      {new Date(
                        featuredEvent.date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                  </div>

                  <div className={`heroEventStatus heroEventStatus--${eventStatus.key}`}>
                    <span className="heroEventStatusDot"></span>
                    <span className="heroEventStatusLabel">{eventStatus.label}</span>
                    {eventStatus.detail && (
                      <span className="heroEventStatusDetail">{eventStatus.detail}</span>
                    )}
                  </div>

                  <div className="heroNextContent">
                    <div className="heroNextTypeRow">
                      <span className="heroNextType">
                        {featuredEvent.mode || "FAS GATHERING"}
                      </span>
                      {featuredEvent.meeting_url && eventStatus.key !== "ended" && (
                        <span className={`heroNextLiveBadge ${eventStatus.key === "live" ? "isLiveNow" : ""}`}>
                          <span className="eventLiveDot"></span>
                          {eventStatus.key === "live" ? "LIVE NOW" : "LIVE LINK"}
                        </span>
                      )}
                    </div>

                    <h2>{featuredEvent.title}</h2>

                    <p className="heroNextTime">
                      {featuredEvent.time || "Time to be announced"}
                    </p>

                    {featuredEvent.speaker_name && (
                      <div className="heroNextSpeaker">
                        <span className="heroNextSpeakerIcon">
                          <UserRound size={14} />
                        </span>
                        <span>
                          <small>Speaker</small>
                          <strong>{featuredEvent.speaker_name}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {canJoin ? (
                    <a
                      className={`heroNextLink heroNextLink--${eventStatus.key}`}
                      href={featuredEvent.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {eventStatus.button}
                      <ArrowRight size={16} />
                    </a>
                  ) : eventStatus.key === "ended" ? (
                    <div className="heroNextLink heroNextLink--ended" aria-disabled="true">
                      Event Ended
                      <span className="heroEndedCheck">✓</span>
                    </div>
                  ) : (
                    <a
                      className="heroNextLink"
                      href="#events"
                    >
                      {eventStatus.button}
                      <ArrowRight size={16} />
                    </a>
                  )}
                </>
              );
            })() : (
              <div className="heroNextEmpty">
                <span className="heroNextType">STAY CONNECTED</span>
                <h2>Our next gathering is coming soon.</h2>

                <p>
                  Thank you for being part of FAS. We will update you here
                  as soon as the details of our next gathering are announced.
                </p>

              </div>
            )}

            <div className="heroNextWatermark">FAS</div>
          </div>
        </section>

        {data.devotional && (
          <section className="devotionalHomeSection reveal-section" aria-labelledby="daily-devotional-title">
            <div className="devotionalHomeCard">
              <div className="devotionalHomeTop">
                <div>
                  <span className="sectionLabel">FAS DAILY DEVOTIONAL</span>
                  <span className="devotionalHomeDate">{new Date(data.devotional.date + "T00:00:00").toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                <span className="devotionalHomeMark">✦</span>
              </div>
              <div className="devotionalHomeScripture">
                <p id="daily-devotional-title">“{data.devotional.scripture_text}”</p>
                <span>{data.devotional.scripture_reference}</span>
              </div>
              <div className="devotionalHomeImpact">
                <span>THE IMPACT</span>
                <strong>{data.devotional.impact_line}</strong>
              </div>
              <div className="devotionalHomePrayer">
                <span>PRAYER</span>
                <p>{data.devotional.prayer}</p>
              </div>
              <div className="devotionalHomeBottom">
                <span>By {data.devotional.author}</span>
                <a href={`/devotionals/${data.devotional.slug}`} className="devotionalReadMore">Read More <ArrowRight size={16} /></a>
              </div>
            </div>
          </section>
        )}

        {data.blog.length > 0 && (
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
                Equipping campus students to{" "}
                <em>know, grow and impact.</em>
              </h2>

              <p>{settings.vision}</p>
            </div>
          </div>

          <div className="visionGrid stagger-group">
            <div className="reveal-item">
              <span>01</span>
              <h3>Grounded in God's Word</h3>
              <p>
                Helping students understand biblical truth,
                develop spiritual discernment, and allow
                Scripture to shape their beliefs, decisions,
                character and everyday lives.
              </p>
            </div>

            <div className="reveal-item">
              <span>02</span>
              <h3>Growing in Worship</h3>
              <p>
                Encouraging students to worship God not only
                through songs and gatherings, but through
                their studies, relationships, choices,
                service and daily walk with Christ.
              </p>
            </div>

            <div className="reveal-item">
              <span>03</span>
              <h3>Exercising Spiritual Gifts</h3>
              <p>
                Creating opportunities for students to
                discover, develop and use their God-given
                gifts through teaching, worship, leadership,
                testimony, service and fellowship.
              </p>
            </div>

            <div className="reveal-item">
              <span>04</span>
              <h3>Impacting the Campus</h3>
              <p>
                Equipping students to carry their faith
                beyond fellowship meetings into their
                campuses, workplaces, families, churches
                and communities, serving others and
                expanding God's Kingdom.
              </p>
            </div>
          </div>
        </section>

        <section
          id="mission"
          className="section missionSection reveal-section"
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
                Building meaningful Christ-centered
                fellowship through online Bible studies,
                in-person gatherings, worship, retreats
                and opportunities for students to grow
                together.
              </p>
            </div>

            <div className="reveal-item">
              <Play size={20} />
              <h3>Nurture</h3>
              <p>
                Helping students grow through God's Word,
                prayer, mentorship, meaningful discussion
                and authentic fellowship, developing
                biblical understanding and spiritual
                discernment.
              </p>
            </div>

            <div className="reveal-item">
              <ArrowRight size={20} />
              <h3>Equip</h3>
              <p>
                Preparing students to participate, lead
                and serve by discovering and developing
                their abilities and spiritual gifts through
                Bible discussions, worship, testimony,
                leadership and practical service.
              </p>
            </div>

            <div className="reveal-item">
              <CalendarDays size={20} />
              <h3>Impact</h3>
              <p>
                Encouraging students to live out their
                faith beyond FAS by serving selflessly,
                sharing the hope of Christ and applying
                biblical truth in their campuses,
                workplaces, families and communities.
              </p>
            </div>
          </div>
        </section>
                <section
          id="story"
          className="storySection reveal-section"
        >
          <div className="sectionLabel">
            THE STORY OF FAS
          </div>

          <div className="storyIntro reveal-item reveal-up">
            <h2>
              From four students to a growing fellowship —
              <em> a story written by God's grace.</em>
            </h2>

            <p>
              What began in October 2023 as a simple desire to
              pray, share God's Word and encourage one another
              became the beginning of a growing student fellowship.
            </p>
          </div>

          <div className="storyTimeline compactStoryTimeline">

            <article className="storyMilestone reveal-item">
              <div className="storyMarker">
                <span>01</span>
              </div>

              <div className="storyContent">
                <div className="storyDate">
                  OCTOBER 2023
                </div>

                <h3>The Beginning</h3>

                <p>
                  A few struggling students longed for friends
                  with whom they could share God's Word, pray
                  and encourage one another in their walk with Christ.
                </p>
              </div>
            </article>

            <article className="storyMilestone reveal-item">
              <div className="storyMarker">
                <span>02</span>
              </div>

              <div className="storyContent">
                <div className="storyDate">
                  OCTOBER 9, 2023
                </div>

                <h3>A Simple Thought</h3>

                <blockquote>
                  “Why don't we gather, even if it is only online,
                  and pray for one another?”
                </blockquote>
              </div>
            </article>

            <article className="storyMilestone reveal-item">
              <div className="storyMarker">
                <span>03</span>
              </div>

              <div className="storyContent">
                <div className="storyDate">
                  OCTOBER 13, 2023 · 6-7 PM
                </div>

                <h3>The First Fellowship</h3>

                <p>
                  Victor Paul, Anjali, Sushanth Paul, and Joy Susan
                  gathered on Google Meet for the first FAS fellowship.
                </p>

                <div className="storyHighlight">
                  What is True Worship?
                </div>
              </div>
            </article>

            <article className="storyMilestone reveal-item">
              <div className="storyMarker">
                <span>04</span>
              </div>

              <div className="storyContent">
                <div className="storyDate">
                  OCTOBER-NOVEMBER 2023
                </div>

                <h3>The Fellowship Grows</h3>

                <p>
                  With the encouragement and help of elders,
                  Tuesday online fellowships and Friday gatherings
                  began. More students joined, and the little
                  gathering began to grow.
                </p>

                <div className="storyRhythm">
                  <div>
                    <strong>TUESDAYS</strong>
                    <span>Online Fellowships</span>
                  </div>

                  <div>
                    <strong>FRIDAYS</strong>
                    <span>Offline Fellowships</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="storyMilestone reveal-item">
              <div className="storyMarker">
                <span>05</span>
              </div>

              <div className="storyContent">
                <div className="storyDate">
                  NOVEMBER 4, 2023
                </div>

                <h3>The First Retreat</h3>

                <div className="storyRetreatCard">
                  <span>WHO AM I?</span>
                  <strong>You Are Not Your Own</strong>
                  <small>13 members</small>
                </div>

                <p>
                  Just a few weeks after the first fellowship,
                  FAS held its first one-day retreat.
                </p>
              </div>
            </article>

          </div>

          <div className="storyFinalCompact reveal-item reveal-up">
            <strong>FAS began with four students.</strong>
            <span>But it was never their story.</span>
            <em>It was, and always will be, God's story.</em>
          </div>
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
            <><div className="storiesGrid">
              {data.stories.map((story) => {
                const preview = story.testimony
                  ?.replace(/\s+/g, " ")
                  .trim();

                return (
                  <article
                    className="storyCard reveal-item"
                    key={story.id}
                  >
                    <div className="storyPhoto">
                      {story.photo ? (
                        <img
                          src={story.photo}
                          alt={`${story.student_name} — FAS student story`}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="storyPhotoFallback">
                          <Quote size={34} />
                        </div>
                      )}

                      <div className="storyPhotoBadge">
                        FAS STORY
                      </div>
                    </div>

                    <div className="storyCardBody">
                      <div className="storyIdentity">
                        <div className="storyEyebrow">
                          STUDENT TESTIMONY
                        </div>

                        <h3>{story.student_name}</h3>

                        {story.college && (
                          <span>{story.college}</span>
                        )}
                      </div>

                      {story.impact_statement && (
                        <div className="storyImpact">
                          <span>WHAT GOD DID</span>
                          <strong>{story.impact_statement}</strong>
                        </div>
                      )}

                      <div className="storyPreview">
                        <div className="storyQuoteMark">“</div>

                        <p>
                          {preview?.length > 220
                            ? `${preview.slice(0, 220).trim()}…`
                            : preview}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="storyReadButton"
                        onClick={() => setSelectedStory(story)}
                      >
                        <span>READ FULL STORY</span>
                        <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        className="storyShareButton"
                        onClick={() => shareStory(story)}
                        aria-label={`Share ${story.student_name}'s testimony`}
                        title={`Share ${story.student_name}'s testimony`}
                      >
                        <Share2 size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          {data.stories.length > 1 && (
            <div className="storiesCarouselControls">
              <button
                type="button"
                className="storiesCarouselArrow"
                aria-label="Previous student story"
                onClick={() => {
                  const carousel = document.querySelector(".storiesGrid");
                  if (!carousel) return;

                  const card = carousel.querySelector(".storyCard");
                  if (!card) return;

                  const styles = window.getComputedStyle(carousel);
                  const gap = parseFloat(
                    styles.columnGap || styles.gap || "0"
                  );

                  carousel.scrollBy({
                    left: -(card.getBoundingClientRect().width + gap),
                    behavior: "smooth"
                  });
                }}
              >
                ←
              </button>

              <div
                className="storiesCarouselDots"
                aria-label="Student story navigation"
              >
                {data.stories.map((story, index) => (
                  <button
                    key={story.id}
                    type="button"
                    className={`storiesCarouselDot ${
                      index === 0 ? "active" : ""
                    }`}
                    aria-label={`Go to student story ${index + 1}`}
                    onClick={() => {
                      const carousel =
                        document.querySelector(".storiesGrid");

                      const cards =
                        carousel?.querySelectorAll(".storyCard");

                      if (!carousel || !cards?.[index]) return;

                      carousel.scrollTo({
                        left: cards[index].offsetLeft,
                        behavior: "smooth"
                      });
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                className="storiesCarouselArrow"
                aria-label="Next student story"
                onClick={() => {
                  const carousel = document.querySelector(".storiesGrid");
                  if (!carousel) return;

                  const card = carousel.querySelector(".storyCard");
                  if (!card) return;

                  const styles = window.getComputedStyle(carousel);
                  const gap = parseFloat(
                    styles.columnGap || styles.gap || "0"
                  );

                  const step =
                    card.getBoundingClientRect().width + gap;

                  const maxScroll =
                    carousel.scrollWidth - carousel.clientWidth;

                  if (carousel.scrollLeft >= maxScroll - 10) {
                    carousel.scrollTo({
                      left: 0,
                      behavior: "smooth"
                    });
                  } else {
                    carousel.scrollBy({
                      left: step,
                      behavior: "smooth"
                    });
                  }
                }}
              >
                →
              </button>
            </div>
          )}
          </>
          )}
        </section>

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
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
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
                        rel="noopener noreferrer"
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
          id="events"
          className="section eventsSection reveal-section"
        >
          <div className="sectionTop">
            <div className="eventsSectionHeading">
              <div className="sectionLabel">
                WHAT'S NEXT
              </div>

              <h2>
                Upcoming <em>Events</em>
              </h2>

              <p className="eventsSectionLead">
                Gather with FAS for Scripture, worship, fellowship and conversations that point us back to Christ.
              </p>
            </div>

            <div className="eventsSectionAside">
              <span className="eventsSectionAsideLabel">
                WEEKLY RHYTHM
              </span>
              <strong>{settings.tuesday_time}</strong>
              <span>Online and in-person gatherings</span>
              <a
                className="textBtn"
                href="/events"
              >
                View all events
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {loading ? (
            <div className="emptyState">
              <CalendarDays size={24} />
              <p>Loading upcoming events...</p>
            </div>
           ) : visibleUpcomingEvents.length === 0 ? (
            <div className="emptyState">
              <CalendarDays size={24} />
              <p>
                Upcoming FAS events will appear here.
              </p>
            </div>
          ) : (
            <div className="eventGrid">
              {visibleUpcomingEvents.map((event) => (
                <article
                  className="eventCard eventCardPremium reveal-item"
                  key={event.id}
                >
                  <div className="eventDate">
                    <span className="eventDateMonth">
                      {new Date(
                        event.date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short"
                      })}
                    </span>
                    <strong>
                      {new Date(
                        event.date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        day: "2-digit"
                      })}
                    </strong>
                    <span className="eventDateDay">
                      {new Date(
                        event.date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        weekday: "short"
                      })}
                    </span>
                  </div>

                  <div className="eventCardMain">
                    <div className="eventCardTopline">
                      <span className="eventType">
                        {(event.event_type || "event").replace(/-/g, " ")}
                      </span>
                      {event.mode && (
                        <span className="eventModeBadge">{event.mode}</span>
                      )}
                      {event.meeting_url && (
                        <span className="eventLiveBadge">
                          <span className="eventLiveDot"></span>
                          Google Meet
                        </span>
                      )}
                    </div>

                    <h3>{event.title}</h3>

                    <div className="eventMetaRow eventMetaPremium">
                      {event.time && (
                        <span className="eventTimeChip">
                          <Clock3 size={14} />
                          <span>
                            <small>TIME</small>
                            <strong>{event.time}</strong>
                          </span>
                        </span>
                      )}
                      {event.location && (
                        <span className="eventLocationChip">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </span>
                      )}
                    </div>

                    {event.speaker_name && (
                      <div className="eventSpeaker">
                        <span className="eventSpeakerIcon">
                          <UserRound size={14} />
                        </span>
                        <span>
                          <small>Speaker</small>
                          <strong>{event.speaker_name}</strong>
                        </span>
                      </div>
                    )}

                    {event.description && (
                      <p className="muted">{event.description}</p>
                    )}
                  </div>

                  <div className="eventCardAction">
                    <div className="eventActionStack">
                      <span className="eventActionHint">EVENT DETAILS</span>
                      <button
                        type="button"
                        className="eventDetailsBtn"
                        onClick={() => setSelectedEvent(event)}
                        aria-label={`View details for ${event.title}`}
                      >
                        More Details
                        <ArrowRight size={16} />
                      </button>

                      {event.meeting_url && (
                        <a
                          className="eventJoinBtn"
                          href={event.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Join Google Meet for ${event.title}`}
                        >
                          Join Google Meet
                          <ArrowRight size={16} />
                        </a>
                      )}

                      {!event.meeting_url && event.registration_url && (
                        <a
                          className="eventJoinBtn eventRegisterBtn"
                          href={event.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Register / View
                          <ArrowRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

                <section
          id="blog"
          className="section blogSection reveal-section"
        >
          <div className="blogSectionHeader">
            <div className="blogSectionHeading">
              <div className="blogSectionEyebrow">
                <span className="blogSectionEyebrowLine"></span>
                FAS JOURNAL
              </div>

              <h2>
                Reflections on <em>faith and life.</em>
              </h2>

              <p>
                Thoughtful reflections, biblical encouragement, and stories
                from the FAS journey — written to help us know Christ,
                grow in truth, and live faithfully.
              </p>
            </div>

            <div className="blogSectionSeal" aria-hidden="true">
              <span>FAITH</span>
              <strong>&amp;</strong>
              <span>TRUTH</span>
            </div>
          </div>

          {data.blog.length === 0 ? (
            <div className="emptyState">
              <p>FAS blog posts will appear here.</p>
            </div>
          ) : (
            <div className="blogGrid blogCarousel">
              {data.blog.map((post, index) => (
                <article
                  className={`blogCard blogCardFeatured reveal-item${index === 0 ? " isFeatured" : ""}${!post.cover_image_url ? " isFallback" : ""}`}
                  key={post.id}
                >
                  <a
                    href={`/blog/${post.slug}`}
                    className="blogCardMedia"
                    aria-label={`Read ${post.title}`}
                  >
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt=""
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    ) : (
                      <div className="blogCardMediaFallback" aria-hidden="true">
                        <div className="blogFallbackArtwork">
                          <span className="blogFallbackKicker">
                            {(post.category || "FAS JOURNAL").replace(/-/g, " ")}
                          </span>
                          <span className="blogFallbackQuote">“</span>
                          <strong>{post.title}</strong>
                          <span className="blogFallbackRule"></span>
                          <span className="blogFallbackFooter">
                            FAITH · FELLOWSHIP · TRUTH
                          </span>
                        </div>
                      </div>
                    )}
                    <span className="blogCardReadBadge">
                      Read article <ArrowRight size={15} />
                    </span>
                  </a>

                  {post.cover_image_url && (
                    <div className="blogCardContent">
                      <div className="blogCardTopline">
                        <div className="blogCategory">
                          {(post.category || "other").replace(/-/g, " ")}
                        </div>
                        {post.published_at && (
                          <time dateTime={post.published_at}>
                            {new Date(post.published_at).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </time>
                        )}
                      </div>

                      <h3>
                        <a href={`/blog/${post.slug}`}>{post.title}</a>
                      </h3>

                      {post.excerpt && <p>{post.excerpt}</p>}

                      <div className="blogMeta">
                        <span className="blogAuthor">
                          {post.author || "FAS"}
                        </span>
                        <a href={`/blog/${post.slug}`} className="blogReadLink">
                          Continue reading <ArrowRight size={16} />
                        </a>
                      </div>
                    </div>
                  )}
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

          {data.sermons.length === 0 ? (
            <div className="emptyState">
              <p>Sermons will appear here.</p>
            </div>
          ) : (
            <>
              <div className="sermonSliderWrap">
                <div className="sermonGrid">
                  {data.sermons.map((sermon) => (
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

                    <div className="sermonCardActions">
                      <button
                        type="button"
                        className="sermonShareBtn"
                        onClick={() => shareSermon(sermon)}
                        aria-label={"Share " + sermon.title}
                        title="Share sermon"
                      >
                        <Share2 size={15} />
                        <span>{sermonShareStatus || "Share"}</span>
                      </button>
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
                  </div>
                </article>
                  ))}
                </div>
                <div className="sermonSliderControls" aria-label="Sermon navigation">
                  <button type="button" className="sermonSliderArrow" aria-label="Previous sermon" onClick={() => {
                    const grid = document.querySelector("#sermons .sermonGrid");
                    if (grid) grid.scrollBy({ left: -grid.clientWidth, behavior: "smooth" });
                  }}>
                    <ArrowLeft size={19} />
                  </button>
                  <span className="sermonSliderHint">SWIPE OR USE ARROWS</span>
                  <button type="button" className="sermonSliderArrow" aria-label="Next sermon" onClick={() => {
                    const grid = document.querySelector("#sermons .sermonGrid");
                    if (grid) grid.scrollBy({ left: grid.clientWidth, behavior: "smooth" });
                  }}>
                    <ArrowRight size={19} />
                  </button>
                </div>
              </div>
            </>
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

          {data.videos.length === 0 ? (
            <div className="emptyState">
              <p>Videos will appear here.</p>
            </div>
          ) : (
            <div className="videoGrid">
              {data.videos.map((video) => (
                <article
                  className="videoCard reveal-item"
                  key={video.id}
                >
                  <div className="videoThumbnail">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        loading="lazy"
                        decoding="async"
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

          {data.ebooks.length === 0 ? (
            <div className="emptyState">
              <p>E-books will appear here.</p>
            </div>
          ) : (
            <div className="ebookGrid">
              {data.ebooks.map((ebook) => (
                <article className="ebookCard reveal-item" key={ebook.id}>
                  <div className="ebookCover">
                    {ebook.cover_image_url ? (
                      <img
                        src={ebook.cover_image_url}
                        alt={ebook.title}
                        loading="lazy"
                        decoding="async"
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

                    <button
                        type="button"
                        className="ebookReadLink"
                        onClick={() => setSelectedEbook(ebook)}
                      >
                        Read Online <ArrowRight size={16} />
                      </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        
        {selectedEvent && (
          <div
            className="eventDetailsModalOverlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Event details for ${selectedEvent.title}`}
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="eventDetailsModal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="eventDetailsModalClose"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
              >
                <X size={22} />
              </button>

              <div className="eventDetailsModalMedia">
                {selectedEvent.image_url ? (
                  <>
                    <img
                      className="eventDetailsModalMediaBackdrop"
                      src={selectedEvent.image_url}
                      aria-hidden="true"
                      loading="eager"
                      decoding="async"
                      alt=""
                    />
                    <img
                      className="eventDetailsModalMediaImage"
                      src={selectedEvent.image_url}
                      loading="eager"
                      decoding="async"
                      alt={selectedEvent.title}
                    />
                  </>
                ) : (
                  <div className="eventDetailsPosterFallback">
                    <span>FAS</span>
                    <small>EVENT POSTER</small>
                  </div>
                )}
                <div className="eventDetailsModalMediaOverlay">
                  <span>{(selectedEvent.event_type || "event").replace(/-/g, " ")}</span>
                  {selectedEvent.mode && <strong>{selectedEvent.mode}</strong>}
                </div>
              </div>

              <div className="eventDetailsModalBody">
                <div className="eventDetailsModalEyebrow">FAS GATHERING</div>
                <h2>{selectedEvent.title}</h2>

                <div className="eventDetailsModalMeta">
                  <div>
                    <CalendarDays size={17} />
                    <span>
                      {new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  {selectedEvent.time && (
                    <div>
                      <span className="eventMetaBullet">TIME</span>
                      <span>{selectedEvent.time}</span>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div>
                      <span className="eventMetaBullet">LOCATION</span>
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>

                {selectedEvent.speaker_name && (
                  <div className="eventDetailsSpeaker">
                    <span className="eventDetailsSpeakerIcon">
                      <UserRound size={17} />
                    </span>
                    <span>
                      <small>SPEAKER</small>
                      <strong>{selectedEvent.speaker_name}</strong>
                    </span>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="eventDetailsDescription">
                    <span className="eventDetailsLabel">ABOUT THIS GATHERING</span>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}

                <div className="eventDetailsActions">
                  {selectedEvent.meeting_url && (
                    <a
                      className="eventDetailsPrimary"
                      href={selectedEvent.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join Google Meet
                      <ArrowRight size={17} />
                    </a>
                  )}

                  {selectedEvent.registration_url && (
                    <a
                      className="eventDetailsSecondary"
                      href={selectedEvent.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Register / More Information
                      <ArrowRight size={17} />
                    </a>
                  )}
                </div>

                <div className="eventDetailsFooter">
                  <span>FAITH · FELLOWSHIP · TRUTH</span>
                  <span>FAS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedStory && (
          <div
            className="storyModalOverlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Student story from ${selectedStory.student_name}`}
            onClick={() => setSelectedStory(null)}
          >
            <div
              className="storyModal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="storyModalClose"
                onClick={() => setSelectedStory(null)}
                aria-label="Close student story"
              >
                <X size={22} />
              </button>

              <div className="storyModalMedia">
                {selectedStory.photo ? (
                  <img
                    src={selectedStory.photo}
                    loading="lazy"
                    decoding="async"
                    alt={`${selectedStory.student_name} — FAS student story`}
                  />
                ) : (
                  <div className="storyModalFallback">
                    <Quote size={52} />
                  </div>
                )}
              </div>

              <div className="storyModalContent">
                <div className="storyEyebrow">
                  STUDENT TESTIMONY
                </div>

                <h2>{selectedStory.student_name}</h2>

                {selectedStory.college && (
                  <div className="storyModalCollege">
                    {selectedStory.college}
                  </div>
                )}

                {selectedStory.impact_statement && (
                  <div className="storyModalImpact">
                    <span>WHAT GOD DID</span>
                    <strong>{selectedStory.impact_statement}</strong>
                  </div>
                )}

                <div className="storyModalDivider" />

                <div className="storyFullText">
                  {selectedStory.testimony}
                </div>

                <div className="storyModalFooter">
                  <span>FAS · STUDENT STORY</span>
                  <span>TO GOD BE THE GLORY</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                        {image.image ? (
                          <img
                            src={image.image}
                            loading="lazy"
                            decoding="async"
                            alt={
                              image.title ||
                              "FAS fellowship moment"
                            }
                          />
                        ) : (
                          <div className="galleryImagePlaceholder">
                            <span>FAS</span>
                          </div>
                        )}

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
                      loading="lazy"
                      decoding="async"
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
            <div className="supportIntro">
              <div className="sectionLabel">
                CONNECT WITH FAS
              </div>

              <h2>
                Come grow with us.
              </h2>

              <p>
                Whether you have a prayer request, a question,
                a testimony, or simply want to know more about FAS,
                we would love to hear from you.
              </p>
            </div>

            <div className="contactFormWrap">
              <div className="contactFormHeader">
                <div>
                  <div className="sectionLabel">
                    REACH OUT
                  </div>
                  <h3>
                    How can we hear from you?
                  </h3>
                </div>

                {contactRequestType === "prayer" && (
                  <span className="contactPrivacyNote">
                    Prayer requests are handled privately.
                  </span>
                )}
              </div>

              <div className="contactTypeSwitch" role="tablist" aria-label="Contact type">
                <button
                  type="button"
                  className={`contactTypeBtn ${
                    contactRequestType === "prayer" ? "active" : ""
                  }`}
                  onClick={() => {
                    setContactRequestType("prayer");
                    setContactFeedback(null);
                  }}
                  aria-selected={contactRequestType === "prayer"}
                  role="tab"
                >
                  Prayer Request
                </button>

                <button
                  type="button"
                  className={`contactTypeBtn ${
                    contactRequestType === "message" ? "active" : ""
                  }`}
                  onClick={() => {
                    setContactRequestType("message");
                    setContactFeedback(null);
                  }}
                  aria-selected={contactRequestType === "message"}
                  role="tab"
                >
                  Send a Message
                </button>
              </div>

              <form
                className="contactForm"
                onSubmit={handleContactSubmit}
              >
                <div className="contactFormGrid">
                  <label>
            <span>Phone Number</span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(event) =>
                setContactPhone(event.target.value)
              }
              placeholder="+91 98765 43210"
              maxLength={30}
              autoComplete="tel"
            />
          </label>

          <label>
                    <span>Name</span>
                    <input
                      type="text"
                      id="contact-name"
                      name="name"
                      autoComplete="name"
                      value={contactName}
                      onChange={(event) =>
                        setContactName(event.target.value)
                      }
                      placeholder="Your name"
                      maxLength={120}
                      required
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(event) =>
                        setContactEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                </div>

                <label>
                  <span>
                    {contactRequestType === "prayer"
                      ? "Prayer Request"
                      : "Message"}
                  </span>
                  <textarea
                    value={contactMessage}
                    onChange={(event) =>
                      setContactMessage(event.target.value)
                    }
                    placeholder={
                      contactRequestType === "prayer"
                        ? "Share what you would like us to pray for..."
                        : "Write your message to FAS..."
                    }
                    maxLength={5000}
                    rows={6}
                    required
                  />
                </label>

                {contactFeedback && (
                  <div
                    className={`contactFeedback ${
                      contactFeedback.type === "success"
                        ? "success"
                        : "error"
                    }`}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {contactFeedback.message}
                  </div>
                )}

                <button
                  type="submit"
                  className="primaryBtn contactSubmitBtn"
                  disabled={contactSubmitting}
                >
                  <span className="contactSubmitLabel">
                    {contactSubmitting
                      ? "Sending..."
                      : contactRequestType === "prayer"
                        ? "Submit Prayer Request"
                        : "Send Message"}
                  </span>
                  <ArrowRight size={17} />
                </button>
              </form>
            </div>

            <div className="supportLinksHeader">
              <span className="supportLinksEyebrow">STAY CONNECTED</span>
              <h3>Find us online.</h3>
              <p>Follow FAS and stay connected with our fellowship.</p>
            </div>

            <div className="supportLinks">
              {settings.whatsapp_url && (
                <a
                  href={settings.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Users size={18} />
                  WhatsApp
                </a>
              )}

              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={18} />
                  Instagram
                </a>
              )}

              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube size={18} />
                  YouTube
                </a>
              )}

              {settings.email && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(settings.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
                    Contact details will appear here once configured
                    in the FAS admin panel.
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