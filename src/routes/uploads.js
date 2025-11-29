const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// تكوين Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'appFile') {
      uploadPath += 'apps/';
    } else if (file.fieldname === 'images') {
      uploadPath += 'images/';
    }
    
    // إنشاء المجلد إذا لم يكن موجوداً
    const fullPath = path.join(__dirname, '..', '..', uploadPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // التحقق من نوع الملف
  if (file.fieldname === 'appFile') {
    const allowedExtensions = ['.apk', '.ipa', '.exe', '.dmg', '.deb', '.appimage', '.zip'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مسموح به'), false);
    }
  } else if (file.fieldname === 'images') {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الصورة غير مسموح به'), false);
    }
  } else {
    cb(new Error('نوع الحقل غير معروف'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// رفع ملف تطبيق
router.post('/app', upload.single('appFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع أي ملف'
      });
    }

    const fileUrl = `/uploads/apps/${req.file.filename}`;
    
    res.json({
      success: true,
      url: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: 'تم رفع الملف بنجاح'
    });

  } catch (error) {
    console.error('Upload app error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع الملف'
    });
  }
});

// رفع صور متعددة
router.post('/images', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع أي صور'
      });
    }

    const imageUrls = req.files.map(file => 
      `/uploads/images/${file.filename}`
    );

    res.json({
      success: true,
      imageUrls: imageUrls,
      total: imageUrls.length,
      message: `تم رفع ${imageUrls.length} صورة بنجاح`
    });

  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع الصور'
    });
  }
});

// معالج أخطاء Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم الملف كبير جداً'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    message: error.message
  });
});

module.exports = router;
