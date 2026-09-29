const express = require('express');
const Asset = require('../models/Asset');

const router = express.Router();

// Get all assets
router.get('/', async (req, res) => {
  try {
    const assets = await Asset.find({}).sort({ createdAt: -1 });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new asset
router.post('/', async (req, res) => {
  const { type, modelName, serialNumber, assignedUser, status } = req.body;
  try {
    const asset = await Asset.create({
      type,
      modelName,
      serialNumber,
      assignedUser,
      status
    });
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update an asset
router.put('/:id', async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!asset) return res.status(404).json({ message: 'Varlık bulunamadı' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an asset
router.delete('/:id', async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Varlık bulunamadı' });
    res.json({ message: 'Varlık silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
