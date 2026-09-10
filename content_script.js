// Runs only on the pages matched in manifest.json (Google/DuckDuckGo search pages).
// Logic: a plain left-click on a link pointing to a DIFFERENT hostname than the
// current page is treated as "opening a search result" -> send it to a new tab.
// Links to the same hostname (Images/News/Maps tabs, pagination, settings, etc.)
// are left alone and navigate normally in the same tab.
// Clicks with modifier keys (Ctrl/Cmd/Shift/middle-click) are left alone too,
// since Firefox already opens those in a new/background tab by default.

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
    const isGoogleHost = /(^|\.)google\./.test(location.hostname);

    if (sameHost) {
      if (isGoogleHost) {
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
