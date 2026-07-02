// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext();

  try {
    // 查找或创建用户记录
    const userRes = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (userRes.data.length === 0) {
      // 新用户，创建记录
      const today = getTodayStr();
      await db.collection('users').add({
        data: {
          _openid: OPENID,
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          dailyQuota: {
            date: today,
            used: 0,
            limit: 5,
            bonus: 0
          },
          totalParsed: 0
        }
      });
    }

    return {
      openid: OPENID,
      appid: APPID,
      unionid: UNIONID,
      message: '登录成功'
    };
  } catch (err) {
    console.error('登录失败:', err);
    return {
      openid: OPENID,
      appid: APPID,
      message: '登录异常: ' + err.message
    };
  }
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
