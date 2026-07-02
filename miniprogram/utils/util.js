/**
 * util.js - 通用工具函数
 */

/**
 * 判断链接平台类型
 * @param {string} url
 * @returns {string} 'douyin' | 'kuaishou' | 'xiaohongshu' | 'unknown'
 */
function detectPlatform(url) {
  if (!url) return 'unknown';
  if (/douyin\.com|iesdouyin\.com|dy\.com/i.test(url)) return 'douyin';
  if (/kuaishou\.com|chenzhongtech\.com|kuaishouapp\.com/i.test(url)) return 'kuaishou';
  if (/xiaohongshu\.com|xhslink\.com|redbook\.com/i.test(url)) return 'xiaohongshu';
  return 'unknown';
}

/**
 * 平台中文名称映射
 */
const platformNames = {
  douyin: '抖音',
  kuaishou: '快手',
  xiaohongshu: '小红书',
  unknown: '未知平台'
};

/**
 * 平台图标映射
 */
const platformIcons = {
  douyin: '🎵',
  kuaishou: '📹',
  xiaohongshu: '📕',
  unknown: '🔗'
};

/**
 * 验证链接是否为支持的分享链接
 * @param {string} url
 * @returns {boolean}
 */
function isValidShareLink(url) {
  if (!url) return false;
  const platform = detectPlatform(url);
  return platform !== 'unknown';
}

/**
 * 复制文本到剪贴板
 * @param {string} text
 * @returns {Promise<void>}
 */
function copyText(text) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 格式化时间
 * @param {Date|string|number} date
 * @returns {string}
 */
function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day2 = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day2}`;
}

/**
 * 显示 Toast
 * @param {string} title
 * @param {string} icon
 */
function showToast(title, icon = 'none') {
  wx.showToast({ title, icon, duration: 2000 });
}

/**
 * 显示加载
 * @param {string} title
 */
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true });
}

/**
 * 隐藏加载
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 下载并保存文件
 * @param {string} url
 * @returns {Promise<string>} 临时文件路径
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    showLoading('下载中...');
    wx.downloadFile({
      url,
      success(res) {
        hideLoading();
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
        } else {
          reject(new Error(`下载失败: ${res.statusCode}`));
        }
      },
      fail(err) {
        hideLoading();
        reject(err);
      }
    });
  });
}

/**
 * 保存到相册
 * @param {string} filePath 临时文件路径
 * @returns {Promise<void>}
 */
function saveToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 保存视频到相册
 * @param {string} filePath
 * @returns {Promise<void>}
 */
function saveVideoToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveVideoToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  detectPlatform,
  platformNames,
  platformIcons,
  isValidShareLink,
  copyText,
  formatTime,
  showToast,
  showLoading,
  hideLoading,
  downloadFile,
  saveToAlbum,
  saveVideoToAlbum,
  getTodayStr
};
