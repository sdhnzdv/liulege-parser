const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    index: true
  },
  title: { type: String, default: '' },
  author: { type: String, default: '' },
  description: { type: String, default: '' },
  cover: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  type: { type: String, default: 'video' },
  platform: { type: String, default: '' },
  createTime: {
    type: Date,
    default: Date.now
  }
});

// 按 openid + 时间倒序的复合索引
historySchema.index({ openid: 1, createTime: -1 });

module.exports = mongoose.model('History', historySchema);
