const ICON_SETS = {
  on: {
    16: "icons/on/icon-16.png",
    32: "icons/on/icon-32.png",
    48: "icons/on/icon-48.png",
    96: "icons/on/icon-96.png",
  },
  off: {
    16: "icons/off/icon-16.png",
    32: "icons/off/icon-32.png",
    48: "icons/off/icon-48.png",
    96: "icons/off/icon-96.png",
  },
};

function applyState(enabled) {
  browser.browserAction.setIcon({ path: ICON_SETS[enabled ? "on" : "off"] });
  browser.browserAction.setTitle({
    title: enabled
      ? "Search results in new tab: ON (click to turn off)"
      : "Search results in new tab: OFF (click to turn on)",
  });
}

async function init() {
  const res = await browser.storage.local.get("enabled");
  const enabled = res.enabled !== false; // default: enabled
  applyState(enabled);
}

init();

browser.browserAction.onClicked.addListener(async () => {
  const res = await browser.storage.local.get("enabled");
  const newValue = !(res.enabled !== false);
  await browser.storage.local.set({ enabled: newValue });
  applyState(newValue);
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.url) {
    browser.tabs.create({ url: msg.url });
  }
});
