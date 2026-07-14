const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = mongoose.models.User;

router.get('/quota', async (req, res) => {
  try {
    const token = req.headers['authorization'] || '';
    let openid = '';
    if (token && token.startsWith('Bearer ')) {
      try {
        openid = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'default').openid;
      } catch (e) {}
    }
    if (!openid || !User) return res.json({ used: 0, limit: 5, remaining: 5, bonus: 0 });

    const today = getTodayStr();
    let user = await User.findOne({ openid }).catch(() => null);
    if (!user) return res.json({ used: 0, limit: 5, remaining: 5, bonus: 0 });

    let quota = user.dailyQuota;
    // 日期变1更 或 旧版数据需重置
    if (!quota || quota.date !== today || (quota.limit || 0) !== 5) {
      quota = { date: today, used: 0, limit: 5, bonus: 0 };
      user.dailyQuota = quota;
      await user.save().catch(() => {});
    }

    const limit = quota.limit + (quota.bonus || 0);
    return res.json({ used: quota.used, limit, remaining: Math.max(0, limit - quota.used), bonus: quota.bonus || 0, totalParsed: user.totalParsed || 0 });
  } catch (err) {
    console.error('quota error:', err.message);
    return res.json({ used: 0, limit: 5, remaining: 5, bonus: 0, totalParsed: 0 });
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
    if (!openid || !User) return res.status(401).json({ success: false, message: '未登录' });

    const today = getTodayStr();
    let user = await User.findOne({ openid }).catch(() => null);
    if (!user) return res.json({ success: false, message: '用户不存在' });

    let quota = user.dailyQuota;
    if (!quota || quota.date !== today || (quota.limit || 0) !== 5) {
      quota = { date: today, used: 0, limit: 5, bonus: 0 };
    }
    quota.bonus = (quota.bonus || 0) + (req.body.bonus || 5);
    quota.date = today;
    user.dailyQuota = quota;
    await user.save().catch(() => {});

    const limit = quota.limit + quota.bonus;
    return res.json({ success: true, quota: { used: quota.used, limit, remaining: Math.max(0, limit - quota.used), bonus: quota.bonus } });
  } catch (err) {
    console.error('bonus error:', err.message);
    return res.json({ success: false, message: err.message });
  }
});

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = router;
