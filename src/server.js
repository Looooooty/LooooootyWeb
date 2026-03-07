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
const WEBSITE_PAYPAL_URL = process.env.WEBSITE_PAYPAL_URL || "";
const BOT_DASHBOARD_REPO_URL = process.env.BOT_DASHBOARD_REPO_URL || "https://github.com/Looooooty/LooooootyBot";
const BOT_CLIENT_ID = process.env.BOT_CLIENT_ID || "";
const BOT_INVITE_URL = process.env.BOT_INVITE_URL || (BOT_CLIENT_ID
  ? `https://discord.com/oauth2/authorize?client_id=${BOT_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`
  : "https://discord.com/developers/applications");
const BOT_SHOP_PUBLIC = String(process.env.BOT_SHOP_PUBLIC || "false").toLowerCase() === "true";
const BOT_OWNER_KEY = process.env.BOT_OWNER_KEY || "";
const SHOP_LOGO_URL = process.env.SHOP_LOGO_URL || "/Looooooty.png";
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
const ABOUT_US_TEXT = process.env.ABOUT_US_TEXT || "About us content coming soon.";

const BASE_STATES_FILE = path.join(BOT_DATA_DIR, "base_states.json");
const APPLICATIONS_FILE = path.join(BOT_DATA_DIR, "base_member_applications.json");
const APPLICATION_FORMS_FILE = path.join(BOT_DATA_DIR, "application_forms.json");
const WEBSITE_SHOP_FILE = path.join(BOT_DATA_DIR, "website_shop.json");
const WEBSITE_SHOP_DEFAULTS_FILE = path.join(process.cwd(), "data", "website_shop_defaults.json");
const BASE_STATES_DEFAULTS_FILE = path.join(process.cwd(), "data", "base_states_defaults.json");
const CREDITS_FILE = path.join(BOT_DATA_DIR, "credits.json");
const GIVEAWAYS_FILE = path.join(BOT_DATA_DIR, "giveaways.json");

const BASE_STATUS_META = {
  open: { label: "Open", color: "#3fb950" },
  open_less: { label: "Open but less likely to be used", color: "#d29922" },
  closed: { label: "Closed", color: "#f85149" }
};

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "1mb" }));
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

function isGiveawayEnded(g) {
  if (!g) {
    return true;
  }
  if (g.ended === true) {
    return true;
  }
  if (g.endsAt) {
    const ts = new Date(g.endsAt).getTime();
    if (Number.isFinite(ts) && Date.now() >= ts) {
      return true;
    }
  }
  return false;
}

function loadCredits() {
  const data = readJson(CREDITS_FILE, {});
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    writeJson(CREDITS_FILE, {});
    return {};
  }
  return data;
}

function saveCredits(credits) {
  writeJson(CREDITS_FILE, credits && typeof credits === "object" ? credits : {});
}

function loadGiveaways() {
  const data = readJson(GIVEAWAYS_FILE, {});
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    writeJson(GIVEAWAYS_FILE, {});
    return {};
  }
  return data;
}

function saveGiveaways(giveaways) {
  writeJson(GIVEAWAYS_FILE, giveaways && typeof giveaways === "object" ? giveaways : {});
}

function giveawayEntriesCount(g) {
  return Array.isArray(g && g.participants) ? g.participants.length : 0;
}

function pickRandomWinners(participants, winnerCount) {
  const pool = [...participants];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, Math.max(0, Math.min(winnerCount, pool.length)));
}

function getGiveawaySession(req) {
  const cookies = parseCookies(req);
  const userId = String(cookies.giveaway_user_id || "").trim();
  const userTag = String(cookies.giveaway_user_tag || "").trim();
  if (!isSnowflake(userId)) {
    return { userId: "", userTag: "" };
  }
  return { userId, userTag };
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
  const defaults = loadBaseStateDefaults();
  const data = readJson(BASE_STATES_FILE, null);
  if (!Array.isArray(data) || data.length === 0) {
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

function loadBaseStateDefaults() {
  const raw = readJson(BASE_STATES_DEFAULTS_FILE, null);
  if (!Array.isArray(raw) || raw.length === 0) {
    const defaults = defaultBases();
    writeJson(BASE_STATES_DEFAULTS_FILE, defaults);
    return defaults;
  }
  const normalized = raw.map((b, i) => normalizeBaseEntry(b, i));
  writeJson(BASE_STATES_DEFAULTS_FILE, normalized);
  return normalized;
}

function saveBaseStateDefaults(bases) {
  writeJson(BASE_STATES_DEFAULTS_FILE, bases.map((b, i) => normalizeBaseEntry(b, i)));
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

function loadWebsiteShopData() {
  const defaults = loadWebsiteShopDefaults();
  const raw = readJson(WEBSITE_SHOP_FILE, null);
  const fallback = defaults;
  const state = raw && raw.state === "closed" ? "closed" : "open";
  const categories = Array.isArray(raw && raw.categories)
    ? raw.categories.map((c) => String(c || "").trim()).filter(Boolean)
    : fallback.categories;
  const products = Array.isArray(raw && raw.products)
    ? raw.products.map((p, i) => ({
        id: String(p && p.id ? p.id : `web-${Date.now()}-${i}`).trim(),
        name: String(p && p.name ? p.name : "Unnamed").trim().slice(0, 80),
        price: Number.isFinite(Number(p && p.price)) ? Number(p.price) : 0,
        category: String(p && p.category ? p.category : "kits").trim().slice(0, 40),
        image: String(p && p.image ? p.image : "").trim(),
        description: String(p && p.description ? p.description : "").trim().slice(0, 400),
        inStock: p && p.inStock === false ? false : true
      }))
    : [];
  const data = { state, categories, products };
  writeJson(WEBSITE_SHOP_FILE, data);
  return data;
}

function saveWebsiteShopData(data) {
  writeJson(WEBSITE_SHOP_FILE, {
    state: data && data.state === "closed" ? "closed" : "open",
    categories: Array.isArray(data && data.categories)
      ? data.categories.map((c) => String(c || "").trim()).filter(Boolean)
      : [],
    products: Array.isArray(data && data.products) ? data.products : []
  });
}

function loadWebsiteShopDefaults() {
  const raw = readJson(WEBSITE_SHOP_DEFAULTS_FILE, null);
  const fallback = {
    state: "open",
    categories: ["kits", "materials"],
    products: []
  };
  if (!raw || typeof raw !== "object") {
    writeJson(WEBSITE_SHOP_DEFAULTS_FILE, fallback);
    return fallback;
  }
  const state = raw.state === "closed" ? "closed" : "open";
  const categories = Array.isArray(raw.categories)
    ? raw.categories.map((c) => String(c || "").trim()).filter(Boolean)
    : fallback.categories;
  const products = Array.isArray(raw.products)
    ? raw.products.map((p) => ({
        id: String(p && p.id ? p.id : "").trim(),
        name: String(p && p.name ? p.name : "Unnamed").trim().slice(0, 80),
        price: Number.isFinite(Number(p && p.price)) ? Number(p.price) : 0,
        category: String(p && p.category ? p.category : "kits").trim().slice(0, 40),
        image: String(p && p.image ? p.image : "").trim(),
        description: String(p && p.description ? p.description : "").trim().slice(0, 400),
        inStock: p && p.inStock === false ? false : true
      }))
    : [];
  const data = { state, categories, products };
  writeJson(WEBSITE_SHOP_DEFAULTS_FILE, data);
  return data;
}

function saveWebsiteShopDefaults(data) {
  writeJson(WEBSITE_SHOP_DEFAULTS_FILE, {
    state: data && data.state === "closed" ? "closed" : "open",
    categories: Array.isArray(data && data.categories)
      ? data.categories.map((c) => String(c || "").trim()).filter(Boolean)
      : [],
    products: Array.isArray(data && data.products) ? data.products : []
  });
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
      <a href="/giveaways">Giveaways</a>
      <a href="/about">About Us</a>
      <a href="/apply">Apply</a>
      <a href="${DISCORD_INVITE_URL}" target="_blank" rel="noreferrer">Discord</a>
      <a href="/shop">LooooootyShop</a>
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
          <a class="btn" href="/shop">Shop</a>
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

function aboutPageHtml() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>About Us</title>
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
      <section class="state-box" style="display:block; text-align:left;">
        <div class="state-head">About Us</div>
        <div style="white-space:pre-wrap; line-height:1.6;">${esc(ABOUT_US_TEXT)}</div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function giveawaysPageHtml({ giveaways, msg = "", err = "", session }) {
  const userId = String(session && session.userId ? session.userId : "");
  const userTag = String(session && session.userTag ? session.userTag : "");
  const list = Array.isArray(giveaways) ? giveaways : [];
  const sorted = list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const cards = sorted
    .map((g) => {
      const ended = isGiveawayEnded(g);
      const entries = giveawayEntriesCount(g);
      const userEntered = userId ? Array.isArray(g.participants) && g.participants.includes(userId) : false;
      const endsText = g.endsAt
        ? new Date(g.endsAt).toLocaleString("en-US", { hour12: false, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "-";
      const winners = Array.isArray(g.winnerIds) ? g.winnerIds : [];
      const winnersText = winners.length ? winners.map((id) => `@${esc(id)}`).join(", ") : "None yet";
      const participantsText = Array.isArray(g.participants) && g.participants.length
        ? g.participants.slice(0, 100).map((id) => `@${esc(id)}`).join(", ")
        : "No participants yet.";
      return `<article class="gw-card">
        <div class="gw-head">
          <h3>${esc(g.prize || "Giveaway")}</h3>
          <span class="gw-pill ${ended ? "ended" : "active"}">${ended ? "ENDED" : "ACTIVE"}</span>
        </div>
        <div class="gw-desc">${esc(g.description || "")}</div>
        <div class="gw-meta-grid">
          <div><span class="k">ID</span><b>${esc(g.id || "-")}</b></div>
          <div><span class="k">${ended ? "Ended" : "Ends"}</span><b>${endsText}</b></div>
          <div><span class="k">Entries</span><b>${entries}</b></div>
          <div><span class="k">Winners</span><b>${Number(g.winners || 1)}</b></div>
        </div>
        <div class="gw-winners"><span class="k">Selected Winner(s)</span><b>${winnersText}</b></div>
        <details class="gw-participants">
          <summary>See Participants</summary>
          <div>${participantsText}</div>
        </details>
        <div class="gw-actions">
          <form method="post" action="/giveaways/${encodeURIComponent(g.id || "")}">
            <button class="gw-btn gw-enter" type="submit" formaction="/giveaways/${encodeURIComponent(g.id || "")}/enter"${ended || !userId || userEntered ? " disabled" : ""}>Enter Giveaway</button>
          </form>
          <form method="post" action="/giveaways/${encodeURIComponent(g.id || "")}">
            <button class="gw-btn gw-leave" type="submit" formaction="/giveaways/${encodeURIComponent(g.id || "")}/leave"${ended || !userId || !userEntered ? " disabled" : ""}>Leave Giveaway</button>
          </form>
        </div>
      </article>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Giveaways</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
  <style>
    .gw-shell {
      width: min(1100px, 98%);
      display: grid;
      gap: 14px;
    }
    .gw-top, .gw-identity {
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(9,13,20,0.72);
      border-radius: 16px;
      padding: 16px;
      backdrop-filter: blur(10px);
    }
    .gw-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .gw-title {
      margin: 0;
      font-size: clamp(24px, 3.2vw, 38px);
      font-style: italic;
    }
    .gw-sub { color: var(--muted); margin-top: 6px; }
    .gw-identity .form-grid { margin-top: 8px; }
    .gw-id {
      margin-top: 8px;
      color: var(--muted);
      font-size: 13px;
    }
    .gw-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 12px;
    }
    .gw-card {
      border: 1px solid rgba(255,255,255,0.14);
      background: linear-gradient(180deg, rgba(12,18,44,0.88), rgba(8,12,30,0.88));
      border-radius: 14px;
      padding: 14px;
      display: grid;
      gap: 10px;
    }
    .gw-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .gw-head h3 { margin: 0; font-size: 24px; }
    .gw-pill {
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 800;
      border: 1px solid transparent;
    }
    .gw-pill.active { color: #0f172a; background: #3fb950; border-color: #3fb950; }
    .gw-pill.ended { color: #fee2e2; background: #7f1d1d; border-color: #b91c1c; }
    .gw-desc { color: #d7e0f5; line-height: 1.45; }
    .gw-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(4,8,25,0.55);
    }
    .gw-meta-grid .k, .gw-winners .k { display: block; color: var(--muted); font-size: 11px; margin-bottom: 2px; }
    .gw-winners {
      padding: 10px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(4,8,25,0.55);
    }
    .gw-participants {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      padding: 8px 10px;
      background: rgba(4,8,25,0.4);
    }
    .gw-participants summary { cursor: pointer; font-weight: 700; }
    .gw-participants div {
      margin-top: 8px;
      color: var(--muted);
      white-space: pre-wrap;
      max-height: 120px;
      overflow: auto;
    }
    .gw-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .gw-actions form { margin: 0; }
    .gw-btn {
      width: 100%;
      border-radius: 10px;
      padding: 10px 12px;
      font-weight: 800;
      border: 1px solid transparent;
      cursor: pointer;
      color: #fff;
    }
    .gw-enter { background: #1f8f4e; border-color: #1f8f4e; }
    .gw-leave { background: #b03a43; border-color: #b03a43; }
    .gw-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <section class="gw-shell">
        <div class="gw-top">
          <div class="gw-title-row">
            <h2 class="gw-title">Looooooty Giveaways</h2>
            <a class="btn" href="/">Back Home</a>
          </div>
          <div class="gw-sub">Join active giveaways, track entries, and check winners.</div>
        </div>
        <div class="gw-identity">
        ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
        ${err ? `<div class="warn">${esc(err)}</div>` : ""}
        <form class="form-grid" method="post" action="/giveaways/session" style="max-width:560px;">
          <input type="text" name="discord_user_id" required maxlength="20" value="${esc(userId)}" placeholder="Your Discord User ID (numbers only)" />
          <input type="text" name="discord_tag" maxlength="64" value="${esc(userTag)}" placeholder="Discord username (optional)" />
          <button class="submit" type="submit">Save Giveaway Identity</button>
        </form>
        <div class="gw-id">Current giveaway identity: <b>${userId ? `${esc(userTag || "User")} (${esc(userId)})` : "Not set"}</b></div>
        </div>
        <div class="gw-grid">
          ${cards || '<div class="note">No giveaways yet.</div>'}
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function shopLandingHtml() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LooooootyShop</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
  <style>
    .shop-wrap {
      width: min(1100px, 98%);
      height: min(70vh, 700px);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 18px;
      overflow: hidden;
      background: rgba(9,13,20,0.62);
      backdrop-filter: blur(10px);
    }
    .shop-half {
      display: grid;
      place-items: center;
      text-decoration: none;
      color: var(--txt);
      font-weight: 800;
      font-size: clamp(24px, 4vw, 46px);
      border-right: 1px solid rgba(255,255,255,0.14);
      background: linear-gradient(180deg, rgba(49,70,99,0.45), rgba(23,29,41,0.68));
    }
    .shop-half:last-child { border-right: 0; }
    .shop-half:hover { border-color: var(--accent); filter: brightness(1.08); }
    @media (max-width: 860px) {
      .shop-wrap {
        grid-template-columns: 1fr;
        height: auto;
      }
      .shop-half {
        min-height: 180px;
        border-right: 0;
        border-bottom: 1px solid rgba(255,255,255,0.14);
      }
      .shop-half:last-child { border-bottom: 0; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <section class="hero" style="margin-bottom:12px; text-align:left;">
        <a class="btn" href="/">Back Home</a>
      </section>
      <section class="shop-wrap">
        <a class="shop-half" href="${SHOP_INVITE_URL}" target="_blank" rel="noreferrer">Discord Shop</a>
        <a class="shop-half" href="/shop/web">Website Shop</a>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function websiteShopHtml(websiteShop) {
  const products = Array.isArray(websiteShop && websiteShop.products) ? websiteShop.products : [];
  const state = websiteShop && websiteShop.state === "closed" ? "closed" : "open";
  const categories = Array.from(
    new Set(
      [
        ...(Array.isArray(websiteShop && websiteShop.categories) ? websiteShop.categories : []),
        ...(products || []).map((p) => String(p && p.category ? p.category : "").trim())
      ]
        .map((c) => String(c || "").trim())
        .filter(Boolean)
    )
  );
  const orderedCategories = ["Recommended", ...categories];
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LooooootyShop 2b2t</title>
  ${faviconLinks()}
  <style>
    :root { --txt:#e8f0ff; --muted:#9ba8c3; --accent:#4ea6ff; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--txt);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
      background:
        radial-gradient(1200px 700px at 85% 20%, rgba(78,166,255,0.18), transparent 60%),
        radial-gradient(900px 500px at 20% 80%, rgba(78,166,255,0.12), transparent 60%),
        linear-gradient(180deg, #060d2c, #050b22 60%, #04081b);
      min-height: 100vh;
    }
    .shell { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
    .sidebar { border-right: 1px solid rgba(255,255,255,0.12); padding: 20px; background: rgba(7,12,34,0.78); }
    .search {
      width: 100%;
      padding: 12px 13px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(4,8,25,0.8);
      color: var(--txt);
      outline: none;
    }
    .cat-list { margin-top: 18px; display: grid; gap: 10px; }
    .cat {
      text-align: left;
      padding: 11px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(14,20,46,0.65);
      color: var(--txt);
      font-weight: 700;
      cursor: pointer;
    }
    .cat.active, .cat:hover { border-color: var(--accent); }
    .main { padding: 18px 22px 30px; }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(8,13,34,0.72);
      border-radius: 16px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .brand img { width: 46px; height: 46px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(255,255,255,0.18); }
    .brand-title {
      margin: 0;
      font-size: clamp(22px, 3.2vw, 42px);
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .top-actions { display: flex; gap: 10px; }
    .btn {
      text-decoration: none;
      color: var(--txt);
      font-weight: 800;
      border: 1px solid rgba(255,255,255,0.18);
      background: linear-gradient(180deg, rgba(56,83,130,0.55), rgba(28,42,68,0.8));
      border-radius: 10px;
      padding: 10px 12px;
    }
    .btn:hover { border-color: var(--accent); }
    .section-title { margin: 12px 2px 16px; font-size: 34px; }
    .grid { display: grid; gap: 14px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .card {
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
      background: rgba(10,16,41,0.72);
      padding: 12px;
      display: grid;
      gap: 9px;
    }
    .card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .price {
      color: #31ff83;
      font-weight: 900;
      border: 1px solid rgba(49,255,131,0.35);
      border-radius: 999px;
      padding: 3px 8px;
    }
    .img-wrap { border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); background: rgba(5,9,25,0.8); }
    .img-wrap img { width: 100%; height: 170px; object-fit: cover; display: block; }
    .shop-content { display:grid; grid-template-columns: 1fr; gap:14px; align-items:start; }
    .add { justify-self: center; border-radius: 10px; border: 1px solid #5ca8ff; background: #4f95ea; color: white; font-weight: 800; padding: 9px 18px; cursor: pointer; opacity: 0.95; }
    .add:disabled { cursor: not-allowed; opacity: 0.55; }
    .cart-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2,5,16,0.78);
      backdrop-filter: blur(4px);
      display: none;
      z-index: 50;
      padding: 20px;
    }
    .cart-overlay.open { display: block; }
    .cart-panel {
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
      background: rgba(10,16,41,0.96);
      padding: 14px;
      max-width: 920px;
      width: 100%;
      max-height: 92vh;
      overflow: auto;
      margin: 0 auto;
    }
    .cart-top { display:flex; justify-content:space-between; align-items:center; gap:10px; }
    .cart-title { font-size: 28px; margin: 0 0 8px; }
    .cart-items { min-height: 80px; margin: 12px 0 10px; color: var(--muted); white-space: pre-wrap; }
    .cart-item {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      padding: 8px 9px;
      margin-bottom: 8px;
      background: rgba(8,12,30,0.7);
      position: relative;
    }
    .cart-item-row { display:flex; justify-content:space-between; gap:10px; font-size: 13px; }
    .cart-remove {
      margin-top: 8px;
      border-radius: 8px;
      border: 1px solid #b03a43;
      background: #b03a43;
      color: white;
      font-weight: 700;
      padding: 6px 10px;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity .15s ease;
    }
    .cart-item:hover .cart-remove,
    .cart-item:focus-within .cart-remove {
      opacity: 1;
      pointer-events: auto;
    }
    .cart-line { display:flex; justify-content:space-between; gap:10px; margin: 4px 0; }
    .cart-actions { display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top: 10px; }
    .cart-btn {
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.18);
      padding: 10px 12px;
      text-align: center;
      font-weight: 800;
      cursor: pointer;
      background: rgba(20,28,58,0.85);
      color: var(--txt);
    }
    .cart-btn.checkout { background: #1f8f4e; border-color: #1f8f4e; }
    .cart-btn.close { background: #b03a43; border-color: #b03a43; }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2,5,16,0.78);
      backdrop-filter: blur(4px);
      display: none;
      z-index: 70;
      padding: 20px;
    }
    .modal-overlay.open { display: block; }
    .modal-card {
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 14px;
      background: rgba(10,16,41,0.96);
      padding: 14px;
      max-width: 520px;
      width: 100%;
      margin: 8vh auto 0;
    }
    .modal-title { font-size: 24px; margin: 0 0 8px; }
    .modal-input {
      width: 100%;
      padding: 11px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(9,13,20,0.62);
      color: var(--txt);
      margin: 8px 0;
    }
    .modal-note { color: var(--muted); font-size: 13px; }
    .modal-error { color: #ff9b9b; font-size: 13px; min-height: 18px; margin-top: 4px; }
    .modal-ok { color: #7ee787; font-size: 13px; min-height: 18px; margin-top: 4px; }
    .modal-check { display:flex; align-items:center; gap:8px; margin-top:8px; color: var(--txt); font-size:13px; }
    .modal-actions { display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top: 10px; }
    @media (max-width: 1120px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 860px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { border-right: 0; border-bottom: 1px solid rgba(255,255,255,0.12); }
      .topbar { flex-direction: column; align-items: stretch; }
      .top-actions { width: 100%; }
      .top-actions .btn { flex: 1; text-align: center; }
      .grid { grid-template-columns: 1fr; }
      .cart-overlay { padding: 8px; }
      .cart-panel { max-height: 96vh; }
      .modal-overlay { padding: 8px; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <input id="shop-search" class="search" type="text" placeholder="Search items..." />
      <div class="cat-list">
        ${orderedCategories
          .map(
            (cat, idx) =>
              `<button class="cat${idx === 0 ? " active" : ""}" data-cat="${esc(cat)}">${esc(cat)}</button>`
          )
          .join("")}
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="brand">
          <img src="${SHOP_LOGO_URL}" alt="LooooootyShop logo" />
          <h1 class="brand-title">LooooootyShop 2b2t</h1>
        </div>
        <div class="top-actions">
          <a class="btn" href="/">Back to Home</a>
          <button id="top-cart-btn" class="btn" type="button" style="display:none;">Cart (0)</button>
          <a class="btn" href="${SHOP_INVITE_URL}" target="_blank" rel="noreferrer">Discord Shop</a>
        </div>
      </header>
      <h2 class="section-title">Shop Catalog</h2>
      ${
        state === "closed"
          ? '<div class="warn" style="margin:0 2px 12px;">Website shop is currently CLOSED.</div>'
          : ""
      }
      <section class="shop-content">
        <div id="product-grid" class="grid">
          ${(products || [])
            .map((p) => {
              const inStock = p.inStock !== false && state !== "closed";
              return `<article class="card" data-id="${esc(String(p.id || ""))}" data-name="${esc(
                String(p.name || "").toLowerCase()
              )}" data-title="${esc(String(p.name || "Unnamed Product"))}" data-price="${Number(p.price || 0)}" data-cat="${esc(
                String(p.category || "Recommended")
              )}">
                <div class="card-top">
                  <h3 style="margin:0;">${esc(p.name || "Unnamed Product")}</h3>
                  <span class="price">$${Number(p.price || 0).toFixed(2)}</span>
                </div>
                <div class="img-wrap"><img src="${esc(p.image || SHOP_LOGO_URL)}" alt="${esc(p.name || "Product")}" /></div>
                <button class="add" data-add-id="${esc(String(p.id || ""))}" ${inStock ? "" : "disabled"}>${inStock ? "Add to Cart" : "Unavailable"}</button>
              </article>`;
            })
            .join("")}
        </div>
        <div id="cart-overlay" class="cart-overlay">
          <aside class="cart-panel">
            <div class="cart-top">
              <h3 class="cart-title">Cart</h3>
              <button id="cart-hide" class="cart-btn close" type="button">Close</button>
            </div>
            <div id="cart-items" class="cart-items">No items yet.</div>
            <div class="cart-line"><span>Subtotal</span><b id="cart-subtotal">$0.00</b></div>
            <div class="cart-line"><span>Tax & Fees</span><b id="cart-tax">$0.00</b></div>
            <div class="cart-line"><span>Total Cost</span><b id="cart-total">$0.00</b></div>
            <div class="cart-line"><span>Total Kits</span><b id="cart-count">0</b></div>
            <div class="cart-actions">
              <button id="cart-checkout" class="cart-btn checkout" type="button">Checkout</button>
              <button id="cart-clear" class="cart-btn close" type="button">Clear Cart</button>
            </div>
          </aside>
        </div>
        <div id="qty-modal" class="modal-overlay">
          <div class="modal-card">
            <h3 class="modal-title">Add to Cart</h3>
            <div id="qty-modal-product" class="modal-note"></div>
            <input id="qty-input" class="modal-input" type="number" min="1" max="999" placeholder="Item Quantity (1-999)" />
            <div id="qty-error" class="modal-error"></div>
            <div class="modal-actions">
              <button id="qty-confirm" class="cart-btn checkout" type="button">Add</button>
              <button id="qty-cancel" class="cart-btn close" type="button">Cancel</button>
            </div>
          </div>
        </div>
        <div id="checkout-modal" class="modal-overlay">
          <div class="modal-card">
            <h3 class="modal-title">Checkout</h3>
            <div class="modal-note">Enter your email for payment receipt/invoice.</div>
            <input id="checkout-email" class="modal-input" type="email" placeholder="you@example.com" />
            <input id="checkout-discord-id" class="modal-input" type="text" maxlength="20" placeholder="Discord User ID (required for store credit)" />
            <label class="modal-check">
              <input id="checkout-use-credit" type="checkbox" />
              Use store credit
            </label>
            <div id="checkout-error" class="modal-error"></div>
            <div id="checkout-result" class="modal-ok"></div>
            <div class="modal-actions">
              <button id="checkout-paypal" class="cart-btn checkout" type="button">PayPal</button>
              <button id="checkout-close" class="cart-btn close" type="button">Close</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
  <script>
    (function () {
      const search = document.getElementById("shop-search");
      const cats = Array.from(document.querySelectorAll(".cat"));
      const cards = Array.from(document.querySelectorAll(".card"));
      const cartItemsEl = document.getElementById("cart-items");
      const cartSubtotalEl = document.getElementById("cart-subtotal");
      const cartTaxEl = document.getElementById("cart-tax");
      const cartTotalEl = document.getElementById("cart-total");
      const cartCountEl = document.getElementById("cart-count");
      const clearBtn = document.getElementById("cart-clear");
      const checkoutBtn = document.getElementById("cart-checkout");
      const topCartBtn = document.getElementById("top-cart-btn");
      const cartOverlay = document.getElementById("cart-overlay");
      const cartHideBtn = document.getElementById("cart-hide");
      const qtyModal = document.getElementById("qty-modal");
      const qtyModalProduct = document.getElementById("qty-modal-product");
      const qtyInput = document.getElementById("qty-input");
      const qtyError = document.getElementById("qty-error");
      const qtyConfirm = document.getElementById("qty-confirm");
      const qtyCancel = document.getElementById("qty-cancel");
      const checkoutModal = document.getElementById("checkout-modal");
      const checkoutEmail = document.getElementById("checkout-email");
      const checkoutDiscordId = document.getElementById("checkout-discord-id");
      const checkoutUseCredit = document.getElementById("checkout-use-credit");
      const checkoutError = document.getElementById("checkout-error");
      const checkoutResult = document.getElementById("checkout-result");
      const checkoutPaypal = document.getElementById("checkout-paypal");
      const checkoutClose = document.getElementById("checkout-close");
      const taxRate = 0.06;
      const storageKey = "looooooty_web_cart_v1";
      let currentCat = "Recommended";
      let cart = {};
      let pendingAddProductId = "";
      let pendingAddProductTitle = "";

      function openQtyModal(productId, productTitle) {
        pendingAddProductId = String(productId || "");
        pendingAddProductTitle = String(productTitle || "this item");
        if (qtyModalProduct) qtyModalProduct.textContent = pendingAddProductTitle;
        if (qtyInput) qtyInput.value = "1";
        if (qtyError) qtyError.textContent = "";
        if (qtyModal) qtyModal.classList.add("open");
        if (qtyInput) qtyInput.focus();
      }

      function loadCart() {
        try {
          const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
          if (parsed && typeof parsed === "object") {
            cart = parsed;
          }
        } catch {
          cart = {};
        }
      }

      function saveCart() {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      }

      function fmt(v) {
        return "$" + Number(v || 0).toFixed(2);
      }

      function getProductMap() {
        const map = {};
        cards.forEach((card) => {
          const id = String(card.dataset.id || "");
          if (!id) return;
          map[id] = {
            id,
            name: String(card.dataset.title || "Unnamed Product"),
            price: Number(card.dataset.price || 0)
          };
        });
        return map;
      }

      function renderCart() {
        const products = getProductMap();
        const rows = [];
        let subtotal = 0;
        let count = 0;
        Object.entries(cart).forEach(([id, qtyRaw]) => {
          const qty = Number(qtyRaw || 0);
          const p = products[id];
          if (!p || qty <= 0) return;
          count += qty;
          subtotal += p.price * qty;
          rows.push({ id, qty, name: p.name, lineTotal: p.price * qty });
        });
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        if (!rows.length) {
          cartItemsEl.textContent = "No items yet.";
        } else {
          cartItemsEl.innerHTML = rows
            .map(
              (r) =>
                '<div class="cart-item" data-cart-id="' +
                r.id +
                '">' +
                '<div class="cart-item-row"><b>' +
                r.qty +
                "x " +
                r.name +
                "</b><span>" +
                fmt(r.lineTotal) +
                '</span></div><button class="cart-remove" type="button" data-remove-id="' +
                r.id +
                '">Remove from Cart</button></div>'
            )
            .join("");
        }
        cartSubtotalEl.textContent = fmt(subtotal);
        cartTaxEl.textContent = fmt(tax);
        cartTotalEl.textContent = fmt(total);
        cartCountEl.textContent = String(count);
        if (topCartBtn) {
          if (count > 0) {
            topCartBtn.style.display = "inline-block";
            topCartBtn.textContent = "Cart (" + count + ")";
          } else {
            topCartBtn.style.display = "none";
            topCartBtn.textContent = "Cart (0)";
          }
        }
      }

      function cartSummaryForCheckout() {
        const products = getProductMap();
        let subtotal = 0;
        let count = 0;
        const normalized = {};
        Object.entries(cart).forEach(([id, qtyRaw]) => {
          const qty = Number(qtyRaw || 0);
          const p = products[id];
          if (!p || qty <= 0) return;
          count += qty;
          subtotal += p.price * qty;
          normalized[id] = qty;
        });
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        return { subtotal, tax, total, count, normalized };
      }

      function applyFilter() {
        const q = String(search.value || "").toLowerCase().trim();
        cards.forEach((card) => {
          const name = card.dataset.name || "";
          const cat = card.dataset.cat || "Recommended";
          const catOk = currentCat === "Recommended" ? true : cat === currentCat;
          const nameOk = !q || name.includes(q);
          card.style.display = catOk && nameOk ? "grid" : "none";
        });
      }
      cats.forEach((btn) => {
        btn.addEventListener("click", () => {
          currentCat = btn.dataset.cat || "Recommended";
          cats.forEach((x) => x.classList.remove("active"));
          btn.classList.add("active");
          applyFilter();
        });
      });
      search.addEventListener("input", applyFilter);
      document.addEventListener("click", (e) => {
        const addBtn = e.target && e.target.closest ? e.target.closest(".add[data-add-id]") : null;
        if (addBtn) {
          if (addBtn.disabled) return;
          const id = String(addBtn.dataset.addId || "");
          const card = addBtn.closest(".card");
          const title = card ? String(card.dataset.title || "this item") : "this item";
          openQtyModal(id, title);
          return;
        }

        const removeBtn = e.target && e.target.closest ? e.target.closest(".cart-remove[data-remove-id]") : null;
        if (removeBtn) {
          const id = String(removeBtn.dataset.removeId || "");
          if (!id) return;
          delete cart[id];
          saveCart();
          renderCart();
        }
      });
      if (qtyConfirm) {
        qtyConfirm.addEventListener("click", () => {
          const qty = Number.parseInt(String((qtyInput && qtyInput.value) || "").trim(), 10);
          if (!Number.isInteger(qty) || qty <= 0 || qty > 999) {
            if (qtyError) qtyError.textContent = "Quantity must be a whole number between 1 and 999.";
            return;
          }
          if (!pendingAddProductId) return;
          cart[pendingAddProductId] = Number(cart[pendingAddProductId] || 0) + qty;
          saveCart();
          renderCart();
          if (qtyModal) qtyModal.classList.remove("open");
        });
      }
      if (qtyCancel) {
        qtyCancel.addEventListener("click", () => {
          if (qtyModal) qtyModal.classList.remove("open");
        });
      }
      clearBtn.addEventListener("click", () => {
        cart = {};
        saveCart();
        renderCart();
      });
      if (topCartBtn) {
        topCartBtn.addEventListener("click", () => {
          if (cartOverlay) cartOverlay.classList.add("open");
        });
      }
      if (cartHideBtn) {
        cartHideBtn.addEventListener("click", () => {
          if (cartOverlay) cartOverlay.classList.remove("open");
        });
      }
      if (cartOverlay) {
        cartOverlay.addEventListener("click", (e) => {
          if (e.target === cartOverlay) cartOverlay.classList.remove("open");
        });
      }
      checkoutBtn.addEventListener("click", () => {
        if (checkoutError) checkoutError.textContent = "";
        if (checkoutResult) checkoutResult.textContent = "";
        if (checkoutEmail) checkoutEmail.value = "";
        if (checkoutDiscordId) checkoutDiscordId.value = "";
        if (checkoutUseCredit) checkoutUseCredit.checked = false;
        if (checkoutModal) checkoutModal.classList.add("open");
      });
      if (checkoutClose) {
        checkoutClose.addEventListener("click", () => {
          if (checkoutModal) checkoutModal.classList.remove("open");
        });
      }
      if (checkoutPaypal) {
        checkoutPaypal.addEventListener("click", async () => {
          const summary = cartSummaryForCheckout();
          if (!summary.count) {
            if (checkoutError) checkoutError.textContent = "Your cart is empty.";
            if (checkoutResult) checkoutResult.textContent = "";
            return;
          }
          const email = String((checkoutEmail && checkoutEmail.value) || "").trim();
          if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
            if (checkoutError) checkoutError.textContent = "Please enter a valid email.";
            if (checkoutResult) checkoutResult.textContent = "";
            return;
          }
          if (checkoutError) checkoutError.textContent = "";
          if (checkoutResult) checkoutResult.textContent = "Processing checkout...";

          const discordUserId = String((checkoutDiscordId && checkoutDiscordId.value) || "").trim();
          const useCredit = Boolean(checkoutUseCredit && checkoutUseCredit.checked);

          try {
            const response = await fetch("/shop/web/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                discordUserId,
                useCredit,
                cart: summary.normalized
              })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload || payload.ok !== true) {
              if (checkoutError) checkoutError.textContent = String((payload && payload.error) || "Checkout failed.");
              if (checkoutResult) checkoutResult.textContent = "";
              return;
            }

            if (checkoutResult) {
              checkoutResult.textContent =
                "Credit used: $" +
                Number(payload.creditUsed || 0).toFixed(2) +
                " | Total due: $" +
                Number(payload.totalDue || 0).toFixed(2);
            }

            if (payload.paidWithCreditOnly) {
              cart = {};
              saveCart();
              renderCart();
              if (checkoutError) checkoutError.textContent = "";
              return;
            }

            if (payload.paypalUrl) {
              window.location.href = payload.paypalUrl;
              return;
            }

            if (checkoutError) checkoutError.textContent = "PayPal checkout URL is not configured.";
          } catch {
            if (checkoutError) checkoutError.textContent = "Checkout request failed.";
            if (checkoutResult) checkoutResult.textContent = "";
          }
        });
      }
      if (qtyModal) {
        qtyModal.addEventListener("click", (e) => {
          if (e.target === qtyModal) qtyModal.classList.remove("open");
        });
      }
      if (checkoutModal) {
        checkoutModal.addEventListener("click", (e) => {
          if (e.target === checkoutModal) checkoutModal.classList.remove("open");
        });
      }
      loadCart();
      renderCart();
      applyFilter();
    })();
  </script>
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
    .ws-product { position: relative; }
    .ws-actions {
      display: grid;
      gap: 8px;
      margin-top: 10px;
      opacity: 0;
      pointer-events: none;
      transition: opacity .16s ease;
    }
    .ws-product:hover .ws-actions,
    .ws-product:focus-within .ws-actions {
      opacity: 1;
      pointer-events: auto;
    }
    .ws-inline { display:grid; gap:8px; grid-template-columns: 1fr 1fr; }
    .ws-compact-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:12px; margin-top:12px; }
    .ws-compact-card { border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:10px; background: rgba(0,0,0,0.14); position:relative; }
    .ws-compact-top { display:flex; justify-content:space-between; gap:8px; align-items:center; margin-bottom:8px; }
    .ws-compact-name { font-weight:800; }
    .ws-compact-price { color:#31ff83; font-weight:900; }
    .ws-compact-img { border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.15); background: rgba(5,9,25,0.8); margin-bottom:8px; }
    .ws-compact-img img { width:100%; height:120px; object-fit:cover; display:block; }
    .ws-compact-meta { font-size:12px; color: var(--muted); }
    .ws-compact-actions { display:grid; gap:8px; margin-top:10px; opacity:0; pointer-events:none; transition: opacity .16s ease; }
    .ws-compact-card:hover .ws-compact-actions,
    .ws-compact-card:focus-within .ws-compact-actions { opacity:1; pointer-events:auto; }
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

function shopAutomationPanelHtml() {
  const credits = loadCredits();
  const creditRows = Object.entries(credits || {})
    .map(([userId, value]) => ({ userId: String(userId), value: Number(value || 0) }))
    .filter((r) => isSnowflake(r.userId) && Number.isFinite(r.value) && r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 30);

  const giveawaysMap = loadGiveaways();
  const giveaways = Object.values(giveawaysMap || {})
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 30);

  return `<div class="card base-panel" style="margin-top:12px;">
    <h3 style="margin-top:0;">Giveaways + Store Credit</h3>
    <div class="note">Website actions here write directly to bot data files.</div>

    <h4 style="margin:14px 0 6px;">Create Giveaway</h4>
    <form method="post" action="/staff/giveaways/create" style="display:grid; gap:10px;">
      <input type="text" name="prize" required maxlength="100" placeholder="Prize" />
      <input type="text" name="description" required maxlength="500" placeholder="Description" />
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <input type="text" name="winners" required placeholder="Number of winners (1-20)" />
        <input type="text" name="end_minutes" required placeholder="Ends in minutes (1-10080)" />
      </div>
      <button class="save-btn" type="submit">Create Giveaway</button>
    </form>

    <h4 style="margin:18px 0 6px;">Manage Giveaways (${giveaways.length})</h4>
    <div class="app-list">
      ${giveaways.length ? giveaways.map((g) => {
        const ended = isGiveawayEnded(g);
        const endsAt = g.endsAt ? new Date(g.endsAt).toLocaleString("en-US", { hour12: false }) : "-";
        const winners = Array.isArray(g.winnerIds) ? g.winnerIds : [];
        const winnersText = winners.length ? winners.map((id) => `@${esc(id)}`).join(", ") : "None yet";
        return `<div class="app-row">
          <div class="app-head">
            <div><b>${esc(g.id || "-")}</b></div>
            <div><span class="tag ${ended ? "approved" : "pending"}">${ended ? "ENDED" : "ACTIVE"}</span></div>
          </div>
          <div class="app-meta">
            Prize: <b>${esc(g.prize || "-")}</b><br/>
            Ends At: <b>${esc(endsAt)}</b><br/>
            Entries: <b>${giveawayEntriesCount(g)}</b> • Winners configured: <b>${Number(g.winners || 1)}</b><br/>
            Winner(s): <b>${winnersText}</b>
          </div>
          <div class="app-actions">
            <form method="post" action="/staff/giveaways/${encodeURIComponent(g.id || "")}/end" style="margin:0;">
              <button class="save-btn" type="submit"${ended ? " disabled" : ""}>End Giveaway</button>
            </form>
            <form method="post" action="/staff/giveaways/${encodeURIComponent(g.id || "")}/reroll" style="margin:0;">
              <button class="btn" type="submit"${ended ? "" : " disabled"}>Reroll Winners</button>
            </form>
          </div>
        </div>`;
      }).join("") : '<div class="note">No giveaways yet.</div>'}
    </div>

    <h4 style="margin:18px 0 6px;">Add / Edit Store Credit</h4>
    <form method="post" action="/staff/credits/update" style="display:grid; gap:10px;">
      <input type="text" name="discord_user_id" required maxlength="20" placeholder="Discord User ID" />
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <input type="text" name="amount" required placeholder="Amount (e.g. 5.00)" />
        <select name="mode" required>
          <option value="add">Add</option>
          <option value="set">Set</option>
          <option value="subtract">Subtract</option>
        </select>
      </div>
      <button class="save-btn" type="submit">Apply Credit Change</button>
    </form>

    <h4 style="margin:18px 0 6px;">Top Credit Balances</h4>
    <div class="app-list">
      ${creditRows.length
        ? creditRows.map((r) => `<div class="app-row"><div class="app-head"><div><b>${esc(r.userId)}</b></div><div>$${r.value.toFixed(2)}</div></div></div>`).join("")
        : '<div class="note">No credits assigned.</div>'}
    </div>
  </div>`;
}

function staffShopTabHtml(s, websiteShop, shopView = "discord") {
  const isWebsite = shopView === "website";
  const products = Array.isArray(websiteShop && websiteShop.products) ? websiteShop.products : [];
  const categories = Array.isArray(websiteShop && websiteShop.categories) ? websiteShop.categories : [];
  if (!isWebsite) {
    return `<div class="card" style="margin-bottom:12px;">
      <div class="action-row" style="justify-content:flex-start;">
        <a class="btn" href="/panel/shop?shop_view=discord">DC Shop (Active)</a>
        <a class="btn" href="/panel/shop?shop_view=website">Website Shop</a>
      </div>
    </div>${shopStatsHtml(s)}${shopAutomationPanelHtml()}`;
  }

  return `<div class="card base-panel">
    <div class="action-row" style="justify-content:flex-start;">
      <a class="btn" href="/panel/shop?shop_view=discord">DC Shop</a>
      <a class="btn" href="/panel/shop?shop_view=website">Website Shop (Active)</a>
    </div>
    <h3 style="margin:12px 0 8px;">Website Shop Controls</h3>
    <div class="note">Manage website-only categories/products here.</div>

    <h4 style="margin:14px 0 6px;">Shop State</h4>
    <form method="post" action="/staff/webshop/state" style="display:flex; gap:10px; flex-wrap:wrap;">
      <select name="state" required style="max-width:220px;">
        <option value="open"${websiteShop.state === "open" ? " selected" : ""}>OPEN</option>
        <option value="closed"${websiteShop.state === "closed" ? " selected" : ""}>CLOSED</option>
      </select>
      <button class="save-btn" type="submit">Save State</button>
    </form>

    <h4 style="margin:18px 0 6px;">Add Category</h4>
    <form method="post" action="/staff/webshop/category/add" style="display:grid; grid-template-columns: 1fr auto; gap:10px;">
      <input type="text" name="category_name" maxlength="40" required placeholder="Category name (e.g. kits)" />
      <button class="save-btn" type="submit">Add Category</button>
    </form>
    <div class="note">Current: ${categories.length ? categories.map((c) => `<b>${esc(c)}</b>`).join(", ") : "-"}</div>

    <h4 style="margin:18px 0 6px;">Add Product</h4>
    <form method="post" action="/staff/webshop/product/add" style="display:grid; gap:10px;">
      <input type="text" name="name" maxlength="80" required placeholder="Product name" />
      <input type="text" name="description" maxlength="400" placeholder="Description (optional)" />
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <input type="text" name="price" required placeholder="Price (e.g. 0.69)" />
        <select name="category" required>
          ${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}
        </select>
      </div>
      <input type="text" name="image" required placeholder="Image URL (https://...)" />
      <button class="save-btn" type="submit">Add Product</button>
    </form>

    <h4 style="margin:18px 0 6px;">Products (${products.length})</h4>
    <div class="ws-compact-grid">
      ${products.length
        ? products
            .map(
              (p) => `<div class="ws-compact-card ws-product">
                <div class="ws-compact-top">
                  <div class="ws-compact-name">${esc(p.name)}</div>
                  <div class="ws-compact-price">$${Number(p.price || 0).toFixed(2)}</div>
                </div>
                <div class="ws-compact-img"><img src="${esc(p.image || SHOP_LOGO_URL)}" alt="${esc(p.name || "Product")}" /></div>
                <div class="ws-compact-meta">
                  ${p.inStock === false ? "Out of Stock" : "In Stock"} • ${esc(p.category || "-")}
                </div>
                <div class="ws-compact-actions">
                  <form method="post" action="/staff/webshop/product/${encodeURIComponent(p.id)}/edit" style="display:grid; gap:8px; border-top:1px solid rgba(255,255,255,0.12); padding-top:8px;">
                    <input type="text" name="name" required maxlength="80" value="${esc(p.name || "")}" />
                    <input type="text" name="description" maxlength="400" value="${esc(p.description || "")}" />
                    <div class="ws-inline">
                      <input type="text" name="price" required value="${Number(p.price || 0).toFixed(2)}" />
                      <select name="category" required>
                        ${categories.map((c) => `<option value="${esc(c)}"${String(c) === String(p.category) ? " selected" : ""}>${esc(c)}</option>`).join("")}
                      </select>
                    </div>
                    <input type="text" name="image" required value="${esc(p.image || "")}" />
                    <button class="save-btn" type="submit">Edit Product</button>
                  </form>
                  <div class="ws-inline">
                    <form method="post" action="/staff/webshop/product/${encodeURIComponent(p.id)}/stock" style="margin:0;">
                      <input type="hidden" name="status" value="${p.inStock === false ? "in_stock" : "out_of_stock"}" />
                      <button class="btn" type="submit">${p.inStock === false ? "Set In Stock" : "Set Out of Stock"}</button>
                    </form>
                    <form method="post" action="/staff/webshop/product/${encodeURIComponent(p.id)}/save-default" style="margin:0;">
                      <button class="btn" type="submit">Save to Default</button>
                    </form>
                  </div>
                  <div class="ws-inline">
                    <form method="post" action="/staff/webshop/product/${encodeURIComponent(p.id)}/delete" style="margin:0;" onsubmit="return confirm('Delete this product?');">
                      <button class="danger-btn" type="submit">Delete</button>
                    </form>
                  </div>
                </div>
              </div>`
            )
            .join("")
        : '<div class="note">No website products yet.</div>'}
    </div>
  </div>${shopAutomationPanelHtml()}`;
}

function basesEditorPanelHtml(bases) {
  return `<div class="card base-panel">
    <h3 style="margin-top:0">State of Bases</h3>
    <form method="post" action="/staff/bases/update">
      ${baseStateEditorHtml(bases)}
      <div class="action-row" style="justify-content:flex-start; margin-top:10px;">
        <button class="save-btn" type="submit">Save Base States</button>
        <button class="btn" type="submit" formaction="/staff/bases/save-defaults">Save Current Bases to Default</button>
      </div>
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

function staffPageHtml({ s, bases, applications, forms, websiteShop, shopView = "discord", msg = "", warn = "", staff, activeTab }) {
  let tabContent = staffShopTabHtml(s, websiteShop, shopView);
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

app.get("/giveaways", (req, res) => {
  const giveaways = Object.values(loadGiveaways()).sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  const session = getGiveawaySession(req);
  res.send(giveawaysPageHtml({ giveaways, msg, err, session }));
});

app.post("/giveaways/session", (req, res) => {
  const userId = String(req.body.discord_user_id || "").trim();
  const userTag = String(req.body.discord_tag || "").trim().slice(0, 64);
  if (!isSnowflake(userId)) {
    res.redirect("/giveaways?err=Invalid%20Discord%20User%20ID");
    return;
  }
  res.setHeader("Set-Cookie", [
    `giveaway_user_id=${encodeURIComponent(userId)}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`,
    `giveaway_user_tag=${encodeURIComponent(userTag)}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`
  ]);
  res.redirect("/giveaways?msg=Giveaway%20identity%20saved");
});

app.post("/giveaways/:id/enter", (req, res) => {
  const id = String(req.params.id || "").trim();
  const { userId } = getGiveawaySession(req);
  if (!isSnowflake(userId)) {
    res.redirect("/giveaways?err=Set%20your%20giveaway%20identity%20first");
    return;
  }
  const giveaways = loadGiveaways();
  const giveaway = giveaways[id];
  if (!giveaway) {
    res.redirect("/giveaways?err=Giveaway%20not%20found");
    return;
  }
  if (isGiveawayEnded(giveaway)) {
    res.redirect("/giveaways?err=This%20giveaway%20has%20ended");
    return;
  }
  giveaway.participants = Array.isArray(giveaway.participants) ? giveaway.participants : [];
  if (giveaway.participants.includes(userId)) {
    res.redirect("/giveaways?err=You%20already%20joined%20this%20giveaway");
    return;
  }
  giveaway.participants.push(userId);
  giveaways[id] = giveaway;
  saveGiveaways(giveaways);
  res.redirect("/giveaways?msg=Joined%20giveaway");
});

app.post("/giveaways/:id/leave", (req, res) => {
  const id = String(req.params.id || "").trim();
  const { userId } = getGiveawaySession(req);
  if (!isSnowflake(userId)) {
    res.redirect("/giveaways?err=Set%20your%20giveaway%20identity%20first");
    return;
  }
  const giveaways = loadGiveaways();
  const giveaway = giveaways[id];
  if (!giveaway) {
    res.redirect("/giveaways?err=Giveaway%20not%20found");
    return;
  }
  if (isGiveawayEnded(giveaway)) {
    res.redirect("/giveaways?err=This%20giveaway%20has%20ended");
    return;
  }
  giveaway.participants = Array.isArray(giveaway.participants) ? giveaway.participants : [];
  giveaway.participants = giveaway.participants.filter((participantId) => String(participantId) !== userId);
  giveaways[id] = giveaway;
  saveGiveaways(giveaways);
  res.redirect("/giveaways?msg=Left%20giveaway");
});

app.get("/about", (_req, res) => {
  res.send(aboutPageHtml());
});

app.get("/shop", (_req, res) => {
  res.send(shopLandingHtml());
});

app.get("/shop/web", (_req, res) => {
  const websiteShop = loadWebsiteShopData();
  res.send(websiteShopHtml(websiteShop));
});

app.post("/shop/web/checkout", (req, res) => {
  const email = String(req.body && req.body.email ? req.body.email : "").trim();
  const discordUserId = String(req.body && req.body.discordUserId ? req.body.discordUserId : "").trim();
  const useCredit = Boolean(req.body && req.body.useCredit);
  const cartInput = req.body && typeof req.body.cart === "object" && req.body.cart ? req.body.cart : {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "Please enter a valid email." });
    return;
  }
  if (useCredit && !isSnowflake(discordUserId)) {
    res.status(400).json({ ok: false, error: "Valid Discord User ID is required to use store credit." });
    return;
  }

  const websiteShop = loadWebsiteShopData();
  if (websiteShop.state === "closed") {
    res.status(400).json({ ok: false, error: "Website shop is currently closed." });
    return;
  }

  const productsById = new Map(
    (Array.isArray(websiteShop.products) ? websiteShop.products : []).map((p) => [String(p.id), p])
  );
  let subtotal = 0;
  let itemCount = 0;
  const normalizedCart = {};

  for (const [idRaw, qtyRaw] of Object.entries(cartInput)) {
    const id = String(idRaw || "").trim();
    const qty = Number.parseInt(String(qtyRaw || "").trim(), 10);
    if (!id || !Number.isInteger(qty) || qty <= 0 || qty > 999) {
      continue;
    }
    const product = productsById.get(id);
    if (!product || product.inStock === false) {
      continue;
    }
    subtotal += Number(product.price || 0) * qty;
    itemCount += qty;
    normalizedCart[id] = qty;
  }

  if (itemCount <= 0) {
    res.status(400).json({ ok: false, error: "Your cart is empty." });
    return;
  }

  const taxFees = money(subtotal * 0.06);
  const total = money(subtotal + taxFees);

  let creditUsed = 0;
  let creditBefore = 0;
  let creditAfter = 0;

  if (useCredit) {
    const credits = loadCredits();
    creditBefore = money(Number(credits[discordUserId] || 0));
    creditUsed = money(Math.min(creditBefore, total));
    const previewDue = money(total - creditUsed);
    if (previewDue > 0 && !String(WEBSITE_PAYPAL_URL || "").trim()) {
      res.status(400).json({ ok: false, error: "PayPal checkout is not configured yet." });
      return;
    }
    creditAfter = money(creditBefore - creditUsed);
    if (creditAfter <= 0) {
      delete credits[discordUserId];
    } else {
      credits[discordUserId] = creditAfter;
    }
    saveCredits(credits);
  }

  const totalDue = money(total - creditUsed);
  if (totalDue > 0 && !String(WEBSITE_PAYPAL_URL || "").trim()) {
    res.status(400).json({ ok: false, error: "PayPal checkout is not configured yet." });
    return;
  }

  res.json({
    ok: true,
    subtotal: money(subtotal),
    taxFees,
    total,
    creditUsed,
    totalDue,
    paidWithCreditOnly: totalDue <= 0,
    paypalUrl: totalDue > 0 ? WEBSITE_PAYPAL_URL : "",
    creditBefore,
    creditAfter,
    itemCount
  });
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

app.post("/staff/bases/:id/edit", requireStaff, (req, res) => {
  const id = String(req.params.id || "").trim();
  const baseName = String(req.body.base_name || "").trim().slice(0, 60);
  const state = normalizeBaseState(req.body.state);
  if (!baseName) {
    res.redirect("/panel/bases?warn=Base%20name%20is%20required");
    return;
  }
  const bases = loadBaseStates();
  const idx = bases.findIndex((b) => String(b.id) === id);
  if (idx === -1) {
    res.redirect("/panel/bases?warn=Base%20not%20found");
    return;
  }
  bases[idx] = { ...bases[idx], name: baseName, state };
  saveBaseStates(bases);
  res.redirect("/panel/bases?msg=Base%20updated");
});

app.post("/staff/bases/:id/delete", requireStaff, (req, res) => {
  const id = String(req.params.id || "").trim();
  const bases = loadBaseStates();
  const filtered = bases.filter((b) => String(b.id) !== id);
  if (filtered.length === bases.length) {
    res.redirect("/panel/bases?warn=Base%20not%20found");
    return;
  }
  saveBaseStates(filtered);
  res.redirect("/panel/bases?msg=Base%20deleted");
});

app.post("/staff/bases/:id/save-default", requireStaff, (req, res) => {
  const id = String(req.params.id || "").trim();
  const bases = loadBaseStates();
  const base = bases.find((b) => String(b.id) === id);
  if (!base) {
    res.redirect("/panel/bases?warn=Base%20not%20found");
    return;
  }
  // Save a full snapshot so states (open/open_less/closed) remain exactly as current.
  saveBaseStateDefaults(bases);
  res.redirect("/panel/bases?msg=Base%20defaults%20snapshot%20saved");
});

app.post("/staff/bases/save-defaults", requireStaff, (req, res) => {
  const bases = loadBaseStates();
  const updated = bases.map((b) => {
    const next = req.body[`state_${b.id}`];
    return {
      ...b,
      state: normalizeBaseState(next)
    };
  });
  saveBaseStates(updated);
  saveBaseStateDefaults(updated);
  res.redirect("/panel/bases?msg=Base%20defaults%20snapshot%20saved");
});

app.post("/staff/webshop/state", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const state = String(req.body.state || "").trim().toLowerCase();
  data.state = state === "closed" ? "closed" : "open";
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?shop_view=website&msg=Website%20shop%20state%20saved");
});

app.post("/staff/webshop/category/add", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const categoryName = String(req.body.category_name || "").trim().slice(0, 40);
  if (!categoryName) {
    res.redirect("/panel/shop?shop_view=website&warn=Category%20name%20is%20required");
    return;
  }
  const exists = data.categories.some((c) => c.toLowerCase() === categoryName.toLowerCase());
  if (!exists) {
    data.categories.push(categoryName);
    saveWebsiteShopData(data);
  }
  res.redirect("/panel/shop?shop_view=website&msg=Category%20saved");
});

app.post("/staff/webshop/product/add", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const name = String(req.body.name || "").trim().slice(0, 80);
  const description = String(req.body.description || "").trim().slice(0, 400);
  const category = String(req.body.category || "").trim().slice(0, 40);
  const image = String(req.body.image || "").trim().slice(0, 500);
  const price = Number.parseFloat(String(req.body.price || "0").trim());
  if (!name) {
    res.redirect("/panel/shop?shop_view=website&warn=Product%20name%20is%20required");
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    res.redirect("/panel/shop?shop_view=website&warn=Price%20must%20be%20greater%20than%200");
    return;
  }
  if (!category) {
    res.redirect("/panel/shop?shop_view=website&warn=Category%20is%20required");
    return;
  }
  if (!image) {
    res.redirect("/panel/shop?shop_view=website&warn=Image%20URL%20is%20required");
    return;
  }
  if (!data.categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
    data.categories.push(category);
  }
  const idBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "item";
  let id = idBase;
  let i = 2;
  const used = new Set(data.products.map((p) => p.id));
  while (used.has(id)) {
    id = `${idBase}-${i}`;
    i += 1;
  }
  data.products.push({
    id,
    name,
    price: Number(price.toFixed(2)),
    category,
    image,
    description,
    inStock: true
  });
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?shop_view=website&msg=Website%20product%20added");
});

app.post("/staff/webshop/product/:id/edit", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const id = String(req.params.id || "").trim();
  const idx = data.products.findIndex((p) => String(p.id) === id);
  if (idx === -1) {
    res.redirect("/panel/shop?shop_view=website&warn=Website%20product%20not%20found");
    return;
  }

  const name = String(req.body.name || "").trim().slice(0, 80);
  const description = String(req.body.description || "").trim().slice(0, 400);
  const category = String(req.body.category || "").trim().slice(0, 40);
  const image = String(req.body.image || "").trim().slice(0, 500);
  const price = Number.parseFloat(String(req.body.price || "0").trim());
  if (!name) {
    res.redirect("/panel/shop?shop_view=website&warn=Product%20name%20is%20required");
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    res.redirect("/panel/shop?shop_view=website&warn=Price%20must%20be%20greater%20than%200");
    return;
  }
  if (!category) {
    res.redirect("/panel/shop?shop_view=website&warn=Category%20is%20required");
    return;
  }
  if (!image) {
    res.redirect("/panel/shop?shop_view=website&warn=Image%20URL%20is%20required");
    return;
  }
  if (!data.categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
    data.categories.push(category);
  }
  data.products[idx] = {
    ...data.products[idx],
    name,
    description,
    category,
    image,
    price: Number(price.toFixed(2))
  };
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?shop_view=website&msg=Website%20product%20updated");
});

app.post("/staff/webshop/product/:id/delete", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const id = String(req.params.id || "").trim();
  const before = data.products.length;
  data.products = data.products.filter((p) => String(p.id) !== id);
  if (data.products.length === before) {
    res.redirect("/panel/shop?shop_view=website&warn=Website%20product%20not%20found");
    return;
  }
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?shop_view=website&msg=Website%20product%20deleted");
});

app.post("/staff/webshop/product/:id/stock", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const id = String(req.params.id || "").trim();
  const idx = data.products.findIndex((p) => String(p.id) === id);
  if (idx === -1) {
    res.redirect("/panel/shop?shop_view=website&warn=Website%20product%20not%20found");
    return;
  }
  const status = String(req.body.status || "").trim().toLowerCase();
  data.products[idx].inStock = status === "in_stock";
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?shop_view=website&msg=Website%20product%20stock%20updated");
});

app.post("/staff/webshop/product/:id/save-default", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const defaults = loadWebsiteShopDefaults();
  const id = String(req.params.id || "").trim();
  const product = data.products.find((p) => String(p.id) === id);
  if (!product) {
    res.redirect("/panel/shop?shop_view=website&warn=Website%20product%20not%20found");
    return;
  }

  defaults.state = data.state === "closed" ? "closed" : "open";
  defaults.categories = Array.isArray(data.categories)
    ? data.categories.map((c) => String(c || "").trim()).filter(Boolean)
    : [];
  defaults.products = Array.isArray(data.products)
    ? data.products.map((p) => ({
        id: String(p && p.id ? p.id : "").trim(),
        name: String(p && p.name ? p.name : "Unnamed").trim().slice(0, 80),
        price: Number.isFinite(Number(p && p.price)) ? Number(p.price) : 0,
        category: String(p && p.category ? p.category : "").trim().slice(0, 40),
        image: String(p && p.image ? p.image : "").trim(),
        description: String(p && p.description ? p.description : "").trim().slice(0, 400),
        inStock: p && p.inStock === false ? false : true
      }))
    : [];
  saveWebsiteShopDefaults(defaults);
  res.redirect("/panel/shop?shop_view=website&msg=Website%20shop%20saved%20to%20defaults");
});

app.post("/staff/credits/update", requireStaff, (req, res) => {
  const userId = String(req.body.discord_user_id || "").trim();
  const amount = Number.parseFloat(String(req.body.amount || "").trim());
  const mode = String(req.body.mode || "").trim().toLowerCase();
  if (!isSnowflake(userId)) {
    res.redirect("/panel/shop?warn=Invalid%20Discord%20User%20ID");
    return;
  }
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
    res.redirect("/panel/shop?warn=Invalid%20credit%20amount");
    return;
  }
  const credits = loadCredits();
  const current = Number(credits[userId] || 0);
  let next = current;
  if (mode === "set") {
    next = amount;
  } else if (mode === "subtract") {
    next = Math.max(0, current - amount);
  } else {
    next = current + amount;
  }
  const rounded = money(next);
  if (rounded <= 0) {
    delete credits[userId];
  } else {
    credits[userId] = rounded;
  }
  saveCredits(credits);
  res.redirect("/panel/shop?msg=Store%20credit%20updated");
});

app.post("/staff/giveaways/create", requireStaff, (req, res) => {
  const prize = String(req.body.prize || "").trim().slice(0, 100);
  const description = String(req.body.description || "").trim().slice(0, 500);
  const winners = Number.parseInt(String(req.body.winners || "").trim(), 10);
  const endMinutes = Number.parseInt(String(req.body.end_minutes || "").trim(), 10);
  if (!prize) {
    res.redirect("/panel/shop?warn=Giveaway%20prize%20is%20required");
    return;
  }
  if (!description) {
    res.redirect("/panel/shop?warn=Giveaway%20description%20is%20required");
    return;
  }
  if (!Number.isInteger(winners) || winners <= 0 || winners > 20) {
    res.redirect("/panel/shop?warn=Winners%20must%20be%201-20");
    return;
  }
  if (!Number.isInteger(endMinutes) || endMinutes <= 0 || endMinutes > 10080) {
    res.redirect("/panel/shop?warn=Ends%20in%20minutes%20must%20be%201-10080");
    return;
  }
  const staff = getStaffSession(req);
  const giveaways = loadGiveaways();
  const id = `GW-${Date.now()}`;
  giveaways[id] = {
    id,
    prize,
    description,
    winners,
    endsAt: new Date(Date.now() + endMinutes * 60 * 1000).toISOString(),
    participants: [],
    createdAt: new Date().toISOString(),
    createdBy: `web:${staff.user}`,
    guildId: GUILD_ID || null,
    channelId: null,
    messageId: null
  };
  saveGiveaways(giveaways);
  res.redirect("/panel/shop?msg=Giveaway%20created");
});

app.post("/staff/giveaways/:id/end", requireStaff, (req, res) => {
  const id = String(req.params.id || "").trim();
  const giveaways = loadGiveaways();
  const giveaway = giveaways[id];
  if (!giveaway) {
    res.redirect("/panel/shop?warn=Giveaway%20not%20found");
    return;
  }
  const participants = Array.isArray(giveaway.participants) ? giveaway.participants : [];
  if (giveaway.ended === true && Array.isArray(giveaway.winnerIds)) {
    res.redirect("/panel/shop?warn=Giveaway%20already%20ended");
    return;
  }
  const winnerCount = Math.max(1, Math.min(Number(giveaway.winners || 1), participants.length || 1));
  giveaway.winnerIds = participants.length ? pickRandomWinners(participants, winnerCount) : [];
  giveaway.ended = true;
  giveaway.endedAt = new Date().toISOString();
  giveaways[id] = giveaway;
  saveGiveaways(giveaways);
  res.redirect("/panel/shop?msg=Giveaway%20ended");
});

app.post("/staff/giveaways/:id/reroll", requireStaff, (req, res) => {
  const id = String(req.params.id || "").trim();
  const giveaways = loadGiveaways();
  const giveaway = giveaways[id];
  if (!giveaway) {
    res.redirect("/panel/shop?warn=Giveaway%20not%20found");
    return;
  }
  if (!isGiveawayEnded(giveaway)) {
    res.redirect("/panel/shop?warn=Giveaway%20is%20not%20ended%20yet");
    return;
  }
  const participants = Array.isArray(giveaway.participants) ? giveaway.participants : [];
  if (participants.length === 0) {
    giveaway.winnerIds = [];
  } else {
    const winnerCount = Math.max(1, Math.min(Number(giveaway.winners || 1), participants.length));
    giveaway.winnerIds = pickRandomWinners(participants, winnerCount);
  }
  giveaway.ended = true;
  giveaway.endedAt = giveaway.endedAt || new Date().toISOString();
  giveaways[id] = giveaway;
  saveGiveaways(giveaways);
  res.redirect("/panel/shop?msg=Giveaway%20rerolled");
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
  const websiteShop = loadWebsiteShopData();
  const shopView = String(req.query.shop_view || "discord") === "website" ? "website" : "discord";
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(staffPageHtml({ s, bases, applications, forms, websiteShop, shopView, msg, warn, staff, activeTab: "shop" }));
});

app.get("/panel/bases", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications();
  const forms = loadApplicationForms();
  const websiteShop = loadWebsiteShopData();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(staffPageHtml({ s, bases, applications, forms, websiteShop, shopView: "discord", msg, warn, staff, activeTab: "bases" }));
});

app.get("/panel/applications", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const forms = loadApplicationForms();
  const websiteShop = loadWebsiteShopData();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(
    staffPageHtml({
      s,
      bases,
      applications,
      forms,
      websiteShop,
      shopView: "discord",
      msg,
      warn,
      staff,
      activeTab: "applications"
    })
  );
});

app.listen(PORT, HOST, () => {
  console.log(`LooooootyWeb running on http://${HOST}:${PORT}`);
});
