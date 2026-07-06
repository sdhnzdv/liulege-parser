const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// 复用已有的 User model
const User = mongoose.models.User;
const History = mongoose.models.History;

function getOpenid(req) {
  const token = req.headers['authorization'] || '';
  if (token && token.startsWith('Bearer ')) {
    try {
      return jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'default').openid;
    } catch (e) {
      console.error('JWT 解析失败:', e.message);
    }
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
    if (platform === 'unknown') return res.json({ success: false, message: '不支持的平台，目前支持抖音、快手、小红书等' });

    const today = getTodayStr();

    let user = await User.findOne({ openid }).catch(() => null);
    if (!user) {
      user = await User.create({
        openid,
        dailyQuota: { date: today, used: 0, limit: 5, bonus: 0 }
      }).catch((err) => {
        console.error('parse 创建用户失败:', err.message);
        return null;
      });
    }
    if (!user) return res.json({ success: false, message: '用户数据异常，请重新登录' });

    let quota = user.dailyQuota;
    if (!quota || quota.date !== today) quota = { date: today, used: 0, limit: 5, bonus: 0 };

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

function detectPlatform(url) {
  if (/douyin\.com|iesdouyin\.com|v\.douyin/i.test(url)) return 'douyin';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/bilibili\.com|b23\.tv/i.test(url)) return 'bilibili';
  if (/kuaishou\.com|chenzhongtech\.com|kuaishouapp\.com/i.test(url)) return 'kuaishou';
  if (/xiaohongshu\.com|xhslink\.com|redbook\.com/i.test(url)) return 'xiaohongshu';
  return 'unknown';
}

async function parseByPlatform(url, platform) {
  // 使用 52api.cn（最优先）
  if (process.env.PARSE_API_KEY) {
    try {
      console.log('调用 52api.cn 解析:', platform, url);
      const apiRes = await axios.get('https://www.52api.cn/api/douyin', {
        params: { key: process.env.PARSE_API_KEY, url },
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LiulegeParser/1.0)'
        }
      });

      const data = apiRes.data;
      console.log('52api 返回 code:', data.code, 'msg:', data.msg);

      if (data.code === 200 && data.data) {
        // 52api 返回字段：work_title, work_author, work_cover, work_url, music 等
        const d = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        return {
          success: true,
          data: {
            title: d.work_title || d.title || '',
            author: d.work_author || d.author || '',
            description: d.work_title || '',
            cover: d.work_cover || d.cover || '',
            mediaUrl: d.work_url || d.video_url || '',
            type: d.work_type === 'image' ? 'image' : 'video',
            musicUrl: d.music?.url || d.music_url || '',
            musicName: d.music?.name || '',
            duration: d.work_duration || '',
            authorAvatar: d.work_avatar || '',
            authorUid: d.work_uid || ''
          }
        };
      }

      return { success: false, message: data.msg || '解析失败' };
    } catch (e) {
      console.error('52api 解析失败:', e.message);
    }
  }

  // 备用：尝试 Douyin_TikTok_Download_API 公开接口
  try {
    console.log('尝试备用 API:', platform, url);
    const apiRes = await axios.get('https://api.douyin.wtf/api/hybrid/video_data', {
      params: { url, minimal: false },
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = apiRes.data;
    if (data && data.code === 200 && data.data) {
      const d = data.data;
      let mediaUrl = '';
      if (d.nwm_video_url) mediaUrl = d.nwm_video_url;
      else if (d.video_data?.nwm_urls?.length > 0) mediaUrl = d.video_data.nwm_urls[0];
      else if (d.download_url) mediaUrl = d.download_url;

      return {
        success: true,
        data: {
          title: d.desc || d.title || '',
          author: d.author?.nickname || d.nickname || '',
          description: d.desc || '',
          cover: d.cover?.url_list?.[0] || d.cover || '',
          mediaUrl: mediaUrl,
          type: d.images ? 'image' : 'video',
          musicUrl: d.music?.play_url?.url_list?.[0] || '',
          duration: d.duration || 0
        }
      };
    }

    return { success: false, message: data?.msg || '备用解析失败' };
  } catch (e) {
    console.error('备用 API 失败:', e.message);
    return { success: false, message: '解析服务暂不可用，请稍后重试' };
  }
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = router;
