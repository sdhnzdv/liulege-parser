// app.js - 六了个六解析助手（自建后端版）
App({
  globalData: {
    userInfo: null,
    openid: '',
    token: '',
    quota: { used: 0, limit: 5, remaining: 5 },
    isDarkMode: false,
    systemInfo: null,
    apiBase: 'https://liulege-parser.vercel.app/api'
  },

  onLaunch() {
    this.initSystemInfo();
    this.checkLogin();
  },

  initSystemInfo() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.globalData.systemInfo = info;
    this.globalData.isDarkMode = info.theme === 'dark';
  },

  async checkLogin() {
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');
    if (token && openid) {
      this.globalData.token = token;
      this.globalData.openid = openid;
      this.fetchQuota();
      return;
    }
    await this.doLogin();
  },

  async doLogin() {
    try {
      const loginRes = await wxLogin();
      if (!loginRes.code) return;
      const res = await this.request('/login', 'POST', { code: loginRes.code });
      if (res && res.success && res.token) {
        this.globalData.token = res.token;
        this.globalData.openid = res.openid;
        wx.setStorageSync('token', res.token);
        wx.setStorageSync('openid', res.openid);
        if (res.quota) this.globalData.quota = res.quota;
      } else {
        console.log('登录返回:', res);
      }
    } catch (err) {
      console.error('登录失败:', err.message);
    }
  },

  async fetchQuota() {
    try {
      const res = await this.request('/quota');
      if (res && res.used !== undefined) this.globalData.quota = res;
    } catch (err) {
      console.error('配额失败:', err.message);
    }
  },

  async request(path, method = 'GET', data = {}) {
    const url = this.globalData.apiBase + path;
    const header = { 'Content-Type': 'application/json' };
    if (this.globalData.token) header['Authorization'] = 'Bearer ' + this.globalData.token;

    return new Promise((resolve, reject) => {
      wx.request({
        url, method, data, header,
        success(res) {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error('HTTP ' + res.statusCode));
          }
        },
        fail(err) {
          reject(err);
        }
      });
    });
  },

  onThemeChange({ theme }) {
    this.globalData.isDarkMode = theme === 'dark';
  }
});

function wxLogin() {
  return new Promise((resolve) => {
    wx.login({ success: resolve, fail: resolve });
  });
}
