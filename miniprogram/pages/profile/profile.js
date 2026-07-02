// pages/profile/profile.js - 个人中心页
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    openid: '',
    quota: { used: 0, limit: 5, remaining: 5 },
    totalParsed: 0
  },

  onShow() {
    this.loadUserData();
    this.loadQuota();
    this.loadTotalParsed();
  },

  // 加载用户数据
  loadUserData() {
    const { userInfo, openid, quota } = app.globalData;
    this.setData({ userInfo, openid, quota });
  },

  // 加载配额
  async loadQuota() {
    try {
      const quota = await api.getUserQuota();
      this.setData({ quota });
    } catch (err) {
      console.error('加载配额失败:', err);
    }
  },

  // 加载累计解析次数（后端暂无此接口，用配额信息估算）
  async loadTotalParsed() {
    try {
      const quota = await api.getUserQuota();
      if (quota) {
        // 用已使用次数作为累计参考
        this.setData({ totalParsed: quota.used || 0 });
      }
    } catch (err) {
      console.error('加载累计解析失败:', err);
    }
  },

  // 获取用户信息
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({ userInfo: e.detail.userInfo });
      app.globalData.userInfo = e.detail.userInfo;
    }
  },

  // 跳转历史
  onGoHistory() {
    wx.switchTab({ url: '/pages/history/history' });
  },

  // 清除缓存
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({ title: '已清除', icon: 'success' });
            }
          });
        }
      }
    });
  },

  // 意见反馈
  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '请发送邮件至 feedback@liulege.com',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 关于
  onAbout() {
    wx.showModal({
      title: '关于',
      content: '六了个六解析助手\n支持抖音/快手/小红书\n无水印视频和图片解析\n\n版本: 1.0.0',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
