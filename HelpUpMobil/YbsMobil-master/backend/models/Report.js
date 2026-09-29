const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['performance', 'ticket_summary', 'asset_report', 'custom'],
    required: true,
  },
  period: {
    type: String, // "2025-05" formatında ay bazlı
    required: true,
  },
  targetAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  data: {
    totalTickets: { type: Number, default: 0 },
    resolvedTickets: { type: Number, default: 0 },
    avgResolutionTime: { type: Number, default: 0 }, // saat cinsinden
    satisfactionScore: { type: Number, default: 0, min: 0, max: 5 },
    notes: { type: String, default: '' },
  },
  allowedAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published',
  }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
