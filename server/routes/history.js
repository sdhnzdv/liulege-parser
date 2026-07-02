const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  openid: { type: String, required: true },
  title: String, author: String, description: String,
  cover: String, mediaUrl: String, type: String, platform: String,
  createTime: { type: Date, default: Date.now }
});
const History = mongoose.models.History || mongoose.model('History', historySchema);

router.get('/history', async (req, res) => {
  try {
    const token = req.headers['authorization'] || '';
    let openid = '';
    if (token && token.startsWith('Bearer ')) {
      try {
        openid = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'default').openid;
      } catch (e) {}
    }
    if (!openid) return res.json({ list: [], total: 0 });

    const skip = parseInt(req.query.skip) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const list = await History.find({ openid }).sort({ createTime: -1 }).skip(skip).limit(limit).lean().catch(() => []);
    return res.json({ list: list || [], total: (list || []).length, skip, limit, hasMore: (list || []).length >= limit });
  } catch (err) {
    return res.json({ list: [], total: 0 });
  }
});

module.exports = router;
