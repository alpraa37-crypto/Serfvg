const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/apps');
const uploadRoutes = require('./routes/uploads');

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/upload', uploadRoutes);

// إحصائيات المنصة
app.get('/api/stats', async (req, res) => {
    try {
        // هنا يمكنك جلب الإحصائيات من قاعدة البيانات
        const stats = {
            totalApps: 1247,
            totalDevelopers: 358,
            totalDownloads: 45892,
            totalUsers: 12475
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الإحصائيات' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
