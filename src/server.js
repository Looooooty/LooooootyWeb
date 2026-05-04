require("dotenv").config();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

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
const HOW_TO_ORDER_TEXT = process.env.HOW_TO_ORDER_TEXT || "How to order content coming soon.";
const DISCORD_OAUTH_CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID || BOT_CLIENT_ID || "";
const DISCORD_OAUTH_CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET || "";
const DISCORD_OAUTH_REDIRECT_URI = process.env.DISCORD_OAUTH_REDIRECT_URI || "";
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || "";
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || GUILD_ID || "";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || "";
const REQUIRE_GUILD_MEMBERSHIP = String(process.env.REQUIRE_GUILD_MEMBERSHIP || "true").toLowerCase() === "true";
const MIN_DISCORD_ACCOUNT_AGE_DAYS = Math.max(0, Number(process.env.MIN_DISCORD_ACCOUNT_AGE_DAYS || 0));
const WEB_SESSION_COOKIE = "web_auth";
const WEB_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const WEB_SESSION_SIGNING_KEY = process.env.WEB_SESSION_SIGNING_KEY || BOT_INTERNAL_API_SECRET || "change_me_web_session_key";
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "no-reply@looooooty.local";
const LOCAL_VERIFY_TTL_MS = 1000 * 60 * 60 * 24;
const LOCAL_RESET_TTL_MS = 1000 * 60 * 60;
const LOCAL_LOGIN_MAX_FAILED = Math.max(3, Number(process.env.LOCAL_LOGIN_MAX_FAILED || 5));
const LOCAL_LOGIN_LOCK_MS = Math.max(60 * 1000, Number(process.env.LOCAL_LOGIN_LOCK_MS || (15 * 60 * 1000)));
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_CHECKOUT = 6;
const RATE_LIMIT_MAX_GIVEAWAY = 20;
const RATE_LIMIT_MAX_LOCAL_LOGIN = 20;
const RATE_LIMIT_MAX_LOCAL_FORGOT = 10;
const RATE_LIMIT_MAX_REVIEW = 6;
const RATE_LIMIT_MAX_COUPON = 10;

function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function normalizeBotInternalUrl(value, fallback) {
  const raw = String(value || "").trim();
  return isAbsoluteHttpUrl(raw) ? raw : String(fallback || "").trim();
}

const BASE_STATES_FILE = path.join(BOT_DATA_DIR, "base_states.json");
const APPLICATIONS_FILE = path.join(BOT_DATA_DIR, "base_member_applications.json");
const APPLICATION_FORMS_FILE = path.join(BOT_DATA_DIR, "application_forms.json");
const WEBSITE_SHOP_FILE = path.join(BOT_DATA_DIR, "website_shop.json");
const WEBSITE_SHOP_DEFAULTS_FILE = path.join(process.cwd(), "data", "website_shop_defaults.json");
const BASE_STATES_DEFAULTS_FILE = path.join(process.cwd(), "data", "base_states_defaults.json");
const CREDITS_FILE = path.join(BOT_DATA_DIR, "credits.json");
const GIVEAWAYS_FILE = path.join(BOT_DATA_DIR, "giveaways.json");
const WEBSITE_ORDERS_FILE = path.join(BOT_DATA_DIR, "website_orders.json");
const WEBSITE_READY_ALERTS_FILE = path.join(BOT_DATA_DIR, "website_ready_alerts.json");
const WEB_ACCOUNTS_FILE = path.join(BOT_DATA_DIR, "web_accounts.json");
const LOCAL_ACCOUNTS_FILE = path.join(BOT_DATA_DIR, "web_local_accounts.json");
const WEBSITE_REVIEWS_FILE = path.join(BOT_DATA_DIR, "website_reviews.json");
const WEBSITE_COUPONS_FILE = path.join(BOT_DATA_DIR, "website_coupons.json");

const BASE_STATUS_META = {
  open: { label: "Open", color: "#3fb950" },
  open_less: { label: "Open but less likely to be used", color: "#d29922" },
  closed: { label: "Closed", color: "#f85149" }
};

const oauthStateMap = new Map();
const rateLimitMap = new Map();
const guildMemberCache = new Map();

app.use(express.urlencoded({ extended: false, limit: "12mb" }));
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

function normalizeMinus(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/,/g, "");
}

function parseDeliveryCoords(input) {
  const normalized = normalizeMinus(input);
  const matches = normalized.match(/-?\d+(?:\.\d+)?/g) || [];
  let x = matches.length >= 1 ? Number(matches[0]) : NaN;
  let z = matches.length >= 2 ? Number(matches[1]) : NaN;
  if (Number.isFinite(x) && Number.isFinite(z)) {
    return { x, z };
  }
  const cleaned = normalized.replace(/[^0-9.\-]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  x = Number(parts[0]);
  z = Number(parts[1]);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return { x, z };
}

function computeDeliveryFeeFromCoords(coords) {
  if (!coords) return 0;
  const x = Number(coords.x || 0);
  const z = Number(coords.z || 0);
  const dist = Math.hypot(x, z);
  if (!Number.isFinite(dist)) return 0;
  const threshold = 1000000;
  if (dist <= threshold) return 0;
  const extra = dist - threshold;
  const chunks = Math.ceil(extra / 100000);
  return money(chunks * 0.99);
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

function loadWebsiteOrders() {
  const data = readJson(WEBSITE_ORDERS_FILE, []);
  if (!Array.isArray(data)) {
    writeJson(WEBSITE_ORDERS_FILE, []);
    return [];
  }
  return data;
}

function saveWebsiteOrders(orders) {
  writeJson(WEBSITE_ORDERS_FILE, Array.isArray(orders) ? orders : []);
}

function loadWebsiteReadyAlerts() {
  const data = readJson(WEBSITE_READY_ALERTS_FILE, []);
  if (!Array.isArray(data)) {
    writeJson(WEBSITE_READY_ALERTS_FILE, []);
    return [];
  }
  return data;
}

function saveWebsiteReadyAlerts(alerts) {
  writeJson(WEBSITE_READY_ALERTS_FILE, Array.isArray(alerts) ? alerts : []);
}

function loadWebsiteReviews() {
  const data = readJson(WEBSITE_REVIEWS_FILE, []);
  if (!Array.isArray(data)) {
    writeJson(WEBSITE_REVIEWS_FILE, []);
    return [];
  }
  return data;
}

function saveWebsiteReviews(reviews) {
  writeJson(WEBSITE_REVIEWS_FILE, Array.isArray(reviews) ? reviews : []);
}

function loadWebsiteCoupons() {
  const data = readJson(WEBSITE_COUPONS_FILE, []);
  if (!Array.isArray(data)) {
    writeJson(WEBSITE_COUPONS_FILE, []);
    return [];
  }
  return data;
}

function saveWebsiteCoupons(coupons) {
  writeJson(WEBSITE_COUPONS_FILE, Array.isArray(coupons) ? coupons : []);
}

function normalizeCouponCode(value) {
  return String(value || "").trim().toUpperCase();
}

function computeCouponDiscount({ subtotal, coupon }) {
  if (!coupon || coupon.active === false) return 0;
  const type = String(coupon.type || "").toLowerCase();
  const amount = Number(coupon.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (type === "flat") {
    return Math.min(subtotal, amount);
  }
  const pct = Math.min(100, Math.max(0, amount));
  return Math.min(subtotal, subtotal * (pct / 100));
}

function loadWebAccounts() {
  const data = readJson(WEB_ACCOUNTS_FILE, []);
  if (!Array.isArray(data)) {
    writeJson(WEB_ACCOUNTS_FILE, []);
    return [];
  }
  return data;
}

function saveWebAccounts(accounts) {
  writeJson(WEB_ACCOUNTS_FILE, Array.isArray(accounts) ? accounts : []);
}

function recordWebAccountLogin({ provider, userId, userTag }) {
  const safeProvider = String(provider || "").trim().toLowerCase();
  const safeUserId = String(userId || "").trim();
  const safeUserTag = String(userTag || "").trim().slice(0, 80);
  if (!safeProvider || !safeUserId) {
    return;
  }
  const accounts = loadWebAccounts();
  const now = new Date().toISOString();
  const idx = accounts.findIndex(
    (a) => String(a && a.provider || "") === safeProvider && String(a && a.userId || "") === safeUserId
  );
  if (idx === -1) {
    accounts.push({
      provider: safeProvider,
      userId: safeUserId,
      userTag: safeUserTag || safeUserId,
      firstSeenAt: now,
      lastLoginAt: now,
      loginCount: 1
    });
  } else {
    const prev = accounts[idx] || {};
    accounts[idx] = {
      ...prev,
      provider: safeProvider,
      userId: safeUserId,
      userTag: safeUserTag || String(prev.userTag || safeUserId),
      firstSeenAt: String(prev.firstSeenAt || now),
      lastLoginAt: now,
      loginCount: Number(prev.loginCount || 0) + 1
    };
  }
  saveWebAccounts(accounts);
}

function loadLocalAccounts() {
  const data = readJson(LOCAL_ACCOUNTS_FILE, []);
  if (!Array.isArray(data)) {
    writeJson(LOCAL_ACCOUNTS_FILE, []);
    return [];
  }
  return data;
}

function saveLocalAccounts(accounts) {
  writeJson(LOCAL_ACCOUNTS_FILE, Array.isArray(accounts) ? accounts : []);
}

function findLocalAccountByUserId(userId) {
  const uid = String(userId || "").trim();
  if (!uid) {
    return null;
  }
  const accounts = loadLocalAccounts();
  const idx = accounts.findIndex((a) => String(a && a.userId || "") === uid);
  if (idx === -1) {
    return null;
  }
  return { account: accounts[idx], index: idx, accounts };
}

function maskEmail(email) {
  const value = String(email || "");
  const at = value.indexOf("@");
  if (at <= 1) {
    return value;
  }
  const name = value.slice(0, at);
  const domain = value.slice(at + 1);
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

function createAuthToken() {
  return crypto.randomBytes(24).toString("hex");
}

function hashAuthToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function makeAppUrl(pathname) {
  const base = String(APP_BASE_URL || "").replace(/\/+$/, "");
  const tail = String(pathname || "");
  if (!base) {
    return tail || "/";
  }
  return `${base}${tail.startsWith("/") ? "" : "/"}${tail}`;
}

function localMailerReady() {
  return Boolean(nodemailer && SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

async function sendLocalEmail({ to, subject, text, html }) {
  if (!localMailerReady()) {
    return false;
  }
  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    await transport.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch {
    return false;
  }
}

async function issueLocalVerification(account) {
  if (!account || !account.userId || !account.email) {
    return false;
  }
  const token = createAuthToken();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + LOCAL_VERIFY_TTL_MS).toISOString();
  const found = findLocalAccountByUserId(account.userId);
  if (!found) {
    return false;
  }
  found.accounts[found.index] = {
    ...found.account,
    verifyTokenHash: tokenHash,
    verifyTokenExpiresAt: expiresAt
  };
  saveLocalAccounts(found.accounts);
  const link = makeAppUrl(`/auth/looooooty/verify?uid=${encodeURIComponent(account.userId)}&token=${encodeURIComponent(token)}`);
  const subject = "Verify your Looooooty account email";
  const text = `Verify your Looooooty account by opening this link:\n\n${link}\n\nThis link expires in 24 hours.`;
  const html = `<p>Verify your Looooooty account by clicking below:</p><p><a href="${esc(link)}">${esc(link)}</a></p><p>This link expires in 24 hours.</p>`;
  return sendLocalEmail({ to: account.email, subject, text, html });
}

async function issueLocalPasswordReset(account) {
  if (!account || !account.userId || !account.email) {
    return false;
  }
  const token = createAuthToken();
  const tokenHash = hashAuthToken(token);
  const expiresAt = new Date(Date.now() + LOCAL_RESET_TTL_MS).toISOString();
  const found = findLocalAccountByUserId(account.userId);
  if (!found) {
    return false;
  }
  found.accounts[found.index] = {
    ...found.account,
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: expiresAt
  };
  saveLocalAccounts(found.accounts);
  const link = makeAppUrl(`/auth/looooooty/reset?uid=${encodeURIComponent(account.userId)}&token=${encodeURIComponent(token)}`);
  const subject = "Reset your Looooooty account password";
  const text = `Reset your Looooooty account password:\n\n${link}\n\nThis link expires in 1 hour.`;
  const html = `<p>Reset your Looooooty account password:</p><p><a href="${esc(link)}">${esc(link)}</a></p><p>This link expires in 1 hour.</p>`;
  return sendLocalEmail({ to: account.email, subject, text, html });
}

function normalizeLocalUsername(value) {
  return String(value || "").trim();
}

function normalizeLocalEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidLocalUsername(value) {
  return /^[a-zA-Z0-9._-]{3,32}$/.test(String(value || ""));
}

function isValidLocalEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function hashLocalPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function verifyLocalPassword(password, storedHash) {
  const parts = String(storedHash || "").split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const salt = parts[1];
  const expectedHex = parts[2];
  if (!salt || !expectedHex) {
    return false;
  }
  let actual;
  let expected;
  try {
    actual = Buffer.from(crypto.scryptSync(String(password), salt, 64).toString("hex"), "hex");
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }
  if (actual.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(actual, expected);
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
  const session = getWebSession(req);
  return {
    userId: session ? String(session.userId || "") : "",
    userTag: session ? String(session.userTag || "") : ""
  };
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

function parseForwardedIp(raw) {
  const head = String(raw || "").split(",")[0].trim();
  return head || "";
}

function clientIp(req) {
  const forwarded = parseForwardedIp(req.headers["x-forwarded-for"]);
  return forwarded || req.ip || req.socket?.remoteAddress || "unknown";
}

function setWebSessionCookie(res, token) {
  const secure = String(HOST) !== "127.0.0.1" && String(HOST) !== "localhost";
  const parts = [
    `${WEB_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(WEB_SESSION_TTL_MS / 1000)}`
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearWebSessionCookie(res) {
  const secure = String(HOST) !== "127.0.0.1" && String(HOST) !== "localhost";
  const parts = [
    `${WEB_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function base64UrlEncode(input) {
  return Buffer.from(String(input), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const raw = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = raw + "===".slice((raw.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function signSessionPayload(payloadRaw) {
  return crypto
    .createHmac("sha256", WEB_SESSION_SIGNING_KEY)
    .update(payloadRaw)
    .digest("hex");
}

function encodeWebSessionToken(session) {
  const payloadRaw = base64UrlEncode(JSON.stringify(session));
  const sig = signSessionPayload(payloadRaw);
  return `${payloadRaw}.${sig}`;
}

function decodeWebSessionToken(token) {
  const value = String(token || "");
  const idx = value.lastIndexOf(".");
  if (idx <= 0) {
    return null;
  }
  const payloadRaw = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = signSessionPayload(payloadRaw);
  if (sig !== expected) {
    return null;
  }
  try {
    return JSON.parse(base64UrlDecode(payloadRaw));
  } catch {
    return null;
  }
}

function createWebSession(user) {
  const now = Date.now();
  const session = {
    provider: String(user.provider || "discord"),
    userId: String(user.userId || ""),
    userTag: String(user.userTag || ""),
    avatarUrl: String(user.avatarUrl || ""),
    createdAt: new Date(now).toISOString(),
    expiresAt: now + WEB_SESSION_TTL_MS
  };
  const token = encodeWebSessionToken(session);
  return { token, session };
}

function getWebSession(req) {
  const cookies = parseCookies(req);
  const token = String(cookies[WEB_SESSION_COOKIE] || "").trim();
  if (!token) {
    return null;
  }
  const session = decodeWebSessionToken(token);
  if (!session) {
    return null;
  }
  if (Number(session.expiresAt || 0) <= Date.now()) {
    return null;
  }
  const provider = String(session.provider || "");
  if (!provider) {
    session.provider = isSnowflake(session.userId) ? "discord" : "google";
  }
  return { ...session, token };
}

function destroyWebSession(req, res) {
  clearWebSessionCookie(res);
}

function checkRateLimit(key, maxAllowed, windowMs) {
  const now = Date.now();
  const rec = rateLimitMap.get(key);
  if (!rec || rec.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  rec.count += 1;
  if (rec.count > maxAllowed) {
    return false;
  }
  return true;
}

function discordUserCreatedAtMs(userId) {
  try {
    const n = BigInt(String(userId));
    return Number((n >> 22n) + 1420070400000n);
  } catch {
    return 0;
  }
}

async function isDiscordMemberOfGuild(userId) {
  if (!REQUIRE_GUILD_MEMBERSHIP) {
    return true;
  }
  if (!isSnowflake(userId)) {
    return false;
  }
  if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
    return false;
  }
  const key = `${DISCORD_GUILD_ID}:${userId}`;
  const cached = guildMemberCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return Boolean(cached.ok);
  }
  const url = `https://discord.com/api/v10/guilds/${encodeURIComponent(DISCORD_GUILD_ID)}/members/${encodeURIComponent(userId)}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`
      }
    });
    const ok = response.ok;
    guildMemberCache.set(key, { ok, expiresAt: now + 10 * 60 * 1000 });
    return ok;
  } catch {
    guildMemberCache.set(key, { ok: false, expiresAt: now + 60 * 1000 });
    return false;
  }
}

async function validateWebUserPolicy(session) {
  const provider = String(session && session.provider ? session.provider : "");
  const userId = String(session && session.userId ? session.userId : "");
  if (!userId) {
    return "Login is required.";
  }
  if (provider === "google") {
    return "";
  }
  if (provider === "looooooty") {
    const found = findLocalAccountByUserId(userId);
    if (!found || !found.account) {
      return "Looooooty account not found.";
    }
    return "";
  }
  if (provider && provider !== "discord") {
    return "Unsupported account provider.";
  }
  if (String(userId).startsWith("google:") || String(userId).startsWith("looooooty:")) {
    return "";
  }
  if (!isSnowflake(userId)) {
    return "Invalid Discord identity.";
  }
  if (MIN_DISCORD_ACCOUNT_AGE_DAYS > 0) {
    const createdAtMs = discordUserCreatedAtMs(userId);
    if (!createdAtMs) {
      return "Unable to validate Discord account age.";
    }
    const minAgeMs = MIN_DISCORD_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000;
    if ((Date.now() - createdAtMs) < minAgeMs) {
      return `Discord account must be at least ${MIN_DISCORD_ACCOUNT_AGE_DAYS} day(s) old.`;
    }
  }
  const isMember = await isDiscordMemberOfGuild(userId);
  if (!isMember) {
    if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
      return "Guild membership check is not configured.";
    }
    return "You must be in the Discord server to use store credit and giveaways.";
  }
  return "";
}

function oauthReady() {
  return Boolean(DISCORD_OAUTH_CLIENT_ID && DISCORD_OAUTH_CLIENT_SECRET && DISCORD_OAUTH_REDIRECT_URI);
}

function googleOauthReady() {
  return Boolean(GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REDIRECT_URI);
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

function getLatestApplicationForSession(session) {
  const provider = String(session && session.provider ? session.provider : "").trim();
  const userId = String(session && session.userId ? session.userId : "").trim();
  if (!userId || provider !== "discord") {
    return null;
  }
  return loadApplications()
    .filter((app) => String(app && app.discordUserId ? app.discordUserId : "") === userId)
    .sort((a, b) => String(b && (b.updatedAt || b.createdAt) ? (b.updatedAt || b.createdAt) : "").localeCompare(String(a && (a.updatedAt || a.createdAt) ? (a.updatedAt || a.createdAt) : "")))[0] || null;
}

function markLatestApplicationResultSeenForUser(discordUserId) {
  const target = String(discordUserId || "").trim();
  if (!target) return null;
  const applications = loadApplications();
  const ranked = applications
    .map((app, index) => ({ app, index }))
    .filter(({ app }) => String(app && app.discordUserId ? app.discordUserId : "") === target)
    .sort((a, b) => String(b.app && (b.app.updatedAt || b.app.createdAt) ? (b.app.updatedAt || b.app.createdAt) : "").localeCompare(String(a.app && (a.app.updatedAt || a.app.createdAt) ? (a.app.updatedAt || a.app.createdAt) : "")));
  const hit = ranked[0];
  if (!hit || !hit.app || !["APPROVED", "REJECTED"].includes(String(hit.app.status || ""))) {
    return null;
  }
  if (!hit.app.resultSeenAt) {
    applications[hit.index] = { ...hit.app, resultSeenAt: new Date().toISOString() };
    saveApplications(applications);
    return applications[hit.index];
  }
  return hit.app;
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
        inStock: p && p.inStock === false ? false : true,
        stockQty: Number.isFinite(Number(p && p.stockQty)) ? Number(p.stockQty) : null
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
        inStock: p && p.inStock === false ? false : true,
        stockQty: Number.isFinite(Number(p && p.stockQty)) ? Number(p.stockQty) : null
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

function isValidCreditAccountId(value) {
  const id = String(value || "").trim();
  if (!id) {
    return false;
  }
  if (isSnowflake(id)) {
    return true;
  }
  return /^[a-z][a-z0-9_-]{1,31}:[A-Za-z0-9._:@-]{3,200}$/.test(id);
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

function sideMenuHtml(session = {}) {
  const userId = String(session && session.userId ? session.userId : "");
  const authLabel = userId ? "Account" : "Sign Up";
  const latestApplication = getLatestApplicationForSession(session);
  const hasApplicationResult = latestApplication && ["APPROVED", "REJECTED"].includes(String(latestApplication.status || ""));
  const applicationResultUnread = hasApplicationResult && !latestApplication.resultSeenAt;
  return `<div class="menu-shell">
    <div class="brand-lockup">
      <div class="brand-mark-sm"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /></div>
      <div>
        <div class="brand-kicker">Looooooty Network</div>
        <div class="brand">LooooootyBases</div>
      </div>
    </div>
    <nav class="menu">
      <a href="/bases">State of bases</a>
      <a href="/giveaways">Giveaways</a>
      <a href="/about">About Us</a>
      <a href="/how-to-order">How to order</a>
      <a href="/apply">Apply</a>
      ${hasApplicationResult ? `<a href="/application-result">Application Result${applicationResultUnread ? " • New" : ""}</a>` : ""}
      <a href="${DISCORD_INVITE_URL}" target="_blank" rel="noreferrer">Discord</a>
      <a href="/shop">LooooootyShop</a>
      <a href="/auth">${authLabel}</a>
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
    :root {
      --txt: #f4f7ff;
      --muted: #9ca4bb;
      --line: rgba(255,255,255,0.12);
      --panel: rgba(7,10,18,0.82);
      --panel-2: rgba(10,14,26,0.9);
      --panel-3: rgba(255,255,255,0.04);
      --blue: #4f95ea;
      --blue-2: #8ad0ff;
      --green: #1f8f4e;
      --red: #b03a43;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--txt);
      font-family: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 20% 14%, rgba(111, 79, 255, 0.16), transparent 22%),
        radial-gradient(circle at 79% 20%, rgba(93, 127, 255, 0.12), transparent 24%),
        linear-gradient(180deg, #010204 0%, #03050b 45%, #060914 100%);
      overflow-x: hidden;
    }
    body::before,
    body::after { content: none; }
    .layout {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: 100vh;
      gap: 24px;
      width: min(1540px, calc(100% - 40px));
      margin: 24px auto;
      align-items: start;
    }
    .side { display: flex; align-items: stretch; }
    .menu-shell {
      width: 100%;
      min-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 22px 18px;
      border-radius: 28px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(8,12,24,0.92), rgba(5,8,18,0.96));
      box-shadow: 0 12px 36px rgba(0,0,0,0.28);
      backdrop-filter: none;
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 4px 2px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .brand-mark-sm img {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.14);
      object-fit: cover;
      background: rgba(255,255,255,0.04);
    }
    .brand-kicker {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .brand {
      font-size: 26px;
      font-weight: 1000;
      font-style: italic;
      letter-spacing: -0.05em;
      line-height: 0.95;
    }
    .menu {
      display: grid;
      gap: 10px;
    }
    .menu a {
      color: var(--txt);
      text-decoration: none;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      border-radius: 999px;
      padding: 13px 16px;
      font-weight: 900;
      letter-spacing: 0.01em;
      transition: border-color .16s ease, transform .16s ease, background .16s ease;
    }
    .menu a:hover {
      border-color: rgba(138,208,255,0.34);
      background: rgba(255,255,255,0.06);
      transform: translateY(-1px);
    }
    .main {
      display: grid;
      align-content: start;
      gap: 18px;
    }
    .page-topbar,
    .hero,
    .page-panel,
    .page-card,
    .state-box {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(10,15,27,0.95), rgba(7,10,18,0.92));
      box-shadow: 0 12px 32px rgba(0,0,0,0.24);
    }
    .page-topbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 18px;
      padding: 16px 22px;
      border-radius: 24px;
      backdrop-filter: none;
      background: rgba(2,4,8,0.8);
    }
    .page-topbar .mark {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .page-topbar .mark img {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.14);
      object-fit: cover;
      background: rgba(255,255,255,0.04);
    }
    .page-topbar .mark b {
      font-size: 24px;
      font-style: italic;
      font-weight: 1000;
      letter-spacing: -0.05em;
      white-space: nowrap;
    }
    .page-topbar nav {
      display: flex;
      justify-content: center;
      gap: 22px;
      flex-wrap: wrap;
    }
    .page-topbar nav a {
      color: var(--muted);
      text-decoration: none;
      font-weight: 800;
    }
    .page-topbar nav a:hover,
    .page-topbar nav a.active {
      color: var(--txt);
    }
    .top-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pill,
    .btn,
    .submit,
    .top-actions a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      color: var(--txt);
      text-decoration: none;
      font-weight: 900;
      cursor: pointer;
      transition: transform .14s ease, border-color .14s ease, background .14s ease, filter .14s ease;
    }
    .pill:hover,
    .btn:hover,
    .submit:hover,
    .top-actions a:hover {
      transform: translateY(-1px);
      border-color: rgba(138,208,255,0.36);
      filter: brightness(1.03);
    }
    .pill.primary,
    .top-actions a.primary {
      background: rgba(255,255,255,0.08);
    }
    .submit {
      background: linear-gradient(180deg, #5da8ff, #4388df);
      border-color: rgba(115,177,255,0.45);
      color: white;
      min-height: 50px;
      padding: 0 22px;
    }
    .hero {
      padding: 34px 30px 28px;
      border-radius: 30px;
      background:
        radial-gradient(circle at 50% 0%, rgba(102,125,255,0.13), transparent 26%),
        linear-gradient(180deg, rgba(8,13,30,0.97), rgba(6,10,22,0.98));
    }
    .page-kicker, .state-head {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 18px;
    }
    .page-title {
      margin: 0;
      font-size: clamp(44px, 7vw, 86px);
      line-height: 0.9;
      letter-spacing: -0.06em;
      font-weight: 1000;
    }
    .page-title em { font-style: italic; }
    .page-sub {
      margin: 16px 0 0;
      max-width: 820px;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.68;
    }
    .page-stats {
      margin-top: 24px;
      display: inline-grid;
      grid-template-columns: repeat(3, minmax(130px, 1fr));
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      background: rgba(255,255,255,0.03);
      backdrop-filter: none;
    }
    .page-stat {
      padding: 16px 24px;
      border-right: 1px solid var(--line);
    }
    .page-stat:last-child { border-right: 0; }
    .page-stat b {
      display: block;
      font-size: clamp(28px, 4vw, 42px);
      line-height: 1;
      margin-bottom: 6px;
    }
    .page-stat span {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 12px;
      font-weight: 800;
    }
    .page-grid {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 18px;
    }
    .page-panel,
    .page-card,
    .state-box {
      border-radius: 26px;
      padding: 22px;
      text-align: left;
    }
    .page-panel h2,
    .page-card h2,
    .page-panel h3,
    .page-card h3 {
      margin: 0 0 10px;
      font-size: 28px;
      letter-spacing: -0.04em;
    }
    .panel-copy,
    .page-copy,
    .note,
    .subtle {
      color: var(--muted);
      line-height: 1.7;
    }
    .msg {
      margin: 0 0 12px 0;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(49,255,131,0.18);
      background: rgba(10,27,18,0.72);
      color: #9cffc5;
      font-weight: 800;
    }
    .warn {
      margin: 0 0 12px 0;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(255,130,130,0.2);
      background: rgba(60,16,18,0.78);
      color: #ffc4c4;
      font-weight: 800;
    }
    .base-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      padding: 14px 0;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .base-row:first-of-type { border-top: 0; }
    .badge {
      color: #081019;
      font-weight: 900;
      font-size: 12px;
      padding: 7px 11px;
      border-radius: 999px;
    }
    .form-grid {
      display: grid;
      gap: 12px;
      text-align: left;
    }
    .form-grid label {
      color: rgba(244,247,255,0.88);
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.01em;
    }
    .form-grid input,
    .form-grid textarea,
    .form-grid select,
    input[type=text],
    input[type=password],
    input[type=email],
    textarea,
    select {
      width: 100%;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.03);
      color: var(--txt);
      font-size: 15px;
      outline: none;
    }
    .form-grid textarea,
    textarea {
      min-height: 120px;
      resize: vertical;
    }
    .form-grid input:focus,
    .form-grid textarea:focus,
    .form-grid select:focus,
    input[type=text]:focus,
    input[type=password]:focus,
    input[type=email]:focus,
    textarea:focus,
    select:focus {
      border-color: rgba(108,168,255,0.48);
      box-shadow: 0 0 0 3px rgba(108,168,255,0.12);
    }
    .panel-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }
    .account-meta {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px;
      background: rgba(255,255,255,0.03);
      padding: 14px 16px;
      line-height: 1.7;
      margin: 12px 0 0;
    }
    .auth-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: 1fr 1fr;
      margin-top: 16px;
    }
    .auth-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 54px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.12);
      background: linear-gradient(180deg, rgba(17,25,46,0.96), rgba(9,14,28,0.94));
      color: var(--txt);
      font-weight: 900;
      text-decoration: none;
      padding: 12px 14px;
      text-align: center;
      transition: transform .14s ease, border-color .14s ease;
    }
    .auth-btn:hover {
      transform: translateY(-1px);
      border-color: rgba(138,208,255,0.36);
    }
    .auth-btn.disabled {
      opacity: 0.45;
      pointer-events: none;
    }
    @media (max-width: 1120px) {
      .layout {
        grid-template-columns: 1fr;
        width: min(100% - 24px, 1540px);
      }
      .menu-shell { min-height: auto; }
      .page-topbar {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .page-topbar .mark,
      .page-topbar nav,
      .top-actions {
        justify-content: center;
      }
      .page-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 760px) {
      .layout {
        margin: 12px auto 22px;
        gap: 14px;
      }
      .hero,
      .page-panel,
      .page-card,
      .state-box,
      .page-topbar {
        border-radius: 22px;
      }
      .hero { padding: 24px 18px 22px; }
      .page-panel,
      .page-card,
      .state-box { padding: 18px; }
      .auth-grid { grid-template-columns: 1fr; }
      .page-stats {
        grid-template-columns: 1fr;
        width: 100%;
      }
      .page-stat {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .page-stat:last-child { border-bottom: 0; }
    }
  </style>`;
}

function faviconLinks() {
  return `<link rel="icon" type="image/png" href="${SITE_ICON_URL}" />
  <link rel="shortcut icon" href="${SITE_ICON_URL}" />
  <link rel="apple-touch-icon" href="${SITE_ICON_URL}" />`;
}

function homeHtml(session = {}) {
  const userId = String(session && session.userId ? session.userId : "");
  const authLabel = userId ? "Account" : "Sign Up";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LooooootyBases 2b2t</title>
  ${faviconLinks()}
  <style>
    :root {
      --txt: #f6f7fb;
      --muted: #a8b3cd;
      --line: rgba(133, 157, 255, 0.16);
      --panel: rgba(11, 16, 36, 0.88);
      --blue: #6ca8ff;
      --blue-2: #8ad0ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--txt);
      font-family: "Segoe UI", Inter, system-ui, sans-serif;
      background:
        linear-gradient(120deg, rgba(5,10,20,0.72), rgba(5,10,20,0.54)),
        radial-gradient(circle at 22% 18%, rgba(104, 125, 255, 0.08), transparent 24%),
        radial-gradient(circle at 78% 22%, rgba(90, 151, 255, 0.08), transparent 20%),
        url('${HOME_BG_URL}') center/cover no-repeat;
      overflow-x: hidden;
    }
    body::before { content: none; }
    .layout {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: 100vh;
      gap: 22px;
      width: min(1480px, calc(100% - 40px));
      margin: 24px auto;
    }
    .side { padding: 0; display: flex; align-items: stretch; }
    .menu-shell {
      border: 1px solid rgba(255,255,255,0.12);
      background: linear-gradient(180deg, rgba(20,27,47,0.94), rgba(11,16,31,0.92));
      backdrop-filter: none;
      border-radius: 28px;
      padding: 18px;
      width: 100%;
      min-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 36px rgba(0,0,0,0.28);
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      margin-bottom: 16px;
      font-style: italic;
      letter-spacing: -0.03em;
    }
    .menu { display: grid; gap: 12px; }
    .menu a {
      color: var(--txt);
      text-decoration: none;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(15,20,30,0.54);
      border-radius: 16px;
      padding: 14px 16px;
      font-weight: 700;
      transition: border-color .16s ease, transform .16s ease;
    }
    .menu a:hover { border-color: rgba(108,168,255,0.46); transform: translateY(-1px); }
    .main {
      display: grid;
      align-content: start;
      gap: 22px;
      padding: 0;
    }
    .topbar {
      display:flex;
      justify-content: space-between;
      align-items:center;
      gap: 14px;
      padding: 14px 18px;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 999px;
      background: rgba(9,14,28,0.84);
      box-shadow: 0 10px 24px rgba(0,0,0,0.22);
      backdrop-filter: none;
      flex-wrap: wrap;
    }
    .topbar-brand {
      display:flex;
      align-items:center;
      gap:12px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .topbar-brand img {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.14);
      object-fit: cover;
      background: rgba(255,255,255,0.04);
    }
    .topbar-actions {
      display:flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items:center;
    }
    .pill {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height: 44px;
      padding: 0 18px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: var(--txt);
      text-decoration: none;
      font-weight: 800;
      transition: transform .14s ease, border-color .14s ease;
    }
    .pill:hover { border-color: rgba(108,168,255,0.45); transform: translateY(-1px); }
    .pill.primary {
      background: linear-gradient(135deg, rgba(69,128,255,0.26), rgba(42,78,181,0.3));
      border-color: rgba(108,168,255,0.4);
    }
    .hero {
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 34px;
      padding: 54px 42px 40px;
      text-align: center;
      background:
        radial-gradient(circle at 50% 18%, rgba(117,122,255,0.18), transparent 24%),
        linear-gradient(180deg, rgba(10,14,28,0.88), rgba(8,11,24,0.94));
      box-shadow: 0 14px 36px rgba(0,0,0,0.24);
    }
    .hero-badge {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height: 34px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--blue-2);
      background: rgba(255,255,255,0.03);
      text-transform: uppercase;
      letter-spacing: 0.22em;
      font-size: 0.78rem;
      font-weight: 800;
    }
    h1 {
      margin: 18px 0 10px 0;
      font-size: clamp(54px, 10vw, 120px);
      line-height: 0.9;
      font-weight: 1000;
      letter-spacing: -0.06em;
    }
    .title-italic { font-style: italic; }
    .sub {
      margin: 0 auto;
      max-width: 760px;
      color: var(--muted);
      font-size: 1.08rem;
      line-height: 1.78;
    }
    .hero-stats {
      margin-top: 28px;
      display: inline-grid;
      grid-template-columns: repeat(3, minmax(120px, 1fr));
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      overflow: hidden;
    }
    .hero-stat {
      padding: 16px 24px;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .hero-stat:last-child { border-right: 0; }
    .hero-stat b {
      display: block;
      font-size: 2rem;
      line-height: 1;
      margin-bottom: 6px;
    }
    .hero-stat span {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .btn-box {
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 34px;
      padding: 28px;
      background: linear-gradient(180deg, rgba(10,14,28,0.86), rgba(8,12,25,0.88));
      box-shadow: 0 22px 68px rgba(0,0,0,0.3);
    }
    .btns {
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 16px;
      max-width: 900px;
      margin: 0 auto;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 70px;
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.12);
      color: var(--txt);
      text-decoration: none;
      font-weight: 900;
      font-size: 1.08rem;
      padding: 14px 18px;
      background: linear-gradient(180deg, rgba(43,63,102,0.56), rgba(18,26,43,0.78));
      transition: transform .16s ease, border-color .16s ease;
    }
    .btn:hover { border-color: rgba(108,168,255,0.46); transform: translateY(-1px); }
    .foot { margin-top: 18px; font-size: 13px; color: var(--muted); text-align:center; }
    @media (max-width: 1120px) {
      .layout { grid-template-columns: 1fr; width: min(100% - 24px, 1480px); }
      .menu-shell { min-height: auto; }
    }
    @media (max-width: 760px) {
      .layout { margin: 12px auto 22px; gap: 14px; }
      .hero, .btn-box { border-radius: 24px; padding: 28px 18px 22px; }
      .btns { grid-template-columns: 1fr; }
      .hero-stats { grid-template-columns: 1fr; width: 100%; }
      .hero-stat { border-right: 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .hero-stat:last-child { border-bottom: 0; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="topbar">
        <div class="topbar-brand">
          <img src="${SITE_ICON_URL}" alt="Looooooty logo" />
          <span>Looooooty Network</span>
        </div>
        <div class="topbar-actions">
          <a class="pill" href="/bases">State of bases</a>
          <a class="pill" href="/shop">Shop</a>
          <a class="pill" href="/apply">Apply</a>
          <a class="pill primary" href="/auth">${authLabel}</a>
        </div>
      </section>
      <section class="hero">
        <div class="hero-badge">Official 2b2t Portal</div>
        <h1><span class="title-italic">LooooootyBases</span> | 2b2t</h1>
        <p class="sub">The main portal for LooooootyBases, LooooootyShop, applications, account access, and public information.</p>
        <div class="hero-stats">
          <div class="hero-stat"><b>6</b><span>Bases</span></div>
          <div class="hero-stat"><b>300+</b><span>Kits</span></div>
          <div class="hero-stat"><b>24/7</b><span>Growth</span></div>
        </div>
      </section>
      <section class="btn-box">
        <div class="btns">
          <a class="btn" href="${DISCORD_INVITE_URL}" target="_blank" rel="noreferrer">Join Discord</a>
          <a class="btn" href="/shop">Open Shop</a>
          <a class="btn" href="/apply">Applications</a>
          <a class="btn" href="/auth">${authLabel}</a>
        </div>
        <div class="foot">Use this portal to access the shop, applications, and account features.</div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function basesPageHtml
(bases, session = {}) {
  const authLabel = String(session && session.userId ? "Account" : "Sign Up");
  const openCount = bases.filter((b) => b.state === "open").length;
  const closedCount = bases.filter((b) => b.state === "closed").length;
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
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a class="active" href="/bases">State of Bases</a>
          <a href="/shop">Shop</a>
          <a href="/apply">Apply</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/">Back Home</a>
          <a class="pill primary" href="/auth">${authLabel}</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Operations</div>
        <h1 class="page-title">State of <em>Bases</em></h1>
        <p class="page-sub">Track which bases are open, restricted, or currently less active.</p>
        <div class="page-stats">
          <div class="page-stat"><b>${bases.length}</b><span>Total Bases</span></div>
          <div class="page-stat"><b>${openCount}</b><span>Open</span></div>
          <div class="page-stat"><b>${closedCount}</b><span>Closed</span></div>
        </div>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>Current base access</h2>
          <div class="panel-copy">This is the public-safe view of which bases are operational, quieter, or restricted.</div>
          <div style="margin-top:14px;">${baseStateListHtml(bases)}</div>
        </article>
        <aside class="page-card">
          <h3>Status meaning</h3>
          <div class="subtle">
            <p><b>Open</b> means normal access.</p>
            <p><b>Open but less likely to be used</b> means the base exists but is not the current focus.</p>
            <p><b>Closed</b> means access is restricted for safety or operational reasons.</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>`;
}


function aboutPageHtml(session = {}) {
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
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a href="/bases">State of Bases</a>
          <a href="/shop">Shop</a>
          <a class="active" href="/about">About</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/">Back Home</a>
          <a class="pill primary" href="/shop/web">Website Shop</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Network Overview</div>
        <h1 class="page-title">About <em>Looooooty</em></h1>
        <p class="page-sub">Information about the network, the project, and what Looooooty is building on 2b2t.</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>About the project</h2>
          <div class="page-copy" style="white-space:pre-wrap;">${esc(ABOUT_US_TEXT)}</div>
        </article>
        <aside class="page-card">
          <h3>Core pillars</h3>
          <div class="subtle">
            <p><b>Operations:</b> base management and controlled access.</p>
            <p><b>Commerce:</b> shop infrastructure that supports delivery flows.</p>
            <p><b>Trust:</b> applications, ranks, reviews, and account identity tied into one system.</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>`;
}


function howToOrderHtml(session = {}) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>How to Order</title>
  ${faviconLinks()}
  <style>
    :root {
      --txt: #f6f7fb;
      --muted: #9ba8c7;
      --line: rgba(133, 157, 255, 0.18);
      --panel: rgba(11, 16, 36, 0.88);
      --panel-2: rgba(16, 24, 52, 0.82);
      --blue: #6ca8ff;
      --blue-2: #8ad0ff;
      --green: #3cff8f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--txt);
      font-family: "Segoe UI", Inter, system-ui, sans-serif;
      background:
        radial-gradient(circle at 20% 18%, rgba(104, 125, 255, 0.12), transparent 26%),
        radial-gradient(circle at 78% 24%, rgba(90, 151, 255, 0.11), transparent 22%),
        radial-gradient(circle at 50% 54%, rgba(88, 76, 168, 0.18), transparent 34%),
        linear-gradient(180deg, #02040a 0%, #070b18 48%, #050814 100%);
      overflow-x: hidden;
    }
    body::before { content: none; }
    .shell {
      position: relative;
      z-index: 1;
      width: min(1480px, calc(100% - 40px));
      margin: 26px auto;
      display: grid;
      grid-template-columns: 290px minmax(0, 1fr);
      gap: 22px;
    }
    .side {
      align-self: start;
      position: relative;
      padding: 18px;
      border-radius: 28px;
      background: linear-gradient(180deg, rgba(20,27,47,0.94), rgba(11,16,31,0.92));
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 12px 28px rgba(0,0,0,0.24);
      backdrop-filter: none;
    }
    .content {
      display: grid;
      gap: 22px;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 999px;
      background: rgba(9, 14, 28, 0.84);
      box-shadow: 0 10px 24px rgba(0,0,0,0.22);
      backdrop-filter: none;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .brand img {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.14);
      object-fit: cover;
      background: rgba(255,255,255,0.04);
    }
    .brand span { color: var(--txt); }
    .nav-links, .top-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 44px;
      padding: 0 18px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: var(--txt);
      text-decoration: none;
      font-weight: 700;
      transition: 160ms ease;
    }
    .pill:hover { border-color: rgba(108,168,255,0.45); transform: translateY(-1px); }
    .pill.primary {
      background: linear-gradient(135deg, rgba(69,128,255,0.26), rgba(42,78,181,0.3));
      border-color: rgba(108,168,255,0.4);
    }
    .hero {
      padding: 54px 52px 42px;
      border-radius: 34px;
      border: 1px solid rgba(255,255,255,0.08);
      background:
        radial-gradient(circle at 50% 18%, rgba(117,122,255,0.18), transparent 24%),
        linear-gradient(180deg, rgba(10,14,28,0.88), rgba(8,11,24,0.94));
      box-shadow: 0 14px 36px rgba(0,0,0,0.24);
      text-align: center;
      overflow: hidden;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 34px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--blue-2);
      background: rgba(255,255,255,0.03);
      text-transform: uppercase;
      letter-spacing: 0.22em;
      font-size: 0.78rem;
      font-weight: 800;
    }
    .hero h1 {
      margin: 18px 0 10px;
      font-size: clamp(3.5rem, 8vw, 6.4rem);
      line-height: 0.92;
      font-weight: 950;
      letter-spacing: -0.05em;
    }
    .hero h1 em { font-style: italic; }
    .hero-sub {
      margin: 0 auto;
      max-width: 760px;
      color: var(--muted);
      font-size: 1.08rem;
      line-height: 1.75;
    }
    .hero-stats {
      margin-top: 28px;
      display: inline-grid;
      grid-template-columns: repeat(3, minmax(120px, 1fr));
      gap: 0;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      overflow: hidden;
    }
    .hero-stat {
      padding: 18px 26px;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .hero-stat:last-child { border-right: 0; }
    .hero-stat strong {
      display: block;
      font-size: 2rem;
      line-height: 1;
      margin-bottom: 6px;
    }
    .hero-stat span {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
      gap: 22px;
    }
    .panel {
      border-radius: 30px;
      border: 1px solid rgba(255,255,255,0.08);
      background: linear-gradient(180deg, rgba(10,14,29,0.9), rgba(10,15,31,0.82));
      box-shadow: 0 18px 48px rgba(0,0,0,0.3);
      padding: 28px;
    }
    .panel h2, .panel h3 {
      margin: 0 0 12px;
      font-size: 1.55rem;
      letter-spacing: -0.03em;
    }
    .panel p, .panel li { color: var(--muted); line-height: 1.72; }
    .how-copy {
      white-space: pre-wrap;
      color: var(--txt);
      font-size: 1rem;
      line-height: 1.85;
    }
    .how-copy b, .how-copy strong { color: #fff; }
    .checklist {
      display: grid;
      gap: 12px;
      margin-top: 8px;
    }
    .check-item {
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: var(--txt);
      font-weight: 700;
    }
    .check-item small {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-weight: 500;
      line-height: 1.5;
    }
    @media (max-width: 1120px) {
      .shell { grid-template-columns: 1fr; }
      .side { position: static; }
      .grid { grid-template-columns: 1fr; }
      .topbar { border-radius: 28px; }
    }
    @media (max-width: 760px) {
      .shell { width: min(100% - 20px, 1480px); margin: 14px auto 24px; gap: 14px; }
      .hero { padding: 30px 18px 24px; border-radius: 24px; }
      .hero-stats { grid-template-columns: 1fr; width: 100%; }
      .hero-stat { border-right: 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .hero-stat:last-child { border-bottom: 0; }
      .panel { padding: 20px; border-radius: 24px; }
      .topbar { padding: 14px; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="content">
      <section class="topbar">
        <div class="brand">
          <img src="${SHOP_LOGO_URL}" alt="Shop logo" />
          <span>LooooootyShop 2b2t</span>
        </div>
        <div class="top-actions">
          <a class="pill" href="/shop">Shop Options</a>
          <a class="pill primary" href="/shop/web">Website Shop</a>
          <a class="pill" href="/shop/reviews">Reviews</a>
          <a class="pill" href="/">Back Home</a>
        </div>
      </section>
      <section class="hero">
        <div class="hero-badge">Ordering Guide</div>
        <h1><em>How to</em> Order</h1>
        <p class="hero-sub">Everything you need to know before placing an order, from adding items to delivery.</p>
        <div class="hero-stats">
          <div class="hero-stat"><strong>1</strong><span>Browse</span></div>
          <div class="hero-stat"><strong>2</strong><span>Checkout</span></div>
          <div class="hero-stat"><strong>3</strong><span>Delivery</span></div>
        </div>
      </section>
      <section class="grid">
        <article class="panel">
          <h2>Full Ordering Flow</h2>
          <div class="how-copy">${esc(HOW_TO_ORDER_TEXT)}</div>
        </article>
        <aside class="panel">
          <h3>Quick Checklist</h3>
          <div class="checklist">
            <div class="check-item">Pick your products<small>Add the items you want to the cart and confirm quantities before paying.</small></div>
            <div class="check-item">Choose your payment<small>Use store credit if you have it, or finish the remaining balance with PayPal.</small></div>
            <div class="check-item">Send IGN and coords<small>After payment, provide delivery information exactly so staff can fulfill the order fast.</small></div>
            <div class="check-item">Confirm you are ready<small>When staff ask if you are ready, click the ready button so the delivery queue moves.</small></div>
          </div>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>`;
}


function authPageHtml({ session = {}, msg = "", err = "", next = "/", localAccount = null }) {
  const userId = String(session && session.userId ? session.userId : "");
  const userTag = String(session && session.userTag ? session.userTag : "");
  const provider = String(session && session.provider ? session.provider : "");
  const nextPath = next && String(next).startsWith("/") ? String(next) : "/";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${userId ? "Account" : "Sign Up / Login"}</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a href="/shop">Shop</a>
          <a href="/shop/reviews">Reviews</a>
          <a class="active" href="/auth">Account</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/">Back Home</a>
          <a class="pill primary" href="/shop/web">Website Shop</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Identity & Access</div>
        <h1 class="page-title">${userId ? "Your" : "Access the"} <em>Account</em></h1>
        <p class="page-sub">Sign in, manage your account, and access account-linked shop features.</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>${userId ? "Current session" : "Choose a sign-in method"}</h2>
          ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
          ${err ? `<div class="warn">${esc(err)}</div>` : ""}
          ${userId
            ? `<div class="account-meta">
                Logged in as: <b>${esc(userTag || "User")}</b><br/>
                Provider: <b>${esc(provider || "unknown")}</b><br/>
                Account ID: <b>${esc(userId)}</b>${provider === "looooooty" ? `<br/>Email: <b>${esc(localAccount && localAccount.email ? localAccount.email : "-")}</b>` : ""}
              </div>
              <div class="panel-actions">
                <form method="post" action="/auth/logout?next=${encodeURIComponent(nextPath)}" style="margin:0;">
                  <button class="submit" type="submit">Logout</button>
                </form>
                <a class="btn" href="${provider === "looooooty" ? "/account" : esc(nextPath)}">${provider === "looooooty" ? "Account Settings" : "Back"}</a>
              </div>`
            : `<div class="auth-grid">
                <a class="auth-btn" href="/auth/looooooty?mode=login&next=${encodeURIComponent(nextPath)}">Log in with Looooooty Accounts</a>
                <a class="auth-btn" href="/auth/google/start?next=%2Fauth">Log in with Google</a>
                <a class="auth-btn" href="/auth/looooooty?mode=signup&next=${encodeURIComponent(nextPath)}">Create a Looooooty Account</a>
                <a class="auth-btn" href="/auth/discord/start?next=%2Fauth">Log in with Discord</a>
              </div>`}
        </article>
        <aside class="page-card">
          <h3>Why accounts matter</h3>
          <div class="subtle">
            <p>Accounts connect reviews, giveaway identity, store credit, and future order history.</p>
            <p>Discord and Google are external providers. Looooooty Accounts are local and support password reset.</p>
            <p>You can browse without logging in, but account-linked features depend on it.</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>`;
}


function localAuthPageHtml({ mode = "login", msg = "", err = "", next = "/auth", session = {} }) {
  const safeMode = mode === "signup" ? "signup" : mode === "forgot" ? "forgot" : "login";
  const nextPath = next && String(next).startsWith("/") ? String(next) : "/auth";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeMode === "signup" ? "Create Looooooty Account" : safeMode === "forgot" ? "Reset Password" : "Login Looooooty Account"}</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a href="/auth">Account</a>
          <a href="/shop/web">Store</a>
          <a href="/shop/reviews">Reviews</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/auth">Back</a>
          <a class="pill primary" href="/shop/web">Website Shop</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Local Accounts</div>
        <h1 class="page-title">${safeMode === "signup" ? "Create" : safeMode === "forgot" ? "Reset" : "Login to"} <em>Looooooty</em></h1>
        <p class="page-sub">Create a local account, sign in, or reset access to your account.</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>${safeMode === "signup" ? "Create account" : safeMode === "forgot" ? "Forgot password" : "Login"}</h2>
          ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
          ${err ? `<div class="warn">${esc(err)}</div>` : ""}
          ${safeMode === "signup"
            ? `<form class="form-grid" method="post" action="/auth/looooooty/signup?next=${encodeURIComponent(nextPath)}">
                <input type="text" name="username" required maxlength="32" placeholder="Username (3-32 letters/numbers/._-)" />
                <input type="email" name="email" required maxlength="120" placeholder="Email" />
                <input type="password" name="password" required minlength="8" maxlength="120" placeholder="Password (min 8 chars)" />
                <input type="password" name="password_confirm" required minlength="8" maxlength="120" placeholder="Confirm password" />
                <button class="submit" type="submit">Create Account</button>
              </form>`
            : safeMode === "forgot"
              ? `<form class="form-grid" method="post" action="/auth/looooooty/forgot?next=${encodeURIComponent(nextPath)}">
                  <input type="email" name="email" required maxlength="120" placeholder="Email" />
                  <button class="submit" type="submit">Send reset email</button>
                </form>`
              : `<form class="form-grid" method="post" action="/auth/looooooty/login?next=${encodeURIComponent(nextPath)}">
                  <input type="text" name="login" required maxlength="120" placeholder="Username or email" />
                  <input type="password" name="password" required maxlength="120" placeholder="Password" />
                  <button class="submit" type="submit">Login</button>
                </form>
                <div class="panel-actions">
                  <a class="btn" href="/auth/looooooty?mode=signup&next=${encodeURIComponent(nextPath)}">Create account</a>
                  <a class="btn" href="/auth/looooooty?mode=forgot&next=${encodeURIComponent(nextPath)}">Forgot password?</a>
                </div>`}
        </article>
        <aside class="page-card">
          <h3>Local account notes</h3>
          <div class="subtle">
            <p>Local accounts are the base for email verification and password resets.</p>
            <p>They stay separate from Discord and Google logins, but still connect into the same storefront account system.</p>
            <p>If SMTP is configured, forgot-password sends a real reset link.</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>`;
}


function localResetPasswordPageHtml({ msg = "", err = "", uid = "", token = "", next = "/auth" }) {
  const nextPath = next && String(next).startsWith("/") ? String(next) : "/auth";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Reset Password</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a class="active" href="/auth">Account</a>
          <a href="/shop/web">Store</a>
          <a href="/shop/reviews">Reviews</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/auth">Back</a>
          <a class="pill primary" href="/shop/web">Website Shop</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Recovery</div>
        <h1 class="page-title">Reset <em>Password</em></h1>
        <p class="page-sub">Reset your password securely using the email linked to your account.</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>Choose a new password</h2>
          ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
          ${err ? `<div class="warn">${esc(err)}</div>` : ""}
          <form class="form-grid" method="post" action="/auth/looooooty/reset?next=${encodeURIComponent(nextPath)}">
            <input type="hidden" name="uid" value="${esc(uid)}" />
            <input type="hidden" name="token" value="${esc(token)}" />
            <input type="password" name="password" required minlength="8" maxlength="120" placeholder="New password (min 8 chars)" />
            <input type="password" name="password_confirm" required minlength="8" maxlength="120" placeholder="Confirm new password" />
            <button class="submit" type="submit">Update Password</button>
          </form>
        </article>
        <aside class="page-card">
          <h3>Reset notes</h3>
          <div class="subtle">
            <p>Use a password you have not already used for this account.</p>
            <p>The reset token is time-limited, so expired links need a new reset request.</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>`;
}


function accountSettingsPageHtml({ session, account, msg = "", err = "" }) {
  const userTag = String(session && session.userTag ? session.userTag : "");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Account Settings</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a class="active" href="/account">Account</a>
          <a href="/shop/web">Store</a>
          <a href="/shop/reviews">Reviews</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/auth">Back to Access</a>
          <a class="pill primary" href="/shop/web">Website Shop</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Account Management</div>
        <h1 class="page-title">Account <em>Settings</em></h1>
        <p class="page-sub">Manage your profile details and update your password from one place.</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>Your account</h2>
          ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
          ${err ? `<div class="warn">${esc(err)}</div>` : ""}
          <div class="account-meta">
            Username: <b>${esc(userTag || account.username || "-")}</b><br/>
            Email: <b>${esc(account.email || "-")}</b><br/>
            Verified: <b>${account.emailVerified ? "Yes" : "No"}</b>
          </div>
          <form class="form-grid" method="post" action="/account/profile" style="margin-top:14px;">
            <h3 style="margin:4px 0;">Profile</h3>
            <input type="text" name="username" required maxlength="32" value="${esc(account.username || "")}" />
            <input type="email" name="email" required maxlength="120" value="${esc(account.email || "")}" />
            <button class="submit" type="submit">Save Profile</button>
          </form>
          ${account.emailVerified ? "" : `<div class="note" style="margin-top:12px;">Email verification is temporarily disabled.</div>`}
          <form class="form-grid" method="post" action="/account/password" style="margin-top:14px;">
            <h3 style="margin:4px 0;">Change Password</h3>
            <input type="password" name="current_password" required maxlength="120" placeholder="Current password" />
            <input type="password" name="new_password" required minlength="8" maxlength="120" placeholder="New password" />
            <input type="password" name="new_password_confirm" required minlength="8" maxlength="120" placeholder="Confirm new password" />
            <button class="submit" type="submit">Update Password</button>
          </form>
        </article>
        <aside class="page-card">
          <h3>Security notes</h3>
          <div class="subtle">
            <p>Changing email or password affects the local Looooooty account only.</p>
            <p>Provider logins like Discord or Google remain external authentication methods.</p>
          </div>
        </aside>
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
      backdrop-filter: none;
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
    <aside class="side">${sideMenuHtml(session)}</aside>
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
        <div class="form-grid" style="max-width:560px;">
          ${
            userId
              ? `<form method="post" action="/auth/logout?next=%2Fgiveaways" style="margin:0;">
                  <button class="submit" type="submit">Logout Discord</button>
                </form>`
              : `<a class="submit" href="/auth" style="text-decoration:none; text-align:center; display:inline-block;">Sign Up / Login</a>`
          }
        </div>
        <div class="gw-id">Current giveaway identity: <b>${userId ? `${esc(userTag || "User")} (${esc(userId)})` : "Not logged in"}</b></div>
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
    .landing-shell {
      width: min(1320px, 96%);
      display: grid;
      gap: 22px;
    }
    .landing-hero {
      position: relative;
      overflow: hidden;
      border-radius: 34px;
      padding: 28px 28px 34px;
      border: 1px solid rgba(255,255,255,0.09);
      background:
        radial-gradient(circle at top center, rgba(109,140,255,0.20), transparent 34%),
        radial-gradient(circle at 20% 85%, rgba(52,211,153,0.08), transparent 26%),
        linear-gradient(180deg, rgba(5,8,18,0.95), rgba(6,10,24,0.98));
      box-shadow: 0 28px 90px rgba(0,0,0,0.38);
    }
    .landing-hero::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 10% 20%, rgba(255,255,255,0.9) 0 1px, transparent 2px),
        radial-gradient(circle at 24% 74%, rgba(255,255,255,0.55) 0 1px, transparent 2px),
        radial-gradient(circle at 70% 24%, rgba(255,255,255,0.8) 0 1px, transparent 2px),
        radial-gradient(circle at 88% 68%, rgba(255,255,255,0.55) 0 1px, transparent 2px),
        radial-gradient(circle at 52% 84%, rgba(255,255,255,0.65) 0 1px, transparent 2px),
        radial-gradient(circle at 64% 46%, rgba(255,255,255,0.4) 0 1px, transparent 2px),
        radial-gradient(circle at 38% 34%, rgba(255,255,255,0.5) 0 1px, transparent 2px);
      opacity: 0.45;
      pointer-events: none;
    }
    .landing-topbar {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      margin-bottom: 38px;
      flex-wrap: wrap;
    }
    .landing-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #f8fafc;
      font-size: clamp(28px, 4vw, 46px);
      font-weight: 900;
      letter-spacing: -0.04em;
    }
    .landing-brand img {
      width: 62px;
      height: 62px;
      border-radius: 18px;
      object-fit: cover;
      box-shadow: 0 12px 26px rgba(0,0,0,0.34);
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.04);
    }
    .landing-brand .accent {
      font-style: italic;
      font-weight: 900;
    }
    .landing-nav {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .landing-nav a {
      text-decoration: none;
      color: #f4f7fb;
      font-weight: 700;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      padding: 11px 18px;
      background: rgba(255,255,255,0.05);
      backdrop-filter: none;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }
    .landing-nav a:hover {
      transform: translateY(-1px);
      border-color: rgba(125,211,252,0.52);
      background: rgba(125,211,252,0.10);
    }
    .landing-copy {
      position: relative;
      z-index: 1;
      max-width: 760px;
      margin: 0 auto 28px;
      text-align: center;
    }
    .landing-kicker {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
      color: #dbe6ff;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 12px;
    }
    .landing-title {
      margin: 0;
      color: #ffffff;
      font-size: clamp(52px, 10vw, 108px);
      line-height: 0.94;
      letter-spacing: -0.06em;
      font-weight: 950;
    }
    .landing-title span {
      display: block;
      font-weight: 300;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: rgba(226,232,240,0.8);
      font-size: 0.42em;
      margin-top: 10px;
    }
    .landing-description {
      margin: 22px auto 0;
      max-width: 680px;
      color: #bac6dc;
      font-size: clamp(15px, 2vw, 19px);
      line-height: 1.72;
    }
    .landing-cards {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }
    .landing-card {
      position: relative;
      overflow: hidden;
      display: grid;
      gap: 14px;
      text-decoration: none;
      color: #f8fafc;
      min-height: 280px;
      padding: 24px;
      border-radius: 26px;
      border: 1px solid rgba(255,255,255,0.10);
      background:
        radial-gradient(circle at top right, rgba(96,165,250,0.22), transparent 28%),
        linear-gradient(180deg, rgba(9,13,28,0.94), rgba(7,10,22,0.98));
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 16px 38px rgba(0,0,0,0.28);
      transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
    }
    .landing-card::after {
      content: "";
      position: absolute;
      inset: auto -10% -24% auto;
      width: 180px;
      height: 180px;
      background: radial-gradient(circle, rgba(96,165,250,0.18), transparent 60%);
      pointer-events: none;
    }
    .landing-card:hover {
      transform: translateY(-4px);
      border-color: rgba(125,211,252,0.45);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 60px rgba(0,0,0,0.34);
    }
    .landing-card.discord {
      background:
        radial-gradient(circle at top right, rgba(129,140,248,0.22), transparent 28%),
        linear-gradient(180deg, rgba(11,16,33,0.94), rgba(8,12,25,0.98));
    }
    .landing-card .eyebrow {
      color: #93c5fd;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.10em;
    }
    .landing-card h3 {
      margin: 0;
      font-size: clamp(28px, 4vw, 42px);
      line-height: 1.05;
      letter-spacing: -0.04em;
    }
    .landing-card p {
      margin: 0;
      color: #b4c0d5;
      line-height: 1.7;
      font-size: 15px;
      max-width: 38ch;
    }
    .landing-points {
      display: grid;
      gap: 8px;
      color: #e5edf9;
      font-weight: 600;
      font-size: 14px;
    }
    .landing-cta {
      margin-top: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: fit-content;
      min-width: 160px;
      padding: 12px 18px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.07);
      color: #f8fafc;
      font-weight: 800;
      letter-spacing: 0.01em;
    }
    .landing-bottom {
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 18px;
    }
    .landing-review-strip,
    .landing-support {
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(6,10,24,0.92);
      box-shadow: 0 16px 44px rgba(0,0,0,0.24);
      padding: 22px;
    }
    .landing-review-strip h3,
    .landing-support h3 {
      margin: 0 0 10px;
      color: #f8fafc;
      font-size: 22px;
      letter-spacing: -0.03em;
    }
    .landing-review-strip p,
    .landing-support p {
      margin: 0;
      color: #b3c0d8;
      line-height: 1.7;
    }
    .landing-review-actions {
      margin-top: 16px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .landing-review-actions a {
      text-decoration: none;
      color: #f8fafc;
      font-weight: 800;
      padding: 11px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05);
    }
    @media (max-width: 980px) {
      .landing-cards,
      .landing-bottom {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 700px) {
      .landing-shell {
        width: min(96%, 96%);
      }
      .landing-hero {
        padding: 20px 18px 24px;
        border-radius: 24px;
      }
      .landing-topbar {
        margin-bottom: 28px;
      }
      .landing-brand {
        font-size: 30px;
      }
      .landing-card {
        min-height: 240px;
        padding: 18px;
        border-radius: 20px;
      }
      .landing-review-strip,
      .landing-support {
        border-radius: 20px;
        padding: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml()}</aside>
    <main class="main">
      <section class="landing-shell">
        <div class="landing-hero">
          <div class="landing-topbar">
            <div class="landing-brand">
              <img src="${esc(SITE_ICON_URL)}" alt="LooooootyShop logo" />
              <div><span class="accent">Looooooty</span>Shop</div>
            </div>
            <nav class="landing-nav">
              <a href="/">Back Home</a>
              <a href="${SHOP_INVITE_URL}" target="_blank" rel="noreferrer">Discord Shop</a>
              <a href="/shop/reviews">Reviews</a>
            </nav>
          </div>
          <div class="landing-copy">
            <div class="landing-kicker">Official 2b2t Storefront</div>
            <h1 class="landing-title">Looooooty<span>Shop</span></h1>
            <p class="landing-description">Choose the storefront that fits how you want to buy. Use the Discord shop if you want the ticket-based delivery flow, or jump into the website shop for a faster modern catalog with cart, checkout, reviews, and account features.</p>
          </div>
          <div class="landing-cards">
            <a class="landing-card discord" href="${SHOP_INVITE_URL}" target="_blank" rel="noreferrer">
              <div class="eyebrow">Discord</div>
              <h3>Discord Shop</h3>
              <p>Open tickets, talk to staff directly, use the full Discord cart flow, and keep everything inside your server workflow.</p>
              <div class="landing-points">
                <div>Direct ticket support</div>
                <div>Built-in delivery status flow</div>
                <div>Best for staff-assisted orders</div>
              </div>
              <div class="landing-cta">Open Discord Shop</div>
            </a>
            <a class="landing-card" href="/shop/web">
              <div class="eyebrow">Website</div>
              <h3>Website Shop</h3>
              <p>Browse a cleaner storefront, filter categories quickly, build your cart, leave reviews, and manage checkout from one modern page.</p>
              <div class="landing-points">
                <div>Fast modern product browsing</div>
                <div>Website checkout and reviews</div>
                <div>Best for self-serve orders</div>
              </div>
              <div class="landing-cta">Enter Website Shop</div>
            </a>
          </div>
        </div>
        <div class="landing-bottom">
          <div class="landing-review-strip">
            <h3>Reviews and trust</h3>
            <p>Read customer feedback, post your own review after delivery, and keep the public storefront credible. The review flow is part of the shop now, not an afterthought.</p>
            <div class="landing-review-actions">
              <a href="/shop/reviews">View Reviews</a>
              <a href="/shop/web#catalog">Browse Products</a>
            </div>
          </div>
          <div class="landing-support">
            <h3>How to buy</h3>
            <p>Need the ticket-based process? Use Discord. Want a cleaner storefront and website checkout? Use the website shop. Both routes feed into the same shop operation.</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function websiteShopHtml(websiteShop, session = {}) {
  const products = Array.isArray(websiteShop && websiteShop.products) ? websiteShop.products : [];
  const state = websiteShop && websiteShop.state === "closed" ? "closed" : "open";
  const userId = String(session && session.userId ? session.userId : "");
  const userTag = String(session && session.userTag ? session.userTag : "");
  const userProvider = String(session && session.provider ? session.provider : "");
  const authLabel = userId ? "Account" : "Sign Up";
  const reviews = loadWebsiteReviews();
  const orders = loadWebsiteOrders();
  const buyerCount = new Set(orders.map((o) => String(o && o.userId ? o.userId : "")).filter(Boolean)).size;
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
    :root {
      --txt: #f4f7ff;
      --muted: #9ca4bb;
      --line: rgba(255,255,255,0.12);
      --panel: rgba(7,10,18,0.78);
      --panel-2: rgba(10,14,26,0.86);
      --chip: rgba(255,255,255,0.04);
      --chip-active: #ffffff;
      --chip-active-text: #05070d;
      --green: #1f8f4e;
      --red: #b03a43;
      --blue: #4f95ea;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--txt);
      font-family: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 20% 14%, rgba(111, 79, 255, 0.16), transparent 22%),
        radial-gradient(circle at 79% 20%, rgba(93, 127, 255, 0.12), transparent 24%),
        linear-gradient(180deg, #010204 0%, #03050b 45%, #060914 100%);
      min-height: 100vh;
      overflow-x: hidden;
    }
    body::before,
    body::after { content: none; }
    .shop-shell {
      position: relative;
      z-index: 1;
      min-height: 100vh;
    }
    .shop-topbar {
      position: relative;
      z-index: 20;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 20px;
      padding: 16px 28px;
      border-bottom: 1px solid var(--line);
      background: rgba(2,4,8,0.8);
      backdrop-filter: none;
    }
    .brand-mark {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      text-decoration: none;
      color: var(--txt);
    }
    .brand-mark img {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.16);
      object-fit: cover;
      background: rgba(255,255,255,0.04);
    }
    .brand-mark span {
      font-size: 28px;
      font-style: italic;
      font-weight: 1000;
      white-space: nowrap;
    }
    .shop-nav {
      display: flex;
      justify-content: center;
      gap: 28px;
      flex-wrap: wrap;
    }
    .shop-nav a {
      color: var(--muted);
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
    }
    .shop-nav a:hover,
    .shop-nav a.active {
      color: var(--txt);
    }
    .shop-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .shop-btn,
    .cat,
    .add,
    .cart-btn,
    .flow-btn {
      transition: transform .14s ease, border-color .14s ease, background .14s ease, opacity .14s ease;
    }
    .shop-btn:hover,
    .cat:hover,
    .add:hover,
    .cart-btn:hover,
    .flow-btn:hover {
      transform: translateY(-1px);
    }
    .shop-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: var(--txt);
      font-weight: 800;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.04);
      border-radius: 999px;
      padding: 11px 16px;
      min-height: 44px;
      cursor: pointer;
    }
    .shop-btn.primary {
      background: rgba(255,255,255,0.08);
    }
    .hero {
      padding: 70px 28px 36px;
      text-align: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 11px 18px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.03);
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 26px;
    }
    .hero-title {
      margin: 0;
      font-size: clamp(80px, 17vw, 196px);
      line-height: 0.86;
      font-weight: 1000;
      font-style: italic;
      letter-spacing: -0.07em;
      text-transform: none;
    }
    
    .hero-sub {
      margin: 18px auto 0;
      color: rgba(255,255,255,0.58);
      text-transform: uppercase;
      letter-spacing: 0.3em;
      padding-left: 0.3em;
      font-size: clamp(24px, 5vw, 56px);
    }
    .hero-copy {
      max-width: 740px;
      margin: 18px auto 0;
      color: var(--muted);
      font-size: 20px;
      line-height: 1.6;
    }
    .hero-stats {
      margin: 36px auto 24px;
      display: inline-grid;
      grid-template-columns: repeat(3, minmax(130px, 1fr));
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      background: rgba(255,255,255,0.03);
      backdrop-filter: none;
    }
    .hero-stat {
      padding: 18px 30px;
      border-right: 1px solid var(--line);
    }
    .hero-stat:last-child { border-right: 0; }
    .hero-stat b {
      display: block;
      font-size: clamp(32px, 5vw, 50px);
      line-height: 1;
      margin-bottom: 6px;
    }
    .hero-stat span {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 12px;
      font-weight: 800;
    }
    .hero-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 220px;
      padding: 16px 24px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.04);
      color: var(--txt);
      text-decoration: none;
      font-weight: 900;
      font-size: 18px;
    }
    .catalog {
      padding: 18px 28px 48px;
    }
    .catalog-head {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      align-items: end;
      margin-bottom: 20px;
    }
    .catalog-title {
      margin: 0;
      font-size: clamp(34px, 5vw, 60px);
      line-height: 0.95;
      font-weight: 1000;
      letter-spacing: -0.04em;
    }
    .catalog-sub {
      margin-top: 10px;
      color: var(--muted);
      line-height: 1.6;
      max-width: 760px;
    }
    .catalog-tools {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search {
      width: min(320px, 100%);
      padding: 16px 18px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.03);
      color: var(--txt);
      outline: none;
      font-size: 16px;
    }
    .search::placeholder { color: rgba(255,255,255,0.38); }
    .cat-row {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 20px;
      scrollbar-width: none;
    }
    .cat-row::-webkit-scrollbar { display: none; }
    .cat {
      flex: 0 0 auto;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--chip);
      color: var(--txt);
      padding: 12px 18px;
      font-weight: 800;
      white-space: nowrap;
      cursor: pointer;
      font-size: 15px;
    }
    .cat.active {
      background: var(--chip-active);
      color: var(--chip-active-text);
      border-color: var(--chip-active);
    }
    .status-banner {
      margin: 0 0 18px;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(138, 30, 30, 0.18);
      color: #ffd7d7;
      font-weight: 700;
    }
    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .card {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(10,15,27,0.95), rgba(7,10,18,0.92));
      padding: 16px;
      display: grid;
      gap: 12px;
      position: relative;
      overflow: visible;
      box-shadow: 0 12px 32px rgba(0,0,0,0.24);
    }
    .card-info {
      position: absolute;
      left: 0;
      right: 0;
      top: 100%;
      margin-top: 8px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(8,12,28,0.96);
      padding: 12px;
      font-size: 13px;
      color: var(--txt);
      opacity: 0;
      pointer-events: none;
      display: grid;
      gap: 7px;
      transform: translateY(-4px);
      transition: opacity .15s ease, transform .15s ease;
      z-index: 6;
      box-shadow: 0 18px 46px rgba(0,0,0,0.36);
    }
    .card:hover .card-info,
    .card:focus-within .card-info {
      opacity: 1;
      transform: translateY(0);
    }
    .card-info h4 { margin: 0; font-size: 14px; }
    .card-info .muted { color: var(--muted); font-size: 12px; }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }
    .card-top h3 {
      margin: 0;
      font-size: 24px;
      line-height: 1.04;
      letter-spacing: -0.03em;
    }
    .price {
      color: #31ff83;
      font-weight: 900;
      border: 1px solid rgba(49,255,131,0.28);
      border-radius: 999px;
      padding: 5px 10px;
      background: rgba(10,27,18,0.72);
      white-space: nowrap;
      font-size: 15px;
    }
    .img-wrap {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.12);
      background: radial-gradient(circle at 50% 30%, rgba(96,120,190,0.2), rgba(7,10,20,0.96));
      display: grid;
      place-items: center;
      min-height: 196px;
    }
    .img-wrap img {
      width: 100%;
      height: 196px;
      object-fit: contain;
      display: block;
      background: transparent;
    }
    .add {
      justify-self: center;
      border-radius: 12px;
      border: 1px solid rgba(115,177,255,0.45);
      background: linear-gradient(180deg, #5da8ff, #4388df);
      color: white;
      font-weight: 900;
      padding: 11px 22px;
      cursor: pointer;
      min-width: 180px;
      font-size: 16px;
    }
    .add:disabled {
      cursor: not-allowed;
      opacity: 0.45;
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.12);
    }
    .cart-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2,5,16,0.82);
      backdrop-filter: none;
      display: none;
      z-index: 50;
      padding: 20px;
    }
    .cart-overlay.open { display: block; }
    .cart-panel {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 30px;
      background:
        radial-gradient(circle at 50% 0%, rgba(102, 125, 255, 0.13), transparent 26%),
        linear-gradient(180deg, rgba(8,13,30,0.97), rgba(6,10,22,0.98));
      padding: 26px;
      max-width: 980px;
      width: 100%;
      max-height: 92vh;
      overflow: auto;
      margin: 0 auto;
      box-shadow: 0 16px 42px rgba(0,0,0,0.30);
    }
    .cart-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:14px;
      margin-bottom: 18px;
    }
    .cart-head h3 {
      margin: 0;
      font-size: clamp(34px, 4vw, 52px);
      line-height: 0.95;
      letter-spacing: -0.04em;
      font-weight: 950;
    }
    .cart-items {
      min-height: 96px;
      margin: 0 0 18px;
      color: var(--muted);
      white-space: pre-wrap;
      display: grid;
      gap: 10px;
    }
    .cart-item {
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px;
      padding: 14px 16px;
      background: linear-gradient(180deg, rgba(11,17,37,0.9), rgba(7,12,27,0.88));
      position: relative;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    }
    .cart-item-row {
      display:flex;
      justify-content:space-between;
      gap:12px;
      font-size: 15px;
      align-items: center;
    }
    .cart-item-row b { font-size: 16px; }
    .cart-remove {
      margin-top: 10px;
      border-radius: 10px;
      border: 1px solid rgba(234, 71, 71, 0.8);
      background: linear-gradient(180deg, rgba(205,61,61,0.96), rgba(157,37,37,0.96));
      color: white;
      font-weight: 800;
      padding: 8px 12px;
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
    .cart-totals {
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 22px;
      background: rgba(255,255,255,0.03);
      padding: 16px 18px;
      display: grid;
      gap: 8px;
    }
    .row {
      display:flex;
      justify-content:space-between;
      gap:12px;
      color: var(--muted);
      font-size: 15px;
    }
    .row b { color: var(--txt); }
    .row.total {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.08);
      color: var(--txt);
      font-size: 18px;
      font-weight: 800;
    }
    .row.total b { font-size: 22px; }
    .cart-actions { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top: 14px; }
    .cart-actions.single { grid-template-columns: 1fr; }
    .cart-actions.tertiary { margin-top: 16px; }
    .cart-actions.tertiary .secondary {
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.1);
      color: var(--txt);
    }
    .checkout,
    .close,
    .secondary,
    .flow-btn,
    .cart-remove {
      transition: transform .14s ease, filter .14s ease, opacity .14s ease;
    }
    .checkout:hover,
    .close:hover,
    .secondary:hover,
    .flow-btn:hover,
    .cart-remove:hover {
      transform: translateY(-1px);
      filter: brightness(1.03);
    }
    .checkout,
    .close,
    .secondary {
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.16);
      padding: 14px 16px;
      text-align: center;
      font-weight: 900;
      font-size: 18px;
      cursor: pointer;
      color: #fff;
    }
    .checkout {
      background: linear-gradient(180deg, #28a654, #1f8844);
      border-color: rgba(64, 255, 142, 0.38);
    }
    .close {
      background: linear-gradient(180deg, #c2494b, #a53a3d);
      border-color: rgba(255, 120, 120, 0.3);
    }
    .secondary {
      background: linear-gradient(180deg, rgba(41,61,103,0.9), rgba(23,34,62,0.94));
      border-color: rgba(111,151,255,0.28);
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2,5,16,0.92);
      display: none;
      z-index: 70;
      padding: 20px;
    }
    .modal-overlay.open { display: block; }
    .modal-panel {
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 28px;
      background:
        radial-gradient(circle at 50% 0%, rgba(96,120,190,0.16), transparent 24%),
        linear-gradient(180deg, rgba(9,14,31,0.98), rgba(7,11,24,0.98));
      padding: 24px;
      max-width: 560px;
      width: 100%;
      margin: 8vh auto 0;
      box-shadow: 0 16px 40px rgba(0,0,0,0.30);
    }
    .modal-panel h3 {
      margin: 0 0 10px;
      font-size: clamp(30px, 4vw, 46px);
      line-height: 0.96;
      letter-spacing: -0.04em;
      font-weight: 950;
    }
    .modal-copy { color: var(--muted); font-size: 16px; line-height: 1.7; }
    .muted-copy { margin-top: 12px; font-size: 14px; }
    .modal-panel input[type="text"] {
      width: 100%;
      padding: 16px 18px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.03);
      color: var(--txt);
      margin: 14px 0 6px;
      font-size: 17px;
      outline: none;
    }
    .modal-panel input[type="text"]::placeholder { color: rgba(255,255,255,0.35); }
    .modal-panel input[type="text"]:focus {
      border-color: rgba(108,168,255,0.48);
      box-shadow: 0 0 0 3px rgba(108,168,255,0.12);
    }
    .check-row {
      display:flex;
      align-items:center;
      gap:10px;
      margin-top: 10px;
      color: var(--txt);
      font-size: 15px;
      font-weight: 700;
    }
    .check-row input { width: 18px; height: 18px; accent-color: #5da8ff; }
    .modal-error { color: #ff9b9b; font-size: 14px; min-height: 20px; margin-top: 8px; }
    .modal-result { color: #7ee787; font-size: 14px; min-height: 20px; margin-top: 8px; }
    .cart-flow { margin-top: 16px; display: grid; gap: 12px; }
    .flow-wrap { margin-top: 12px; display: grid; gap: 10px; }
    .flow-embed {
      border: 1px solid rgba(93, 141, 255, 0.35);
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(17,25,56,0.9), rgba(9,14,34,0.92));
      padding: 12px;
      line-height: 1.45;
      font-size: 14px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .flow-embed h4 { margin: 0 0 8px; font-size: 16px; }
    .flow-meta { display: grid; gap: 6px; margin-top: 8px; }
    .flow-meta-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 6px;
    }
    .flow-meta-row:first-child { border-top: 0; padding-top: 0; }
    .flow-meta-label { color: var(--muted); font-weight: 700; }
    .flow-meta-value { font-weight: 800; }
    .flow-actions { display:flex; gap:8px; flex-wrap: wrap; }
    .flow-btn {
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(32,48,82,0.85);
      color: #fff;
      font-weight: 800;
      padding: 7px 10px;
      cursor: pointer;
    }
    .flow-btn.ok { background: var(--green); border-color: var(--green); }
    .modal-actions { display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top: 10px; }
    @media (max-width: 1120px) {
      .shop-topbar {
        grid-template-columns: 1fr;
        justify-items: start;
      }
      .shop-nav, .shop-actions {
        justify-content: flex-start;
      }
      .catalog-head {
        grid-template-columns: 1fr;
      }
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 860px) {
      .hero {
        padding-top: 48px;
      }
      .hero-title {
        font-size: clamp(64px, 20vw, 120px);
      }
      .hero-sub {
        font-size: clamp(22px, 8vw, 40px);
        letter-spacing: 0.22em;
        padding-left: 0.22em;
      }
      .hero-copy {
        font-size: 16px;
      }
      .hero-stats {
        grid-template-columns: 1fr;
        width: min(320px, 100%);
      }
      .hero-stat {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .hero-stat:last-child { border-bottom: 0; }
      .grid {
        grid-template-columns: 1fr;
      }
      .catalog, .hero, .shop-topbar {
        padding-left: 16px;
        padding-right: 16px;
      }
      .cart-overlay, .modal-overlay {
        padding: 8px;
      }
      .cart-panel {
        max-height: 96vh;
      }
      .search {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="shop-shell">
    <header class="shop-topbar">
      <a class="brand-mark" href="/shop/web">
        <img src="${SHOP_LOGO_URL}" alt="LooooootyShop logo" />
        <span>LooooootyShop</span>
      </a>
      <nav class="shop-nav">
        <a class="active" href="/shop/web">Store</a>
        <a href="/shop/reviews">Reviews</a>
        <a href="/how-to-order">How to Buy</a>
      </nav>
      <div class="shop-actions">
        <a class="shop-btn" href="/">Back to Home</a>
        <a class="shop-btn" href="${SHOP_INVITE_URL}" target="_blank" rel="noreferrer">Discord Shop</a>
        <button id="top-cart-btn" class="shop-btn" type="button">Cart (0)</button>
        <a class="shop-btn primary" href="/auth?next=%2Fshop%2Fweb">${authLabel}</a>
      </div>
    </header>

    <section class="hero">
      <div class="hero-badge">Official 2b2t Storefront</div>
      <h2 class="hero-title">Looooooty</h2>
      <div class="hero-sub">Shop</div>
      <p class="hero-copy">A high-trust 2b2t storefront for kits, rares, materials and delivery-ready orders. Browse fast, check out cleanly, and keep the whole flow in one place.</p>
      <div class="hero-stats">
        <div class="hero-stat"><b>${orders.length}</b><span>Orders</span></div>
        <div class="hero-stat"><b>${reviews.length}</b><span>Reviews</span></div>
        <div class="hero-stat"><b>${buyerCount}</b><span>Buyers</span></div>
      </div>
      <a class="hero-cta" href="#catalog">Browse Store</a>
    </section>

    <section id="catalog" class="catalog">
      <div class="catalog-head">
        <div>
          <h2 class="catalog-title">Store</h2>
          <div class="catalog-sub">Browse by category, search items fast, hover products for details, and check out without leaving the page.</div>
        </div>
        <div class="catalog-tools">
          <input id="shop-search" class="search" type="text" placeholder="Search items..." />
        </div>
      </div>

      <div class="cat-row">
        ${orderedCategories
          .map(
            (cat, idx) =>
              `<button class="cat${idx === 0 ? " active" : ""}" data-cat="${esc(cat)}">${esc(cat)}</button>`
          )
          .join("")}
      </div>

      ${
        state === "closed"
          ? '<div class="status-banner">Website shop is currently CLOSED.</div>'
          : ""
      }

      <div id="product-grid" class="grid">
        ${(products || [])
          .map((p) => {
            const stockQty = Number.isFinite(Number(p.stockQty)) ? Number(p.stockQty) : null;
            const inStock = p.inStock !== false && state !== "closed" && (stockQty === null || stockQty > 0);
            return `<article class="card" data-id="${esc(String(p.id || ""))}" data-name="${esc(
              String(p.name || "").toLowerCase()
            )}" data-title="${esc(String(p.name || "Unnamed Product"))}" data-price="${Number(p.price || 0)}" data-cat="${esc(
              String(p.category || "Recommended")
            )}">
              <div class="card-top">
                <h3>${esc(p.name || "Unnamed Product")}</h3>
                <span class="price">$${Number(p.price || 0).toFixed(2)}</span>
              </div>
              <div class="img-wrap"><img src="${esc(p.image || SHOP_LOGO_URL)}" alt="${esc(p.name || "Product")}" /></div>
              <button class="add" data-add-id="${esc(String(p.id || ""))}" ${inStock ? "" : "disabled"}>${inStock ? "Add to Cart" : "Unavailable"}</button>
              <div class="card-info">
                <h4>${esc(p.name || "Product")}</h4>
                <div>${esc(p.description || "No description provided.")}</div>
                <div class="muted">ID: ${esc(p.id || "-")}</div>
                <div class="muted">In Stock: ${stockQty === null ? "-" : String(stockQty)}</div>
              </div>
            </article>`;
          })
          .join("")}
      </div>
    </section>
  </div>

  <div id="cart-overlay" class="cart-overlay">
    <div class="cart-panel">
      <div class="cart-head">
        <h3>Cart</h3>
        <button id="cart-hide" class="close" type="button">Close</button>
      </div>
      <div id="cart-items" class="cart-items">Your cart is empty.</div>
      <div class="cart-totals">
        <div class="row"><span>Subtotal</span><b id="cart-subtotal">$0.00</b></div>
        <div class="row"><span>Discount</span><b id="cart-discount">$0.00</b></div>
        <div class="row"><span>Tax & Fees</span><b id="cart-tax">$0.00</b></div>
        <div class="row"><span>Delivery Fee</span><b id="cart-delivery">$0.00</b></div>
        <div class="row total"><span>Total Cost</span><b id="cart-total">$0.00</b></div>
        <div class="row"><span>Total Kits</span><b id="cart-count">0</b></div>
      </div>
      <div class="cart-actions tertiary">
        <button id="cart-discount-btn" class="secondary" type="button">Discount</button>
        <button id="cart-delivery-btn" class="secondary" type="button">Delivery Price</button>
      </div>
      <div class="cart-actions">
        <button id="cart-checkout" class="checkout" type="button">Checkout</button>
        <button id="cart-clear" class="close" type="button">Clear Cart</button>
      </div>
      <div id="cart-flow" class="cart-flow"></div>
    </div>
  </div>

  <div id="qty-modal" class="modal-overlay">
    <div class="modal-panel">
      <h3>Item Quantity</h3>
      <div class="modal-copy">Select how many of <b id="qty-modal-product">this item</b> you want to add.</div>
      <input id="qty-input" type="text" value="1" inputmode="numeric" />
      <div id="qty-error" class="modal-error"></div>
      <div class="modal-actions">
        <button id="qty-confirm" class="checkout" type="button">Add to Cart</button>
        <button id="qty-cancel" class="close" type="button">Close</button>
      </div>
    </div>
  </div>

  <div id="checkout-modal" class="modal-overlay">
    <div class="modal-panel">
      <h3>Checkout</h3>
      <div class="modal-copy">Enter your email for payment receipt/invoice.</div>
      <input id="checkout-email" type="text" placeholder="you@example.com" />
      <label class="check-row"><input id="checkout-use-credit" type="checkbox" /> <span>Use store credit</span></label>
      <div id="checkout-error" class="modal-error"></div>
      <div id="checkout-result" class="modal-result"></div>
      <div class="modal-actions">
        <button id="checkout-paypal" class="checkout" type="button">PayPal</button>
        <button id="checkout-close" class="close" type="button">Close</button>
      </div>
    </div>
  </div>

  <div id="discount-modal" class="modal-overlay">
    <div class="modal-panel">
      <h3>Discount Code</h3>
      <div class="modal-copy">Enter your coupon code.</div>
      <input id="discount-code" type="text" placeholder="e.g. LOOT10" />
      <div id="discount-error" class="modal-error"></div>
      <div id="discount-result" class="modal-result"></div>
      <div class="modal-actions">
        <button id="discount-apply" class="checkout" type="button">Apply</button>
        <button id="discount-close" class="close" type="button">Close</button>
      </div>
    </div>
  </div>

  <div id="delivery-modal" class="modal-overlay">
    <div class="modal-panel">
      <h3>Delivery Coordinates</h3>
      <div class="modal-copy">Enter your X and Z coordinates to estimate delivery price. Format: X Z (two numbers). Example: -1500000 200000.</div>
      <input id="delivery-coords" type="text" placeholder="-1500000 200000" />
      <div class="modal-copy muted-copy">Free within 1,000,000 blocks from spawn. Every 100k after is $0.99.</div>
      <div id="delivery-error" class="modal-error"></div>
      <div id="delivery-result" class="modal-result"></div>
      <div class="modal-actions">
        <button id="delivery-apply" class="checkout" type="button">Apply</button>
        <button id="delivery-close" class="close" type="button">Close</button>
      </div>
    </div>
  </div>

  <div id="flow-input-modal" class="modal-overlay">
    <div class="modal-panel">
      <h3 id="flow-input-title">Enter value</h3>
      <div id="flow-input-hint" class="modal-copy"></div>
      <input id="flow-input-value" type="text" />
      <div id="flow-input-error" class="modal-error"></div>
      <div class="modal-actions">
        <button id="flow-input-save" class="checkout" type="button">Save</button>
        <button id="flow-input-cancel" class="close" type="button">Close</button>
      </div>
    </div>
  </div>

  <script>
    (function () {
      const authedAccountUserId = ${JSON.stringify(userId)};
      const search = document.getElementById("shop-search");
      const cats = Array.from(document.querySelectorAll(".cat"));
      const cards = Array.from(document.querySelectorAll(".card"));
      const cartItemsEl = document.getElementById("cart-items");
      const cartSubtotalEl = document.getElementById("cart-subtotal");
      const cartDiscountEl = document.getElementById("cart-discount");
      const cartTaxEl = document.getElementById("cart-tax");
      const cartDeliveryEl = document.getElementById("cart-delivery");
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
      const checkoutUseCredit = document.getElementById("checkout-use-credit");
      const checkoutError = document.getElementById("checkout-error");
      const checkoutResult = document.getElementById("checkout-result");
      const cartFlow = document.getElementById("cart-flow");
      const checkoutPaypal = document.getElementById("checkout-paypal");
      const checkoutClose = document.getElementById("checkout-close");
      const discountModal = document.getElementById("discount-modal");
      const discountCodeInput = document.getElementById("discount-code");
      const discountError = document.getElementById("discount-error");
      const discountResult = document.getElementById("discount-result");
      const discountApply = document.getElementById("discount-apply");
      const discountClose = document.getElementById("discount-close");
      const discountBtn = document.getElementById("cart-discount-btn");
      const deliveryModal = document.getElementById("delivery-modal");
      const deliveryCoordsInput = document.getElementById("delivery-coords");
      const deliveryError = document.getElementById("delivery-error");
      const deliveryResult = document.getElementById("delivery-result");
      const deliveryApply = document.getElementById("delivery-apply");
      const deliveryClose = document.getElementById("delivery-close");
      const deliveryBtn = document.getElementById("cart-delivery-btn");
      const flowInputModal = document.getElementById("flow-input-modal");
      const flowInputTitle = document.getElementById("flow-input-title");
      const flowInputHint = document.getElementById("flow-input-hint");
      const flowInputValue = document.getElementById("flow-input-value");
      const flowInputError = document.getElementById("flow-input-error");
      const flowInputSave = document.getElementById("flow-input-save");
      const flowInputCancel = document.getElementById("flow-input-cancel");
      const taxRate = 0.06;
      const storageKey = "looooooty_web_cart_v1";
      const activeOrderStorageKey = "looooooty_web_active_order_v1";
      const couponStorageKey = "looooooty_web_coupon_v1";
      const deliveryStorageKey = "looooooty_web_delivery_v1";
      let currentCat = "Recommended";
      let cart = {};
      let pendingAddProductId = "";
      let pendingAddProductTitle = "";
      let activeOrder = null;
      let orderStatusPoll = null;
      let deliveryAutoCloseTimer = null;
      let deliveryAutoCloseRemainingMs = 0;
      let deliveryAutoCloseStartedAt = 0;
      let flowInputSubmit = null;
      let couponCode = "";
      let couponType = "";
      let couponAmount = 0;
      let couponDiscount = 0;
      let deliveryCoords = "";
      let deliveryFee = 0;

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

      function saveCoupon() {
        localStorage.setItem(
          couponStorageKey,
          JSON.stringify({ code: couponCode, type: couponType, amount: couponAmount, discount: couponDiscount })
        );
      }

      function loadCoupon() {
        try {
          const parsed = JSON.parse(localStorage.getItem(couponStorageKey) || "null");
          if (parsed && typeof parsed === "object") {
            couponCode = String(parsed.code || "");
            couponType = String(parsed.type || "");
            couponAmount = Number(parsed.amount || 0);
            couponDiscount = Number(parsed.discount || 0);
          }
        } catch {
          couponCode = "";
          couponType = "";
          couponAmount = 0;
          couponDiscount = 0;
        }
      }

      function saveDelivery() {
        localStorage.setItem(deliveryStorageKey, JSON.stringify({ coords: deliveryCoords, fee: deliveryFee }));
      }

      function loadDelivery() {
        try {
          const parsed = JSON.parse(localStorage.getItem(deliveryStorageKey) || "null");
          if (parsed && typeof parsed === "object") {
            deliveryCoords = String(parsed.coords || "");
            deliveryFee = Number(parsed.fee || 0);
          }
        } catch {
          deliveryCoords = "";
          deliveryFee = 0;
        }
      }

      function saveActiveOrder() {
        try {
          if (!activeOrder) {
            localStorage.removeItem(activeOrderStorageKey);
            return;
          }
          localStorage.setItem(activeOrderStorageKey, JSON.stringify(activeOrder));
        } catch {
          // ignore localStorage issues
        }
      }

      function setActiveOrder(nextOrder) {
        activeOrder = nextOrder || null;
        saveActiveOrder();
      }

      function loadActiveOrder() {
        try {
          const parsed = JSON.parse(localStorage.getItem(activeOrderStorageKey) || "null");
          if (parsed && typeof parsed === "object" && parsed.orderId) {
            const deliveredCloseAt = Number(parsed.deliveredCloseAt || 0);
            if (deliveredCloseAt && Date.now() > deliveredCloseAt) {
              activeOrder = null;
              localStorage.removeItem(activeOrderStorageKey);
              return;
            }
            activeOrder = {
              orderId: String(parsed.orderId || ""),
              userId: String(parsed.userId || ""),
              ign: String(parsed.ign || ""),
              coordinates: String(parsed.coordinates || ""),
              ready: Boolean(parsed.ready),
              delivered: Boolean(parsed.delivered),
              deliveredAt: String(parsed.deliveredAt || ""),
              deliveredCloseAt: Number(parsed.deliveredCloseAt || 0),
              deliveredMessage: String(parsed.deliveredMessage || ""),
              deliveredAutoClosed: Boolean(parsed.deliveredAutoClosed),
              paidAt: String(parsed.paidAt || "")
            };
            return;
          }
        } catch {
          // ignore parse issues
        }
        activeOrder = null;
      }

      function fmt(v) {
        return "$" + Number(v || 0).toFixed(2);
      }

      function escHtml(v) {
        return String(v || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function normalizeMinus(value) {
        return String(value || "")
          .normalize("NFKC")
          .replace(/[\u2212\u2013\u2014]/g, "-")
          .replace(/\u00A0/g, " ")
          .replace(/,/g, "");
      }

      function parseCoords(value) {
        const normalized = normalizeMinus(value);
        const matches = normalized.match(/-?\d+(?:\.\d+)?/g) || [];
        let x = matches.length >= 1 ? Number(matches[0]) : NaN;
        let z = matches.length >= 2 ? Number(matches[1]) : NaN;
        if (Number.isFinite(x) && Number.isFinite(z)) {
          return { x, z };
        }
        const cleaned = normalized.replace(/[^0-9.\-]+/g, " ").trim();
        const parts = cleaned.split(/\s+/).filter(Boolean);
        if (parts.length < 2) return null;
        x = Number(parts[0]);
        z = Number(parts[1]);
        if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
        return { x, z };
      }

      function computeDeliveryFeeFromCoords(coords) {
        if (!coords) return 0;
        const dist = Math.hypot(Number(coords.x || 0), Number(coords.z || 0));
        if (!Number.isFinite(dist)) return 0;
        const threshold = 1000000;
        if (dist <= threshold) return 0;
        const extra = dist - threshold;
        const chunks = Math.ceil(extra / 100000);
        return Number((chunks * 0.99).toFixed(2));
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
        let discount = 0;
        if (couponType === "flat") {
          discount = Math.min(subtotal, Math.max(0, Number(couponAmount || 0)));
        } else if (couponType === "percent") {
          const pct = Math.min(100, Math.max(0, Number(couponAmount || 0)));
          discount = Math.min(subtotal, subtotal * (pct / 100));
        }
        const discountedSubtotal = Math.max(0, subtotal - discount);
        const tax = discountedSubtotal * taxRate;
        const delivery = count > 0 ? Number(deliveryFee || 0) : 0;
        const total = discountedSubtotal + tax + delivery;
        if (!rows.length) {
          cartItemsEl.textContent = "Your cart is empty.";
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
        if (cartDiscountEl) cartDiscountEl.textContent = fmt(discount);
        cartTaxEl.textContent = fmt(tax);
        if (cartDeliveryEl) cartDeliveryEl.textContent = fmt(delivery);
        cartTotalEl.textContent = fmt(total);
        cartCountEl.textContent = String(count);      if (topCartBtn) {
        topCartBtn.style.display = "inline-flex";
        topCartBtn.textContent = count > 0 ? "Cart (" + count + ")" : "Cart (0)";
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
        let discount = 0;
        if (couponType === "flat") {
          discount = Math.min(subtotal, Math.max(0, Number(couponAmount || 0)));
        } else if (couponType === "percent") {
          const pct = Math.min(100, Math.max(0, Number(couponAmount || 0)));
          discount = Math.min(subtotal, subtotal * (pct / 100));
        }
        const discountedSubtotal = Math.max(0, subtotal - discount);
        const tax = discountedSubtotal * taxRate;
        const delivery = count > 0 ? Number(deliveryFee || 0) : 0;
        const total = discountedSubtotal + tax + delivery;
        return { subtotal, tax, total, count, normalized, discount, delivery };
      }

      function renderPostCheckoutState() {
        if (checkoutBtn) {
          checkoutBtn.textContent = activeOrder ? "Refund" : "Checkout";
          checkoutBtn.classList.toggle("checkout", !activeOrder);
          checkoutBtn.classList.toggle("close", Boolean(activeOrder));
        }
        if (clearBtn) {
          clearBtn.disabled = Boolean(activeOrder);
          clearBtn.style.opacity = activeOrder ? "0.55" : "";
          clearBtn.textContent = "Clear Cart";
        }
      }

      async function notifyReady(order) {
        try {
          await fetch("/shop/web/ready", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.orderId,
              userId: order.userId,
              ign: order.ign || "",
              coordinates: order.coordinates || ""
            })
          });
        } catch {
          // best-effort only
        }
      }

      function stopOrderStatusPoll() {
        if (orderStatusPoll) {
          clearInterval(orderStatusPoll);
          orderStatusPoll = null;
        }
      }

      function stopDeliveryAutoCloseTimer() {
        if (deliveryAutoCloseTimer) {
          clearTimeout(deliveryAutoCloseTimer);
          deliveryAutoCloseTimer = null;
        }
      }

      function pauseDeliveryAutoCloseTimer() {
        if (!deliveryAutoCloseTimer) return;
        const elapsed = Math.max(0, Date.now() - deliveryAutoCloseStartedAt);
        deliveryAutoCloseRemainingMs = Math.max(0, deliveryAutoCloseRemainingMs - elapsed);
        stopDeliveryAutoCloseTimer();
      }

      function startDeliveryAutoCloseTimer(ms) {
        if (!activeOrder || !activeOrder.delivered) return;
        if (activeOrder.deliveredAutoClosed) return;
        const duration = Math.max(0, Number(ms || 0));
        deliveryAutoCloseRemainingMs = duration;
        if (activeOrder && duration > 0) {
          activeOrder.deliveredCloseAt = Date.now() + duration;
          saveActiveOrder();
        }
        if (duration <= 0) {
          cart = {};
          saveCart();
          setActiveOrder(null);
          stopOrderStatusPoll();
          stopDeliveryAutoCloseTimer();
          renderCart();
          renderPostCheckoutState();
          renderWebsiteOnlyPaidFlow();
          if (cartOverlay) {
            cartOverlay.classList.remove("open");
          }
          return;
        }
        stopDeliveryAutoCloseTimer();
        deliveryAutoCloseStartedAt = Date.now();
        deliveryAutoCloseTimer = setTimeout(() => {
          deliveryAutoCloseTimer = null;
          deliveryAutoCloseRemainingMs = 0;
          cart = {};
          saveCart();
          setActiveOrder(null);
          stopOrderStatusPoll();
          stopDeliveryAutoCloseTimer();
          renderCart();
          renderPostCheckoutState();
          renderWebsiteOnlyPaidFlow();
          if (cartOverlay) {
            cartOverlay.classList.remove("open");
          }
        }, duration);
      }

      function startOrderStatusPoll() {
        stopOrderStatusPoll();
        if (!activeOrder || !activeOrder.orderId) return;
        orderStatusPoll = setInterval(async () => {
          if (!activeOrder || !activeOrder.orderId) return;
          try {
            const res = await fetch("/shop/web/order-status?orderId=" + encodeURIComponent(activeOrder.orderId));
            const payload = await res.json().catch(() => ({}));
            if (!res.ok || !payload || payload.ok !== true) return;
            if (payload.status === "DELIVERED") {
              activeOrder.delivered = true;
              activeOrder.deliveredMessage = "Hope you enjoyed this delivery, please remember to drop a review!";
              activeOrder.deliveredAutoClosed = false;
              activeOrder.deliveredAt = new Date().toISOString();
              activeOrder.deliveredCloseAt = Date.now() + 60000;
              saveActiveOrder();
              renderWebsiteOnlyPaidFlow();
              stopOrderStatusPoll();
              startDeliveryAutoCloseTimer(60000);
            }
          } catch {
            // ignore polling failure
          }
        }, 1500);
      }

      function renderWebsiteOnlyPaidFlow() {
        if (!cartFlow) return;
        if (!activeOrder) {
          cartFlow.innerHTML = "";
          return;
        }

        const ign = activeOrder.ign || "";
        const coords = activeOrder.coordinates || "";
        const ready = Boolean(activeOrder.ready);
        const delivered = Boolean(activeOrder.delivered);
        if (delivered) {
          cartFlow.innerHTML =
            '<div class="flow-embed">' +
            escHtml(activeOrder.deliveredMessage || "Hope you enjoyed this delivery, please remember to drop a review!") +
            "</div>";
          return;
        }
        cartFlow.innerHTML =
          '<div class="flow-embed">' +
          "<h4>Paid Order " + escHtml(activeOrder.orderId) + "</h4>" +
          "<div>This order is now paid, please put your coordinates and IGN below. ETA will be shared soon by one of our admins when they are online.</div>" +
          '<div class="flow-meta">' +
          '<div class="flow-meta-row"><span class="flow-meta-label">IGN</span><span class="flow-meta-value">' + escHtml(ign || "-") + "</span></div>" +
          '<div class="flow-meta-row"><span class="flow-meta-label">Coordinates</span><span class="flow-meta-value">' + escHtml(coords || "-") + "</span></div>" +
          "</div>" +
          "</div>" +
          '<div class="flow-actions">' +
          '<button id="flow-ign" class="flow-btn" type="button">IGN</button>' +
          '<button id="flow-coords" class="flow-btn" type="button">Coordinates</button>' +
          "</div>" +
          (ign && coords
            ? '<div class="flow-embed">Are you ready for your delivery?</div><div class="flow-actions"><button id="flow-ready" class="flow-btn ok" type="button">' +
              (ready ? "Ready Confirmed" : "Yes") +
              "</button></div>"
            : "");

        const ignBtn = document.getElementById("flow-ign");
        const coordsBtn = document.getElementById("flow-coords");
        const readyBtn = document.getElementById("flow-ready");
        if (ignBtn) {
          ignBtn.addEventListener("click", () => {
            openFlowInputModal({
              title: "Enter IGN",
              hint: "Enter your Minecraft IGN.",
              value: activeOrder.ign || "",
              maxLen: 32,
              onSave: (next) => {
                activeOrder.ign = next.trim().slice(0, 32);
                saveActiveOrder();
                renderWebsiteOnlyPaidFlow();
              }
            });
          });
        }
        if (coordsBtn) {
          coordsBtn.addEventListener("click", () => {
            openFlowInputModal({
              title: "Enter Coordinates",
              hint: "Enter coordinates like X Y Z.",
              value: activeOrder.coordinates || "",
              maxLen: 120,
              onSave: (next) => {
                activeOrder.coordinates = next.trim().slice(0, 120);
                saveActiveOrder();
                renderWebsiteOnlyPaidFlow();
              }
            });
          });
        }
        if (readyBtn) {
          readyBtn.addEventListener("click", async () => {
            activeOrder.ready = true;
            saveActiveOrder();
            renderWebsiteOnlyPaidFlow();
            await notifyReady(activeOrder);
            startOrderStatusPoll();
          });
        }
      }

      function openFlowInputModal({ title, hint, value, maxLen, onSave }) {
        if (!flowInputModal || !flowInputValue || !flowInputSave) return;
        flowInputSubmit = onSave;
        if (flowInputTitle) flowInputTitle.textContent = String(title || "Enter value");
        if (flowInputHint) flowInputHint.textContent = String(hint || "");
        flowInputValue.value = String(value || "");
        if (maxLen && Number.isInteger(Number(maxLen))) {
          flowInputValue.maxLength = Number(maxLen);
        } else {
          flowInputValue.removeAttribute("maxlength");
        }
        if (flowInputError) flowInputError.textContent = "";
        flowInputModal.classList.add("open");
        flowInputValue.focus();
        flowInputValue.select();
      }

      if (flowInputSave) {
        flowInputSave.addEventListener("click", () => {
          const raw = String((flowInputValue && flowInputValue.value) || "");
          const next = raw.trim();
          if (!next) {
            if (flowInputError) flowInputError.textContent = "This field cannot be empty.";
            return;
          }
          if (typeof flowInputSubmit === "function") {
            flowInputSubmit(next);
          }
          flowInputSubmit = null;
          if (flowInputModal) flowInputModal.classList.remove("open");
        });
      }
      if (flowInputCancel) {
        flowInputCancel.addEventListener("click", () => {
          flowInputSubmit = null;
          if (flowInputModal) flowInputModal.classList.remove("open");
        });
      }
      if (flowInputModal) {
        flowInputModal.addEventListener("click", (e) => {
          if (e.target === flowInputModal) {
            flowInputSubmit = null;
            flowInputModal.classList.remove("open");
          }
        });
      }

      function syncCheckoutLabel() {
        if (!checkoutPaypal) return;
        const useCredit = Boolean(checkoutUseCredit && checkoutUseCredit.checked);
        checkoutPaypal.textContent = useCredit ? "Checkout" : "PayPal";
      }

      async function applyCouponCode(codeRaw) {
        const code = String(codeRaw || "").trim().toUpperCase();
        if (!code) {
          couponCode = "";
          couponType = "";
          couponAmount = 0;
          couponDiscount = 0;
          saveCoupon();
          renderCart();
          return { ok: true, cleared: true };
        }
        const summary = cartSummaryForCheckout();
        if (!summary.count) {
          return { ok: false, error: "Your cart is empty." };
        }
        try {
          const res = await fetch("/shop/web/coupon/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, subtotal: summary.subtotal })
          });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok || !payload || payload.ok !== true) {
            return { ok: false, error: String((payload && payload.error) || "Invalid coupon.") };
          }
          couponCode = String(payload.code || code);
          couponType = String(payload.type || "");
          couponAmount = Number(payload.amount || 0);
          couponDiscount = Number(payload.discount || 0);
          saveCoupon();
          renderCart();
          return { ok: true, discount: couponDiscount };
        } catch {
          return { ok: false, error: "Coupon validation failed." };
        }
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
          if (activeOrder && activeOrder.delivered) {
            setActiveOrder(null);
            stopOrderStatusPoll();
            stopDeliveryAutoCloseTimer();
            deliveryAutoCloseRemainingMs = 0;
            deliveryAutoCloseStartedAt = 0;
            renderWebsiteOnlyPaidFlow();
            renderPostCheckoutState();
          }
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
        if (activeOrder) {
          return;
        }
        cart = {};
        saveCart();
        couponCode = "";
        couponType = "";
        couponAmount = 0;
        couponDiscount = 0;
        saveCoupon();
        deliveryCoords = "";
        deliveryFee = 0;
        saveDelivery();
        setActiveOrder(null);
        stopOrderStatusPoll();
        stopDeliveryAutoCloseTimer();
        deliveryAutoCloseRemainingMs = 0;
        deliveryAutoCloseStartedAt = 0;
        renderCart();
        renderPostCheckoutState();
        renderWebsiteOnlyPaidFlow();
      });
      if (topCartBtn) {
        topCartBtn.addEventListener("click", () => {
          if (cartOverlay) cartOverlay.classList.add("open");
          if (activeOrder && activeOrder.delivered && deliveryAutoCloseRemainingMs > 0) {
            startDeliveryAutoCloseTimer(deliveryAutoCloseRemainingMs);
          }
        });
      }
      if (cartHideBtn) {
        cartHideBtn.addEventListener("click", () => {
          if (activeOrder && activeOrder.delivered) {
            pauseDeliveryAutoCloseTimer();
          }
          if (cartOverlay) cartOverlay.classList.remove("open");
        });
      }
      if (cartOverlay) {
        cartOverlay.addEventListener("click", (e) => {
          if (e.target === cartOverlay) {
            if (activeOrder && activeOrder.delivered) {
              pauseDeliveryAutoCloseTimer();
            }
            cartOverlay.classList.remove("open");
          }
        });
      }
      checkoutBtn.addEventListener("click", () => {
        if (activeOrder) {
          fetch("/shop/web/refund", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: activeOrder.orderId,
              userId: activeOrder.userId
            })
          }).catch(() => null);
          setActiveOrder(null);
          stopOrderStatusPoll();
          stopDeliveryAutoCloseTimer();
          deliveryAutoCloseRemainingMs = 0;
          deliveryAutoCloseStartedAt = 0;
          deliveryCoords = "";
          deliveryFee = 0;
          saveDelivery();
          renderPostCheckoutState();
          renderWebsiteOnlyPaidFlow();
          if (checkoutResult) checkoutResult.textContent = "Order refunded.";
          if (checkoutError) checkoutError.textContent = "";
          return;
        }
        if (checkoutError) checkoutError.textContent = "";
        if (checkoutResult) checkoutResult.textContent = "";
        if (checkoutEmail) checkoutEmail.value = "";
        if (checkoutUseCredit) checkoutUseCredit.checked = false;
        syncCheckoutLabel();
        if (checkoutModal) checkoutModal.classList.add("open");
      });
      if (checkoutClose) {
        checkoutClose.addEventListener("click", () => {
          if (checkoutModal) checkoutModal.classList.remove("open");
        });
      }
      if (discountBtn) {
        discountBtn.addEventListener("click", () => {
          if (discountError) discountError.textContent = "";
          if (discountResult) discountResult.textContent = "";
          if (discountCodeInput) discountCodeInput.value = couponCode || "";
          if (discountModal) discountModal.classList.add("open");
        });
      }
      if (deliveryBtn) {
        deliveryBtn.addEventListener("click", () => {
          if (deliveryError) deliveryError.textContent = "";
          if (deliveryResult) deliveryResult.textContent = "";
          if (deliveryCoordsInput) deliveryCoordsInput.value = deliveryCoords || "";
          if (deliveryModal) deliveryModal.classList.add("open");
        });
      }
      if (discountClose) {
        discountClose.addEventListener("click", () => {
          if (discountModal) discountModal.classList.remove("open");
        });
      }
      if (deliveryClose) {
        deliveryClose.addEventListener("click", () => {
          if (deliveryModal) deliveryModal.classList.remove("open");
        });
      }
      if (discountApply) {
        discountApply.addEventListener("click", async () => {
          if (discountError) discountError.textContent = "";
          if (discountResult) discountResult.textContent = "";
          const code = String((discountCodeInput && discountCodeInput.value) || "").trim();
          const result = await applyCouponCode(code);
          if (!result.ok) {
            if (discountError) discountError.textContent = result.error || "Invalid coupon.";
            return;
          }
          if (discountResult) {
            discountResult.textContent = result.cleared ? "Discount cleared." : "Discount applied: -" + fmt(couponDiscount);
          }
        });
      }
      if (deliveryApply) {
        deliveryApply.addEventListener("click", () => {
          if (deliveryError) deliveryError.textContent = "";
          if (deliveryResult) deliveryResult.textContent = "";
          const rawValue =
            (deliveryCoordsInput && typeof deliveryCoordsInput.value === "string" ? deliveryCoordsInput.value : "") || "";
          const value = String(rawValue || (deliveryCoordsInput && deliveryCoordsInput.getAttribute("value")) || "").trim();
          if (!value) {
            deliveryCoords = "";
            deliveryFee = 0;
            saveDelivery();
            renderCart();
            if (deliveryResult) deliveryResult.textContent = "Delivery cleared.";
            return;
          }
          const parsed = parseCoords(value);
          if (!parsed) {
            const nums = normalizeMinus(value).match(/-?\d+(?:\.\d+)?/g) || [];
            const hint = nums.length ? "Detected numbers: " + nums.join(", ") : "No numbers detected.";
            const rawPreview = value ? String(value).slice(0, 80) : "(empty)";
            if (deliveryError) {
              deliveryError.textContent =
                "Please enter valid X and Z coordinates. " + hint + " Raw: " + rawPreview;
            }
            return;
          }
          deliveryCoords = value;
          deliveryFee = computeDeliveryFeeFromCoords(parsed);
          saveDelivery();
          renderCart();
          if (deliveryResult) deliveryResult.textContent = "Delivery fee applied: " + fmt(deliveryFee);
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

          if (!authedAccountUserId) {
            if (checkoutError) checkoutError.textContent = "Please login first.";
            if (checkoutResult) checkoutResult.textContent = "";
            return;
          }
          const useCredit = Boolean(checkoutUseCredit && checkoutUseCredit.checked);

          try {
            const response = await fetch("/shop/web/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                useCredit,
                cart: summary.normalized,
                couponCode: couponCode,
                deliveryCoords: deliveryCoords
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
                "Order created: " +
                String(payload.orderId || "ORDER-LOCAL") +
                " | Credit used: $" +
                Number(payload.creditUsed || 0).toFixed(2) +
                " | Total due: $" +
                Number(payload.totalDue || 0).toFixed(2);
            }

            setActiveOrder({
              orderId: String(payload.orderId || "ORDER-LOCAL"),
              userId: authedAccountUserId,
              ign: "",
              coordinates: "",
              ready: false,
              delivered: false,
              deliveredAutoClosed: false,
              paidAt: new Date().toISOString()
            });
            stopDeliveryAutoCloseTimer();
            deliveryAutoCloseRemainingMs = 0;
            deliveryAutoCloseStartedAt = 0;
            if (checkoutModal) checkoutModal.classList.remove("open");
            renderPostCheckoutState();
            renderWebsiteOnlyPaidFlow();
            startOrderStatusPoll();
            if (checkoutError) checkoutError.textContent = "";
          } catch {
            if (checkoutError) checkoutError.textContent = "Checkout request failed.";
            if (checkoutResult) checkoutResult.textContent = "";
          }
        });
      }
      if (checkoutUseCredit && checkoutPaypal) {
        checkoutUseCredit.addEventListener("change", syncCheckoutLabel);
        checkoutUseCredit.addEventListener("click", syncCheckoutLabel);
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
      if (discountModal) {
        discountModal.addEventListener("click", (e) => {
          if (e.target === discountModal) discountModal.classList.remove("open");
        });
      }
      if (deliveryModal) {
        deliveryModal.addEventListener("click", (e) => {
          if (e.target === deliveryModal) deliveryModal.classList.remove("open");
        });
      }
      loadCart();
      loadCoupon();
      loadDelivery();
      loadActiveOrder();
      syncCheckoutLabel();
      renderPostCheckoutState();
      renderCart();
      renderWebsiteOnlyPaidFlow();
      if (activeOrder && activeOrder.orderId) {
        startOrderStatusPoll();
      }
      applyFilter();
    })();
  </script>
</body>
</html>`;
}

function websiteReviewsHtml({ reviews, session = {}, msg = "", err = "" }) {
  const userId = String(session && session.userId ? session.userId : "");
  const userTag = String(session && session.userTag ? session.userTag : "");
  const provider = String(session && session.provider ? session.provider : "");
  const list = Array.isArray(reviews) ? reviews : [];
  const ordered = list
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const providerCounts = ordered.reduce((acc, review) => {
    const key = String(review.provider || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "mixed";
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Shop Reviews</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
  <style>
    .reviews-shell {
      width: min(1320px, 96%);
      display: grid;
      gap: 22px;
    }
    .reviews-hero {
      position: relative;
      overflow: hidden;
      border-radius: 32px;
      padding: 24px 24px 28px;
      border: 1px solid rgba(255,255,255,0.09);
      background:
        radial-gradient(circle at top center, rgba(96,165,250,0.18), transparent 32%),
        radial-gradient(circle at 80% 18%, rgba(52,211,153,0.10), transparent 24%),
        linear-gradient(180deg, rgba(5,8,18,0.95), rgba(6,10,24,0.98));
      box-shadow: 0 14px 32px rgba(0,0,0,0.24);
    }
    .reviews-hero::before { content: none; }
    .reviews-topbar {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .reviews-topbar nav {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .reviews-topbar a {
      text-decoration: none;
      color: #f8fafc;
      font-weight: 700;
      padding: 11px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05);
    }
    .reviews-copy {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 14px;
      max-width: 760px;
    }
    .reviews-kicker {
      width: fit-content;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.05);
      color: #dce7fb;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.10em;
      text-transform: uppercase;
    }
    .reviews-title {
      margin: 0;
      color: #fff;
      font-size: clamp(40px, 6vw, 72px);
      line-height: 0.96;
      letter-spacing: -0.05em;
      font-weight: 950;
    }
    .reviews-title span {
      font-style: italic;
      font-weight: 900;
    }
    .reviews-sub {
      margin: 0;
      color: #b8c4d9;
      font-size: clamp(15px, 2vw, 18px);
      line-height: 1.72;
      max-width: 64ch;
    }
    .reviews-stats {
      position: relative;
      z-index: 1;
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      max-width: 760px;
    }
    .reviews-stat {
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.04);
      padding: 16px 18px;
      backdrop-filter: none;
    }
    .reviews-stat b {
      display: block;
      color: #fff;
      font-size: clamp(24px, 3vw, 34px);
      line-height: 1;
      margin-bottom: 8px;
    }
    .reviews-stat span {
      color: #b9c7de;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .reviews-grid {
      display: grid;
      grid-template-columns: 420px minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    .review-panel,
    .review-list-shell {
      border-radius: 28px;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(7,11,24,0.95);
      box-shadow: 0 20px 54px rgba(0,0,0,0.28);
      padding: 22px;
    }
    .review-panel h2,
    .review-list-shell h2 {
      margin: 0 0 10px;
      color: #fff;
      font-size: 28px;
      letter-spacing: -0.04em;
    }
    .review-panel .subtle,
    .review-list-shell .subtle {
      color: #adbdd7;
      line-height: 1.7;
      margin-bottom: 14px;
    }
    .review-form {
      display: grid;
      gap: 12px;
      margin-top: 14px;
    }
    .review-form textarea {
      width: 100%;
      min-height: 160px;
      resize: vertical;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      color: #f8fafc;
      padding: 16px;
      font: inherit;
      line-height: 1.65;
      outline: none;
      box-sizing: border-box;
    }
    .review-form textarea:focus {
      border-color: rgba(125,211,252,0.44);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    }
    .review-submit {
      border: 0;
      border-radius: 999px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      color: #fff;
      font-weight: 900;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 16px 34px rgba(37,99,235,0.24);
    }
    .review-login-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #fff;
      font-weight: 800;
      border-radius: 999px;
      padding: 13px 18px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
    }
    .review-list {
      display: grid;
      gap: 14px;
      margin-top: 12px;
    }
    .review-row {
      border-radius: 22px;
      border: 1px solid rgba(255,255,255,0.10);
      background:
        radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 24%),
        linear-gradient(180deg, rgba(10,14,30,0.96), rgba(7,11,22,0.98));
      padding: 18px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }
    .review-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .review-user {
      color: #fff;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.03em;
    }
    .review-time {
      color: #96a6c3;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.10em;
      font-weight: 700;
    }
    .review-meta {
      color: #8ea1c3;
      font-size: 12px;
      margin-bottom: 10px;
    }
    .review-text {
      color: #e7eefb;
      line-height: 1.8;
      white-space: pre-wrap;
      font-size: 15px;
    }
    @media (max-width: 1020px) {
      .reviews-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 760px) {
      .reviews-shell {
        width: min(96%, 96%);
      }
      .reviews-hero,
      .review-panel,
      .review-list-shell {
        border-radius: 22px;
        padding: 18px;
      }
      .reviews-stats {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="reviews-shell">
        <div class="reviews-hero">
          <div class="reviews-topbar">
            <nav>
              <a href="/shop">Shop Options</a>
              <a href="/shop/web">Website Shop</a>
              <a href="/">Back Home</a>
            </nav>
          </div>
          <div class="reviews-copy">
            <div class="reviews-kicker">Customer feedback</div>
            <h1 class="reviews-title"><span>Looooooty</span> Reviews</h1>
            <p class="reviews-sub">Public review history for the storefront. Logged-in users can leave a review after buying, and everyone can use this page to gauge trust, consistency, and how the shop is performing over time.</p>
          </div>
          <div class="reviews-stats">
            <div class="reviews-stat"><b>${ordered.length}</b><span>Total Reviews</span></div>
            <div class="reviews-stat"><b>${new Set(ordered.map((r) => String(r.userId || ""))).size}</b><span>Unique Reviewers</span></div>
            <div class="reviews-stat"><b>${esc(topProvider)}</b><span>Top Provider</span></div>
          </div>
        </div>

        <div class="reviews-grid">
          <div class="review-panel">
            <h2>Write a review</h2>
            <div class="subtle">Post feedback that other buyers can actually use. Keep it specific, short, and relevant to the order, delivery, or communication quality.</div>
            ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
            ${err ? `<div class="warn">${esc(err)}</div>` : ""}
            ${
              userId
                ? `<div class="note">Posting as <b>${esc(userTag || "User")}</b> via <b>${esc(provider || "unknown")}</b>.</div>
                   <form class="review-form" method="post" action="/shop/reviews">
                     <textarea name="review" maxlength="500" required placeholder="Write your review here (max 500 characters)"></textarea>
                     <button class="review-submit" type="submit">Post Review</button>
                   </form>`
                : `<div class="note">You need to be logged in before you can post a public review.</div>
                   <a class="review-login-btn" href="/auth?next=%2Fshop%2Freviews">Sign Up / Login</a>`
            }
          </div>

          <div class="review-list-shell">
            <h2>Recent reviews</h2>
            <div class="subtle">Newest reviews are shown first so the page reflects the current state of the shop.</div>
            <div class="review-list">
              ${ordered.length
                ? ordered.map((r) => `<div class="review-row">
                    <div class="review-head">
                      <div class="review-user">${esc(r.userTag || "User")}</div>
                      <div class="review-time">${esc(r.createdAt ? new Date(r.createdAt).toLocaleString("en-US", { hour12: false }) : "")}</div>
                    </div>
                    <div class="review-meta">Provider: ${esc(r.provider || "unknown")} • ID: ${esc(r.userId || "-")}</div>
                    <div class="review-text">${esc(r.text || "")}</div>
                  </div>`).join("")
                : '<div class="note">No reviews yet.</div>'}
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</body>
</html>`;
}

function applyPageHtml(forms, msg = "", err = "", session = {}) {
  const activeForms = (forms || []).filter((f) => f.active !== false);
  const authLabel = String(session && session.userId ? "Account" : "Sign Up");
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
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a href="/bases">State of Bases</a>
          <a class="active" href="/apply">Apply</a>
          <a href="/shop">Shop</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/">Back Home</a>
          <a class="pill primary" href="/auth">${authLabel}</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Applications</div>
        <h1 class="page-title">Apply to <em>Looooooty</em></h1>
        <p class="page-sub">Submit applications for base access and related roles through the website.</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>Submit an application</h2>
          ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
          ${err ? `<div class="warn">${esc(err)}</div>` : ""}
          ${activeForms.length ? "" : '<div class="warn">No application types are available right now.</div>'}
          <form class="form-grid" method="post" action="/apply">
            <div class="subtle" style="margin-bottom:12px;">You must be logged in with Discord to submit an application. Your Discord account is used automatically.</div>
            <label>Application Type</label>
            <select name="form_id" required>
              ${activeForms.map((f) => `<option value="${esc(f.id)}">${esc(f.name)}${f.guildId ? ` (Guild ${esc(f.guildId)})` : ""}</option>`).join("")}
            </select>
            <input type="hidden" name="discord_user_id" value="${esc(String(session && session.userId ? session.userId : ""))}" />
            <input type="hidden" name="discord_tag" value="${esc(String(session && session.userTag ? session.userTag : ""))}" />
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
              const sel = document.querySelector('select[name="form_id"]');
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
                  '<input type="text" name="custom_answers" maxlength="500" placeholder="Answer #' + (i + 1) + '" required />'
                ).join('');
              }
              sel.addEventListener('change', render);
              render();
            })();
          </script>
        </article>
        <aside class="page-card">
          <h3>Before you submit</h3>
          <div class="subtle">
            <p>Use the correct Discord user ID. That links the application back to role grant flows.</p>
            <p>Different application types can surface different custom questions automatically.</p>
            <p>Short low-effort answers are harder to trust. Be specific.</p>
          </div>
        </aside>
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
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml({})}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a href="/">Home</a>
          <a href="/shop">Shop</a>
          <a class="active" href="/staff">Staff</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/">Back Home</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Restricted</div>
        <h1 class="page-title">Staff <em>Access</em></h1>
        <p class="page-sub">Enter the staff code to access the protected control panel.</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>Enter the panel</h2>
          ${error ? `<div class="warn">${esc(error)}</div>` : ""}
          <form class="form-grid" method="post" action="/staff/login">
            <input name="user" placeholder="Staff name" required maxlength="32" />
            <input name="code" placeholder="Staff code" required />
            <button class="submit" type="submit">Open Staff Panel</button>
          </form>
        </article>
        <aside class="page-card">
          <h3>Operational note</h3>
          <div class="subtle">
            <p>This page only unlocks the protected control panel.</p>
            <p>Shop operations, base management, and application controls stay inside the authenticated staff interface.</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
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
        url('${HOME_BG_URL}') center/cover no-repeat;
      min-height: 100vh;
    }
    .layout { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; }
    .side { padding: 24px 16px; display: flex; align-items: stretch; }
    .menu-shell {
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(8,12,18,0.58);
      backdrop-filter: none;
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
      backdrop-filter: none;
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
      backdrop-filter: none;
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
    .ws-compact-img { border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.15); background: rgba(5,9,25,0.8); margin-bottom:8px; display:grid; place-items:center; }
    .ws-compact-img img { width:100%; height:120px; object-fit:contain; display:block; background: rgba(5,9,25,0.8); }
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
  const accountsBtnLabel = activeTab === "accounts" ? "Accounts (Active)" : "Accounts";
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
        <a class="btn" href="/panel/accounts">${accountsBtnLabel}</a>
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
      <input type="text" name="account_id" required maxlength="240" placeholder="Account ID (Discord ID or google:... or looooooty:...)" />
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

function shopDeliveryAlertsPanelHtml() {
  const readyAlerts = loadWebsiteReadyAlerts()
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 20);
  const unreadReady = readyAlerts.filter((a) => a.delivered !== true).length;

  return `<div class="card base-panel" style="margin-top:12px;">
    <h3 style="margin-top:0;">Ready For Delivery Alerts (${unreadReady} unread)</h3>
    <div class="note">Website shop delivery queue and fulfillment actions.</div>
    <div class="app-list">
      ${readyAlerts.length
        ? readyAlerts.map((a) => `<div class="app-row">
            <div class="app-head">
              <div><b>${esc(a.orderId || "-")}</b></div>
              <div><span class="tag ${a.delivered === true ? "approved" : "pending"}">${a.delivered === true ? "DELIVERED" : "NEW"}</span></div>
            </div>
            <div class="app-meta">
              User ID: <b>${esc(a.userId || "-")}</b><br/>
              IGN: <b>${esc(a.ign || "-")}</b><br/>
              Coordinates: <b>${esc(a.coordinates || "-")}</b><br/>
              Items: <b>${esc(
                Array.isArray(a.items) && a.items.length
                  ? a.items.map((it) => `${Number(it && it.qty ? it.qty : 1)}x ${String(it && it.name ? it.name : "Item")}`).join(", ")
                  : "-"
              )}</b><br/>
              At: <b>${esc(new Date(a.createdAt || Date.now()).toLocaleString("en-US", { hour12: false }))}</b>
            </div>
            ${a.delivered === true ? "" : `<div class="app-actions"><form method="post" action="/staff/ready-alerts/${encodeURIComponent(a.id || "")}/deliver" style="margin:0;"><button class="save-btn" type="submit">Mark Delivered</button></form></div>`}
          </div>`).join("")
        : '<div class="note">No delivery-ready alerts yet.</div>'}
    </div>
  </div>`;
}

function staffAccountsPanelHtml(accounts) {
  const rows = Array.isArray(accounts) ? accounts.slice() : [];
  rows.sort((a, b) => String(b && b.lastLoginAt || "").localeCompare(String(a && a.lastLoginAt || "")));
  return `<div class="card base-panel">
    <h3 style="margin-top:0;">Web Accounts (${rows.length})</h3>
    <div class="note">Accounts that logged into the website.</div>
    <div class="app-list">
      ${rows.length
        ? rows.map((a) => `<div class="app-row">
            <div class="app-head">
              <div><b>${esc(a.userTag || a.userId || "-")}</b></div>
              <div><span class="tag approved">${esc(String(a.provider || "unknown").toUpperCase())}</span></div>
            </div>
            <div class="app-meta">
              ID: <b>${esc(a.userId || "-")}</b><br/>
              Username: <b>${esc(a.userTag || "-")}</b><br/>
              Provider: <b>${esc(a.provider || "-")}</b><br/>
              First Seen: <b>${esc(a.firstSeenAt ? new Date(a.firstSeenAt).toLocaleString("en-US", { hour12: false }) : "-")}</b><br/>
              Last Login: <b>${esc(a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("en-US", { hour12: false }) : "-")}</b><br/>
              Logins: <b>${Number(a.loginCount || 0)}</b>
            </div>
          </div>`).join("")
        : '<div class="note">No accounts logged in yet.</div>'}
    </div>
  </div>`;
}

function staffShopTabHtml(s, websiteShop) {
  const products = Array.isArray(websiteShop && websiteShop.products) ? websiteShop.products : [];
  const categories = Array.isArray(websiteShop && websiteShop.categories) ? websiteShop.categories : [];

  return `<div class="card base-panel">
    <h3 style="margin:0 0 8px;">Website Shop Controls</h3>
    <div class="note">This panel now manages website-only products, categories, coupons, reviews and delivery alerts. The Discord shop is managed inside Discord.</div>

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
    <datalist id="webshop-category-list">
      ${categories.map((c) => `<option value="${esc(c)}"></option>`).join("")}
    </datalist>
    <form method="post" action="/staff/webshop/product/add" class="webshop-product-form" style="display:grid; gap:10px;">
      <input type="text" name="name" maxlength="80" required placeholder="Product name" />
      <input type="text" name="description" maxlength="400" placeholder="Description (optional)" />
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
        <input type="text" name="price" required placeholder="Price (e.g. 0.69)" />
        <input type="text" name="category" list="webshop-category-list" required placeholder="Category (e.g. kits)" />
      </div>
      <input type="text" name="stock_qty" placeholder="Stock quantity (optional, number)" />
      <input type="text" name="image" placeholder="Image URL (https://...)" />
      <input type="file" name="image_file" accept="image/*" />
      <input type="hidden" name="image_data" />
      <div class="note">Type a category or pick an existing one. Use either image URL or upload file. URL is used if both are set.</div>
      <button class="save-btn" type="submit">Add Product</button>
    </form>

    <h4 style="margin:18px 0 6px;">Products (${products.length})</h4>
    <h4 style="margin:18px 0 6px;">Website Coupons</h4>
    <form method="post" action="/staff/webshop/coupon/add" style="display:grid; gap:10px; max-width:520px;">
      <input type="text" name="code" required maxlength="30" placeholder="Coupon code (e.g. LOOT10)" />
      <div class="ws-inline">
        <select name="type" required>
          <option value="percent">Percent (%)</option>
          <option value="flat">Flat ($)</option>
        </select>
        <input type="text" name="amount" required placeholder="Amount (e.g. 10 or 1.50)" />
      </div>
      <button class="save-btn" type="submit">Add Coupon</button>
    </form>
    <div class="app-list" style="margin-top:10px;">
      ${(() => {
        const coupons = loadWebsiteCoupons();
        if (!coupons.length) return '<div class="note">No coupons yet.</div>';
        return coupons
          .map((c) => `<div class="app-row">
            <div class="app-head">
              <div><b>${esc(c.code || "-")}</b></div>
              <div><span class="tag ${c.active === false ? "rejected" : "approved"}">${c.active === false ? "INACTIVE" : "ACTIVE"}</span></div>
            </div>
            <div class="app-meta">Type: <b>${esc(c.type || "-")}</b> • Amount: <b>${esc(String(c.amount || 0))}</b></div>
            <div class="app-actions">
              <form method="post" action="/staff/webshop/coupon/${encodeURIComponent(c.code || "")}/toggle" style="margin:0;">
                <button class="btn" type="submit">${c.active === false ? "Set Active" : "Set Inactive"}</button>
              </form>
              <form method="post" action="/staff/webshop/coupon/${encodeURIComponent(c.code || "")}/delete" style="margin:0;" onsubmit="return confirm('Delete this coupon?');">
                <button class="danger-btn" type="submit">Delete</button>
              </form>
            </div>
          </div>`)
          .join("");
      })()}
    </div>
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
                  <form method="post" action="/staff/webshop/product/${encodeURIComponent(p.id)}/edit" class="webshop-product-form" style="display:grid; gap:8px; border-top:1px solid rgba(255,255,255,0.12); padding-top:8px;">
                    <input type="text" name="name" required maxlength="80" value="${esc(p.name || "")}" />
                    <input type="text" name="description" maxlength="400" value="${esc(p.description || "")}" />
                    <div class="ws-inline">
                      <input type="text" name="price" required value="${Number(p.price || 0).toFixed(2)}" />
                      <input type="text" name="category" list="webshop-category-list" required value="${esc(p.category || "")}" placeholder="Category" />
                    </div>
                    <input type="text" name="stock_qty" value="${Number.isFinite(Number(p.stockQty)) ? String(p.stockQty) : ""}" placeholder="Stock quantity (optional, number)" />
                    <input type="text" name="image" value="${esc(p.image || "")}" placeholder="Image URL (https://...)" />
                    <input type="file" name="image_file" accept="image/*" />
                    <input type="hidden" name="image_data" />
                    <div class="note">Type a category or pick an existing one. Use either image URL or upload file. URL is used if both are set.</div>
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
  </div>${shopAutomationPanelHtml()}${shopDeliveryAlertsPanelHtml()}
  <script>
    (function () {
      function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to read image file"));
          reader.readAsDataURL(file);
        });
      }
      document.querySelectorAll("form.webshop-product-form").forEach((form) => {
        form.addEventListener("submit", async (e) => {
          const fileInput = form.querySelector('input[name="image_file"]');
          const imageInput = form.querySelector('input[name="image"]');
          const dataInput = form.querySelector('input[name="image_data"]');
          if (!fileInput || !dataInput) return;
          const hasUrl = Boolean(imageInput && String(imageInput.value || "").trim());
          const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
          if (!file || hasUrl) {
            dataInput.value = "";
            return;
          }
          e.preventDefault();
          try {
            const dataUrl = await fileToDataUrl(file);
            dataInput.value = dataUrl.slice(0, 10000000);
            form.submit();
          } catch {
            alert("Image upload failed. Try a smaller file or use image URL.");
          }
        });
      });
    })();
  </script>`;
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

function staffPageHtml({ s, bases, applications, forms, websiteShop, webAccounts, msg = "", warn = "", staff, activeTab }) {
  let tabContent = staffShopTabHtml(s, websiteShop);
  if (activeTab === "bases") {
    tabContent = basesEditorPanelHtml(bases);
  } else if (activeTab === "applications") {
    tabContent = applicationsPanelHtml(applications, forms);
  } else if (activeTab === "accounts") {
    tabContent = staffAccountsPanelHtml(webAccounts);
  }
  const title =
    activeTab === "bases"
      ? "Staff Bases"
      : activeTab === "applications"
        ? "Staff Applications"
        : activeTab === "accounts"
          ? "Staff Accounts"
          : "Staff Shop";

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
  const approveUrl = normalizeBotInternalUrl(BOT_APPROVE_URL, "http://127.0.0.1:3001/internal/base-member/approve");
  if (!approveUrl || !BOT_INTERNAL_API_SECRET) {
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
    response = await fetch(approveUrl, {
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
  const notifyUrl = normalizeBotInternalUrl(BOT_NOTIFY_URL, "http://127.0.0.1:3001/internal/base-member/notify");
  if (!notifyUrl || !BOT_INTERNAL_API_SECRET) {
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
    response = await fetch(notifyUrl, {
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

function applicationResultPageHtml({ session = {}, application = null }) {
  const authLabel = String(session && session.userId ? "Account" : "Sign Up");
  const status = String(application && application.status ? application.status : "");
  const titleHtml = status === "APPROVED" ? "Application <em>Accepted</em>" : status === "REJECTED" ? "Application <em>Denied</em>" : "Application <em>Result</em>";
  const sub = status === "APPROVED"
    ? "Your application was accepted. Discord role access is handled through the bot."
    : status === "REJECTED"
      ? "Your application was reviewed and denied. Contact staff if you need more information."
      : "You do not have a reviewed application result yet.";
  const details = application
    ? `<div class="subtle"><p><b>Application:</b> ${esc(application.formName || "Application")}</p><p><b>Status:</b> ${esc(status || "PENDING")}</p><p><b>Reviewed by:</b> ${esc(application.reviewedBy || "-")}</p><p><b>Updated:</b> ${esc(application.updatedAt || application.createdAt || "-")}</p></div>`
    : `<div class="subtle"><p>No approved or rejected application result was found for your Discord account.</p></div>`;
  const nextStep = status === "APPROVED"
    ? `<p>Watch Discord for any new role access and follow staff instructions.</p>`
    : status === "REJECTED"
      ? `<p>If you reapply later, make sure your answers are complete and accurate.</p>`
      : `<p>Once staff review your submission, the result will appear here automatically.</p>`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Application Result</title>
  ${faviconLinks()}
  ${sharedHomeStyles()}
</head>
<body>
  <div class="layout">
    <aside class="side">${sideMenuHtml(session)}</aside>
    <main class="main">
      <section class="page-topbar">
        <div class="mark"><img src="${SITE_ICON_URL}" alt="Looooooty logo" /><b>Looooooty</b></div>
        <nav>
          <a href="/apply">Apply</a>
          <a class="active" href="/application-result">Application Result</a>
          <a href="/auth">Account</a>
        </nav>
        <div class="top-actions">
          <a class="pill" href="/">Back Home</a>
          <a class="pill primary" href="/auth">${authLabel}</a>
        </div>
      </section>
      <section class="hero">
        <div class="page-kicker">Applications</div>
        <h1 class="page-title">${titleHtml}</h1>
        <p class="page-sub">${sub}</p>
      </section>
      <section class="page-grid">
        <article class="page-panel">
          <h2>Current result</h2>
          ${details}
        </article>
        <aside class="page-card">
          <h3>Next step</h3>
          <div class="subtle">${nextStep}</div>
        </aside>
      </section>
    </main>
  </div>
</body>
</html>`;
}
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/auth/me", (req, res) => {
  const session = getWebSession(req);
  res.json({
    ok: true,
    loggedIn: Boolean(session && session.userId),
    provider: session ? String(session.provider || "") : "",
    userId: session ? session.userId : "",
    userTag: session ? session.userTag : "",
    oauthReady: {
      discord: oauthReady(),
      google: googleOauthReady()
    },
    hasSessionSigningKey: Boolean(WEB_SESSION_SIGNING_KEY && WEB_SESSION_SIGNING_KEY !== "change_me_web_session_key")
  });
});

app.get("/api/stats", requireStaff, (_req, res) => {
  res.json(stats());
});

app.get("/", (_req, res) => {
  const session = getWebSession(_req) || { userId: "", userTag: "" };
  res.send(homeHtml(session));
});

app.get("/bases", (req, res) => {
  const bases = loadBaseStates();
  const session = getWebSession(req) || { userId: "", userTag: "" };
  res.send(basesPageHtml(bases, session));
});

app.get("/auth", (req, res) => {
  const session = getWebSession(req) || { userId: "", userTag: "" };
  const localAccount =
    String(session.provider || "") === "looooooty" ? (findLocalAccountByUserId(session.userId) || {}).account || null : null;
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  const next = typeof req.query.next === "string" ? req.query.next : "/";
  res.send(authPageHtml({ session, localAccount, msg, err, next }));
});

app.get("/auth/looooooty", (req, res) => {
  const session = getWebSession(req) || { userId: "", userTag: "" };
  const rawMode = String(req.query.mode || "login");
  const mode = rawMode === "signup" || rawMode === "forgot" ? rawMode : "login";
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/auth";
  const next = nextRaw.startsWith("/") ? nextRaw : "/auth";
  res.send(localAuthPageHtml({ mode, msg, err, next, session }));
});

app.post("/auth/looooooty/signup", async (req, res) => {
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  const username = normalizeLocalUsername(req.body && req.body.username);
  const email = normalizeLocalEmail(req.body && req.body.email);
  const password = String(req.body && req.body.password ? req.body.password : "");
  const passwordConfirm = String(req.body && req.body.password_confirm ? req.body.password_confirm : "");

  if (!isValidLocalUsername(username)) {
    res.redirect(`/auth/looooooty?mode=signup&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Invalid username. Use 3-32 letters/numbers/._-")}`);
    return;
  }
  if (!isValidLocalEmail(email)) {
    res.redirect(`/auth/looooooty?mode=signup&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Invalid email address.")}`);
    return;
  }
  if (password.length < 8) {
    res.redirect(`/auth/looooooty?mode=signup&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Password must be at least 8 characters.")}`);
    return;
  }
  if (password !== passwordConfirm) {
    res.redirect(`/auth/looooooty?mode=signup&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Passwords do not match.")}`);
    return;
  }

  const accounts = loadLocalAccounts();
  const usernameKey = username.toLowerCase();
  const emailKey = email.toLowerCase();
  const nameTaken = accounts.some((a) => String(a && a.usernameLower || "") === usernameKey);
  const emailTaken = accounts.some((a) => String(a && a.emailLower || "") === emailKey);
  if (nameTaken) {
    res.redirect(`/auth/looooooty?mode=signup&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Username already exists.")}`);
    return;
  }
  if (emailTaken) {
    res.redirect(`/auth/looooooty?mode=signup&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Email already exists.")}`);
    return;
  }

  const now = new Date().toISOString();
  const userId = `looooooty:${crypto.randomBytes(12).toString("hex")}`;
  const record = {
    userId,
    provider: "looooooty",
    username,
    usernameLower: usernameKey,
    email,
    emailLower: emailKey,
    passwordHash: hashLocalPassword(password),
    emailVerified: false,
    verifyTokenHash: "",
    verifyTokenExpiresAt: "",
    resetTokenHash: "",
    resetTokenExpiresAt: "",
    failedLoginCount: 0,
    lockUntil: "",
    createdAt: now,
    lastLoginAt: now,
    loginCount: 1
  };
  accounts.push(record);
  saveLocalAccounts(accounts);
  const created = createWebSession({ provider: "looooooty", userId, userTag: username, avatarUrl: "" });
  recordWebAccountLogin({ provider: "looooooty", userId, userTag: username });
  setWebSessionCookie(res, created.token);
  res.redirect(`${next}?msg=${encodeURIComponent(`Logged in as ${username}`)}`);
});

app.post("/auth/looooooty/login", (req, res) => {
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  const ip = clientIp(req);
  if (!checkRateLimit(`local-login-ip:${ip}`, RATE_LIMIT_MAX_LOCAL_LOGIN, RATE_LIMIT_WINDOW_MS)) {
    res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Too many login attempts. Try again in 1 minute.")}`);
    return;
  }
  const identifierRaw = String(req.body && req.body.identifier ? req.body.identifier : "").trim();
  const password = String(req.body && req.body.password ? req.body.password : "");
  const identifier = identifierRaw.toLowerCase();
  if (!identifier || !password) {
    res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Invalid credentials.")}`);
    return;
  }

  const accounts = loadLocalAccounts();
  const idx = accounts.findIndex((a) =>
    String(a && a.usernameLower || "") === identifier ||
    String(a && a.emailLower || "") === identifier
  );
  if (idx === -1) {
    res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Invalid credentials.")}`);
    return;
  }
  const account = accounts[idx] || {};
  const lockUntilMs = account.lockUntil ? new Date(account.lockUntil).getTime() : 0;
  if (Number.isFinite(lockUntilMs) && lockUntilMs > Date.now()) {
    const mins = Math.max(1, Math.ceil((lockUntilMs - Date.now()) / 60000));
    res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&err=${encodeURIComponent(`Account locked. Try again in ${mins} minute(s).`)}`);
    return;
  }
  if (!verifyLocalPassword(password, account.passwordHash)) {
    const fails = Number(account.failedLoginCount || 0) + 1;
    const isLocked = fails >= LOCAL_LOGIN_MAX_FAILED;
    accounts[idx] = {
      ...account,
      failedLoginCount: fails,
      lastFailedAt: new Date().toISOString(),
      lockUntil: isLocked ? new Date(Date.now() + LOCAL_LOGIN_LOCK_MS).toISOString() : ""
    };
    saveLocalAccounts(accounts);
    res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Invalid credentials.")}`);
    return;
  }

  accounts[idx] = {
    ...account,
    failedLoginCount: 0,
    lockUntil: "",
    lastFailedAt: "",
    lastLoginAt: new Date().toISOString(),
    loginCount: Number(account.loginCount || 0) + 1
  };
  saveLocalAccounts(accounts);

  const userId = String(account.userId || "");
  const userTag = String(account.username || "LooooootyUser");
  const created = createWebSession({ provider: "looooooty", userId, userTag, avatarUrl: "" });
  recordWebAccountLogin({ provider: "looooooty", userId, userTag });
  setWebSessionCookie(res, created.token);
  res.redirect(`${next}?msg=${encodeURIComponent(`Logged in as ${userTag}`)}`);
});

app.get("/auth/looooooty/verify", (req, res) => {
  const uid = String(req.query.uid || "").trim();
  const token = String(req.query.token || "").trim();
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/auth";
  const next = nextRaw.startsWith("/") ? nextRaw : "/auth";
  const found = findLocalAccountByUserId(uid);
  if (!found || !found.account) {
    res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Verification link is invalid.")}`);
    return;
  }
  const account = found.account;
  const expiresMs = account.verifyTokenExpiresAt ? new Date(account.verifyTokenExpiresAt).getTime() : 0;
  const ok = Boolean(token) &&
    Boolean(account.verifyTokenHash) &&
    hashAuthToken(token) === String(account.verifyTokenHash) &&
    Number.isFinite(expiresMs) &&
    expiresMs > Date.now();
  if (!ok) {
    res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Verification link expired or invalid.")}`);
    return;
  }
  found.accounts[found.index] = {
    ...account,
    emailVerified: true,
    verifyTokenHash: "",
    verifyTokenExpiresAt: ""
  };
  saveLocalAccounts(found.accounts);
  res.redirect(`${next}?msg=${encodeURIComponent("Email verified successfully.")}`);
});

app.post("/auth/looooooty/forgot", async (req, res) => {
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/auth";
  const next = nextRaw.startsWith("/") ? nextRaw : "/auth";
  const ip = clientIp(req);
  if (!checkRateLimit(`local-forgot-ip:${ip}`, RATE_LIMIT_MAX_LOCAL_FORGOT, RATE_LIMIT_WINDOW_MS)) {
    res.redirect(`/auth/looooooty?mode=forgot&next=${encodeURIComponent(next)}&err=${encodeURIComponent("Too many requests. Try again in 1 minute.")}`);
    return;
  }
  const email = normalizeLocalEmail(req.body && req.body.email);
  const accounts = loadLocalAccounts();
  const account = accounts.find((a) => String(a && a.emailLower || "") === email);
  if (account) {
    await issueLocalPasswordReset(account);
  }
  res.redirect(`/auth/looooooty?mode=forgot&next=${encodeURIComponent(next)}&msg=${encodeURIComponent("If the email exists, a reset link has been sent.")}`);
});

app.get("/auth/looooooty/reset", (req, res) => {
  const uid = String(req.query.uid || "").trim();
  const token = String(req.query.token || "").trim();
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/auth";
  const next = nextRaw.startsWith("/") ? nextRaw : "/auth";
  const found = findLocalAccountByUserId(uid);
  if (!found || !found.account) {
    res.send(localResetPasswordPageHtml({ uid, token, next, err: "Reset link is invalid." }));
    return;
  }
  const account = found.account;
  const expiresMs = account.resetTokenExpiresAt ? new Date(account.resetTokenExpiresAt).getTime() : 0;
  const ok = Boolean(token) &&
    Boolean(account.resetTokenHash) &&
    hashAuthToken(token) === String(account.resetTokenHash) &&
    Number.isFinite(expiresMs) &&
    expiresMs > Date.now();
  if (!ok) {
    res.send(localResetPasswordPageHtml({ uid, token, next, err: "Reset link expired or invalid." }));
    return;
  }
  res.send(localResetPasswordPageHtml({ uid, token, next }));
});

app.post("/auth/looooooty/reset", (req, res) => {
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/auth";
  const next = nextRaw.startsWith("/") ? nextRaw : "/auth";
  const uid = String(req.body && req.body.uid ? req.body.uid : "").trim();
  const token = String(req.body && req.body.token ? req.body.token : "").trim();
  const password = String(req.body && req.body.password ? req.body.password : "");
  const passwordConfirm = String(req.body && req.body.password_confirm ? req.body.password_confirm : "");
  if (password.length < 8) {
    res.send(localResetPasswordPageHtml({ uid, token, next, err: "Password must be at least 8 characters." }));
    return;
  }
  if (password !== passwordConfirm) {
    res.send(localResetPasswordPageHtml({ uid, token, next, err: "Passwords do not match." }));
    return;
  }
  const found = findLocalAccountByUserId(uid);
  if (!found || !found.account) {
    res.send(localResetPasswordPageHtml({ uid, token, next, err: "Reset link is invalid." }));
    return;
  }
  const account = found.account;
  const expiresMs = account.resetTokenExpiresAt ? new Date(account.resetTokenExpiresAt).getTime() : 0;
  const ok = Boolean(token) &&
    Boolean(account.resetTokenHash) &&
    hashAuthToken(token) === String(account.resetTokenHash) &&
    Number.isFinite(expiresMs) &&
    expiresMs > Date.now();
  if (!ok) {
    res.send(localResetPasswordPageHtml({ uid, token, next, err: "Reset link expired or invalid." }));
    return;
  }
  found.accounts[found.index] = {
    ...account,
    passwordHash: hashLocalPassword(password),
    resetTokenHash: "",
    resetTokenExpiresAt: "",
    failedLoginCount: 0,
    lockUntil: "",
    lastFailedAt: ""
  };
  saveLocalAccounts(found.accounts);
  res.redirect(`/auth/looooooty?mode=login&next=${encodeURIComponent(next)}&msg=${encodeURIComponent("Password updated. You can now log in.")}`);
});

app.get("/auth/discord/start", (req, res) => {
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/auth";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  if (!oauthReady()) {
    res.redirect(`${next}?err=${encodeURIComponent("Discord login is not configured yet.")}`);
    return;
  }
  const state = crypto.randomBytes(24).toString("hex");
  oauthStateMap.set(state, { next, expiresAt: Date.now() + 10 * 60 * 1000 });
  const query = new URLSearchParams({
    client_id: DISCORD_OAUTH_CLIENT_ID,
    response_type: "code",
    redirect_uri: DISCORD_OAUTH_REDIRECT_URI,
    scope: "identify",
    state
  });
  res.redirect(`https://discord.com/oauth2/authorize?${query.toString()}`);
});

app.get("/auth/google/start", (req, res) => {
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/auth";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  if (!googleOauthReady()) {
    res.redirect(`${next}?err=${encodeURIComponent("Google login is not configured yet.")}`);
    return;
  }
  const state = crypto.randomBytes(24).toString("hex");
  oauthStateMap.set(state, { next, provider: "google", expiresAt: Date.now() + 10 * 60 * 1000 });
  const query = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    response_type: "code",
    redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
    scope: "openid email profile",
    state
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`);
});

app.get("/auth/discord/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const rec = oauthStateMap.get(state);
  oauthStateMap.delete(state);
  if (!rec || rec.expiresAt < Date.now()) {
    res.redirect("/auth?err=Discord%20login%20state%20expired");
    return;
  }
  if (!code || !oauthReady()) {
    res.redirect(`${rec.next}?err=${encodeURIComponent("Discord login failed.")}`);
    return;
  }
  try {
    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_OAUTH_CLIENT_ID,
        client_secret: DISCORD_OAUTH_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_OAUTH_REDIRECT_URI
      }).toString()
    });
    const tokenJson = await tokenResponse.json().catch(() => ({}));
    const accessToken = String(tokenJson && tokenJson.access_token ? tokenJson.access_token : "");
    if (!tokenResponse.ok || !accessToken) {
      const details = [
        "Discord token exchange failed.",
        tokenJson && tokenJson.error ? `error=${String(tokenJson.error)}` : "",
        tokenJson && tokenJson.error_description ? `description=${String(tokenJson.error_description)}` : "",
        `status=${tokenResponse.status}`
      ].filter(Boolean).join(" ");
      res.redirect(`${rec.next}?err=${encodeURIComponent(details)}`);
      return;
    }
    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userJson = await userResponse.json().catch(() => ({}));
    const userId = String(userJson && userJson.id ? userJson.id : "");
    if (!userResponse.ok || !isSnowflake(userId)) {
      res.redirect(`${rec.next}?err=${encodeURIComponent("Discord identity fetch failed.")}`);
      return;
    }
    const policyErr = await validateWebUserPolicy({ provider: "discord", userId });
    if (policyErr) {
      res.redirect(`${rec.next}?err=${encodeURIComponent(policyErr)}`);
      return;
    }
    const userTag = String(userJson.global_name || userJson.username || userId).slice(0, 64);
    const avatarUrl = userJson.avatar
      ? `https://cdn.discordapp.com/avatars/${userId}/${userJson.avatar}.png?size=128`
      : "";
    const created = createWebSession({ provider: "discord", userId, userTag, avatarUrl });
    recordWebAccountLogin({ provider: "discord", userId, userTag });
    setWebSessionCookie(res, created.token);
    res.redirect(`${rec.next}?msg=${encodeURIComponent(`Logged in as ${userTag}`)}`);
  } catch {
    res.redirect(`${rec.next}?err=${encodeURIComponent("Discord login failed.")}`);
  }
});

app.get("/auth/google/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const rec = oauthStateMap.get(state);
  oauthStateMap.delete(state);
  if (!rec || rec.expiresAt < Date.now()) {
    res.redirect("/auth?err=Google%20login%20state%20expired");
    return;
  }
  if (!code || !googleOauthReady()) {
    res.redirect(`${rec.next}?err=${encodeURIComponent("Google login failed.")}`);
    return;
  }
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: GOOGLE_OAUTH_REDIRECT_URI
      }).toString()
    });
    const tokenJson = await tokenResponse.json().catch(() => ({}));
    const accessToken = String(tokenJson && tokenJson.access_token ? tokenJson.access_token : "");
    if (!tokenResponse.ok || !accessToken) {
      const details = [
        "Google token exchange failed.",
        tokenJson && tokenJson.error ? `error=${String(tokenJson.error)}` : "",
        tokenJson && tokenJson.error_description ? `description=${String(tokenJson.error_description)}` : "",
        `status=${tokenResponse.status}`
      ].filter(Boolean).join(" ");
      res.redirect(`${rec.next}?err=${encodeURIComponent(details)}`);
      return;
    }
    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const userJson = await userResponse.json().catch(() => ({}));
    const googleSub = String(userJson && userJson.sub ? userJson.sub : "").trim();
    if (!userResponse.ok || !googleSub) {
      res.redirect(`${rec.next}?err=${encodeURIComponent("Google identity fetch failed.")}`);
      return;
    }
    const userId = `google:${googleSub}`;
    const userTag = String(userJson.name || userJson.email || googleSub).slice(0, 64);
    const avatarUrl = String(userJson.picture || "");
    const created = createWebSession({ provider: "google", userId, userTag, avatarUrl });
    recordWebAccountLogin({ provider: "google", userId, userTag });
    setWebSessionCookie(res, created.token);
    res.redirect(`${rec.next}?msg=${encodeURIComponent(`Logged in as ${userTag}`)}`);
  } catch {
    res.redirect(`${rec.next}?err=${encodeURIComponent("Google login failed.")}`);
  }
});

app.post("/auth/logout", (req, res) => {
  const nextRaw = typeof req.query.next === "string" ? req.query.next : "/";
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  destroyWebSession(req, res);
  res.redirect(`${next}?msg=${encodeURIComponent("Logged out.")}`);
});

app.get("/account", (req, res) => {
  const session = getWebSession(req);
  if (!session || String(session.provider || "") !== "looooooty") {
    res.redirect("/auth?next=%2Faccount");
    return;
  }
  const found = findLocalAccountByUserId(session.userId);
  if (!found || !found.account) {
    destroyWebSession(req, res);
    res.redirect("/auth?err=Looooooty%20account%20not%20found");
    return;
  }
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  res.send(accountSettingsPageHtml({ session, account: found.account, msg, err }));
});

app.post("/account/resend-verification", async (req, res) => {
  res.redirect("/account?msg=Email%20verification%20is%20temporarily%20disabled");
});

app.post("/account/profile", async (req, res) => {
  const session = getWebSession(req);
  if (!session || String(session.provider || "") !== "looooooty") {
    res.redirect("/auth?next=%2Faccount");
    return;
  }
  const found = findLocalAccountByUserId(session.userId);
  if (!found || !found.account) {
    destroyWebSession(req, res);
    res.redirect("/auth?err=Looooooty%20account%20not%20found");
    return;
  }
  const username = normalizeLocalUsername(req.body && req.body.username);
  const email = normalizeLocalEmail(req.body && req.body.email);
  if (!isValidLocalUsername(username)) {
    res.redirect("/account?err=Invalid%20username");
    return;
  }
  if (!isValidLocalEmail(email)) {
    res.redirect("/account?err=Invalid%20email");
    return;
  }
  const accounts = found.accounts;
  const self = found.account;
  const usernameKey = username.toLowerCase();
  const emailKey = email.toLowerCase();
  const usernameTaken = accounts.some((a, i) => i !== found.index && String(a && a.usernameLower || "") === usernameKey);
  const emailTaken = accounts.some((a, i) => i !== found.index && String(a && a.emailLower || "") === emailKey);
  if (usernameTaken) {
    res.redirect("/account?err=Username%20already%20exists");
    return;
  }
  if (emailTaken) {
    res.redirect("/account?err=Email%20already%20exists");
    return;
  }
  const emailChanged = String(self.emailLower || "") !== emailKey;
  accounts[found.index] = {
    ...self,
    username,
    usernameLower: usernameKey,
    email,
    emailLower: emailKey,
    emailVerified: emailChanged ? false : Boolean(self.emailVerified),
    verifyTokenHash: emailChanged ? "" : String(self.verifyTokenHash || ""),
    verifyTokenExpiresAt: emailChanged ? "" : String(self.verifyTokenExpiresAt || "")
  };
  saveLocalAccounts(accounts);
  if (emailChanged) {
    await issueLocalVerification(accounts[found.index]);
  }
  const newSession = createWebSession({
    provider: "looooooty",
    userId: session.userId,
    userTag: username,
    avatarUrl: String(session.avatarUrl || "")
  });
  setWebSessionCookie(res, newSession.token);
  recordWebAccountLogin({ provider: "looooooty", userId: session.userId, userTag: username });
  res.redirect(`/account?msg=${encodeURIComponent(emailChanged ? "Profile saved. Verify your new email." : "Profile saved.")}`);
});

app.post("/account/password", (req, res) => {
  const session = getWebSession(req);
  if (!session || String(session.provider || "") !== "looooooty") {
    res.redirect("/auth?next=%2Faccount");
    return;
  }
  const found = findLocalAccountByUserId(session.userId);
  if (!found || !found.account) {
    destroyWebSession(req, res);
    res.redirect("/auth?err=Looooooty%20account%20not%20found");
    return;
  }
  const currentPassword = String(req.body && req.body.current_password ? req.body.current_password : "");
  const newPassword = String(req.body && req.body.new_password ? req.body.new_password : "");
  const newPasswordConfirm = String(req.body && req.body.new_password_confirm ? req.body.new_password_confirm : "");
  if (!verifyLocalPassword(currentPassword, found.account.passwordHash)) {
    res.redirect("/account?err=Current%20password%20is%20incorrect");
    return;
  }
  if (newPassword.length < 8) {
    res.redirect("/account?err=New%20password%20must%20be%20at%20least%208%20characters");
    return;
  }
  if (newPassword !== newPasswordConfirm) {
    res.redirect("/account?err=New%20passwords%20do%20not%20match");
    return;
  }
  found.accounts[found.index] = {
    ...found.account,
    passwordHash: hashLocalPassword(newPassword),
    failedLoginCount: 0,
    lockUntil: "",
    lastFailedAt: "",
    resetTokenHash: "",
    resetTokenExpiresAt: ""
  };
  saveLocalAccounts(found.accounts);
  res.redirect("/account?msg=Password%20updated");
});

app.get("/giveaways", (req, res) => {
  const giveaways = Object.values(loadGiveaways()).sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  );
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  const session = getWebSession(req) || { userId: "", userTag: "" };
  res.send(giveawaysPageHtml({ giveaways, msg, err, session }));
});

app.post("/giveaways/session", (req, res) => {
  res.redirect("/auth?next=%2Fgiveaways");
});

app.post("/giveaways/:id/enter", async (req, res) => {
  const id = String(req.params.id || "").trim();
  const session = getWebSession(req);
  const userId = String(session && session.userId ? session.userId : "");
  if (!userId) {
    res.redirect("/auth?next=%2Fgiveaways");
    return;
  }
  const policyErr = await validateWebUserPolicy(session);
  if (policyErr) {
    res.redirect(`/giveaways?err=${encodeURIComponent(policyErr)}`);
    return;
  }
  const ip = clientIp(req);
  if (!checkRateLimit(`gw-enter:${userId}:${ip}`, RATE_LIMIT_MAX_GIVEAWAY, RATE_LIMIT_WINDOW_MS)) {
    res.redirect("/giveaways?err=Rate%20limit%20exceeded.%20Try%20again%20in%201%20minute.");
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

app.post("/giveaways/:id/leave", async (req, res) => {
  const id = String(req.params.id || "").trim();
  const session = getWebSession(req);
  const userId = String(session && session.userId ? session.userId : "");
  if (!userId) {
    res.redirect("/auth?next=%2Fgiveaways");
    return;
  }
  const policyErr = await validateWebUserPolicy(session);
  if (policyErr) {
    res.redirect(`/giveaways?err=${encodeURIComponent(policyErr)}`);
    return;
  }
  const ip = clientIp(req);
  if (!checkRateLimit(`gw-leave:${userId}:${ip}`, RATE_LIMIT_MAX_GIVEAWAY, RATE_LIMIT_WINDOW_MS)) {
    res.redirect("/giveaways?err=Rate%20limit%20exceeded.%20Try%20again%20in%201%20minute.");
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
  const session = getWebSession(_req) || { userId: "", userTag: "" };
  res.send(aboutPageHtml(session));
});

app.get("/how-to-order", (_req, res) => {
  const session = getWebSession(_req) || { userId: "", userTag: "" };
  res.send(howToOrderHtml(session));
});

app.get("/application-result", (req, res) => {
  const session = getWebSession(req) || { userId: "", userTag: "", provider: "" };
  if (!session.userId) {
    res.redirect("/auth?next=%2Fapplication-result");
    return;
  }
  if (String(session.provider || "") !== "discord") {
    res.redirect("/auth?next=%2Fapplication-result&err=Please%20log%20in%20with%20Discord%20to%20view%20application%20results.");
    return;
  }
  const application = markLatestApplicationResultSeenForUser(session.userId);
  res.send(applicationResultPageHtml({ session, application }));
});

app.get("/shop", (_req, res) => {
  res.send(shopLandingHtml());
});

app.get("/shop/web", (req, res) => {
  const websiteShop = loadWebsiteShopData();
  const session = getWebSession(req) || { userId: "", userTag: "" };
  res.send(websiteShopHtml(websiteShop, session));
});

app.get("/shop/reviews", (req, res) => {
  const session = getWebSession(req) || { userId: "", userTag: "" };
  const reviews = loadWebsiteReviews();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  res.send(websiteReviewsHtml({ reviews, session, msg, err }));
});

app.post("/shop/reviews", async (req, res) => {
  const session = getWebSession(req);
  const userId = String(session && session.userId ? session.userId : "").trim();
  const userTag = String(session && session.userTag ? session.userTag : "").trim();
  const provider = String(session && session.provider ? session.provider : "").trim();
  if (!userId) {
    res.redirect("/auth?next=%2Fshop%2Freviews");
    return;
  }
  const policyErr = await validateWebUserPolicy(session);
  if (policyErr) {
    res.redirect(`/shop/reviews?err=${encodeURIComponent(policyErr)}`);
    return;
  }
  const ip = clientIp(req);
  if (!checkRateLimit(`review:${userId}:${ip}`, RATE_LIMIT_MAX_REVIEW, RATE_LIMIT_WINDOW_MS)) {
    res.redirect("/shop/reviews?err=Rate%20limit%20exceeded.%20Try%20again%20in%201%20minute.");
    return;
  }
  const text = String(req.body && req.body.review ? req.body.review : "").trim().slice(0, 500);
  if (text.length < 5) {
    res.redirect("/shop/reviews?err=Review%20must%20be%20at%20least%205%20characters.");
    return;
  }
  const reviews = loadWebsiteReviews();
  reviews.push({
    id: `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userTag: userTag || "User",
    provider: provider || "unknown",
    text,
    createdAt: new Date().toISOString()
  });
  saveWebsiteReviews(reviews);
  res.redirect("/shop/reviews?msg=Review%20posted");
});

app.post("/shop/web/coupon/validate", (req, res) => {
  const code = normalizeCouponCode(req.body && req.body.code);
  const subtotal = Number(req.body && req.body.subtotal ? req.body.subtotal : 0);
  const ip = clientIp(req);
  if (!checkRateLimit(`coupon:${ip}:${code || "-"}`, RATE_LIMIT_MAX_COUPON, RATE_LIMIT_WINDOW_MS)) {
    res.status(429).json({ ok: false, error: "Rate limit exceeded. Try again in 1 minute." });
    return;
  }
  if (!code) {
    res.status(400).json({ ok: false, error: "Missing coupon code." });
    return;
  }
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    res.status(400).json({ ok: false, error: "Invalid subtotal." });
    return;
  }
  const coupons = loadWebsiteCoupons();
  const coupon = coupons.find((c) => normalizeCouponCode(c && c.code) === code && c.active !== false);
  if (!coupon) {
    res.status(404).json({ ok: false, error: "Coupon not found." });
    return;
  }
  const discount = computeCouponDiscount({ subtotal, coupon });
  res.json({
    ok: true,
    code,
    type: coupon.type,
    amount: coupon.amount,
    discount: money(discount)
  });
});

app.post("/shop/web/checkout", async (req, res) => {
  const email = String(req.body && req.body.email ? req.body.email : "").trim();
  const session = getWebSession(req);
  const accountUserId = String(session && session.userId ? session.userId : "").trim();
  const accountProvider = String(session && session.provider ? session.provider : "").trim();
  const useCredit = Boolean(req.body && req.body.useCredit);
  const couponCode = normalizeCouponCode(req.body && req.body.couponCode);
  const deliveryCoordsRaw = String(req.body && req.body.deliveryCoords ? req.body.deliveryCoords : "").trim();
  const cartInput = req.body && typeof req.body.cart === "object" && req.body.cart ? req.body.cart : {};

  if (!accountUserId) {
    res.status(401).json({ ok: false, error: "Please login first." });
    return;
  }
  const policyErr = await validateWebUserPolicy(session);
  if (policyErr) {
    res.status(403).json({ ok: false, error: policyErr });
    return;
  }
  const ip = clientIp(req);
  if (!checkRateLimit(`checkout:${accountUserId}:${ip}`, RATE_LIMIT_MAX_CHECKOUT, RATE_LIMIT_WINDOW_MS)) {
    res.status(429).json({ ok: false, error: "Too many checkout attempts. Try again in 1 minute." });
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "Please enter a valid email." });
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
  let itemCount = 0;
  const normalizedItems = [];

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
    if (Number.isFinite(Number(product.stockQty)) && Number(product.stockQty) <= 0) {
      continue;
    }
    if (Number.isFinite(Number(product.stockQty)) && qty > Number(product.stockQty)) {
      res.status(400).json({ ok: false, error: `Not enough stock for ${String(product.name || "item")}.` });
      return;
    }
    itemCount += qty;
    normalizedItems.push({
      productId: id,
      name: String(product.name || "Item"),
      price: Number(product.price || 0),
      quantity: qty
    });
  }

  if (itemCount <= 0) {
    res.status(400).json({ ok: false, error: "Your cart is empty." });
    return;
  }

  // Decrement stock quantities if tracked.
  let updatedStock = false;
  if (Array.isArray(websiteShop.products)) {
    for (const item of normalizedItems) {
      const idx = websiteShop.products.findIndex((p) => String(p.id) === String(item.productId));
      if (idx === -1) continue;
      const cur = websiteShop.products[idx];
      if (Number.isFinite(Number(cur.stockQty))) {
        const nextQty = Math.max(0, Number(cur.stockQty) - Number(item.quantity || 0));
        websiteShop.products[idx] = {
          ...cur,
          stockQty: nextQty,
          inStock: nextQty <= 0 ? false : cur.inStock !== false
        };
        updatedStock = true;
      }
    }
  }
  if (updatedStock) {
    saveWebsiteShopData(websiteShop);
  }

  const subtotal = money(normalizedItems.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0));
  let coupon = null;
  let couponDiscount = 0;
  if (couponCode) {
    const coupons = loadWebsiteCoupons();
    coupon = coupons.find((c) => normalizeCouponCode(c && c.code) === couponCode && c.active !== false) || null;
    if (!coupon) {
      res.status(400).json({ ok: false, error: "Invalid coupon code." });
      return;
    }
    couponDiscount = computeCouponDiscount({ subtotal, coupon });
  }
  const discountedSubtotal = money(subtotal - money(couponDiscount));
  const taxFees = money(discountedSubtotal * 0.06);
  let deliveryCoords = "";
  let deliveryFee = 0;
  if (deliveryCoordsRaw) {
    const parsed = parseDeliveryCoords(deliveryCoordsRaw);
    if (!parsed) {
      res.status(400).json({ ok: false, error: "Invalid delivery coordinates." });
      return;
    }
    deliveryCoords = deliveryCoordsRaw;
    deliveryFee = computeDeliveryFeeFromCoords(parsed);
  }
  const total = money(discountedSubtotal + taxFees + deliveryFee);

  const credits = loadCredits();
  const currentCredit = money(Number(credits[accountUserId] || 0));
  let creditUsed = 0;
  let totalDue = money(total);
  if (useCredit) {
    if (currentCredit < total) {
      res.status(400).json({
        ok: false,
        error: `Not enough store credit. Needed ${money(total)}, available ${money(currentCredit)}.`
      });
      return;
    }
    creditUsed = money(total);
    totalDue = 0;
    const nextCredit = money(currentCredit - creditUsed);
    if (nextCredit <= 0) {
      delete credits[accountUserId];
    } else {
      credits[accountUserId] = nextCredit;
    }
    saveCredits(credits);
  }

  const orderId = `ORDER-${Date.now()}`;
  const paypalUrl = totalDue > 0 ? WEBSITE_PAYPAL_URL : "";
  const websiteOrders = loadWebsiteOrders();
  websiteOrders.push({
    id: orderId,
    userId: accountUserId,
    accountProvider: accountProvider || "unknown",
    email,
    items: normalizedItems,
    subtotal,
    couponCode: coupon ? couponCode : "",
    couponDiscount: money(couponDiscount),
    taxFees,
    deliveryCoords,
    deliveryFee: money(deliveryFee),
    total,
    creditUsed: money(creditUsed),
    totalDue: money(totalDue),
    paidWithCreditOnly: totalDue <= 0,
    status: "PAID",
    createdAt: new Date().toISOString(),
    refundedAt: null,
    ign: "",
    coordinates: deliveryCoords,
    deliveryFee: money(deliveryFee),
    readyForDelivery: false
  });
  saveWebsiteOrders(websiteOrders);
  res.json({
    ok: true,
    orderId,
    subtotal,
    couponCode: coupon ? couponCode : "",
    couponDiscount: money(couponDiscount),
    taxFees,
    deliveryCoords,
    deliveryFee: money(deliveryFee),
    total,
    creditUsed: money(creditUsed),
    totalDue: money(totalDue),
    paidWithCreditOnly: totalDue <= 0,
    paypalUrl,
    itemCount
  });
});

app.post("/shop/web/refund", (req, res) => {
  const orderId = String(req.body && req.body.orderId ? req.body.orderId : "").trim();
  const userId = String(req.body && req.body.userId ? req.body.userId : "").trim();
  if (!orderId) {
    res.status(400).json({ ok: false, error: "Missing orderId." });
    return;
  }
  const orders = loadWebsiteOrders();
  const idx = orders.findIndex((o) => String(o.id) === orderId);
  if (idx === -1) {
    res.status(404).json({ ok: false, error: "Order not found." });
    return;
  }
  if (orders[idx].status === "REFUNDED") {
    res.json({ ok: true, refunded: true });
    return;
  }
  const creditUsed = money(Number(orders[idx].creditUsed || 0));
  if (creditUsed > 0 && userId) {
    const credits = loadCredits();
    const existing = money(Number(credits[userId] || 0));
    credits[userId] = money(existing + creditUsed);
    saveCredits(credits);
  }
  orders[idx].status = "REFUNDED";
  orders[idx].refundedAt = new Date().toISOString();
  saveWebsiteOrders(orders);
  res.json({ ok: true, refunded: true });
});

app.post("/shop/web/ready", (req, res) => {
  const orderId = String(req.body && req.body.orderId ? req.body.orderId : "").trim();
  const userId = String(req.body && req.body.userId ? req.body.userId : "").trim();
  const ign = String(req.body && req.body.ign ? req.body.ign : "").trim().slice(0, 32);
  const coordinates = String(req.body && req.body.coordinates ? req.body.coordinates : "").trim().slice(0, 120);
  if (!orderId || !userId) {
    res.status(400).json({ ok: false, error: "Invalid order/user." });
    return;
  }

  const orders = loadWebsiteOrders();
  const idx = orders.findIndex((o) => String(o.id) === orderId);
  let items = [];
  if (idx !== -1) {
    orders[idx].ign = ign;
    orders[idx].coordinates = coordinates;
    orders[idx].readyForDelivery = true;
    orders[idx].readyAt = new Date().toISOString();
    items = Array.isArray(orders[idx].items)
      ? orders[idx].items.map((it) => ({
          name: String((it && (it.name || it.productName || it.id)) || "Item").slice(0, 100),
          qty: Math.max(1, Number.parseInt(it && it.qty ? it.qty : 1, 10) || 1)
        }))
      : [];
    saveWebsiteOrders(orders);
  }

  const alerts = loadWebsiteReadyAlerts();
  alerts.push({
    id: `RDY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId,
    userId,
    ign,
    coordinates,
    items,
    createdAt: new Date().toISOString(),
    delivered: false
  });
  saveWebsiteReadyAlerts(alerts);
  res.json({ ok: true });
});

app.get("/shop/web/order-status", (req, res) => {
  const orderId = String(req.query && req.query.orderId ? req.query.orderId : "").trim();
  if (!orderId) {
    res.status(400).json({ ok: false, error: "Missing orderId." });
    return;
  }
  const orders = loadWebsiteOrders();
  const order = orders.find((o) => String(o.id) === orderId);
  if (!order) {
    res.status(404).json({ ok: false, error: "Order not found." });
    return;
  }
  res.json({ ok: true, status: String(order.status || "PAID").toUpperCase() });
});

app.get("/apply", (req, res) => {
  const session = getWebSession(req) || { userId: "", userTag: "", provider: "" };
  if (!session.userId) {
    res.redirect("/auth?next=%2Fapply");
    return;
  }
  if (String(session.provider || "") !== "discord") {
    res.redirect("/auth?next=%2Fapply&err=Please%20log%20in%20with%20Discord%20to%20submit%20applications.");
    return;
  }
  const forms = loadApplicationForms().filter((f) => f.active !== false);
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const err = typeof req.query.err === "string" ? req.query.err : "";
  res.send(applyPageHtml(forms, msg, err, session));
});

app.post("/apply", (req, res) => {
  const session = getWebSession(req) || { userId: "", userTag: "", provider: "" };
  if (!session.userId) {
    res.redirect("/auth?next=%2Fapply");
    return;
  }
  if (String(session.provider || "") !== "discord") {
    res.redirect("/auth?next=%2Fapply&err=Please%20log%20in%20with%20Discord%20to%20submit%20applications.");
    return;
  }
  const formId = String(req.body.form_id || "").trim();
  const discordUserId = String(session.userId || "").trim();
  const discordTag = String(session.userTag || req.body.discord_tag || "").trim().slice(0, 64);
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
    applicantUserId: discordUserId,
    applicantProvider: "discord",
    resultSeenAt: "",
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
  res.redirect("/panel/shop?msg=Website%20shop%20state%20saved");
});

app.post("/staff/webshop/category/add", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const categoryName = String(req.body.category_name || "").trim().slice(0, 40);
  if (!categoryName) {
    res.redirect("/panel/shop?warn=Category%20name%20is%20required");
    return;
  }
  const exists = data.categories.some((c) => c.toLowerCase() === categoryName.toLowerCase());
  if (!exists) {
    data.categories.push(categoryName);
    saveWebsiteShopData(data);
  }
  res.redirect("/panel/shop?msg=Category%20saved");
});

app.post("/staff/webshop/product/add", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const name = String(req.body.name || "").trim().slice(0, 80);
  const description = String(req.body.description || "").trim().slice(0, 400);
  const category = String(req.body.category || "").trim().slice(0, 40);
  const stockQtyRaw = String(req.body.stock_qty || "").trim();
  const stockQty = stockQtyRaw === "" ? null : Number.parseInt(stockQtyRaw, 10);
  const imageUrl = String(req.body.image || "").trim().slice(0, 500);
  const imageData = String(req.body.image_data || "").trim().slice(0, 10000000);
  const image = imageUrl || imageData;
  const price = Number.parseFloat(String(req.body.price || "0").trim());
  if (!name) {
    res.redirect("/panel/shop?warn=Product%20name%20is%20required");
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    res.redirect("/panel/shop?warn=Price%20must%20be%20greater%20than%200");
    return;
  }
  if (!category) {
    res.redirect("/panel/shop?warn=Category%20is%20required");
    return;
  }
  if (!image) {
    res.redirect("/panel/shop?warn=Image%20URL%20or%20image%20upload%20is%20required");
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
    inStock: true,
    stockQty: Number.isFinite(stockQty) ? stockQty : null
  });
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?msg=Website%20product%20added");
});

app.post("/staff/webshop/product/:id/edit", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const id = String(req.params.id || "").trim();
  const idx = data.products.findIndex((p) => String(p.id) === id);
  if (idx === -1) {
    res.redirect("/panel/shop?warn=Website%20product%20not%20found");
    return;
  }

  const name = String(req.body.name || "").trim().slice(0, 80);
  const description = String(req.body.description || "").trim().slice(0, 400);
  const category = String(req.body.category || "").trim().slice(0, 40);
  const stockQtyRaw = String(req.body.stock_qty || "").trim();
  const stockQty = stockQtyRaw === "" ? null : Number.parseInt(stockQtyRaw, 10);
  const imageUrl = String(req.body.image || "").trim().slice(0, 500);
  const imageData = String(req.body.image_data || "").trim().slice(0, 10000000);
  const image = imageUrl || imageData || String(data.products[idx].image || "");
  const price = Number.parseFloat(String(req.body.price || "0").trim());
  if (!name) {
    res.redirect("/panel/shop?warn=Product%20name%20is%20required");
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    res.redirect("/panel/shop?warn=Price%20must%20be%20greater%20than%200");
    return;
  }
  if (!category) {
    res.redirect("/panel/shop?warn=Category%20is%20required");
    return;
  }
  if (!image) {
    res.redirect("/panel/shop?warn=Image%20URL%20or%20image%20upload%20is%20required");
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
    price: Number(price.toFixed(2)),
    stockQty: Number.isFinite(stockQty) ? stockQty : null
  };
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?msg=Website%20product%20updated");
});

app.post("/staff/webshop/product/:id/delete", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const id = String(req.params.id || "").trim();
  const before = data.products.length;
  data.products = data.products.filter((p) => String(p.id) !== id);
  if (data.products.length === before) {
    res.redirect("/panel/shop?warn=Website%20product%20not%20found");
    return;
  }
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?msg=Website%20product%20deleted");
});

app.post("/staff/webshop/product/:id/stock", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const id = String(req.params.id || "").trim();
  const idx = data.products.findIndex((p) => String(p.id) === id);
  if (idx === -1) {
    res.redirect("/panel/shop?warn=Website%20product%20not%20found");
    return;
  }
  const status = String(req.body.status || "").trim().toLowerCase();
  data.products[idx].inStock = status === "in_stock";
  saveWebsiteShopData(data);
  res.redirect("/panel/shop?msg=Website%20product%20stock%20updated");
});

app.post("/staff/webshop/coupon/add", requireStaff, (req, res) => {
  const codeRaw = String(req.body.code || "").trim().toUpperCase();
  const typeRaw = String(req.body.type || "").trim().toLowerCase();
  const amount = Number.parseFloat(String(req.body.amount || "").trim());
  if (!codeRaw) {
    res.redirect("/panel/shop?warn=Coupon%20code%20is%20required");
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    res.redirect("/panel/shop?warn=Coupon%20amount%20must%20be%20greater%20than%200");
    return;
  }
  const type = typeRaw === "flat" ? "flat" : "percent";
  const coupons = loadWebsiteCoupons();
  const exists = coupons.find((c) => String(c.code || "").toUpperCase() === codeRaw);
  if (exists) {
    res.redirect("/panel/shop?warn=Coupon%20already%20exists");
    return;
  }
  coupons.push({ code: codeRaw, type, amount: Number(amount.toFixed(2)), active: true, createdAt: new Date().toISOString() });
  saveWebsiteCoupons(coupons);
  res.redirect("/panel/shop?msg=Coupon%20added");
});

app.post("/staff/webshop/coupon/:code/toggle", requireStaff, (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  const coupons = loadWebsiteCoupons();
  const idx = coupons.findIndex((c) => String(c.code || "").toUpperCase() === code);
  if (idx === -1) {
    res.redirect("/panel/shop?warn=Coupon%20not%20found");
    return;
  }
  coupons[idx].active = coupons[idx].active === false ? true : false;
  saveWebsiteCoupons(coupons);
  res.redirect("/panel/shop?msg=Coupon%20updated");
});

app.post("/staff/webshop/coupon/:code/delete", requireStaff, (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  const coupons = loadWebsiteCoupons();
  const next = coupons.filter((c) => String(c.code || "").toUpperCase() !== code);
  if (next.length === coupons.length) {
    res.redirect("/panel/shop?warn=Coupon%20not%20found");
    return;
  }
  saveWebsiteCoupons(next);
  res.redirect("/panel/shop?msg=Coupon%20deleted");
});

app.post("/staff/webshop/product/:id/save-default", requireStaff, (req, res) => {
  const data = loadWebsiteShopData();
  const defaults = loadWebsiteShopDefaults();
  const id = String(req.params.id || "").trim();
  const product = data.products.find((p) => String(p.id) === id);
  if (!product) {
    res.redirect("/panel/shop?warn=Website%20product%20not%20found");
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
  res.redirect("/panel/shop?msg=Website%20shop%20saved%20to%20defaults");
});

app.post("/staff/credits/update", requireStaff, (req, res) => {
  const userId = String(req.body.account_id || req.body.discord_user_id || "").trim();
  const amount = Number.parseFloat(String(req.body.amount || "").trim());
  const mode = String(req.body.mode || "").trim().toLowerCase();
  if (!isValidCreditAccountId(userId)) {
    res.redirect("/panel/shop?warn=Invalid%20account%20ID.%20Use%20Discord%20ID%20or%20provider%3AuserId%20format");
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

app.post("/staff/ready-alerts/:id/deliver", requireStaff, (req, res) => {
  const id = String(req.params.id || "").trim();
  const alerts = loadWebsiteReadyAlerts();
  const idx = alerts.findIndex((a) => String(a.id) === id);
  if (idx === -1) {
    res.redirect("/panel/shop?warn=Ready%20alert%20not%20found");
    return;
  }
  alerts[idx].delivered = true;
  alerts[idx].deliveredAt = new Date().toISOString();
  saveWebsiteReadyAlerts(alerts);

  const orderId = String(alerts[idx].orderId || "").trim();
  if (orderId) {
    const orders = loadWebsiteOrders();
    const orderIdx = orders.findIndex((o) => String(o.id) === orderId);
    if (orderIdx !== -1) {
      orders[orderIdx].status = "DELIVERED";
      orders[orderIdx].deliveredAt = new Date().toISOString();
      saveWebsiteOrders(orders);
    }
  }

  setTimeout(() => {
    const latestAlerts = loadWebsiteReadyAlerts();
    const stillIdx = latestAlerts.findIndex((a) => String(a.id) === id);
    if (stillIdx === -1) {
      return;
    }
    latestAlerts.splice(stillIdx, 1);
    saveWebsiteReadyAlerts(latestAlerts);
  }, 5000);

  res.redirect("/panel/shop?msg=Order%20marked%20delivered");
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
    approvalResult: botResult.body,
    resultSeenAt: ""
  };
  saveApplications(applications);

  await notifyDecisionInBot({
    application: applications[idx],
    status: "APPROVED",
    note: "Your application was accepted."
  });

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
    rejectedAt: new Date().toISOString(),
    resultSeenAt: ""
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
  const webAccounts = loadWebAccounts();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(staffPageHtml({ s, bases, applications, forms, websiteShop, webAccounts, msg, warn, staff, activeTab: "shop" }));
});

app.get("/panel/bases", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications();
  const forms = loadApplicationForms();
  const websiteShop = loadWebsiteShopData();
  const webAccounts = loadWebAccounts();
  const msg = typeof req.query.msg === "string" ? req.query.msg : "";
  const warn = typeof req.query.warn === "string" ? req.query.warn : "";
  const staff = getStaffSession(req);
  res.send(staffPageHtml({ s, bases, applications, forms, websiteShop, webAccounts, shopView: "discord", msg, warn, staff, activeTab: "bases" }));
});

app.get("/panel/applications", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const forms = loadApplicationForms();
  const websiteShop = loadWebsiteShopData();
  const webAccounts = loadWebAccounts();
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
      webAccounts,
      shopView: "discord",
      msg,
      warn,
      staff,
      activeTab: "applications"
    })
  );
});

app.get("/panel/accounts", requireStaff, (req, res) => {
  const s = stats();
  const bases = loadBaseStates();
  const applications = loadApplications();
  const forms = loadApplicationForms();
  const websiteShop = loadWebsiteShopData();
  const webAccounts = loadWebAccounts();
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
      webAccounts,
      shopView: "discord",
      msg,
      warn,
      staff,
      activeTab: "accounts"
    })
  );
});

app.listen(PORT, HOST, () => {
  console.log(`LooooootyWeb running on http://${HOST}:${PORT}`);
});
