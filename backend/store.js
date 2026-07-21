const fs = require('fs');
const path = require('path');

// مسیر دیتا: اگر متغیر DATA_DIR ست شده باشد (روی Railway، مسیر یک Volume) از آن
// استفاده می‌شود، در غیر این‌صورت پوشه‌ی محلی backend/data به‌کار می‌رود.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function ensureReady() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, '[]');
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');
}

function readProjects() {
  ensureReady();
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeProjects(list) {
  ensureReady();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(list, null, 2));
}

function readOrders() {
  ensureReady();
  const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeOrders(list) {
  ensureReady();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(list, null, 2));
}

module.exports = {
  DATA_DIR,
  VIDEOS_DIR,
  PROJECTS_FILE,
  ORDERS_FILE,
  ensureReady,
  readProjects,
  writeProjects,
  readOrders,
  writeOrders,
};
