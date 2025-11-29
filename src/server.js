require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// استيراد المسارات
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/apps');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3000;

// إنشاء المجلدات الضرورية
const requiredDirs = [
  'uploads/apps',
  'uploads/images', 
  'database',
  'logs'
];

requiredDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// middleware الأمان
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // 100 طلب كل 15 دقيقة
});
app.use(limiter);

// middleware التحويل
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// الملفات الثابتة
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// المسارات
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/upload', uploadRoutes);

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// صفحة 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة'
  });
});

// معالج الأخطاء
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  
  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 CAPNCom Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

module.exports = app;
