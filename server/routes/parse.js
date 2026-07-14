const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = mongoose.models.User;
const History = mongoose.models.History;

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

    let { url } = req.body;
    if (!url) return res.json({ success: false, message: '链接不能为空' });

    // 从分享文案中自动提取真实 URL
    const extracted = extractUrl(url);
    if (extracted) url = extracted;

    const platform = detectPlatform(url);
    if (platform === 'unknown') return res.json({ success: false, message: '不支持的平台，请检查链接' });

    const today = getTodayStr();

    let user = await User.findOne({ openid }).catch(() => null);
    if (!user) {
      user = await User.create({
        openid,
        dailyQuota: { date: today, used: 0, limit: 5, bonus: 0 },
        totalParsed: 0
      }).catch(() => null);
    }
    if (!user) return res.json({ success: false, message: '用户数据异常' });

    let quota = user.dailyQuota;
    if (!quota || quota.date !== today || (quota.limit || 0) !== 5) {
      quota = { date: today, used: 0, limit: 5, bonus: 0 };
    }

    const limit = quota.limit + (quota.bonus || 0);
    if (quota.used >= limit) return res.json({ success: false, message: '今日次数已用完', quotaExceeded: true });

    const result = await parseByPlatform(url, platform);
    if (!result.success) return res.json({ success: false, message: result.message || '解析失败' });

    quota.used += 1;
    user.dailyQuota = quota;
    user.totalParsed = (user.totalParsed || 0) + 1;
    await user.save().catch(() => {});

    if (History) {
      await History.create({ openid, ...result.data, platform }).catch(() => {});
    }

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

// 从分享文案中提取 URL
function extractUrl(text) {
  const regex = /(https?:\/\/[^\s\u4e00-\u9fa5]+)/i;
  const match = text.match(regex);
  return match ? match[1] : null;
}

function detectPlatform(url) {
  if (/douyin\.com|iesdouyin\.com|v\.douyin/i.test(url)) return 'douyin';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/bilibili\.com|b23\.tv/i.test(url)) return 'bilibili';
  if (/kuaishou\.com|chenzhongtech\.com|kuaishouapp\.com/i.test(url)) return 'kuaishou';
  if (/xiaohongshu\.com|xhslink\.com|redbook\.com/i.test(url)) return 'xiaohongshu';
  return 'unknown';
}

async function parseByPlatform(url, platform) {
  const parseApiKey = process.env.PARSE_API_KEY || 'HRpjlIIA66QF36bioxIz2ILFce';
  try {
    const apiRes = await axios.get('https://www.52api.cn/api/douyin', {
      params: { key: parseApiKey, url },
      timeout: 30000
    });

    const data = apiRes.data;
    if (data.code === 200 && data.data) {
      const d = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
      return {
        success: true,
        data: {
          title: d.work_title || '',
          author: d.work_author || '',
          description: d.work_title || '',
          cover: d.work_cover || '',
          mediaUrl: d.work_url || '',
          type: d.work_type === 'image' ? 'image' : 'video',
          musicUrl: d.music?.url || '',
          musicName: d.music?.name || '',
          duration: d.work_duration || '',
          authorAvatar: d.work_avatar || '',
          authorUid: d.work_uid || ''
        }
      };
    }
    return { success: false, message: data.msg || '解析失败' };
  } catch (e) {
    console.error('52api 失败:', e.message);
    return { success: false, message: '解析服务暂不可用' };
  }
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = router;
