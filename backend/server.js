const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { ensureReady, VIDEOS_DIR } = require('./store');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

ensureReady();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/admin', authRoutes);
app.use('/api/projects', projectRoutes);

// فایل‌های ویدیوی آپلودشده
app.use('/uploads', express.static(VIDEOS_DIR));

// فرانت استاتیک (index.html + admin.html + assets)
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ سرور پورتفولیو روی پورت ${PORT} در حال اجراست`);
});
