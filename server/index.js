const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== MongoDB 连接（Serverless 缓存模式）==========
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false })
      .then((m) => { console.log('MongoDB 已连接'); return m; })
      .catch((err) => { console.error('MongoDB 连接失败:', err.message); cached.promise = null; return null; });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ========== 统一注册所有 Mongoose Model ==========
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

// ========== 中间件：自动连接数据库 ==========
app.use(async (req, res, next) => {
  // 健康检查不需要数据库
  if (req.path === '/api/health') return next();
  // 其他接口先确保数据库连接
  await connectDB();
  next();
});

// ========== 路由 ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

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
  console.error('服务器错误:', err.message);
  res.status(500).json({ message: '服务器内部错误' });
});

// 本地开发时监听端口
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`六了个六解析助手 - 后端服务启动: http://localhost:${PORT}`);
  });
}

module.exports = app;
