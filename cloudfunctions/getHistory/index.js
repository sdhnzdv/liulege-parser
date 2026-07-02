// cloudfunctions/getHistory/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { skip = 0, limit = 20 } = event;

  try {
    const res = await db.collection('parse_history')
      .where({ _openid: OPENID })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(Math.min(limit, 50))
      .get();

    return {
      list: res.data,
      total: res.data.length,
      skip,
      limit
    };
  } catch (err) {
    console.error('获取历史失败:', err);
    return { list: [], total: 0, skip, limit };
  }
};
