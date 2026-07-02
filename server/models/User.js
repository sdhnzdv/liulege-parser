const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createTime: {
    type: Date,
    default: Date.now
  },
  updateTime: {
    type: Date,
    default: Date.now
  },
  dailyQuota: {
    date: { type: String, default: '' },
    used: { type: Number, default: 0 },
    limit: { type: Number, default: 5 },
    bonus: { type: Number, default: 0 }
  },
  totalParsed: {
    type: Number,
    default: 0
  }
});

// 更新时自动刷新 updateTime
userSchema.pre('save', function (next) {
  this.updateTime = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
