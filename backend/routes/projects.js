const express = require('express');
const multer = require('multer');
const { adminAuth } = require('../middleware/adminAuth');
const { readProjects, createProject, deleteProject } = require('../store');

const router = express.Router();

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_SIZE = 150 * 1024 * 1024; // 150MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('فقط فایل ویدیویی (mp4, webm, mov) مجاز است'));
    }
    cb(null, true);
  },
});

// لیست عمومی نمونه‌کارها
router.get('/', async (req, res) => {
  try {
    const list = await readProjects();
    res.json(
      list.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        url: p.video_url,
        createdAt: p.created_at,
      }))
    );
  } catch (err) {
    console.error('خطا در خواندن نمونه‌کارها:', err.message);
    res.status(500).json({ message: 'خطا در دریافت نمونه‌کارها' });
  }
});

// افزودن نمونه‌کار جدید (فقط ادمین) — multipart/form-data با فیلد video
router.post('/', adminAuth, (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'خطا در آپلود فایل' });
    if (!req.file) return res.status(400).json({ message: 'فایل ویدیو الزامی است' });

    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'عنوان نمونه‌کار الزامی است' });
    }

    try {
      const project = await createProject({
        title,
        description,
        videoBuffer: req.file.buffer,
        videoOriginalName: req.file.originalname,
        videoMimetype: req.file.mimetype,
      });
      res.status(201).json({
        id: project.id,
        title: project.title,
        description: project.description,
        url: project.video_url,
        createdAt: project.created_at,
      });
    } catch (uploadErr) {
      console.error('خطا در آپلود نمونه‌کار:', uploadErr.message);
      res.status(500).json({ message: 'خطا در ذخیره‌سازی نمونه‌کار' });
    }
  });
});

// حذف نمونه‌کار (فقط ادمین)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const removed = await deleteProject(req.params.id);
    if (!removed) return res.status(404).json({ message: 'یافت نشد' });
    res.json({ message: 'حذف شد' });
  } catch (err) {
    console.error('خطا در حذف نمونه‌کار:', err.message);
    res.status(500).json({ message: 'خطا در حذف نمونه‌کار' });
  }
});

module.exports = router;
