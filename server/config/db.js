const mongoose = require('mongoose');

// Serverless 环境下缓存 MongoDB 连接，避免重复创建连接
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((conn) => {
      console.log(`MongoDB 已连接: ${conn.connection.host}`);
      return conn;
    }).catch((err) => {
      console.error('MongoDB 连接失败:', err.message);
      cached.promise = null;
      // Serverless 环境下不能 process.exit，返回 null 让请求继续返回错误信息
      return null;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
