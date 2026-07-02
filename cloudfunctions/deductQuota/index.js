// cloudfunctions/deductQuota/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const today = getTodayStr();

  try {
    const res = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (res.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const user = res.data[0];
    let quota = user.dailyQuota || { date: today, used: 0, limit: 5, bonus: 0 };

    // 日期过期，重置
    if (quota.date !== today) {
      quota = { date: today, used: 0, limit: 5, bonus: 0 };
    }

    const limit = quota.limit + (quota.bonus || 0);

    if (quota.used >= limit) {
      return { success: false, message: '今日次数已用完' };
    }

    // 扣减一次
    const newUsed = quota.used + 1;

    await db.collection('users').doc(user._id).update({
      data: {
        'dailyQuota.used': newUsed,
        'dailyQuota.date': today,
        totalParsed: _.inc(1),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      remaining: limit - newUsed,
      used: newUsed,
      limit
    };
  } catch (err) {
    console.error('扣减配额失败:', err);
    return { success: false, message: err.message };
  }
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
