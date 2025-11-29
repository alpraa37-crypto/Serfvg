const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// تكوين multer للرفع
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'file') {
            cb(null, 'uploads/apps/');
        } else if (file.fieldname === 'images') {
            cb(null, 'uploads/images/');
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// نموذج مؤقت للتطبيقات (استبدل بقاعدة البيانات)
let apps = [];

// الحصول على جميع التطبيقات
router.get('/', (req, res) => {
    try {
        res.json(apps);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب التطبيقات' });
    }
});

// الحصول على تطبيقات المطور
router.get('/my-apps', authenticateToken, (req, res) => {
    try {
        const developerApps = apps.filter(app => app.developerId === req.user.userId);
        res.json(developerApps);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب التطبيقات' });
    }
});

// نشر تطبيق جديد
router.post('/', authenticateToken, upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]), (req, res) => {
    try {
        const { name, description, category, platforms } = req.body;
        
        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: 'يرجى رفع ملف التطبيق' });
        }

        const appFile = req.files.file[0];
        const imageFiles = req.files.images || [];

        const app = {
            id: Date.now().toString(),
            name,
            description,
            category,
            platforms: JSON.parse(platforms),
            fileName: appFile.originalname,
            fileSize: appFile.size,
            fileUrl: `/uploads/apps/${appFile.filename}`,
            images: imageFiles.map(img => `/uploads/images/${img.filename}`),
            developerId: req.user.userId,
            developerName: 'المطور', // يمكن جلب اسم المطور من قاعدة البيانات
            uploadDate: new Date().toLocaleString('ar-SA'),
            downloads: 0,
            rating: 0,
            reviews: [],
            createdAt: new Date()
        };

        apps.push(app);

        res.status(201).json({
            message: 'تم نشر التطبيق بنجاح',
            app
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في نشر التطبيق' });
    }
});

// تحميل التطبيق
router.post('/:id/download', authenticateToken, (req, res) => {
    try {
        const appId = req.params.id;
        const app = apps.find(a => a.id === appId);
        
        if (!app) {
            return res.status(404).json({ message: 'التطبيق غير موجود' });
        }

        // زيادة عداد التحميلات
        app.downloads = (app.downloads || 0) + 1;

        res.json({ message: 'تم زيادة عداد التحميلات' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في التحميل' });
    }
});

// الحصول على رابط التحميل
router.get('/:id/download-url', (req, res) => {
    try {
        const appId = req.params.id;
        const app = apps.find(a => a.id === appId);
        
        if (!app) {
            return res.status(404).json({ message: 'التطبيق غير موجود' });
        }

        res.json({
            downloadUrl: `http://localhost:3000${app.fileUrl}`
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب رابط التحميل' });
    }
});

// middleware للتحقق من التوكن
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'غير مصرح' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'توكن غير صالح' });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
