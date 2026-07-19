/* ============================================================
   UTABIRI WA MECHI - app.js
   Vanilla JS + Firebase Firestore (realtime, shared kwa watumiaji wote)
   ============================================================ */

let db = null;
let firebaseReady = false;
let matches = [];
let isAdmin = false;
let openRowId = null;

const WEEKDAYS = ["Jumapili","Jumatatu","Jumanne","Jumatano","Alhamisi","Ijumaa","Jumamosi"];
const MONTHS = ["Januari","Februari","Machi","Aprili","Mei","Juni","Julai","Agosti","Septemba","Oktoba","Novemba","Desemba"];

/* ---------- Firebase init ---------- */
function initFirebase() {
  try {
    if (!firebaseConfig || firebaseConfig.apiKey === "WEKA_API_KEY_YAKO") {
      showBanner("Firebase bado haijawekwa. Fungua firebase-config.js na weka funguo zako (angalia README.md).", "info");
      document.getElementById("loadingState").classList.add("hidden");
      document.getElementById("emptyState").classList.remove("hidden");
      return;
    }
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    firebaseReady = true;
    listenMatches();
  } catch (e) {
    showBanner("Imeshindwa kuunganisha Firebase: " + e.message, "error");
  }
}

/* ---------- Realtime listener ---------- */
function listenMatches() {
  db.collection("matches").onSnapshot(
    (snap) => {
      matches = [];
      snap.forEach((doc) => matches.push({ id: doc.id, ...doc.data() }));
      document.getElementById("loadingState").classList.add("hidden");
      render();
    },
    (err) => {
      document.getElementById("loadingState").classList.add("hidden");
      showBanner("Imeshindwa kupakia data: " + err.message, "error");
    }
  );
}

/* ---------- Helpers ---------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function emptyMarkets() {
  return {
    ouLine: "2.5", ouPick: null,
    ggPick: null,
    cornersLine: "9.5", cornersPick: null,
    winnerPick: null,
  };
}

function fmtDateHeading(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function showBanner(msg, type) {
  const b = document.getElementById("banner");
  b.textContent = msg;
  b.className = "banner" + (type === "info" ? " info" : "");
  b.classList.remove("hidden");
}
function hideBanner() {
  document.getElementById("banner").classList.add("hidden");
}

function groupByDate(list) {
  const byDate = {};
  for (const m of list) {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  }
  const dates = Object.keys(byDate).sort();
  for (const d of dates) byDate[d].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  return dates.map((d) => ({ date: d, items: byDate[d] }));
}

/* ---------- Firestore write helpers ---------- */
async function addMatch(data) {
  await db.collection("matches").add({
    date: data.date, time: data.time, league: data.league,
    teamA: data.teamA, teamB: data.teamB,
    ...emptyMarkets(),
    confidence: 0, note: "",
    createdAt: Date.now(),
  });
}
async function updateMatch(id, patch) {
  await db.collection("matches").doc(id).update(patch);
}
async function deleteMatch(id) {
  await db.collection("matches").doc(id).delete();
}

/* ---------- Render: router ---------- */
function render() {
  document.getElementById("adminBar").classList.toggle("hidden", !isAdmin);
  const root = document.getElementById("matchesRoot");
  const empty = document.getElementById("emptyState");

  if (!firebaseReady) return;

  if (matches.length === 0) {
    root.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  root.innerHTML = isAdmin ? renderAdminList() : renderPublicList();
  attachDynamicHandlers();
}

/* ---------- PUBLIC render ---------- */
function renderPublicList() {
  const groups = groupByDate(matches);
  return groups.map(({ date, items }) => `
    <div class="date-group">
      <div class="date-heading">📅 ${fmtDateHeading(date)}</div>
      <div class="matches-grid">
        ${items.map(renderPublicCard).join("")}
      </div>
    </div>
  `).join("");
}

function renderPublicCard(m) {
  const winnerText = m.winnerPick === "1" ? (m.teamA || "Timu A")
    : m.winnerPick === "2" ? (m.teamB || "Timu B")
    : m.winnerPick === "X" ? "Sare" : null;
  const winnerColor = m.winnerPick === "1" ? "var(--green)" : m.winnerPick === "2" ? "var(--red)" : "var(--blue)";

  const pills = [];
  if (m.ouPick) pills.push(pill(`O/U ${m.ouLine}`, m.ouPick, m.ouPick === "Over" ? "var(--green)" : "var(--red)"));
  if (m.ggPick) pills.push(pill("GG", m.ggPick, m.ggPick === "Ndiyo" ? "var(--green)" : "var(--red)"));
  if (m.cornersPick) pills.push(pill(`Kona ${m.cornersLine}`, m.cornersPick, m.cornersPick === "Over" ? "var(--green)" : "var(--red)"));
  if (winnerText) pills.push(pill("Ushindi", winnerText, winnerColor));

  return `
    <div class="match-card">
      <div><span class="match-league">${esc(m.league || "Ligi")}</span><span class="match-time">${esc(m.time || "--:--")}</span></div>
      <div class="match-teams">${esc(m.teamA || "Timu A")} <span class="vs">vs</span> ${esc(m.teamB || "Timu B")}</div>
      <div class="pills">${pills.join("") || `<span class="section-label" style="margin:0;">Utabiri bado haujawekwa</span>`}</div>
      <div class="confid-row">Uhakika ${stars(m.confidence || 0, false, null)}</div>
      ${m.note ? `<div class="note">${esc(m.note)}</div>` : ""}
    </div>
  `;
}

function pill(label, val, color) {
  return `<div class="pill"><span class="dot" style="background:${color}"></span><span class="lab">${esc(label)}:</span><span class="val" style="color:${color}">${esc(val)}</span></div>`;
}

function stars(value, editable, matchId) {
  let out = `<span class="stars" ${editable ? `data-star-for="${matchId}"` : ""}>`;
  for (let n = 1; n <= 5; n++) {
    out += `<span class="star ${n <= value ? "on" : ""}" ${editable ? `data-star-n="${n}"` : ""}>★</span>`;
  }
  return out + "</span>";
}

/* ---------- ADMIN render ---------- */
function renderAdminList() {
  const sorted = matches.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return sorted.map(renderAdminRow).join("");
}

function renderAdminRow(m) {
  const open = openRowId === m.id;
  return `
    <div class="admin-row">
      <div class="admin-row-head" data-toggle-row="${m.id}">
        <div>
          <div class="admin-row-title">${esc(m.teamA || "Timu A")} <span style="color:var(--chalk-dim)">vs</span> ${esc(m.teamB || "Timu B")}</div>
          <div class="admin-row-sub">${esc(m.league || "Ligi")} &middot; ${esc(m.time || "--:--")} &middot; ${esc(m.date || "")}</div>
        </div>
        <div class="admin-row-actions">
          <button class="del-btn" data-delete="${m.id}">🗑</button>
          <span class="chev">${open ? "▲" : "▼"}</span>
        </div>
      </div>
      <div class="admin-row-body ${open ? "open" : ""}">
        ${open ? renderMarketEditor(m) : ""}
      </div>
    </div>
  `;
}

function renderMarketEditor(m) {
  return `
    <div class="grid2" style="margin-bottom:10px;">
      <input data-field="teamA" data-id="${m.id}" value="${escAttr(m.teamA)}" placeholder="Timu A" />
      <input data-field="teamB" data-id="${m.id}" value="${escAttr(m.teamB)}" placeholder="Timu B" />
      <input data-field="league" data-id="${m.id}" value="${escAttr(m.league)}" placeholder="Ligi" class="span2" />
      <input data-field="date" data-id="${m.id}" type="date" value="${escAttr(m.date)}" />
      <input data-field="time" data-id="${m.id}" type="time" value="${escAttr(m.time)}" />
    </div>

    <div class="market-block">
      <div class="section-label" style="margin-top:0;">Over / Under</div>
      <div class="pillrow">
        <input class="line-input" data-field="ouLine" data-id="${m.id}" value="${escAttr(m.ouLine)}" />
        <button class="toggle-pill ${m.ouPick === "Over" ? "active" : ""}" style="${m.ouPick === "Over" ? "background:var(--green);border-color:var(--green);" : ""}" data-pick="${m.id}" data-key="ouPick" data-val="Over">Over</button>
        <button class="toggle-pill ${m.ouPick === "Under" ? "active" : ""}" style="${m.ouPick === "Under" ? "background:var(--red);border-color:var(--red);" : ""}" data-pick="${m.id}" data-key="ouPick" data-val="Under">Under</button>
      </div>
    </div>

    <div class="market-block">
      <div class="section-label">GG (Timu Zote Kufunga)</div>
      <div class="pillrow">
        <button class="toggle-pill ${m.ggPick === "Ndiyo" ? "active" : ""}" style="${m.ggPick === "Ndiyo" ? "background:var(--green);border-color:var(--green);" : ""}" data-pick="${m.id}" data-key="ggPick" data-val="Ndiyo">Ndiyo</button>
        <button class="toggle-pill ${m.ggPick === "Hapana" ? "active" : ""}" style="${m.ggPick === "Hapana" ? "background:var(--red);border-color:var(--red);" : ""}" data-pick="${m.id}" data-key="ggPick" data-val="Hapana">Hapana</button>
      </div>
    </div>

    <div class="market-block">
      <div class="section-label">Mashuti ya Kona</div>
      <div class="pillrow">
        <input class="line-input" data-field="cornersLine" data-id="${m.id}" value="${escAttr(m.cornersLine)}" />
        <button class="toggle-pill ${m.cornersPick === "Over" ? "active" : ""}" style="${m.cornersPick === "Over" ? "background:var(--green);border-color:var(--green);" : ""}" data-pick="${m.id}" data-key="cornersPick" data-val="Over">Over</button>
        <button class="toggle-pill ${m.cornersPick === "Under" ? "active" : ""}" style="${m.cornersPick === "Under" ? "background:var(--red);border-color:var(--red);" : ""}" data-pick="${m.id}" data-key="cornersPick" data-val="Under">Under</button>
      </div>
    </div>

    <div class="market-block">
      <div class="section-label">Ushindi (1X2)</div>
      <div class="pillrow">
        <button class="toggle-pill ${m.winnerPick === "1" ? "active" : ""}" style="${m.winnerPick === "1" ? "background:var(--green);border-color:var(--green);" : ""}" data-pick="${m.id}" data-key="winnerPick" data-val="1">1 &middot; ${esc(m.teamA || "A")}</button>
        <button class="toggle-pill ${m.winnerPick === "X" ? "active" : ""}" style="${m.winnerPick === "X" ? "background:var(--blue);border-color:var(--blue);" : ""}" data-pick="${m.id}" data-key="winnerPick" data-val="X">X</button>
        <button class="toggle-pill ${m.winnerPick === "2" ? "active" : ""}" style="${m.winnerPick === "2" ? "background:var(--red);border-color:var(--red);" : ""}" data-pick="${m.id}" data-key="winnerPick" data-val="2">2 &middot; ${esc(m.teamB || "B")}</button>
      </div>
    </div>

    <div class="market-block">
      <div class="section-label">Kiwango cha Uhakika</div>
      ${stars(m.confidence || 0, true, m.id)}
    </div>

    <div class="market-block" style="margin-bottom:0;">
      <div class="section-label">Maelezo (hiari)</div>
      <textarea class="note-input" data-field="note" data-id="${m.id}" placeholder="mfano: Timu A haijashinda nyumbani...">${esc(m.note || "")}</textarea>
    </div>
  `;
}

/* ---------- Escaping ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function escAttr(s) { return esc(s); }

/* ---------- Event delegation ---------- */
function attachDynamicHandlers() {
  const root = document.getElementById("matchesRoot");

  root.querySelectorAll("[data-toggle-row]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-delete]")) return;
      const id = el.getAttribute("data-toggle-row");
      openRowId = openRowId === id ? null : id;
      render();
    });
  });

  root.querySelectorAll("[data-delete]").forEach((el) => {
    el.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = el.getAttribute("data-delete");
      if (confirm("Una uhakika unataka kufuta mechi hii?")) {
        try { await deleteMatch(id); } catch (err) { showBanner("Imeshindwa kufuta: " + err.message, "error"); }
      }
    });
  });

  root.querySelectorAll("[data-field]").forEach((el) => {
    const handler = debounce(async () => {
      const id = el.getAttribute("data-id");
      const field = el.getAttribute("data-field");
      try { await updateMatch(id, { [field]: el.value }); } catch (err) { showBanner("Imeshindwa kuhifadhi: " + err.message, "error"); }
    }, 500);
    el.addEventListener("input", handler);
  });

  root.querySelectorAll("[data-pick]").forEach((el) => {
    el.addEventListener("click", async () => {
      const id = el.getAttribute("data-pick");
      const key = el.getAttribute("data-key");
      const val = el.getAttribute("data-val");
      const current = matches.find((m) => m.id === id);
      const newVal = current && current[key] === val ? null : val;
      try { await updateMatch(id, { [key]: newVal }); } catch (err) { showBanner("Imeshindwa kuhifadhi: " + err.message, "error"); }
    });
  });

  root.querySelectorAll("[data-star-for]").forEach((starWrap) => {
    starWrap.querySelectorAll("[data-star-n]").forEach((s) => {
      s.addEventListener("click", async () => {
        const id = starWrap.getAttribute("data-star-for");
        const n = parseInt(s.getAttribute("data-star-n"), 10);
        try { await updateMatch(id, { confidence: n }); } catch (err) { showBanner("Imeshindwa kuhifadhi: " + err.message, "error"); }
      });
    });
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---------- Static UI wiring ---------- */
document.getElementById("adminToggleBtn").addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById("adminToggleBtn").textContent = "🔒 Msimamizi";
    render();
  } else {
    document.getElementById("pinModal").classList.remove("hidden");
    document.getElementById("pinInput").value = "";
    document.getElementById("pinError").classList.add("hidden");
    document.getElementById("pinInput").focus();
  }
});

document.getElementById("pinCloseBtn").addEventListener("click", () => {
  document.getElementById("pinModal").classList.add("hidden");
});

function submitPin() {
  const val = document.getElementById("pinInput").value;
  if (val === ADMIN_PIN) {
    isAdmin = true;
    document.getElementById("pinModal").classList.add("hidden");
    document.getElementById("adminToggleBtn").textContent = "🔓 Msimamizi";
    render();
  } else {
    document.getElementById("pinError").textContent = "PIN si sahihi.";
    document.getElementById("pinError").classList.remove("hidden");
  }
}
document.getElementById("pinSubmitBtn").addEventListener("click", submitPin);
document.getElementById("pinInput").addEventListener("keydown", (e) => { if (e.key === "Enter") submitPin(); });

document.getElementById("addMatchBtn").addEventListener("click", () => {
  document.getElementById("addForm").classList.toggle("hidden");
  if (!document.getElementById("fDate").value) {
    document.getElementById("fDate").value = new Date().toISOString().slice(0, 10);
  }
});

document.getElementById("saveMatchBtn").addEventListener("click", async () => {
  const date = document.getElementById("fDate").value;
  const time = document.getElementById("fTime").value;
  const league = document.getElementById("fLeague").value.trim();
  const teamA = document.getElementById("fTeamA").value.trim();
  const teamB = document.getElementById("fTeamB").value.trim();

  if (!teamA || !teamB || !date) {
    showBanner("Weka tarehe na majina ya timu zote mbili.", "error");
    return;
  }
  try {
    await addMatch({ date, time, league, teamA, teamB });
    document.getElementById("fTeamA").value = "";
    document.getElementById("fTeamB").value = "";
    document.getElementById("addForm").classList.add("hidden");
    hideBanner();
  } catch (err) {
    showBanner("Imeshindwa kuhifadhi mechi: " + err.message, "error");
  }
});

/* ---------- Boot ---------- */
initFirebase();
