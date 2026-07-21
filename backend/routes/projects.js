const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { adminAuth } = require('../middleware/adminAuth');
const { VIDEOS_DIR, readProjects, writeProjects } = require('../store');

const router = express.Router();

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_SIZE = 150 * 1024 * 1024; // 150MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VIDEOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('فقط فایل ویدیویی (mp4, webm, mov) مجاز است'));
    }
    cb(null, true);
  },
});

// لیست عمومی نمونه‌کارها
router.get('/', (req, res) => {
  const list = readProjects()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      url: `/uploads/${p.filename}`,
      createdAt: p.createdAt,
    }));
  res.json(list);
});

// افزودن نمونه‌کار جدید (فقط ادمین) — multipart/form-data با فیلد video
router.post('/', adminAuth, (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'خطا در آپلود فایل' });
    if (!req.file) return res.status(400).json({ message: 'فایل ویدیو الزامی است' });

    const { title, description } = req.body;
    if (!title) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'عنوان نمونه‌کار الزامی است' });
    }

    const list = readProjects();
    const project = {
      id: crypto.randomUUID(),
      title,
      description: description || '',
      filename: req.file.filename,
      createdAt: new Date().toISOString(),
    };
    list.push(project);
    writeProjects(list);

    res.status(201).json({ ...project, url: `/uploads/${project.filename}` });
  });
});

// حذف نمونه‌کار (فقط ادمین)
router.delete('/:id', adminAuth, (req, res) => {
  const list = readProjects();
  const idx = list.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'یافت نشد' });

  const [removed] = list.splice(idx, 1);
  writeProjects(list);

  const filePath = path.join(VIDEOS_DIR, removed.filename);
  fs.unlink(filePath, () => {});

  res.json({ message: 'حذف شد' });
});

module.exports = router;
