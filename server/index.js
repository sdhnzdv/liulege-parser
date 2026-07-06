require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== 统一注册所有 Mongoose Model（解决 Serverless 冷启动加载顺序问题）==========
if (!mongoose.models.User) {
  mongoose.model('User', new mongoose.Schema({
    openid: { type: String, required: true, unique: true },
    dailyQuota: {
      date: { type: String, default: '' },
      used: { type: Number, default: 0 },
      limit: { type: Number, default: 5 },
      bonus: { type: Number, default: 0 }
    },
    totalParsed: { type: Number, default: 0 },
    createTime: { type: Date, default: Date.now }
  }));
}
if (!mongoose.models.History) {
  mongoose.model('History', new mongoose.Schema({
    openid: { type: String, required: true },
    title: String, author: String, description: String,
    cover: String, mediaUrl: String, type: String, platform: String,
    musicUrl: String, musicName: String, duration: String,
    authorAvatar: String, authorUid: String,
    createTime: { type: Date, default: Date.now }
  }));
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 路由
app.use('/api', require('./routes/login'));
app.use('/api', require('./routes/parse'));
app.use('/api', require('./routes/quota'));
app.use('/api', require('./routes/history'));

// 404
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;

// Vercel Serverless 不需要监听端口，本地开发时启动
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`六了个六解析助手 - 后端服务启动: http://localhost:${PORT}`);
  });
}

module.exports = app;
