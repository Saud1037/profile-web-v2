require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const multer = require('multer');

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PATH = '/' + (process.env.ADMIN_PATH || 'panel-9f3k2x').replace(/^\/+/, '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-too';
const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (ADMIN_PASSWORD === 'changeme') {
  console.warn('\n[تحذير] لم تُغيّر كلمة مرور لوحة التحكم. عدّل ADMIN_PASSWORD في ملف .env قبل النشر.\n');
}

// ---------- helpers ----------
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'غير مصرح. سجّل الدخول أولاً.' });
}

// ---------- middleware ----------
app.use(express.json({ limit: '2mb' }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);
app.use(express.static(path.join(__dirname, 'public')));

// image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext) ? ext : '.png';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /image\/(png|jpe?g|gif|webp|svg\+xml)/.test(file.mimetype);
    cb(allowed ? null : new Error('نوع الملف غير مدعوم'), allowed);
  },
});

// ---------- public API ----------
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// ---------- auth ----------
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ---------- protected API ----------
app.post('/api/data', requireAuth, (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  }
  // basic shape check to avoid corrupting the file
  const required = ['profile', 'theme', 'socials', 'projects'];
  for (const key of required) {
    if (!(key in incoming)) return res.status(400).json({ error: `الحقل ${key} مفقود` });
  }
  writeData(incoming);
  res.json({ ok: true, data: incoming });
});

app.post('/api/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'لم يتم إرسال أي ملف' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// ---------- pages ----------
app.get(ADMIN_PATH, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`الموقع يعمل على: http://localhost:${PORT}`);
  console.log(`لوحة التحكم (مخفية): http://localhost:${PORT}${ADMIN_PATH}`);
});
