const express = require('express');
const router = express.Router();
const axios = require('axios');
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

const historySchema = new mongoose.Schema({
  openid: { type: String, required: true },
  title: String, author: String, description: String,
  cover: String, mediaUrl: String, type: String, platform: String,
  createTime: { type: Date, default: Date.now }
});
const History = mongoose.models.History || mongoose.model('History', historySchema);

function getOpenid(req) {
  const token = req.headers['authorization'] || '';
  if (token && token.startsWith('Bearer ')) {
    try {
      return jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'default').openid;
    } catch (e) {}
  }
  return null;
}

router.post('/parse', async (req, res) => {
  try {
    const openid = getOpenid(req);
    if (!openid) return res.status(401).json({ success: false, message: '未登录' });

    const { url } = req.body;
    if (!url) return res.json({ success: false, message: '链接不能为空' });

    const platform = detectPlatform(url);
    if (platform === 'unknown') return res.json({ success: false, message: '不支持的平台' });

    const today = getTodayStr();
    let user = await User.findOne({ openid }).catch(() => null);
    if (!user) return res.json({ success: false, message: '用户不存在' });

    let quota = user.dailyQuota;
    if (quota.date !== today) quota = { date: today, used: 0, limit: 5, bonus: 0 };

    const limit = quota.limit + (quota.bonus || 0);
    if (quota.used >= limit) return res.json({ success: false, message: '今日次数已用完', quotaExceeded: true });

    const result = await parseByPlatform(url, platform);
    if (!result.success) return res.json({ success: false, message: result.message || '解析失败' });

    quota.used += 1;
    user.dailyQuota = quota;
    user.totalParsed = (user.totalParsed || 0) + 1;
    await user.save().catch(() => {});

    await History.create({ openid, ...result.data, platform }).catch(() => {});

    return res.json({
      success: true,
      data: { ...result.data, platform },
      quota: { used: quota.used, limit, remaining: Math.max(0, limit - quota.used) }
    });
  } catch (err) {
    console.error('解析失败:', err.message);
    return res.json({ success: false, message: '解析服务异常' });
  }
});

function detectPlatform(url) {
  if (/douyin\.com|iesdouyin\.com|dy\.com/i.test(url)) return 'douyin';
  if (/kuaishou\.com|chenzhongtech\.com|kuaishouapp\.com/i.test(url)) return 'kuaishou';
  if (/xiaohongshu\.com|xhslink\.com|redbook\.com/i.test(url)) return 'xiaohongshu';
  return 'unknown';
}

async function parseByPlatform(url, platform) {
  if (process.env.PARSE_API_KEY) {
    try {
      const response = await axios.post('https://api.tianapi.com/douyin/video/index', {
        key: process.env.PARSE_API_KEY, url
      }, { timeout: 15000 });
      if (response.data.code === 200) {
        const d = response.data.newslist?.[0] || response.data.result || {};
        return { success: true, data: {
          title: d.title || '', author: d.author || '', description: d.description || '',
          cover: d.cover || '', mediaUrl: d.video_url || d.url || '', type: d.type || 'video'
        }};
      }
    } catch (e) {}
  }

  const mockData = {
    douyin: { title: '抖音视频示例', author: '抖音创作者', description: '视频文案 #话题', cover: 'https://picsum.photos/seed/douyin/400/600', mediaUrl: '', type: 'video' },
    kuaishou: { title: '快手视频示例', author: '快手达人', description: '视频描述', cover: 'https://picsum.photos/seed/kuaishou/400/600', mediaUrl: '', type: 'video' },
    xiaohongshu: { title: '小红书笔记示例', author: '小红书博主', description: '种草文案', cover: 'https://picsum.photos/seed/xiaohongshu/400/600', mediaUrl: '', type: 'image' }
  };
  return { success: true, data: mockData[platform] || mockData.douyin };
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = router;
