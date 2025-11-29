const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// نموذج مؤقت للمستخدمين (استبدل بقاعدة البيانات)
let users = [];
let apps = [];

// تسجيل مستخدم جديد
router.post('/register/:role', async (req, res) => {
    try {
        const { name, email, password, isAnonymous } = req.body;
        const { role } = req.params;

        // التحقق من البريد الإلكتروني
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
        }

        // تشفير كلمة المرور
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const user = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            role,
            isAnonymous: isAnonymous || false,
            createdAt: new Date()
        };

        users.push(user);

        // إنشاء التوكن
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'تم إنشاء الحساب بنجاح',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// تسجيل الدخول
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // التحقق من كلمة المرور
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // إنشاء التوكن
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// مستخدم مجهول
router.post('/anonymous', (req, res) => {
    try {
        const user = {
            id: Date.now().toString(),
            name: 'مستخدم مجهول',
            email: `anonymous_${Date.now()}@capncom.com`,
            role: 'user',
            isAnonymous: true,
            createdAt: new Date()
        };

        users.push(user);

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'تم إنشاء الحساب المجهول بنجاح',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// التحقق من المستخدم الحالي
router.get('/me', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = users.find(u => u.id === decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        res.status(401).json({ message: 'توكن غير صالح' });
    }
});

module.exports = router;
