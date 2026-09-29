const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['LAPTOP', 'MONİTÖR', 'TELEFON', 'TABLET', 'YAZICI', 'KLAVYE', 'MOUSE', 'DİĞER'],
  },
  modelName: {
    type: String,
    required: true,
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
  },
  assignedUser: {
    type: String,
    default: 'Depoda'
  },
  status: {
    type: String,
    enum: ['Zimmetli', 'Depoda', 'Arızalı'],
    default: 'Depoda',
  }
}, { timestamps: true });

const Asset = mongoose.model('Asset', assetSchema);
module.exports = Asset;
