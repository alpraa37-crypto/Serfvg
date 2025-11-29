const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'database.json');

// قراءة قاعدة البيانات
function readDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialData = {
        users: [],
        apps: []
      };
      
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
    
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], apps: [] };
  }
}

// كتابة قاعدة البيانات
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// النسخ الاحتياطي
function backupDatabase() {
  try {
    const data = readDatabase();
    const backupPath = path.join(
      path.dirname(DB_PATH), 
      `backup-${Date.now()}.json`
    );
    
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Backup error:', error);
    return false;
  }
}

// تنظيف قاعدة البيانات (إزالة التطبيقات القديمة)
function cleanupDatabase(daysOld = 30) {
  try {
    const db = readDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const initialCount = db.apps.length;
    db.apps = db.apps.filter(app => new Date(app.createdAt) > cutoffDate);
    
    if (db.apps.length !== initialCount) {
      writeDatabase(db);
      console.log(`Cleaned up ${initialCount - db.apps.length} old apps`);
    }
    
    return initialCount - db.apps.length;
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}

module.exports = {
  readDatabase,
  writeDatabase,
  backupDatabase,
  cleanupDatabase
};
