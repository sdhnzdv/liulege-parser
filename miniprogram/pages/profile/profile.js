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
    // 优先从 app.globalData 取，没有则从本地缓存取
    let { userInfo, openid } = app.globalData;
    if (!openid) openid = wx.getStorageSync('openid') || '';
    if (!userInfo) userInfo = wx.getStorageSync('userInfo') || null;

    this.setData({
      userInfo: userInfo || null,
      openid: openid || '',
      quota: app.globalData.quota || { used: 0, limit: 5, remaining: 5 }
    });
  },

  // 加载配额
  async loadQuota() {
    try {
      const quota = await api.getUserQuota();
      this.setData({ quota });
      app.globalData.quota = quota;
    } catch (err) {
      console.error('加载配额失败:', err);
    }
  },

  // 加载累计解析次数
  async loadTotalParsed() {
    try {
      const res = await api.getUserQuota();
      if (res && res.totalParsed !== undefined) {
        this.setData({ totalParsed: res.totalParsed });
      }
    } catch (err) {
      console.error('加载累计解析失败:', err);
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = { ...(this.data.userInfo || {}), avatarUrl };
    this.setData({ userInfo });
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  // 输入昵称
  onInputNickname(e) {
    const nickName = e.detail.value;
    const userInfo = { ...(this.data.userInfo || {}), nickName };
    this.setData({ userInfo });
    app.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  // 跳转历史
  onGoHistory() {
    wx.switchTab({ url: '/pages/history/history' });
  },

  // 清除缓存
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？这将清除登录状态。',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({ title: '已清除', icon: 'success' });
              setTimeout(() => {
                app.doLogin();
              }, 500);
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
