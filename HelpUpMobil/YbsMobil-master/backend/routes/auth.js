const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log('Register isteği geldi:', { name, email, role });
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });
    if (user) {
      console.log('Kullanıcı başarıyla oluşturuldu:', user.email);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '30d' }),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register HATA:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '30d' }),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware for auth
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token bulunamadı' });
    const decoded = jwt.verify(token, 'secretkey');
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    
    user.name = req.body.name || user.name;
    // Assuming you might add more fields later like phone, bio etc.
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: jwt.sign({ id: updatedUser._id }, 'secretkey', { expiresIn: '30d' })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Password
router.put('/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Mevcut şifre yanlış' });
    }
    
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save Expo Push Token
router.put('/push-token', authenticate, async (req, res) => {
  const { expoPushToken } = req.body;
  try {
    if (!expoPushToken) {
      return res.status(400).json({ message: 'Push token gerekli' });
    }
    await User.findByIdAndUpdate(req.user._id, { expoPushToken });
    console.log(`[Push Token] Kaydedildi: ${req.user.name} -> ${expoPushToken}`);
    res.json({ message: 'Push token kaydedildi' });
  } catch (error) {
    console.error('[Push Token] Kayıt hatası:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
