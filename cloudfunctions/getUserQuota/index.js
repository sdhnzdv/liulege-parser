// cloudfunctions/getUserQuota/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const today = getTodayStr();

  try {
    const res = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (res.data.length === 0) {
      return { used: 0, limit: 5, remaining: 5, bonus: 0 };
    }

    const user = res.data[0];
    const quota = user.dailyQuota || { date: today, used: 0, limit: 5, bonus: 0 };

    // 检查日期是否需要重置
    if (quota.date !== today) {
      // 日期已过，返回新配额
      return { used: 0, limit: 5, remaining: 5, bonus: 0, date: today };
    }

    const limit = quota.limit + (quota.bonus || 0);
    const remaining = Math.max(0, limit - quota.used);

    return {
      used: quota.used,
      limit,
      remaining,
      bonus: quota.bonus || 0,
      date: quota.date
    };
  } catch (err) {
    console.error('获取配额失败:', err);
    return { used: 0, limit: 5, remaining: 5, bonus: 0 };
  }
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
