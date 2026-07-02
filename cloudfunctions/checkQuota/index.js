// cloudfunctions/checkQuota/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const today = getTodayStr();
  const { bonus = 0 } = event;

  try {
    const res = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (res.data.length === 0) {
      return { canParse: true, remaining: 5 };
    }

    const user = res.data[0];
    let quota = user.dailyQuota || { date: today, used: 0, limit: 5, bonus: 0 };

    // 日期过期，重置
    if (quota.date !== today) {
      quota = { date: today, used: 0, limit: 5, bonus: 0 };
      await db.collection('users').doc(user._id).update({
        data: { dailyQuota: quota, updateTime: db.serverDate() }
      });
      return { canParse: true, remaining: 5 };
    }

    // 处理 bonus 增加（看完广告后）
    if (bonus > 0) {
      const newBonus = (quota.bonus || 0) + bonus;
      await db.collection('users').doc(user._id).update({
        data: {
          'dailyQuota.bonus': newBonus,
          'dailyQuota.date': today,
          updateTime: db.serverDate()
        }
      });
      const limit = quota.limit + newBonus;
      const remaining = Math.max(0, limit - quota.used);
      return { canParse: remaining > 0, remaining };
    }

    const limit = quota.limit + (quota.bonus || 0);
    const remaining = Math.max(0, limit - quota.used);

    return {
      canParse: remaining > 0,
      remaining,
      used: quota.used,
      limit,
      bonus: quota.bonus || 0
    };
  } catch (err) {
    console.error('检查配额失败:', err);
    return { canParse: false, remaining: 0, error: err.message };
  }
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
