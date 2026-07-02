const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  openid: { type: String, required: true, unique: true },
  dailyQuota: {
    date: { type: String, default: '' },
    used: { type: Number, default: 0 },
    limit: { type: Number, default: 5 },
    bonus: { type: Number, default: 0 }
  },
  totalParsed: { type: Number, default: 0 },
  createTime: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

router.get('/quota', async (req, res) => {
  try {
    const token = req.headers['authorization'] || '';
    let openid = '';
    if (token && token.startsWith('Bearer ')) {
      try {
        const d = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'default');
        openid = d.openid;
      } catch (e) {}
    }
    if (!openid) return res.json({ used: 0, limit: 5, remaining: 5, bonus: 0 });

    const today = getTodayStr();
    let user = await User.findOne({ openid }).catch(() => null);
    if (!user) return res.json({ used: 0, limit: 5, remaining: 5, bonus: 0 });

    let quota = user.dailyQuota;
    if (quota.date !== today) {
      quota = { date: today, used: 0, limit: 5, bonus: 0 };
      user.dailyQuota = quota;
      await user.save().catch(() => {});
    }

    const limit = quota.limit + (quota.bonus || 0);
    return res.json({ used: quota.used, limit, remaining: Math.max(0, limit - quota.used), bonus: quota.bonus || 0, date: quota.date });
  } catch (err) {
    return res.json({ used: 0, limit: 5, remaining: 5, bonus: 0 });
  }
});

router.post('/quota/bonus', async (req, res) => {
  try {
    const token = req.headers['authorization'] || '';
    let openid = '';
    if (token && token.startsWith('Bearer ')) {
      try {
        openid = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'default').openid;
      } catch (e) {
        return res.status(401).json({ success: false, message: '未登录' });
      }
    }
    if (!openid) return res.status(401).json({ success: false, message: '未登录' });

    const today = getTodayStr();
    let user = await User.findOne({ openid }).catch(() => null);
    if (!user) return res.json({ success: false, message: '用户不存在' });

    let quota = user.dailyQuota;
    if (quota.date !== today) quota = { date: today, used: 0, limit: 5, bonus: 0 };
    quota.bonus = (quota.bonus || 0) + (req.body.bonus || 5);
    quota.date = today;
    user.dailyQuota = quota;
    await user.save().catch(() => {});

    const limit = quota.limit + quota.bonus;
    return res.json({ success: true, quota: { used: quota.used, limit, remaining: Math.max(0, limit - quota.used), bonus: quota.bonus } });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = router;
