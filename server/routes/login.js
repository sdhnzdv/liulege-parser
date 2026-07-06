const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = mongoose.models.User;
const History = mongoose.models.History;

router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ success: false, message: '缺少 code' });

    const appid = process.env.WX_APPID;
    const secret = process.env.WX_SECRET;
    if (!appid || !secret) {
      return res.json({ success: false, message: 'WX_APPID 或 WX_SECRET 未配置' });
    }

    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const wxRes = await axios.get(wxUrl, { timeout: 10000 });

    if (wxRes.data.errcode) {
      return res.json({ success: false, message: `微信错误(${wxRes.data.errcode}): ${wxRes.data.errmsg}` });
    }

    const openid = wxRes.data.openid;
    if (!openid) return res.json({ success: false, message: '未获取到 openid' });

    const today = getTodayStr();

    let user = await User.findOne({ openid }).catch((err) => {
      console.error('查找用户失败:', err.message);
      return null;
    });

    if (!user) {
      user = await User.create({
        openid,
        dailyQuota: { date: today, used: 0, limit: 5, bonus: 0 }
      }).catch((err) => {
        console.error('创建用户失败:', err.message);
        return null;
      });
    }

    const token = jwt.sign({ openid }, process.env.JWT_SECRET || 'default', { expiresIn: '7d' });

    let quota = user ? (user.dailyQuota || { date: today, used: 0, limit: 5, bonus: 0 }) : { date: today, used: 0, limit: 5, bonus: 0 };
    if (!quota.date || quota.date !== today) {
      quota = { date: today, used: 0, limit: 5, bonus: 0 };
      if (user) {
        user.dailyQuota = quota;
        await user.save().catch(() => {});
      }
    }

    const limit = quota.limit + (quota.bonus || 0);

    return res.json({
      success: true,
      openid,
      token,
      quota: { used: quota.used, limit, remaining: Math.max(0, limit - quota.used), bonus: quota.bonus || 0 }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    return res.json({ success: false, message: '服务器错误: ' + err.message });
  }
});

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = router;
