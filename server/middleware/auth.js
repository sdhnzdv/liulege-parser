const jwt = require('jsonwebtoken');

/**
 * 认证中间件 - 从请求头解析 openid
 * 小程序端传入 code，服务端通过微信接口换取 openid
 */
module.exports = async (req, res, next) => {
  try {
    const token = req.headers['authorization'] || req.query.token || '';

    if (!token) {
      // 没有 token，尝试通过 code 获取
      const code = req.headers['x-wx-code'] || req.query.code || '';

      if (code) {
        // 用 code 换 openid（走微信接口）
        const openid = await getOpenidByCode(code);
        req.openid = openid;
        return next();
      }

      return res.status(401).json({ success: false, message: '未登录' });
    }

    // 验证 JWT token
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.openid = decoded.openid;
    next();
  } catch (err) {
    console.error('认证失败:', err.message);
    return res.status(401).json({ success: false, message: '认证失败' });
  }
};

/**
 * 通过微信 code 获取 openid
 */
async function getOpenidByCode(code) {
  const axios = require('axios');

  try {
    const res = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (res.data.openid) {
      return res.data.openid;
    }

    throw new Error(res.data.errmsg || '获取openid失败');
  } catch (err) {
    console.error('微信接口调用失败:', err.message);
    throw err;
  }
}
