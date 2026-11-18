
const SITE_LIVE = false; // Change to false to take the website offline.

const FEED_URL = "data/updates.json";
const TIME_ZONE = "Asia/Kolkata";

if (!SITE_LIVE) {
  document.title = "404: We've left the building.";

  document.body.replaceChildren();

  const page = document.createElement("main");
  page.style.cssText = `
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 32px 20px;
    text-align: center;
    background: #0b1020;
    color: #f1f5f9;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  `;

  const code = document.createElement("p");
  code.textContent = "404";
  code.style.cssText = `
    margin: 0;
    color: #64748b;
    font-size: 14px;
    letter-spacing: 8px;
    font-weight: 700;
  `;

  const heading = document.createElement("h1");
  heading.textContent = "We've left the building.";
  heading.style.cssText = `
    margin: 18px 0 12px;
    font-size: clamp(30px, 6vw, 52px);
    line-height: 1.15;
    font-weight: 750;
  `;

  const message = document.createElement("p");
  message.textContent = "Nothing to see here. Move along.";
  message.style.cssText = `
    margin: 0;
    color: #cbd5e1;
    font-size: 18px;
  `;

  const footer = document.createElement("p");
  footer.textContent =
    "This website is currently enjoying an extended vacation. Please respect its privacy.";
  footer.style.cssText = `
    max-width: 480px;
    margin: 22px 0 0;
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.7;
  `;

  page.append(code, heading, message, footer);
  document.body.append(page);
} else {
  const container = document.getElementById("updates-container");
  const updateCount = document.getElementById("update-count");
  const lastScan = document.getElementById("last-scan");
  const scanStatus = document.getElementById("scan-status");

  function formatDate(value) {
    const date = new Date(value);

    if (!value || Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: TIME_ZONE
    }).format(date) + " IST";
  }

  function safeText(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function showMessage(title, message) {
    container.replaceChildren();

    const state = document.createElement("div");
    state.className = "empty-state";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    state.append(heading, paragraph);
    container.append(state);
  }

  function createUpdateCard(update) {
    const card = document.createElement("article");
    card.className = "update-card";

    const meta = document.createElement("div");
    meta.className = "update-meta";

    const classification = document.createElement("span");
    const label = safeText(update.classification, "Unclassified");
    const classificationClass = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    classification.className = `classification ${classificationClass}`;
    classification.textContent = label.replaceAll("_", " ");

    const date = document.createElement("span");
    date.className = "update-date";
    date.textContent = formatDate(update.published_at);

    meta.append(classification, date);

    const heading = document.createElement("h3");
    heading.textContent = safeText(update.title, "Untitled update");

    const summary = document.createElement("p");
    summary.className = "update-summary";
    summary.textContent = safeText(update.summary, "No summary available.");

    const footer = document.createElement("div");
    footer.className = "update-footer";

    const target = document.createElement("span");
    target.className = "update-target";
    target.textContent = `Target: ${safeText(update.target, "Not specified")}`;

    footer.append(target);

    if (typeof update.source_url === "string") {
      try {
        const url = new URL(update.source_url);

        if (url.protocol === "https:" || url.protocol === "http:") {
          const link = document.createElement("a");
          link.className = "source-link";
          link.href = url.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = safeText(update.source_name, "Read source");
          footer.append(link);
        }
      } catch {
        // Ignore invalid source URLs.
      }
    }

    card.append(meta, heading, summary, footer);
    return card;
  }

  async function loadFeed() {
    try {
      const response = await fetch(`${FEED_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Feed request failed: ${response.status}`);
      }

      const feed = await response.json();

      if (!feed || !Array.isArray(feed.updates)) {
        throw new Error("Invalid intelligence feed format.");
      }

      const updates = feed.updates
        .filter(update =>
          update &&
          typeof update.published_at === "string" &&
          !Number.isNaN(Date.parse(update.published_at))
        )
        .sort((a, b) =>
          Date.parse(b.published_at) - Date.parse(a.published_at)
        );

      updateCount.textContent = String(updates.length);

      if (feed.last_scan_at) {
        lastScan.textContent = formatDate(feed.last_scan_at);
      } else {
        lastScan.textContent = "Not available";
      }

      scanStatus.textContent = safeText(feed.scan_status, "Status unavailable");

      container.replaceChildren();

      if (updates.length === 0) {
        showMessage(
          "No qualifying updates yet",
          "The monitoring agent has not published any qualifying acquisition updates. Check back after future scans."
        );
        return;
      }

      for (const update of updates) {
        container.append(createUpdateCard(update));
      }
    } catch (error) {
      console.error("Unable to load intelligence feed:", error);

      updateCount.textContent = "—";
      lastScan.textContent = "Unavailable";
      scanStatus.textContent = "Feed could not be loaded";

      showMessage(
        "Unable to load intelligence feed",
        "Please refresh the page or try again later."
      );
    }
  }

  loadFeed();
}
