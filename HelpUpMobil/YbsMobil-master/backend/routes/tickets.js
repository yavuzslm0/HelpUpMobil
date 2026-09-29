const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/notificationHelper');

const router = express.Router();

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find({}).populate('creator', 'name').populate('assignee', 'name');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new ticket
router.post('/', async (req, res) => {
  const { category, priority, description, creatorId, photo } = req.body;
  try {
    // Generate a random ticket ID like #443589
    const ticketId = '#' + Math.floor(100000 + Math.random() * 900000);
    
    const ticketData = {
      ticketId,
      category,
      priority,
      description,
      creator: creatorId,
    };

    // Opsiyonel fotoğraf ekleme
    if (photo && photo.data) {
      ticketData.photo = {
        data: photo.data,
        mimeType: photo.mimeType || 'image/jpeg',
      };
    }

    const ticket = await Ticket.create(ticketData);

    // Bildirim Gönderimi: Oluşturan kişiye (eğer push token'ı varsa) ve tüm Manager'lara
    try {
      const creatorUser = await User.findById(creatorId);
      if (creatorUser && creatorUser.expoPushToken) {
        await sendPushNotification(
          [creatorUser.expoPushToken],
          'Talep Oluşturuldu',
          `Talebiniz başarıyla oluşturuldu: ${ticket.category}`,
          { ticketId: ticket._id }
        );
      }

      // Tüm Manager'ları bul ve bildirim gönder
      const managers = await User.find({ role: 'MANAGER', expoPushToken: { $exists: true, $ne: null } });
      const managerTokens = managers.map(m => m.expoPushToken);
      if (managerTokens.length > 0) {
        await sendPushNotification(
          managerTokens,
          'Yeni Talep',
          `Yeni bir talep oluşturuldu, atamasını yapınız. Kategori: ${ticket.category}`,
          { ticketId: ticket._id }
        );
      }
    } catch (notifErr) {
      console.error('[Bildirim Hatası] Talep oluşturma:', notifErr.message);
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get statistics for the dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalOpen = await Ticket.countDocuments({ status: { $nin: ['Çözüldü', 'Reddedildi'] } });
    const totalClosed = await Ticket.countDocuments({ status: 'Çözüldü' });

    // Ort. Çözüm Süresi: Çözülen taleplerin (updatedAt - createdAt) ortalaması
    const avgResult = await Ticket.aggregate([
      { $match: { status: 'Çözüldü' } },
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

    // Kategori bazlı dağılım (grafik için)
    const categoryStats = await Ticket.aggregate([
      {
        $group: {
          _id: '$category',
          open: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'Çözüldü'] }, { $ne: ['$status', 'Reddedildi'] }] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'Çözüldü'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Son aktif talepler (en son 5 tanesi)
    const recentTickets = await Ticket.find({ status: { $nin: ['Çözüldü', 'Reddedildi'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('creator', 'name');

    res.json({
      openTickets: totalOpen,
      closedTickets: totalClosed,
      avgResolutionHours: avgHours,
      categoryStats,
      recentTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('assignee', 'name email');
    if (!ticket) return res.status(404).json({ message: 'Talep bulunamadı' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manager approves a ticket
router.put('/:id/approve', async (req, res) => {
  const { assigneeId, managerNote } = req.body;
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Onaylandı', 
        assignee: assigneeId,
        managerNote: managerNote || ''
      },
      { new: true }
    ).populate('creator', 'name email expoPushToken').populate('assignee', 'name email expoPushToken');
    if (!ticket) return res.status(404).json({ message: 'Talep bulunamadı' });

    // Bildirim Gönderimi: Admin'e ve Oluşturan kişiye
    try {
      if (ticket.assignee && ticket.assignee.expoPushToken) {
        await sendPushNotification(
          [ticket.assignee.expoPushToken],
          'Yeni Görev Atandı',
          `Size yeni bir talep atandı. Kategori: ${ticket.category}`,
          { ticketId: ticket._id }
        );
      }
      if (ticket.creator && ticket.creator.expoPushToken) {
        await sendPushNotification(
          [ticket.creator.expoPushToken],
          'Talep Onaylandı',
          `Talebiniz onaylandı ve bir IT personeline atandı.`,
          { ticketId: ticket._id }
        );
      }
    } catch (notifErr) {
      console.error('[Bildirim Hatası] Talep onaylama:', notifErr.message);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manager rejects a ticket
router.put('/:id/reject', async (req, res) => {
  const { managerNote } = req.body;
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: 'Reddedildi', managerNote: managerNote || '' },
      { new: true }
    ).populate('creator', 'name email expoPushToken').populate('assignee', 'name email expoPushToken');
    if (!ticket) return res.status(404).json({ message: 'Talep bulunamadı' });

    // Bildirim Gönderimi: Oluşturan kişiye
    try {
      if (ticket.creator && ticket.creator.expoPushToken) {
        await sendPushNotification(
          [ticket.creator.expoPushToken],
          'Talep Reddedildi',
          `Talebiniz reddedildi. Lütfen detayları kontrol edin.`,
          { ticketId: ticket._id }
        );
      }
    } catch (notifErr) {
      console.error('[Bildirim Hatası] Talep reddetme:', notifErr.message);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ticket status (for admin workflow)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const updateData = { status };

    // Çözüldü durumuna geçince fotoğrafı veritabanından sil
    if (status === 'Çözüldü') {
      updateData.photo = null;
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('creator', 'name email expoPushToken').populate('assignee', 'name email expoPushToken');
    if (!ticket) return res.status(404).json({ message: 'Talep bulunamadı' });

    // Bildirim Gönderimi: Oluşturan kişiye
    try {
      if (ticket.creator && ticket.creator.expoPushToken) {
        let title = 'Talep Güncellendi';
        let body = `Talebinizin durumu "${status}" olarak güncellendi.`;
        if (status === 'Çözüldü') {
          title = 'Talep Çözüldü';
          body = `Talebiniz başarıyla çözüldü!`;
        }
        await sendPushNotification(
          [ticket.creator.expoPushToken],
          title,
          body,
          { ticketId: ticket._id }
        );
      }
    } catch (notifErr) {
      console.error('[Bildirim Hatası] Durum güncelleme:', notifErr.message);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
