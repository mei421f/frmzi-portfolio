const express = require('express');
const multer = require('multer');
const { adminAuth } = require('../middleware/adminAuth');
const { readProjects, createProject, deleteProject } = require('../store');

const router = express.Router();

const ALLOWED_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB — سقف فایل در پلن رایگان Supabase Storage

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('فقط فایل ویدیویی (mp4, webm, mov) یا عکس (jpg, png, webp) مجاز است'));
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
        type: p.media_type || 'video',
        link: p.link_url || null,
        createdAt: p.created_at,
      }))
    );
  } catch (err) {
    console.error('خطا در خواندن نمونه‌کارها:', err.message);
    res.status(500).json({ message: 'خطا در دریافت نمونه‌کارها' });
  }
});

// افزودن نمونه‌کار جدید (فقط ادمین) — multipart/form-data با فیلد media
router.post('/', adminAuth, (req, res) => {
  upload.single('media')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'حجم فایل بیشتر از حد مجاز (۵۰ مگابایت) است' });
      }
      return res.status(400).json({ message: err.message || 'خطا در آپلود فایل' });
    }
    if (!req.file) return res.status(400).json({ message: 'فایل ویدیو یا عکس الزامی است' });

    const { title, description, linkUrl } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'عنوان نمونه‌کار الزامی است' });
    }
    if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
      return res.status(400).json({ message: 'لینک باید با http:// یا https:// شروع شود' });
    }

    try {
      const project = await createProject({
        title,
        description,
        linkUrl,
        fileBuffer: req.file.buffer,
        fileOriginalName: req.file.originalname,
        fileMimetype: req.file.mimetype,
      });
      res.status(201).json({
        id: project.id,
        title: project.title,
        description: project.description,
        url: project.video_url,
        type: project.media_type,
        link: project.link_url || null,
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
