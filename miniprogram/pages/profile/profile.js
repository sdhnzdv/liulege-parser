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
    this.setData({
      userInfo: userInfo || null,
      openid: openid || '',
      quota: quota || { used: 0, limit: 5, remaining: 5 }
    });
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

  // 获取微信头像和昵称
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ 'userInfo.avatarUrl': avatarUrl });
    app.globalData.userInfo = { ...app.globalData.userInfo, avatarUrl };
  },

  onInputNickname(e) {
    const nickName = e.detail.value;
    this.setData({ 'userInfo.nickName': nickName });
    app.globalData.userInfo = { ...app.globalData.userInfo, nickName };
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
              // 重新登录
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
