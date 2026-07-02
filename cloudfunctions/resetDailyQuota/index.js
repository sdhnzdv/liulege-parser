// cloudfunctions/resetDailyQuota/index.js
// 定时触发器：每天 00:00 执行，重置所有用户配额
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const today = getTodayStr();

  try {
    // 批量更新所有用户配额
    // 注意：小程序云开发不支持批量更新，需要用循环
    // 这里仅作为触发器占位，实际重置逻辑在每个函数中按日期检查

    console.log(`[${today}] 每日配额重置触发器执行`);

    return {
      success: true,
      date: today,
      message: '配额重置触发器执行完成'
    };
  } catch (err) {
    console.error('重置失败:', err);
    return { success: false, error: err.message };
  }
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
