// The manifest injects this script into ALL pages ("<all_urls>"), because a
// static match pattern cannot express "any Google TLD" (host wildcards may
// only be a leading "*.", not a trailing one covering the TLD). So the
// host/path filtering that used to live in manifest.json's "matches" is done
// here instead, in isSearchResultsPage(). If that check fails, the script
// exits immediately and does nothing on the page.
//
// Logic once on a matching page: a plain left-click on a link pointing to a
// DIFFERENT hostname than the current page is treated as "opening a search
// result" -> send it to a new tab. Links to the same hostname (Images/News/
// Maps tabs, pagination, settings, etc.) are left alone and navigate
// normally in the same tab. Clicks with modifier keys (Ctrl/Cmd/Shift/
// middle-click) are left alone too, since Firefox already opens those in a
// new/background tab by default.

function isGoogleHost(hostname) {
  // Matches google.com, google.co.uk, google.co.il, google.com.au,
  // scholar.google.com, www.google.de, etc. Does NOT match hosts that merely
  // contain "google" as a substring (e.g. evilgoogle.com, googlee.com).
  return /(^|\.)google\.[a-z.]+$/i.test(hostname);
}

function isSearchResultsPage() {
  const host = location.hostname;
  const path = location.pathname;

  if (isGoogleHost(host)) {
    if (host === "scholar.google.com") return path.startsWith("/scholar");
    return path === "/search" || path.startsWith("/search/");
  }

  return (
    host === "duckduckgo.com" ||
    host === "html.duckduckgo.com" ||
    host === "lite.duckduckgo.com"
  );
}

if (!isSearchResultsPage()) {
  // Not a page we care about; do nothing further.
} else {

// Cached locally so the click handler can decide synchronously
// (preventDefault only works if called within the same event tick).
let enabled = true;
browser.storage.local.get("enabled").then((res) => {
  if (typeof res.enabled === "boolean") enabled = res.enabled;
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.enabled) {
    enabled = changes.enabled.newValue;
  }
});

document.addEventListener(
  "click",
  function (event) {
    if (!enabled) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0) return; // only plain left-click
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest("a[href]");
    if (!link) return;

    let url;
    try {
      url = new URL(link.href, location.href);
    } catch (e) {
      return;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    const sameHost = url.hostname === location.hostname;

    if (sameHost) {
      if (isGoogleHost(location.hostname)) {
        // Google's actual internal navigation is a small, stable set of
        // paths (the search page itself, prefs, homepage). Anything else
        // on a google.* hostname (/url, /aclk, /goto, /interstitial, and
        // whatever wrapper path they introduce next) is an outbound result
        // wrapper, not internal nav -- so it's treated as external below.
        const internalGooglePaths = [
          "/",
          "/search",
          "/webhp",
          "/preferences",
          "/advanced_search",
          "/setprefs",
          "/scholar",
          "/scholar_settings",
          "/scholar_setprefs",
        ];
        if (internalGooglePaths.includes(url.pathname)) return;
      } else {
        return; // same-host link on a non-Google engine (e.g. DDG nav): ignore
      }
    }

    event.preventDefault();
    event.stopPropagation();
    browser.runtime.sendMessage({ url: url.href });
  },
  true
);

} // end isSearchResultsPage() gate
