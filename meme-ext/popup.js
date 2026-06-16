const tog = document.getElementById("tog");
const count = document.getElementById("count");

function render(memes) {
  count.textContent = "Meme's Available : " + Object.keys(memes).length;
}

chrome.storage.local.get(["memes", "enabled"], (d) => {
  render(d.memes || {});
  tog.checked = d.enabled !== false;
});

tog.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: tog.checked });
});

document.getElementById("opts").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("reload").addEventListener("click", () => {
  chrome.storage.local.get("memes", (d) => render(d.memes || {}));
});
