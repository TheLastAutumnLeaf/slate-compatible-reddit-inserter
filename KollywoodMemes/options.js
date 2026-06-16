let memes = {};

const tblWrap = document.getElementById("tbl-wrap");
const srch = document.getElementById("srch");
const newKw = document.getElementById("new-kw");
const newUrl = document.getElementById("new-url");
const newTitle = document.getElementById("new-title");
const ioStatus = document.getElementById("io-status");

function save(cb) {
  chrome.storage.local.set({ memes }, cb);
}

function status(msg, type) {
  ioStatus.textContent = msg;
  ioStatus.className = "status " + (type || "");
  if (msg) setTimeout(() => { ioStatus.textContent = ""; ioStatus.className = "status"; }, 2800);
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function render(filter) {
  if (!filter) { tblWrap.innerHTML = ""; return; }

  const f = filter.toLowerCase();
  const keys = Object.keys(memes).filter(k =>
    k.toLowerCase().includes(f) || memes[k].toLowerCase().includes(f)
  );

  if (!keys.length) {
    tblWrap.innerHTML = '<p style="color:#444;font-size:12.5px;padding:12px 0;">No matches.</p>';
    return;
  }

  tblWrap.innerHTML = `<table>
    <thead><tr><th>Trigger</th><th>URL / Filename</th><th></th></tr></thead>
    <tbody>${keys.map((k, i) => `<tr>
      <td class="kw-cell">${esc(k)}</td>
      <td class="fn-cell">${esc(memes[k])}</td>
      <td><button class="del" data-i="${i}" title="Remove">&#x2715;</button></td>
    </tr>`).join("")}</tbody>
  </table>`;
  tblWrap._keys = keys;
}

chrome.storage.local.get("memes", (d) => {
  memes = d.memes || {};
});

srch.addEventListener("input", () => render(srch.value.trim()));

tblWrap.addEventListener("click", (e) => {
  const btn = e.target.closest(".del");
  if (!btn) return;
  const key = tblWrap._keys?.[+btn.dataset.i];
  if (key === undefined) return;
  delete memes[key];
  save(() => render(srch.value.trim()));
});

document.getElementById("add-btn").addEventListener("click", () => {
  const k = newKw.value.trim();
  const v = newUrl.value.trim();
  if (!k || !v) return;
  memes[k] = v;
  save(() => {
    render(srch.value.trim());
    newKw.value = "";
    newUrl.value = "";
    newTitle.value = "";
    newKw.focus();
  });
});

newTitle.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("add-btn").click();
});

document.getElementById("exp").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(memes, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "memes.json";
  a.click();
  status("Exported.", "ok");
});

document.getElementById("file-in").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      memes = { ...memes, ...parsed };
      save(() => {
        render(srch.value.trim());
        status("Imported " + Object.keys(parsed).length + " entries.", "ok");
      });
    } catch {
      status("Invalid JSON file.", "err");
    }
  };
  r.readAsText(f);
  e.target.value = "";
});

document.getElementById("reset").addEventListener("click", async () => {
  if (!confirm("Reset to built-in defaults? This replaces all current mappings.")) return;
  const r = await fetch(chrome.runtime.getURL("assets/memes.json"));
  memes = await r.json();
  save(() => {
    render(srch.value.trim());
    status("Reset to defaults.", "ok");
  });
});
