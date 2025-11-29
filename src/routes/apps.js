const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDatabase, writeDatabase } = require('../config/database');

const router = express.Router();

// الحصول على جميع التطبيقات
router.get('/', (req, res) => {
  try {
    const db = readDatabase();
    const apps = db.apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      apps: apps,
      total: apps.length
    });

  } catch (error) {
    console.error('Get apps error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب التطبيقات'
    });
  }
});

// الحصول على تطبيقات المطور
router.get('/developer/:developerId', (req, res) => {
  try {
    const { developerId } = req.params;
    const db = readDatabase();

    const developerApps = db.apps.filter(app => app.developerId === developerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      apps: developerApps,
      total: developerApps.length
    });

  } catch (error) {
    console.error('Get developer apps error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب التطبيقات'
    });
  }
});

// نشر تطبيق جديد
router.post('/', (req, res) => {
  try {
    const {
      name,
      description,
      fileUrl,
      fileName,
      fileSize,
      images,
      platforms,
      developerId,
      developerName
    } = req.body;

    if (!name || !description || !fileUrl || !developerId) {
      return res.status(400).json({
        success: false,
        message: 'الرجاء إدخال جميع البيانات المطلوبة'
      });
    }

    const db = readDatabase();

    const newApp = {
      id: uuidv4(),
      name,
      description,
      fileUrl,
      fileName: fileName || 'app.file',
      fileSize: parseInt(fileSize) || 0,
      images: Array.isArray(images) ? images : [],
      platforms: platforms || {},
      developerId,
      developerName: developerName || 'مطور مجهول',
      uploadDate: new Date().toLocaleString('ar-SA'),
      downloads: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.apps.push(newApp);
    writeDatabase(db);

    res.status(201).json({
      success: true,
      message: 'تم نشر التطبيق بنجاح',
      app: newApp
    });

  } catch (error) {
    console.error('Publish app error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء نشر التطبيق'
    });
  }
});

// زيادة عداد التحميلات
router.put('/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const appIndex = db.apps.findIndex(app => app.id === id);
    if (appIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'التطبيق غير موجود'
      });
    }

    db.apps[appIndex].downloads += 1;
    db.apps[appIndex].updatedAt = new Date().toISOString();
    writeDatabase(db);

    res.json({
      success: true,
      message: 'تم تحديث عداد التحميلات',
      downloads: db.apps[appIndex].downloads
    });

  } catch (error) {
    console.error('Download count error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تحديث العداد'
    });
  }
});

// البحث في التطبيقات
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    const db = readDatabase();

    if (!q) {
      return res.json({
        success: true,
        apps: [],
        total: 0
      });
    }

    const searchTerm = q.toLowerCase();
    const filteredApps = db.apps.filter(app => 
      app.name.toLowerCase().includes(searchTerm) ||
      app.description.toLowerCase().includes(searchTerm) ||
      app.developerName.toLowerCase().includes(searchTerm)
    );

    res.json({
      success: true,
      apps: filteredApps,
      total: filteredApps.length
    });

  } catch (error) {
    console.error('Search apps error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في البحث'
    });
  }
});

module.exports = router;
