let map = {};
let urls = {};
let on = true;
let sorted = [];
let normKeys = {};

function norm(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildIndex(m) {
  map = m;
  urls = {};
  normKeys = {};
  for (const k of Object.keys(m)) {
    const v = m[k];
    urls[k] = v.startsWith("http") ? v : chrome.runtime.getURL("assets/memes/" + v);
    normKeys[k] = norm(k);
  }
  sorted = Object.keys(m).sort((a, b) => normKeys[b].length - normKeys[a].length);
}

function matchTrigger(text) {
  const t = norm(text.trimEnd());
  for (const k of sorted) {
    if (t.endsWith(normKeys[k])) return k;
  }
  return null;
}

function getTextBeforeCursor(ce) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return null;
  const endNode = range.endContainer;
  const endOff = range.endOffset;
  if (endNode.nodeType !== Node.TEXT_NODE) return null;
  const walker = document.createTreeWalker(ce, NodeFilter.SHOW_TEXT);
  let text = "";
  let n;
  while ((n = walker.nextNode())) {
    if (n === endNode) { text += n.textContent.slice(0, endOff); break; }
    text += n.textContent;
  }
  return text;
}

function buildTriggerRange(ce, trigger) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const endNode = range.endContainer;
  const endOff = range.endOffset;
  if (endNode.nodeType !== Node.TEXT_NODE) return null;

  const nodeText = endNode.textContent.slice(0, endOff);
  const trimmed = nodeText.trimEnd();
  if (norm(trimmed).endsWith(normKeys[trigger])) {
    const trailing = nodeText.length - trimmed.length;
    const startOff = endOff - trailing - trigger.length;
    if (startOff >= 0) {
      const r = document.createRange();
      r.setStart(endNode, startOff);
      r.setEnd(endNode, endOff - trailing);
      return r;
    }
  }

  const walker = document.createTreeWalker(ce, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) {
    nodes.push(n);
    if (n === endNode) break;
  }

  let full = "";
  const offsets = [];
  for (let i = 0; i < nodes.length; i++) {
    offsets.push(full.length);
    full += nodes[i] === endNode
      ? nodes[i].textContent.slice(0, endOff)
      : nodes[i].textContent;
  }

  const trimmedFull = full.trimEnd();
  if (!norm(trimmedFull).endsWith(normKeys[trigger])) return null;

  const absEnd = trimmedFull.length;
  const absStart = absEnd - trigger.length;
  let sNode = null, sOff = 0, eNode = null, eOff = 0;

  for (let i = 0; i < nodes.length; i++) {
    const s = offsets[i];
    const len = nodes[i] === endNode ? endOff : nodes[i].textContent.length;
    const e = s + len;
    if (!sNode && e > absStart) { sNode = nodes[i]; sOff = absStart - s; }
    if (!eNode && e >= absEnd) { eNode = nodes[i]; eOff = absEnd - s; break; }
  }

  if (!sNode || !eNode) return null;
  const r = document.createRange();
  r.setStart(sNode, sOff);
  r.setEnd(eNode, eOff);
  return r;
}

function deleteTriggerRange(trigRange) {
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(trigRange);
  trigRange.deleteContents();
  sel.collapseToStart();
}

function escHTML(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function insertViaDataTransfer(url, trigger, ce) {
  const dt = new DataTransfer();
  dt.setData("text/html", `<img src="${escHTML(url)}" alt="${escHTML(trigger)}">`);
  dt.setData("text/plain", `![${trigger}](${url})`);
  ce.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
}

function pasteImageAtCursor(url, trigger, ce) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { insertViaDataTransfer(url, trigger, ce); return; }
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        .then(() => { ce.focus(); document.execCommand("paste"); })
        .catch(() => insertViaDataTransfer(url, trigger, ce));
    }, "image/png");
  };
  img.onerror = () => insertViaDataTransfer(url, trigger, ce);
  img.src = url;
}

document.addEventListener("keydown", (e) => {
  if (!on || e.key !== " ") return;

  const active = document.activeElement;
  if (!active) return;

  if (active.tagName === "TEXTAREA") {
    const before = active.value.slice(0, active.selectionStart);
    const hit = matchTrigger(before);
    if (!hit) return;
    const url = urls[hit];
    if (!url) return;
    e.preventDefault();
    const pos = active.selectionStart;
    const trimmed = before.trimEnd();
    const start = trimmed.length - hit.length;
    const md = `![${hit}](${url})`;
    active.value = trimmed.slice(0, start) + md + " " + active.value.slice(pos);
    const cur = start + md.length + 1;
    active.setSelectionRange(cur, cur);
    active.dispatchEvent(new Event("input", { bubbles: true }));
    active.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const ce = active.getAttribute("contenteditable") === "true"
    ? active
    : active.closest("[contenteditable='true']");
  if (!ce) return;

  const text = getTextBeforeCursor(ce);
  if (!text) return;
  const hit = matchTrigger(text);
  if (!hit) return;
  const url = urls[hit];
  if (!url) return;

  const trigRange = buildTriggerRange(ce, hit);
  if (!trigRange) return;

  e.preventDefault();
  deleteTriggerRange(trigRange);
  pasteImageAtCursor(url, hit, ce);
}, true);

function init(data) {
  buildIndex(data.memes || {});
  on = data.enabled !== false;
}

chrome.runtime.sendMessage({ type: "getMemes" }, init);

chrome.storage.onChanged.addListener((ch) => {
  if (ch.memes) buildIndex(ch.memes.newValue || {});
  if (ch.enabled) on = ch.enabled.newValue !== false;
});
