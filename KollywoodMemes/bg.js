const KEY = "memes";
const VER = chrome.runtime.getManifest().version;

async function sync() {
  const r = await fetch(chrome.runtime.getURL("assets/memes.json"));
  const data = await r.json();
  await chrome.storage.local.set({ [KEY]: data });
}

chrome.runtime.onInstalled.addListener(async () => {
  await sync();
  await chrome.storage.local.set({ enabled: true, ver: VER });
});

chrome.storage.local.get("ver", async (d) => {
  if (d.ver !== VER) {
    await sync();
    await chrome.storage.local.set({ ver: VER });
  }
});

chrome.runtime.onMessage.addListener((msg, _, reply) => {
  if (msg.type === "getMemes") {
    chrome.storage.local.get([KEY, "enabled"], (d) => {
      reply({ memes: d[KEY] || {}, enabled: d.enabled !== false });
    });
    return true;
  }
  if (msg.type === "getURL") {
    reply({ url: chrome.runtime.getURL(msg.path) });
    return true;
  }
});
