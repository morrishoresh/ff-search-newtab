# Search Results in New Tab

Firefox extension. Opens clicked search results on Google and DuckDuckGo in
a new tab instead of the current one.

## Usage
Click the toolbar icon to toggle on/off (on by default). The icon shows the
current state.

## Behavior
- Active on Google search pages (any `google.*` TLD, `/search`), Google
  Scholar (`/scholar`), and `duckduckgo.com` / `html.` / `lite.`.
- Only plain left-clicks are intercepted. Clicks with Ctrl/Cmd/Shift/Alt or
  the middle button keep Firefox default behavior.
- Links to the same host (Images/News tabs, pagination, settings) navigate
  normally. On Google, same-host redirect wrappers (`/url`, `/aclk`, ...) are
  treated as results and opened in a new tab.

## Note
The content script is injected into `<all_urls>` because a match pattern
cannot express "any Google TLD". It exits immediately on non-search pages.
