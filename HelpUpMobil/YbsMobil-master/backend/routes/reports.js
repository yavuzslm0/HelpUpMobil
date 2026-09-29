const express = require('express');
const jwt = require('jsonwebtoken');
const Report = require('../models/Report');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const router = express.Router();

// --- Middleware: Token doğrulama ---
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token bulunamadı' });

    const decoded = jwt.verify(token, 'secretkey');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Kullanıcı bulunamadı' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

// --- Middleware: Sadece MANAGER ---
const requireManager = (req, res, next) => {
  if (req.user.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Bu işlem için Manager yetkisi gereklidir' });
  }
  next();
};

// --- Middleware: ADMIN veya MANAGER ---
const requireAdminOrManager = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Bu sayfaya erişim yetkiniz yok' });
  }
  next();
};

// ==========================================
// GET /api/reports - Raporları listele
// Manager: tüm raporlar, Admin: sadece kendine ait veya yetki verilenler
// ==========================================
router.get('/', authenticate, requireAdminOrManager, async (req, res) => {
  try {
    let reports;
    if (req.user.role === 'MANAGER') {
      // Manager tüm raporları görebilir
      reports = await Report.find({})
        .populate('targetAdmin', 'name email role')
        .populate('createdBy', 'name email')
        .populate('allowedAdmins', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Admin: sadece kendine ait veya allowedAdmins listesinde olan raporlar
      reports = await Report.find({
        $or: [
          { targetAdmin: req.user._id },
          { allowedAdmins: req.user._id }
        ],
        status: 'published'
      })
        .populate('targetAdmin', 'name email role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// POST /api/reports - Yeni rapor oluştur (Sadece MANAGER)
// ==========================================
router.post('/', authenticate, requireManager, async (req, res) => {
  const { title, type, period, targetAdmin, data, status } = req.body;
  try {
    const report = await Report.create({
      title,
      type,
      period,
      targetAdmin,
      createdBy: req.user._id,
      data: data || {},
      status: status || 'published',
      allowedAdmins: [targetAdmin], // Hedef admin otomatik erişir
    });

    const populated = await Report.findById(report._id)
      .populate('targetAdmin', 'name email role')
      .populate('createdBy', 'name email')
      .populate('allowedAdmins', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// PUT /api/reports/:id - Raporu güncelle (Sadece MANAGER)
// ==========================================
router.put('/:id', authenticate, requireManager, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('targetAdmin', 'name email role')
      .populate('createdBy', 'name email')
      .populate('allowedAdmins', 'name email');

    if (!report) return res.status(404).json({ message: 'Rapor bulunamadı' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// DELETE /api/reports/:id - Raporu sil (Sadece MANAGER)
// ==========================================
router.delete('/:id', authenticate, requireManager, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: 'Rapor bulunamadı' });
    res.json({ message: 'Rapor silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// PUT /api/reports/:id/grant - Admin'e rapor erişim yetkisi ver (Sadece MANAGER)
// ==========================================
router.put('/:id/grant', authenticate, requireManager, async (req, res) => {
  const { adminId } = req.body;
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { allowedAdmins: adminId } },
      { new: true }
    )
      .populate('targetAdmin', 'name email role')
      .populate('createdBy', 'name email')
      .populate('allowedAdmins', 'name email');

    if (!report) return res.status(404).json({ message: 'Rapor bulunamadı' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// PUT /api/reports/:id/revoke - Admin'den rapor erişim yetkisini kaldır (Sadece MANAGER)
// ==========================================
router.put('/:id/revoke', authenticate, requireManager, async (req, res) => {
  const { adminId } = req.body;
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $pull: { allowedAdmins: adminId } },
      { new: true }
    )
      .populate('targetAdmin', 'name email role')
      .populate('createdBy', 'name email')
      .populate('allowedAdmins', 'name email');

    if (!report) return res.status(404).json({ message: 'Rapor bulunamadı' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// GET /api/reports/admins - Admin listesini getir (MANAGER için yetki yönetimi)
// ==========================================
router.get('/admins', authenticate, requireManager, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['ADMIN', 'MANAGER'] } })
      .select('name email role')
      .sort({ name: 1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// POST /api/reports/auto-generate - Otomatik performans raporu oluştur (MANAGER)
// Ticket verilerinden admin performansını hesaplar
// ==========================================
router.post('/auto-generate', authenticate, requireManager, async (req, res) => {
  const { targetAdminId, period } = req.body;
  try {
    // Hedef admin'in bilgilerini al
    const targetUser = await User.findById(targetAdminId);
    if (!targetUser) return res.status(404).json({ message: 'Admin bulunamadı' });

    // Dönem ayrıştırma (YYYY-MM)
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Bu admin'e atanmış ticket'ları bul
    const totalTickets = await Ticket.countDocuments({
      assignee: targetAdminId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const resolvedTickets = await Ticket.countDocuments({
      assignee: targetAdminId,
      status: 'Çözüldü',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Ortalama çözüm süresi
    const avgResult = await Ticket.aggregate([
      {
        $match: {
          assignee: targetUser._id,
          status: 'Çözüldü',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
        }
      }
    ]);

    const avgHours = avgResult.length > 0 && avgResult[0].avgMs
      ? parseFloat((avgResult[0].avgMs / (1000 * 60 * 60)).toFixed(1))
      : 0;

    // Performans puanı hesapla (basit formül)
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) : 0;
    const satisfactionScore = Math.min(5, Math.max(1, Math.round(resolutionRate * 5 * 10) / 10));

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const report = await Report.create({
      title: `${targetUser.name} - ${monthNames[month - 1]} ${year} Performans Raporu`,
      type: 'performance',
      period,
      targetAdmin: targetAdminId,
      createdBy: req.user._id,
      data: {
        totalTickets,
        resolvedTickets,
        avgResolutionTime: avgHours,
        satisfactionScore: satisfactionScore || 3,
        notes: `Otomatik oluşturulan rapor. Çözüm oranı: %${Math.round(resolutionRate * 100)}`,
      },
      allowedAdmins: [targetAdminId],
      status: 'published',
    });

    const populated = await Report.findById(report._id)
      .populate('targetAdmin', 'name email role')
      .populate('createdBy', 'name email')
      .populate('allowedAdmins', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Otomatik rapor hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
