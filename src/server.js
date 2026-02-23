require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "127.0.0.1";
const BOT_DATA_DIR = process.env.BOT_DATA_DIR || path.join(process.cwd(), "data");
const GUILD_ID = process.env.GUILD_ID || "";
const STAFF_CODE = process.env.STAFF_CODE || "changeme";
const DISCORD_INVITE_URL = process.env.DISCORD_INVITE_URL || "https://discord.gg/";
const SHOP_INVITE_URL = process.env.SHOP_INVITE_URL || "https://discord.gg/";
const HOME_BG_URL =
  process.env.HOME_BG_URL ||
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80";
const BOT_APPROVE_URL =
  process.env.BOT_APPROVE_URL || "http://127.0.0.1:3001/internal/base-member/approve";
const BOT_NOTIFY_URL =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/internal/base-member/notify";
const BOT_INTERNAL_API_SECRET = process.env.BOT_INTERNAL_API_SECRET || "";
const BASE_MEMBER_ROLE_ID = process.env.BASE_MEMBER_ROLE_ID || "";
const SITE_ICON_URL = process.env.SITE_ICON_URL || "/logo.png";

const BASE_STATES_FILE = path.join(BOT_DATA_DIR, "base_states.json");
const APPLICATIONS_FILE = path.join(BOT_DATA_DIR, "base_member_applications.json");
const APPLICATION_FORMS_FILE = path.join(BOT_DATA_DIR, "application_forms.json");

const BASE_STATUS_META = {
  open: { label: "Open", color: "#3fb950" },
  open_less: { label: "Open but less likely to be used", color: "#d29922" },
  closed: { label: "Closed", color: "#f85149" }
};

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "public")));

function readJson(file, fallback) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function esc(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(v) {
  return Number(Number(v || 0).toFixed(2));
}

function isSameUtcDay(isoA, isoB = new Date().toISOString()) {
  if (!isoA) {
    return false;
  }
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isGiveawayActive(g) {
  if (!g || g.ended === true) {
    return false;
  }
  if (g.endsAt) {
    const endTs = new Date(g.endsAt).getTime();
    if (Number.isFinite(endTs) && Date.now() >= endTs) {
      return false;
    }
  }
  return true;
}

function orderGross(o) {
  if (Number.isFinite(Number(o.grossTotal))) {
    return Number(o.grossTotal);
  }
  if (Number.isFinite(Number(o.subtotal)) && Number.isFinite(Number(o.taxFees))) {
    return Number(o.subtotal) + Number(o.taxFees);
  }
  return Number(o.total || 0);
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const out = {};
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = value;
  }
  return out;
}

function isStaffAuthed(req) {
  const cookies = parseCookies(req);
  return cookies.staff_auth === "1";
}

function getStaffSession(req) {
  const cookies = parseCookies(req);
  return {
    user: cookies.staff_user || "Staff",
    since: cookies.staff_since || ""
  };
}

function requireStaff(req, res, next) {
  if (!isStaffAuthed(req)) {
    res.redirect("/staff");
    return;
  }
  next();
}

function defaultBases() {
  const bases = [];
  for (let i = 1; i <= 6; i += 1) {
    bases.push({ id: `looooootybase_${i}`, name: `LooooootyBase ${i}`, state: "open" });
  }
  return bases;
}

function normalizeBaseState(state) {
  if (state === "open" || state === "open_less" || state === "closed") {
    return state;
  }
  return "open";
}

function normalizeBaseEntry(entry, idx) {
  const safeName = String(entry && entry.name ? entry.name : `LooooootyBase ${idx + 1}`).trim().slice(0, 60);
  const baseId = String(entry && entry.id ? entry.id : `base_${idx + 1}`).trim().toLowerCase();
  return {
    id: baseId.replace(/[^a-z0-9_\-]/g, "") || `base_${idx + 1}`,
    name: safeName || `LooooootyBase ${idx + 1}`,
    state: normalizeBaseState(entry && entry.state)
  };
}

function loadBaseStates() {
  const data = readJson(BASE_STATES_FILE, null);
  if (!Array.isArray(data) || data.length === 0) {
    const defaults = defaultBases();
    writeJson(BASE_STATES_FILE, defaults);
    return defaults;
  }
  const normalized = data.map((b, i) => normalizeBaseEntry(b, i));
  writeJson(BASE_STATES_FILE, normalized);
  return normalized;
}

function saveBaseStates(bases) {
  writeJson(BASE_STATES_FILE, bases.map((b, i) => normalizeBaseEntry(b, i)));
}

function makeBaseId(name, bases) {
  const base = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  const root = base || "base";
  let id = root;
  let n = 2;
  const set = new Set((bases || []).map((b) => String(b.id)));
  while (set.has(id)) {
    id = `${root}_${n}`;
    n += 1;
  }
  return id;
}

function loadApplications() {
  const data = readJson(APPLICATIONS_FILE, null);
  if (!Array.isArray(data)) {
    writeJson(APPLICATIONS_FILE, []);
    return [];
  }
  return data;
}

function saveApplications(applications) {
  writeJson(APPLICATIONS_FILE, applications);
}

function createApplicationId() {
  return `APP-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function normalizeApplicationForm(form, idx) {
  const name = String(form && form.name ? form.name : `Application ${idx + 1}`).trim().slice(0, 80);
  const roleId = String(form && form.roleId ? form.roleId : "").trim();
  const guildId = String(form && form.guildId ? form.guildId : GUILD_ID || "").trim();
  const id = String(form && form.id ? form.id : `form-${idx + 1}`).trim();
  const list = Array.isArray(form && form.questions)
    ? form.questions
    : form && form.question
      ? [form.question]
      : [];
  const questions = list
    .map((q) => String(q || "").trim().slice(0, 160))
    .filter(Boolean);
  return {
    id: id || `form-${idx + 1}`,
    name: name || `Application ${idx + 1}`,
    guildId,
    roleId,
    questions,
    active: form && form.active === false ? false : true,
    createdAt: form && form.createdAt ? form.createdAt : new Date().toISOString()
  };
}

function defaultApplicationForms() {
  const fallbackGuildId = String(GUILD_ID || "1374475620846928062").trim();
  return [
    {
      id: "base-member",
      name: "Base Member",
      guildId: fallbackGuildId,
      roleId: String(BASE_MEMBER_ROLE_ID || "1375496244163641414").trim(),
      questions: [
        "When have you joined 2b2t for the first time?",
        "Have you leaked or griefed any base in the past?",
        "Do you own priority queue",
        "Were you part of any base that got griefed in the past?",
        "Is it okay for you to travel long distances on 2b2t?",
        "Why do you want to become a Base member",
        "Have you accidentally stumbled upon a major base in the past",
        "Add anything you want below"
      ],
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "vip",
      name: "VIP",
      guildId: fallbackGuildId,
      roleId: "1374476630873084075",
      questions: [
        "Have you been a Base member for more than 2 months already",
        "Did you ever get warned by Looooooty about something you did wrong at the base?",
        "Have you followed the rules of the group and never broke them?",
        "Add anything you will think that will increase your chances of becoming a VIP."
      ],
      active: true,
      createdAt: new Date().toISOString()
    }
  ];
}

function loadApplicationForms() {
  const raw = readJson(APPLICATION_FORMS_FILE, null);
  if (!Array.isArray(raw) || raw.length === 0) {
    const defaults = defaultApplicationForms();
    writeJson(APPLICATION_FORMS_FILE, defaults);
    return defaults;
  }
  const normalized = raw.map((f, i) => normalizeApplicationForm(f, i));
  writeJson(APPLICATION_FORMS_FILE, normalized);
  return normalized;
}

function saveApplicationForms(forms) {
  writeJson(APPLICATION_FORMS_FILE, forms.map((f, i) => normalizeApplicationForm(f, i)));
}

function findApplicationForm(forms, formId) {
  return (forms || []).find((f) => String(f.id) === String(formId || "")) || null;
}

function makeApplicationFormId(name, forms) {
  const root = String(name || "form")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "form";
  let id = root;
  let n = 2;
  const used = new Set((forms || []).map((f) => String(f.id)));
  while (used.has(id)) {
    id = `${root}-${n}`;
    n += 1;
  }
  return id;
}

function toStringArray(value, maxLen) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return arr
    .map((v) => String(v || "").trim().slice(0, maxLen))
    .filter(Boolean);
}

function isSnowflake(value) {
  return /^\d{17,20}$/.test(String(value || "").trim());
}

function stats() {
  const allOrders = readJson(path.join(BOT_DATA_DIR, "orders.json"), []);
  const products = readJson(path.join(BOT_DATA_DIR, "products.json"), []);
  const coupons = readJson(path.join(BOT_DATA_DIR, "coupons.json"), {});
  const allGiveaways = readJson(path.join(BOT_DATA_DIR, "giveaways.json"), {});
  const carts = readJson(path.join(BOT_DATA_DIR, "carts.json"), {});
  const cartPanels = readJson(path.join(BOT_DATA_DIR, "cart_panels.json"), {});
  const shopStateObj = readJson(path.join(BOT_DATA_DIR, "shop_state.json"), { state: "open" });

  const orders = GUILD_ID ? allOrders.filter((o) => o.guildId === GUILD_ID) : allOrders;
  const giveaways = Object.values(allGiveaways).filter((g) => {
    if (!GUILD_ID) {
      return true;
    }
    return g.guildId === GUILD_ID;
  });

  const paid = orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED");
  const refunded = orders.filter((o) => o.status === "REFUNDED");
  const pending = orders.filter((o) => o.status === "PENDING");
  const grossSales = money(paid.reduce((sum, o) => sum + orderGross(o), 0));
  const collectedNow = money(paid.reduce((sum, o) => sum + Number(o.total || 0), 0));
  const creditUsed = money(paid.reduce((sum, o) => sum + Number(o.creditUsed || 0), 0));
  const deliveredToday = orders.filter((o) => o.deliveryInfo && isSameUtcDay(o.deliveryInfo.deliveredAt)).length;
  const refundsToday = orders.filter((o) => isSameUtcDay(o.refundedAt)).length;
  const openCarts = Object.entries(carts).filter(([userId, cart]) => {
    const hasItems = Object.values(cart || {}).some((qty) => Number(qty) > 0);
    return hasItems && Boolean(cartPanels[userId]);
  }).length;

  return {
    ordersTotal: orders.length,
    ordersPaid: paid.length,
    ordersPending: pending.length,
    ordersRefunded: refunded.length,
    grossSales,
    collectedNow,
    creditUsed,
    deliveredToday,
    refundsToday,
    openCarts,
    productsTotal: products.length,
    couponsTotal: Object.keys(coupons).length,
    giveawaysActive: giveaways.filter((g) => isGiveawayActive(g)).length,
    shopState: String(shopStateObj.state || "open").toUpperCase(),
    scope: GUILD_ID ? `Guild ${GUILD_ID}` : "All data"
  };
}

function sideMenuHtml() {
  return `<div class="menu-shell">
    <div class="brand">LooooootyBases</div>
    <nav class="menu">
      <a href="/bases">State of bases</a>
      <a href="/apply">Apply</a>
      <a href="${DISCORD_INVITE_URL}" target="_blank" rel="noreferrer">Discord</a>
      <a href="${SHOP_INVITE_URL}" target="_blank" rel="noreferrer">LooooootyShop</a>
      <a href="/staff">Staff</a>
    </nav>
  </div>`;
}

function baseStateListHtml(bases) {
  return bases
    .map((b) => {
      const meta = BASE_STATUS_META[b.state] || BASE_STATUS_META.open;
      return `<div class="base-row"><span class="base-name">${esc(b.name)}</span><span class="badge" style="background:${meta.color}">${meta.label}</span></div>`;
    })
    .join("");
}

function baseStateEditorHtml(bases) {
  return bases
    .map((b) => {
      return `<div class="edit-row"><label>${esc(b.name)}</label><select name="state_${esc(b.id)}">
        <option value="open"${b.state === "open" ? " selected" : ""}>Open</option>
        <option value="open_less"${b.state === "open_less" ? " selected" : ""}>Open but less likely to be used</option>
        <option value="closed"${b.state === "closed" ? " selected" : ""}>Closed</option>
      </select></div>`;
    })
    .join("");
}

function sharedHomeStyles() {
  return `<style>
    :root { --txt:#f3f6fc; --muted:#a5afbf; --accent:#24c4ff; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--txt);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
      background:
        linear-gradient(120deg, rgba(5,10,20,0.52), rgba(5,10,20,0.30)),
        url('${HOME_BG_URL}') center/cover no-repeat fixed;
      min-height: 100vh;
    }
    .layout { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .side { padding: 24px 16px; display: flex; align-items: stretch; }
    .menu-shell {
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(8,12,18,0.58);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 14px;
      width: 100%;
      max-width: 220px;
      min-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
    }
    .brand { font-size: 18px; font-weight: 700; margin-bottom: 12px; font-style: italic; }
    .menu { display: grid; gap: 10px; }
    .menu a {
      color: var(--txt);
      text-decoration: none;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(15,20,30,0.5);
      border-radius: 10px;
      padding: 10px 12px;
      font-weight: 600;
    }
    .menu a:hover { border-color: var(--accent); }
    .main { display: grid; place-items: start center; padding: 24px 28px; }
    .hero, .btn-box, .state-box {
      width: min(900px, 96%);
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(9,13,20,0.62);
      backdrop-filter: blur(10px);
      border-radius: 18px;
      padding: 20px;
      text-align: center;
    }
    .btn-box { margin-top: 26px; }
    h1 { margin: 0 0 8px 0; font-size: clamp(34px, 6vw, 62px); }
    .title-italic { font-style: italic; }
    .sub { margin: 0 0 8px 0; color: var(--muted); font-size: 16px; }
    .btns { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 12px; max-width: 720px; margin: 0 auto; }
    .btn {
      display: inline-block;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.14);
      color: var(--txt);
      text-decoration: none;
      font-weight: 700;
      padding: 14px 16px;
      background: linear-gradient(180deg, rgba(49,70,99,0.5), rgba(23,29,41,0.7));
    }
    .btn:hover { border-color: var(--accent); }
    .foot { margin-top: 18px; font-size: 12px; color: var(--muted); }
    .state-head { margin-bottom: 10px; color: var(--muted); font-weight: 700; }
    .base-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.08); }
    .base-row:first-of-type { border-top: 0; }
    .badge { color: #0d1117; font-weight: 800; font-size: 12px; padding: 5px 10px; border-radius: 999px; }
    .msg { margin: 0 0 12px 0; color: #7ee787; font-weight: 700; }
    .warn { margin: 0 0 12px 0; color: #ffb86b; font-weight: 700; }
    .form-grid { display:grid; gap:10px; text-align:left; }
    .form-grid input, .form-grid textarea, .form-grid select {
      width:100%;
      padding:10px;
      border-radius:8px;
      border:1px solid rgba(255,255,255,0.18);
      background: rgba(9,13,20,0.62);
      color: var(--txt);
    }
    .form-grid textarea { min-height:110px; resize:vertical; }
    .submit { width:fit-content; border:1px solid #238636; background:#238636; color:white; border-radius:8px; padding:10px 12px; font-weight:700; cursor:pointer; }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .side { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .menu-shell { min-height: auto; max-width: 100%; }
      .btns { grid-template-columns: 1fr; }
    }
  </style>`;
}

function faviconLinks() {
  return `<link rel="icon" type="image/png" href="${SITE_ICON_URL}" />
  <link rel="shortcut icon" href="${SITE_ICON_URL}" />
  <link rel="apple-touch-icon" href="${SITE_ICON_URL}" />`;
}

function homeHtml() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LooooootyBases 2b2t</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <section class="hero">
        <h1><span class="title-italic">LooooootyBases</span> | 2b2t</h1>
        <p class="sub">Welcome to the official portal</p>
      </section>
      <section class="btn-box">
        <div class="btns">
          <a class="btn" href="${DISCORD_INVITE_URL}" target="_blank" rel="noreferrer">Discord</a>
          <a class="btn" href="${SHOP_INVITE_URL}" target="_blank" rel="noreferrer">Shop</a>
          <a class="btn" href="/apply">Apply</a>
          <a class="btn" href="/staff">Staff</a>
        </div>
        <div class="foot">Staff panel is code protected.</div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function basesPageHtml(bases) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>State of Bases</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <section class="hero" style="margin-bottom:12px; text-align:left;">
        <a class="btn" href="/">Back Home</a>
      </section>
      <section class="state-box" style="display:block;">
        <div class="state-head">State of bases</div>
        ${baseStateListHtml(bases)}
      </section>
    </main>
  </div>
</body>
</html>`;
}

function applyPageHtml(forms, msg = "", err = "") {
  const activeForms = (forms || []).filter((f) => f.active !== false);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Application</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <section class="state-box" style="text-align:left;">
        <h2 style="margin-top:0;">Application</h2>
        ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
        ${err ? `<div class="warn">${esc(err)}</div>` : ""}
        ${activeForms.length ? "" : '<div class="warn">No application types are available right now.</div>'}
        <form class="form-grid" method="post" action="/apply">
          <label>Application Type</label>
          <select name="form_id" required>
            ${activeForms
              .map((f) => `<option value="${esc(f.id)}">${esc(f.name)}${f.guildId ? ` (Guild ${esc(f.guildId)})` : ""}</option>`)
              .join("")}
          </select>
          <label>Discord User ID</label>
          <input type="text" name="discord_user_id" required maxlength="20" placeholder="123456789012345678" />
          <label>Discord Username (optional)</label>
          <input type="text" name="discord_tag" maxlength="64" placeholder="name or name#0001" />
          <label>Minecraft IGN (optional)</label>
          <input type="text" name="minecraft_ign" maxlength="32" placeholder="Your IGN" />
          <label>Why do you want this role? (optional)</label>
          <textarea name="reason" maxlength="1000" placeholder="Short reason"></textarea>
          <div id="custom-question-wrap"></div>
          <button class="submit" type="submit" ${activeForms.length ? "" : "disabled"}>Submit Application</button>
        </form>
        <script>
          (function () {
            const forms = ${JSON.stringify(activeForms.map((f) => ({ id: f.id, questions: Array.isArray(f.questions) ? f.questions : [] })))};
            const sel = document.querySelector('select[name=\"form_id\"]');
            const wrap = document.getElementById('custom-question-wrap');
            if (!sel || !wrap) return;
            function escHtml(v) {
              return String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            function render() {
              const selected = forms.find((f) => f.id === sel.value);
              const qs = selected && Array.isArray(selected.questions) ? selected.questions.map((q) => String(q || '').trim()).filter(Boolean) : [];
              if (!qs.length) {
                wrap.innerHTML = "";
                return;
              }
              wrap.innerHTML = qs.map((q, i) =>
                '<label>' + escHtml(q) + '</label>' +
                '<input type=\"text\" name=\"custom_answers\" maxlength=\"500\" placeholder=\"Answer #' + (i + 1) + '\" required />'
              ).join('');
            }
            sel.addEventListener('change', render);
            render();
          })();
        </script>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function staffLoginHtml(error = "") {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Staff Access</title>
  ${faviconLinks()}
  <style>
    body { margin:0; min-height:100vh; display:grid; place-items:center; background:#0d1117; color:#e6edf3; font-family: ui-sans-serif,system-ui; }
    .card { width:min(420px,92vw); background:#161b22; border:1px solid #30363d; border-radius:14px; padding:18px; }
    .err { color:#ff7b72; margin:8px 0; min-height:20px; }
    input { width:100%; padding:11px; border-radius:10px; border:1px solid #30363d; background:#0d1117; color:#e6edf3; margin-top:8px; }
    button { width:100%; margin-top:10px; padding:11px; border:1px solid #238636; background:#238636; color:white; border-radius:10px; font-weight:700; }
    a { color:#8b949e; }
  </style>
</head>
<body>
  <form class="card" method="post" action="/staff/login">
    <h2 style="margin-top:0">Staff Access</h2>
    <p>Enter your name and staff code to open the panel.</p>
    <div class="err">${esc(error)}</div>
    <input name="user" placeholder="Staff name" required maxlength="32" />
    <input name="code" placeholder="Staff code" required />
    <button type="submit">Open Staff Panel</button>
    <p style="margin:10px 0 0 0"><a href="/">Back Home</a></p>
  </form>
</body>
</html>`;
}

function staffPanelStyles() {
  return `<style>
    :root { --txt:#f3f6fc; --muted:#a5afbf; --accent:#24c4ff; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--txt);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
      background:
        linear-gradient(120deg, rgba(5,10,20,0.72), rgba(5,10,20,0.56)),
        url('${HOME_BG_URL}') center/cover no-repeat fixed;
      min-height: 100vh;
    }
    .layout { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .side { padding: 24px 16px; display: flex; align-items: stretch; }
    .menu-shell {
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(8,12,18,0.58);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 14px;
      width: 100%;
      max-width: 220px;
      min-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
    }
    .brand { font-size: 18px; font-weight: 700; margin-bottom: 12px; font-style: italic; }
    .menu { display: grid; gap: 10px; }
    .menu a {
      color: var(--txt);
      text-decoration: none;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(15,20,30,0.5);
      border-radius: 10px;
      padding: 10px 12px;
      font-weight: 600;
    }
    .menu a:hover { border-color: var(--accent); }
    .main { padding: 24px 28px; }
    .staff-shell { max-width: 1200px; margin: 0 auto; }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 16px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(9,13,20,0.62);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 16px;
    }
    .head-left h1 { margin: 0; }
    .staff-meta { margin-top: 8px; color: var(--muted); font-size: 13px; display: grid; gap: 4px; }
    .head-right { display: grid; justify-items: end; gap: 8px; }
    .action-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .btn {
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(15,20,30,0.5);
      color: var(--txt);
      border-radius: 10px;
      padding: 8px 10px;
      text-decoration: none;
      font-weight: 700;
      cursor: pointer;
    }
    .btn:hover { border-color: var(--accent); }
    .pill { border: 1px solid rgba(255,255,255,0.18); border-radius: 999px; padding: 6px 10px; color: var(--txt); font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 12px; }
    .card {
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(9,13,20,0.62);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 14px;
    }
    .k { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
    .v { font-size: 28px; font-weight: 700; }
    .base-panel { margin-top: 0; }
    .edit-row { display: grid; grid-template-columns: 1fr 340px; gap: 10px; align-items: center; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.08); }
    .edit-row:first-child { border-top: 0; }
    select, input[type=text], textarea { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.18); background: rgba(9,13,20,0.62); color: var(--txt); }
    textarea { min-height: 90px; resize: vertical; }
    .save-btn { margin-top: 10px; background: #238636; border: 1px solid #238636; color: white; border-radius: 8px; padding: 10px 12px; font-weight: 700; cursor: pointer; }
    .danger-btn { background: #a9343a; border: 1px solid #a9343a; color: white; border-radius: 8px; padding: 8px 10px; font-weight: 700; cursor: pointer; }
    .note { margin-top: 8px; color: var(--muted); font-size: 12px; }
    .msg { margin: 0 0 12px 0; color: #7ee787; font-weight: 700; }
    .warn { margin: 0 0 12px 0; color: #ffb86b; font-weight: 700; }
    .foot { margin-top: 16px; color: var(--muted); font-size: 12px; }
    .app-list { display: grid; gap: 10px; margin-top: 14px; }
    .app-row { border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:12px; background: rgba(0,0,0,0.12); }
    .app-head { display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .app-meta { color: var(--muted); font-size: 12px; margin-top: 8px; line-height: 1.5; }
    .app-actions { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
    .question-row { display:grid; gap:6px; margin-bottom:8px; }
    .question-remove-wrap { display:none; }
    .tag { padding:3px 8px; border-radius:999px; font-size:12px; font-weight:700; }
    .pending { background:#d29922; color:#111; }
    .approved { background:#3fb950; color:#111; }
    .rejected { background:#f85149; color:#111; }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .side { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .menu-shell { min-height: auto; max-width: 100%; }
      .head { flex-direction: column; }
      .head-right { justify-items: start; }
      .action-row { justify-content: flex-start; }
      .edit-row { grid-template-columns: 1fr; }
    }
  </style>`;
}

function staffHeaderHtml(staff, s, activeTab) {
  const sinceLabel = staff.since
    ? new Date(staff.since).toLocaleString("en-US", { hour12: false })
    : "Unknown";
  const shopBtnLabel = activeTab === "shop" ? "Shop (Active)" : "Shop";
  const basesBtnLabel = activeTab === "bases" ? "Bases (Active)" : "Bases";
  const appsBtnLabel = activeTab === "applications" ? "Applications (Active)" : "Applications";
  return `<div class="head">
    <div class="head-left">
      <h1>Looooooty Staff Panel</h1>
      <div class="staff-meta">
        <div>Logged in as: <b>${esc(staff.user)}</b></div>
        <div>Logged in since: <b>${esc(sinceLabel)}</b></div>
        <div>Current access password: <b>${esc(STAFF_CODE)}</b></div>
        <div>Scope: <b>${esc(s.scope)}</b></div>
      </div>
    </div>
    <div class="head-right">
      <div class="action-row">
        <a class="btn" href="/panel/shop">${shopBtnLabel}</a>
        <a class="btn" href="/panel/bases">${basesBtnLabel}</a>
        <a class="btn" href="/panel/applications">${appsBtnLabel}</a>
        <a class="btn" href="/">Back Home</a>
        <form method="post" action="/staff/logout" style="margin:0"><button class="btn" type="submit">Logout</button></form>
      </div>
      <div class="pill">Staff session active</div>
    </div>
  </div>`;
}

function shopStatsHtml(s) {
  return `<div class="grid">
    <div class="card"><div class="k">Shop State</div><div class="v">${s.shopState}</div></div>
    <div class="card"><div class="k">Orders Total</div><div class="v">${s.ordersTotal}</div></div>
    <div class="card"><div class="k">Paid + Delivered (All-Time)</div><div class="v">${s.ordersPaid}</div></div>
    <div class="card"><div class="k">Pending</div><div class="v">${s.ordersPending}</div></div>
    <div class="card"><div class="k">Refunded</div><div class="v">${s.ordersRefunded}</div></div>
    <div class="card"><div class="k">Gross Sales</div><div class="v">$${s.grossSales.toFixed(2)}</div></div>
    <div class="card"><div class="k">Collected (Cash)</div><div class="v">$${s.collectedNow.toFixed(2)}</div></div>
    <div class="card"><div class="k">Credit Used</div><div class="v">$${s.creditUsed.toFixed(2)}</div></div>
    <div class="card"><div class="k">Open Carts</div><div class="v">${s.openCarts}</div></div>
    <div class="card"><div class="k">Delivered Today</div><div class="v">${s.deliveredToday}</div></div>
    <div class="card"><div class="k">Refunds Today</div><div class="v">${s.refundsToday}</div></div>
    <div class="card"><div class="k">Products</div><div class="v">${s.productsTotal}</div></div>
    <div class="card"><div class="k">Coupons</div><div class="v">${s.couponsTotal}</div></div>
    <div class="card"><div class="k">Active Giveaways</div><div class="v">${s.giveawaysActive}</div></div>
  </div>`;
}

function basesEditorPanelHtml(bases) {
  return `<div class="card base-panel">
    <h3 style="margin-top:0">State of Bases</h3>
    <form method="post" action="/staff/bases/update">
      ${baseStateEditorHtml(bases)}
      <button class="save-btn" type="submit">Save Base States</button>
    </form>
    <div class="note">Open = green, Open but less likely to be used = yellow, Closed = red.</div>
    <form method="post" action="/staff/bases/create" style="margin-top:12px; display:grid; grid-template-columns: 1fr auto; gap:10px;">
      <input type="text" name="base_name" placeholder="New base name" required maxlength="60" />
      <button class="save-btn" type="submit">Create Base</button>
    </form>
  </div>`;
}

function applicationsPanelHtml(applications, forms) {
  const pending = applications.filter((a) => a.status === "PENDING");
  const recent = applications
    .filter((a) => a.status !== "PENDING")
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, 20);

  const row = (a) => {
    const statusClass = a.status === "APPROVED" ? "approved" : a.status === "REJECTED" ? "rejected" : "pending";
    const canApprove = a.status === "PENDING";
    const questions = Array.isArray(a.customQuestions)
      ? a.customQuestions
      : a.customQuestion
        ? [a.customQuestion]
        : [];
    const answers = Array.isArray(a.customAnswers)
      ? a.customAnswers
      : a.customAnswer
        ? [a.customAnswer]
        : [];
    const qaBlock = questions.length
      ? questions
          .map((q, i) => `Q${i + 1}: <b>${esc(q)}</b><br/>A${i + 1}: <b>${esc(answers[i] || "-")}</b><br/>`)
          .join("")
      : "";
    return `<div class="app-row">
      <div class="app-head">
        <div><b>${esc(a.id)}</b> - <span class="tag ${statusClass}">${esc(a.status)}</span></div>
        <div>${esc(a.createdAt || "")}</div>
      </div>
      <div class="app-meta">
        Application: <b>${esc(a.formName || "-")}</b><br/>
        Guild To Target: <b>${esc(a.targetGuildId || a.guildId || GUILD_ID || "-")}</b><br/>
        Role To Grant: <b>${esc(a.targetRoleId || BASE_MEMBER_ROLE_ID || "-")}</b><br/>
        ${qaBlock}
        Discord User ID: <b>${esc(a.discordUserId)}</b><br/>
        Discord Username: <b>${esc(a.discordTag || "-")}</b><br/>
        IGN: <b>${esc(a.minecraftIgn || "-")}</b><br/>
        Reason: ${esc(a.reason || "-")}<br/>
        Source: ${esc(a.source || "web")}<br/>
        Reviewed By: ${esc(a.reviewedBy || "-")}
      </div>
      ${canApprove ? `<div class="app-actions">
        <form method="post" action="/staff/applications/${encodeURIComponent(a.id)}/approve" style="margin:0;">
          <button class="save-btn" type="submit">Approve + Give Selected Role</button>
        </form>
        <form method="post" action="/staff/applications/${encodeURIComponent(a.id)}/reject" style="margin:0;">
          <button class="danger-btn" type="submit">Reject</button>
        </form>
      </div>` : ""}
    </div>`;
  };

  return `<div class="card base-panel">
    <h3 style="margin-top:0">Applications</h3>
    <div class="note">You can create multiple application types, each with its own role.</div>

    <h4 style="margin-bottom:6px; margin-top:14px;">Application Types (${forms.length})</h4>
    <form method="post" action="/staff/application-forms/create" style="margin-top:12px; display:grid; gap:10px;">
      <input type="text" name="form_name" required maxlength="80" placeholder="Application name (example: Builder)" />
      <input type="text" name="guild_id" required maxlength="20" value="${esc(GUILD_ID || "")}" placeholder="Guild ID to grant in" />
      <input type="text" name="role_id" required maxlength="20" placeholder="Role ID to grant on approval" />
      <div class="question-list"></div>
      <button class="btn add-question-btn" type="button">Add Question</button>
      <button class="save-btn" type="submit">Create Application Type</button>
    </form>
    <div class="app-list">${forms.length ? forms.map((f) => `<div class="app-row"><div class="app-head"><div><b>${esc(f.name)}</b></div><div>${f.active === false ? "Inactive" : "Active"}</div></div><div class="app-meta">ID: <b>${esc(f.id)}</b><br/>Guild ID: <b>${esc(f.guildId || GUILD_ID || "-")}</b><br/>Role ID: <b>${esc(f.roleId || "-")}</b><br/>Questions: <b>${Array.isArray(f.questions) && f.questions.length ? f.questions.map((q) => esc(q)).join(" | ") : "-"}</b></div><div class="app-actions"><form method="post" action="/staff/application-forms/${encodeURIComponent(f.id)}/toggle" style="margin:0;"><button class="save-btn" type="submit">${f.active === false ? "Set Active" : "Set Inactive"}</button></form><form method="post" action="/staff/application-forms/${encodeURIComponent(f.id)}/delete" style="margin:0;" onsubmit="return confirm('Delete this application type?');"><button class="danger-btn" type="submit">Delete</button></form></div><form method="post" action="/staff/application-forms/${encodeURIComponent(f.id)}/update" style="margin-top:10px; display:grid; gap:10px;"><input type="text" name="form_name" required maxlength="80" value="${esc(f.name)}" /><input type="text" name="guild_id" required maxlength="20" value="${esc(f.guildId || GUILD_ID || "")}" /><input type="text" name="role_id" required maxlength="20" value="${esc(f.roleId || "")}" /><div class="question-list">${(Array.isArray(f.questions) && f.questions.length ? f.questions : [""]).map((q) => `<div class="question-row"><input type="text" name="questions" maxlength="160" value="${esc(q)}" placeholder="Custom question" /><div class="question-remove-wrap"><button class="danger-btn remove-question-btn" type="button">Remove Question</button></div></div>`).join("")}</div><button class="btn add-question-btn" type="button">Add Question</button><button class="save-btn" type="submit">Save Changes</button></form></div>`).join("") : '<div class="note">No application types yet.</div>'}</div>

    <h4 style="margin-bottom:6px; margin-top:18px;">Create Staff Application</h4>
    <form method="post" action="/staff/applications/create" style="margin-top:12px; display:grid; gap:10px;">
      <select name="form_id" required>
        ${forms.filter((f) => f.active !== false).map((f) => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}
      </select>
      <input type="text" name="discord_user_id" required maxlength="20" placeholder="Discord User ID" />
      <input type="text" name="discord_tag" maxlength="64" placeholder="Discord Username (optional)" />
      <input type="text" name="minecraft_ign" maxlength="32" placeholder="Minecraft IGN (optional)" />
      <textarea name="reason" maxlength="1000" placeholder="Reason / notes (optional)"></textarea>
      <button class="save-btn" type="submit">Create Application</button>
    </form>

    <h4 style="margin-bottom:6px; margin-top:18px;">Pending (${pending.length})</h4>
    <div class="app-list">${pending.length ? pending.map(row).join("") : '<div class="note">No pending applications.</div>'}</div>

    <h4 style="margin-bottom:6px; margin-top:18px;">Recent Reviewed</h4>
    <div class="app-list">${recent.length ? recent.map(row).join("") : '<div class="note">No reviewed applications yet.</div>'}</div>
    <script>
      (function () {
        function addQuestionInput(btn) {
          const form = btn.closest('form');
          if (!form) return;
          const list = form.querySelector('.question-list');
          if (!list) return;
          const row = document.createElement('div');
          row.className = 'question-row';
          row.innerHTML = '<input type=\"text\" name=\"questions\" maxlength=\"160\" placeholder=\"Custom question\" />' +
            '<div class=\"question-remove-wrap\"><button class=\"danger-btn remove-question-btn\" type=\"button\">Remove Question</button></div>';
          list.appendChild(row);
          const input = row.querySelector('input[name=\"questions\"]');
          if (input) input.focus();
        }
        function hideAllRemoveButtons(form) {
          form.querySelectorAll('.question-remove-wrap').forEach((el) => { el.style.display = 'none'; });
        }
        function ensureCreateFormSeed(form) {
          if (!form.action || !/\\/staff\\/application-forms\\/create$/.test(form.action)) return;
          const list = form.querySelector('.question-list');
          if (!list) return;
          if (list.querySelector('.question-row')) return;
          addQuestionInput(form.querySelector('.add-question-btn'));
        }
        document.querySelectorAll('form[action*=\"/staff/application-forms/\"]').forEach((form) => {
          ensureCreateFormSeed(form);
          form.addEventListener('focusin', function (e) {
            const input = e.target && e.target.matches('input[name=\"questions\"]') ? e.target : null;
            if (!input) return;
            hideAllRemoveButtons(form);
            const row = input.closest('.question-row');
            if (!row) return;
            const wrap = row.querySelector('.question-remove-wrap');
            if (wrap) wrap.style.display = 'block';
          });
          form.addEventListener('click', function (e) {
            const btn = e.target && e.target.closest('.remove-question-btn');
            if (!btn) return;
            const row = btn.closest('.question-row');
            const list = row ? row.closest('.question-list') : null;
            if (!row || !list) return;
            row.remove();
            if (!list.querySelector('.question-row')) {
              addQuestionInput(form.querySelector('.add-question-btn'));
            }
          });
        });
        document.querySelectorAll('.add-question-btn').forEach((btn) => {
          btn.addEventListener('click', function () { addQuestionInput(btn); });
        });
      })();
    </script>
  </div>`;
}

function staffPageHtml({ s, bases, applications, forms, msg = "", warn = "", staff, activeTab }) {
  let tabContent = shopStatsHtml(s);
  if (activeTab === "bases") {
    tabContent = basesEditorPanelHtml(bases);
  } else if (activeTab === "applications") {
    tabContent = applicationsPanelHtml(applications, forms);
  }
  const title = activeTab === "bases" ? "Staff Bases" : activeTab === "applications" ? "Staff Applications" : "Staff Shop";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  ${faviconLinks()}
  ${staffPanelStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <div class="staff-shell">
        ${staffHeaderHtml(staff, s, activeTab)}
        ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
        ${warn ? `<div class="warn">${esc(warn)}</div>` : ""}
        ${tabContent}
        <div class="foot">Data source: ${esc(BOT_DATA_DIR)}</div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

async function approveInBot(application) {
  if (!BOT_APPROVE_URL || !BOT_INTERNAL_API_SECRET) {
    return { ok: false, error: "Missing BOT_APPROVE_URL or BOT_INTERNAL_API_SECRET in web .env." };
  }

  const targetGuildId = String(application.targetGuildId || application.guildId || GUILD_ID || "").trim();
  if (!targetGuildId) {
    return { ok: false, error: "Missing target guild for this application/form." };
  }

  const payload = {
    guildId: targetGuildId,
    userId: application.discordUserId,
    roleId: application.targetRoleId || BASE_MEMBER_ROLE_ID || undefined,
    applicationId: application.id,
    formName: application.formName || ""
  };

  let response;
  try {
    response = await fetch(BOT_APPROVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": BOT_INTERNAL_API_SECRET
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return { ok: false, error: `Bot API connection failed: ${err.message}` };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok || !body || body.ok !== true) {
    return { ok: false, error: body && body.error ? body.error : `Bot API HTTP ${response.status}` };
  }

  return { ok: true, body };
}

async function notifyDecisionInBot({ application, status, note = "" }) {
  if (!BOT_NOTIFY_URL || !BOT_INTERNAL_API_SECRET) {
    return { ok: false, error: "Missing BOT_NOTIFY_URL or BOT_INTERNAL_API_SECRET in web .env." };
  }

  const payload = {
    userId: application.discordUserId,
    status: String(status || "").toUpperCase(),
    guildId: application.targetGuildId || application.guildId || GUILD_ID || "",
    roleId: application.targetRoleId || BASE_MEMBER_ROLE_ID || "",
    applicationId: application.id,
    formName: application.formName || "",
    note
  };

  let response;
  try {
    response = await fetch(BOT_NOTIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": BOT_INTERNAL_API_SECRET
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return { ok: false, error: `Bot notify connection failed: ${err.message}` };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || !body || body.ok !== true) {
    return { ok: false, error: body && body.error ? body.error : `Bot notify HTTP ${response.status}` };
  }
  return { ok: true };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/api/stats", requireStaff, (_req, res) => {
  res.json(stats());
});

app.get("/", (_req, res) => {
  res.send(homeHtml());
});

app.get("/bases", (_req, res) => {
  const bases = loadBaseStates();
  res.send(basesPageHtml(bases));
});

app.get("/apply", (req, res) => {
  const forms = loadApplicationForms().filter((f) => f.active !== false);
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  res.send(applyPageHtml(forms, msg, err));
});

app.post("/apply", (req, res) => {
  const formId = String(req.body.form_id || "").trim();
  const discordUserId = String(req.body.discord_user_id || "").trim();
  const discordTag = String(req.body.discord_tag || "").trim().slice(0, 64);
  const minecraftIgn = String(req.body.minecraft_ign || "").trim().slice(0, 32);
  const reason = String(req.body.reason || "").trim().slice(0, 1000);
  const customAnswers = toStringArray(req.body.custom_answers, 500);

  if (!isSnowflake(discordUserId)) {
    res.redirect("/apply?err=Invalid%20Discord%20User%20ID");
    return;
  }

  const forms = loadApplicationForms();
  const selectedForm = findApplicationForm(forms, formId);
  if (!selectedForm || selectedForm.active === false) {
    res.redirect("/apply?err=Invalid%20application%20type");
    return;
  }
  const selectedQuestions = Array.isArray(selectedForm.questions) ? selectedForm.questions : [];
  if (selectedQuestions.length > 0) {
    const invalid = selectedQuestions.some((_, idx) => !customAnswers[idx] || !String(customAnswers[idx]).trim());
    if (invalid) {
      res.redirect("/apply?err=Please%20answer%20all%20custom%20questions");
      return;
    }
  }

  if (customAnswers.length > selectedQuestions.length) {
    customAnswers.length = selectedQuestions.length;
  }
  while (customAnswers.length < selectedQuestions.length) {
    customAnswers.push("");
  }

  if (selectedQuestions.length > 0 && customAnswers.length === 0) {
    res.redirect("/apply?err=Please%20answer%20all%20custom%20questions");
    return;
  }

  const applications = loadApplications();
  applications.push({
    id: createApplicationId(),
    guildId: selectedForm.guildId || GUILD_ID || null,
    discordUserId,
    discordTag,
    minecraftIgn,
    reason,
    formId: selectedForm.id,
    formName: selectedForm.name,
    targetGuildId: selectedForm.guildId || GUILD_ID || "",
    targetRoleId: selectedForm.roleId || BASE_MEMBER_ROLE_ID || "",
    customQuestions: selectedQuestions,
    customAnswers,
    status: "PENDING",
    source: "web",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedBy: ""
  });
  saveApplications(applications);

  res.redirect("/apply?msg=Application%20submitted");
});

app.get("/staff", (req, res) => {
  if (isStaffAuthed(req)) {
    res.redirect("/panel/shop");
    return;
  }
  res.send(staffLoginHtml());
});

app.post("/staff/login", (req, res) => {
  const code = String(req.body.code || "").trim();
  const user = String(req.body.user || "Staff").trim().slice(0, 32) || "Staff";
  if (code !== STAFF_CODE) {
    res.status(401).send(staffLoginHtml("Invalid staff code."));
    return;
  }
  const now = new Date().toISOString();
  const cookies = [
    "staff_auth=1; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax",
    `staff_user=${encodeURIComponent(user)}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`,
    `staff_since=${encodeURIComponent(now)}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`
  ];
  res.setHeader("Set-Cookie", cookies);
  res.redirect("/panel/shop");
});

app.post("/staff/logout", (_req, res) => {
  res.setHeader("Set-Cookie", [
    "staff_auth=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
    "staff_user=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax",
    "staff_since=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax"
  ]);
  res.redirect("/staff");
});

app.post("/staff/bases/update", requireStaff, (req, res) => {
  const bases = loadBaseStates();
  const updated = bases.map((b) => {
    const next = req.body[`state_${b.id}`];
    return {
      ...b,
      state: normalizeBaseState(next)
    };
  });
  saveBaseStates(updated);
  res.redirect("/panel/bases?msg=Base%20states%20saved");
});

app.post("/staff/bases/create", requireStaff, (req, res) => {
  const bases = loadBaseStates();
  const rawName = String(req.body.base_name || "").trim().slice(0, 60);
  if (!rawName) {
    res.redirect("/panel/bases?warn=Base%20name%20is%20required");
    return;
  }
  const id = makeBaseId(rawName, bases);
  bases.push({ id, name: rawName, state: "open" });
  saveBaseStates(bases);
  res.redirect("/panel/bases?msg=Base%20created");
});

app.post("/staff/application-forms/create", requireStaff, (req, res) => {
  const formName = String(req.body.form_name || "").trim().slice(0, 80);
  const guildId = String(req.body.guild_id || "").trim();
  const roleId = String(req.body.role_id || "").trim();
  const questions = toStringArray(req.body.questions, 160);

  if (!formName) {
    res.redirect("/panel/applications?warn=Form%20name%20is%20required");
    return;
  }
  if (!isSnowflake(guildId)) {
    res.redirect("/panel/applications?warn=Invalid%20Guild%20ID");
    return;
  }
  if (!isSnowflake(roleId)) {
    res.redirect("/panel/applications?warn=Invalid%20Role%20ID");
    return;
  }

  const forms = loadApplicationForms();
  const id = makeApplicationFormId(formName, forms);
  forms.push({ id, name: formName, guildId, roleId, questions, active: true, createdAt: new Date().toISOString() });
  saveApplicationForms(forms);

  res.redirect("/panel/applications?msg=Application%20type%20created");
});

app.post("/staff/application-forms/:id/update", requireStaff, (req, res) => {
  const id = String(req.params.id || "");
  const formName = String(req.body.form_name || "").trim().slice(0, 80);
  const guildId = String(req.body.guild_id || "").trim();
  const roleId = String(req.body.role_id || "").trim();
  const questions = toStringArray(req.body.questions, 160);

  if (!formName) {
    res.redirect("/panel/applications?warn=Form%20name%20is%20required");
    return;
  }
  if (!isSnowflake(guildId)) {
    res.redirect("/panel/applications?warn=Invalid%20Guild%20ID");
    return;
  }
  if (!isSnowflake(roleId)) {
    res.redirect("/panel/applications?warn=Invalid%20Role%20ID");
    return;
  }

  const forms = loadApplicationForms();
  const idx = forms.findIndex((f) => String(f.id) === id);
  if (idx === -1) {
    res.redirect("/panel/applications?warn=Application%20type%20not%20found");
    return;
  }

  forms[idx] = {
    ...forms[idx],
    name: formName,
    guildId,
    roleId,
    questions
  };
  saveApplicationForms(forms);
  res.redirect("/panel/applications?msg=Application%20type%20updated");
});

app.post("/staff/application-forms/:id/toggle", requireStaff, (req, res) => {
  const id = String(req.params.id || "");
  const forms = loadApplicationForms();
  const idx = forms.findIndex((f) => String(f.id) === id);
  if (idx === -1) {
    res.redirect("/panel/applications?warn=Application%20type%20not%20found");
    return;
  }

  forms[idx] = {
    ...forms[idx],
    active: forms[idx].active === false
  };
  saveApplicationForms(forms);
  res.redirect("/panel/applications?msg=Application%20type%20status%20updated");
});

app.post("/staff/application-forms/:id/delete", requireStaff, (req, res) => {
  const id = String(req.params.id || "");
  const forms = loadApplicationForms();
  const idx = forms.findIndex((f) => String(f.id) === id);
  if (idx === -1) {
    res.redirect("/panel/applications?warn=Application%20type%20not%20found");
    return;
  }

  forms.splice(idx, 1);
  saveApplicationForms(forms);
  res.redirect("/panel/applications?msg=Application%20type%20deleted");
});

app.post("/staff/applications/create", requireStaff, (req, res) => {
  const formId = String(req.body.form_id || "").trim();
  const discordUserId = String(req.body.discord_user_id || "").trim();
  const discordTag = String(req.body.discord_tag || "").trim().slice(0, 64);
  const minecraftIgn = String(req.body.minecraft_ign || "").trim().slice(0, 32);
  const reason = String(req.body.reason || "").trim().slice(0, 1000);

  if (!isSnowflake(discordUserId)) {
    res.redirect("/panel/applications?warn=Invalid%20Discord%20User%20ID");
    return;
  }

  const forms = loadApplicationForms();
  const selectedForm = findApplicationForm(forms, formId);
  if (!selectedForm) {
    res.redirect("/panel/applications?warn=Invalid%20application%20type");
    return;
  }

  const applications = loadApplications();
  applications.push({
    id: createApplicationId(),
    guildId: selectedForm.guildId || GUILD_ID || null,
    discordUserId,
    discordTag,
    minecraftIgn,
    reason,
    formId: selectedForm.id,
    formName: selectedForm.name,
    targetGuildId: selectedForm.guildId || GUILD_ID || "",
    targetRoleId: selectedForm.roleId || BASE_MEMBER_ROLE_ID || "",
    status: "PENDING",
    source: "staff",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedBy: ""
  });
  saveApplications(applications);

  res.redirect("/panel/applications?msg=Application%20created");
});

app.post("/staff/applications/:id/approve", requireStaff, async (req, res) => {
  const id = String(req.params.id || "");
  const applications = loadApplications();
  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    res.redirect("/panel/applications?warn=Application%20not%20found");
    return;
  }

  const appItem = applications[idx];
  if (appItem.status !== "PENDING") {
    res.redirect("/panel/applications?warn=Application%20already%20reviewed");
    return;
  }

  const forms = loadApplicationForms();
  const currentForm = findApplicationForm(forms, appItem.formId);
  if (currentForm) {
    if (currentForm.roleId) {
      appItem.targetRoleId = currentForm.roleId;
    }
    if (currentForm.guildId) {
      appItem.targetGuildId = currentForm.guildId;
      appItem.guildId = currentForm.guildId;
    }
    appItem.formName = currentForm.name;
  }

  const botResult = await approveInBot(appItem);
  if (!botResult.ok) {
    res.redirect(`/panel/applications?warn=${encodeURIComponent(`Role grant failed: ${botResult.error}`)}`);
    return;
  }

  const staff = getStaffSession(req);
  applications[idx] = {
    ...applications[idx],
    status: "APPROVED",
    reviewedBy: staff.user,
    updatedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    approvalResult: botResult.body
  };
  saveApplications(applications);

  res.redirect("/panel/applications?msg=Application%20approved%20and%20role%20granted");
});

app.post("/staff/applications/:id/reject", requireStaff, async (req, res) => {
  const id = String(req.params.id || "");
  const applications = loadApplications();
  const idx = applications.findIndex((a) => a.id === id);
  if (idx === -1) {
    res.redirect("/panel/applications?warn=Application%20not%20found");
    return;
  }

  if (applications[idx].status !== "PENDING") {
    res.redirect("/panel/applications?warn=Application%20already%20reviewed");
    return;
  }

  const staff = getStaffSession(req);
  applications[idx] = {
    ...applications[idx],
    status: "REJECTED",
    reviewedBy: staff.user,
    updatedAt: new Date().toISOString(),
    rejectedAt: new Date().toISOString()
  };
  saveApplications(applications);

  const notify = await notifyDecisionInBot({
    application: applications[idx],
    status: "REJECTED",
    note: "Contact staff if you need more details."
  });
  if (!notify.ok) {
    res.redirect(`/panel/applications?warn=${encodeURIComponent(`Application rejected but DM failed: ${notify.error}`)}`);
    return;
  }

  res.redirect("/panel/applications?msg=Application%20rejected%20and%20user%20notified");
});

app.get("/panel", requireStaff, (_req, res) => {
  res.redirect("/panel/shop");
});

app.get("/panel/shop", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications();
  const forms = loadApplicationForms();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(staffPageHtml({ s, bases, applications, forms, msg, warn, staff, activeTab: "shop" }));
});

app.get("/panel/bases", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications();
  const forms = loadApplicationForms();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(staffPageHtml({ s, bases, applications, forms, msg, warn, staff, activeTab: "bases" }));
});

app.get("/panel/applications", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const forms = loadApplicationForms();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(staffPageHtml({ s, bases, applications, forms, msg, warn, staff, activeTab: "applications" }));
});

app.listen(PORT, HOST, () => {
  console.log(`LooooootyWeb running on http://${HOST}:${PORT}`);
});
