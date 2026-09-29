const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Düşük', 'Orta', 'Yüksek', 'Kritik'],
    default: 'Düşük',
  },
  status: {
    type: String,
    enum: ['Onay Bekliyor', 'Onaylandı', 'İşlemde', 'Çözüldü', 'Reddedildi'],
    default: 'Onay Bekliyor',
  },
  description: {
    type: String,
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  managerNote: {
    type: String,
  },
  photo: {
    data: { type: String },      // Base64 encoded image
    mimeType: { type: String },  // image/jpeg, image/png
  }
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
