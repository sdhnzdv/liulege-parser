/**
 * api.js - 后端 API 调用封装（自建后端版）
 */
const app = getApp();
const util = require('./util');

const api = {
  /**
   * 通用请求
   */
  request(path, method = 'GET', data = {}) {
    return app.request(path, method, data);
  },

  /**
   * 用户登录
   */
  async login() {
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({ success: resolve, fail: reject });
    });

    if (!loginRes.code) {
      throw new Error('wx.login 失败');
    }

    const res = await this.request('/login', 'POST', { code: loginRes.code });
    return res;
  },

  /**
   * 解析链接
   */
  async parseLink(url) {
    util.showLoading('解析中...');
    try {
      const res = await this.request('/parse', 'POST', { url });
      util.hideLoading();
      return res;
    } catch (err) {
      util.hideLoading();
      throw err;
    }
  },

  /**
   * 获取配额
   */
  async getUserQuota() {
    const res = await this.request('/quota');
    return res;
  },

  /**
   * 检查配额
   */
  async checkQuota() {
    const res = await this.request('/quota');
    return {
      canParse: res.remaining > 0,
      ...res
    };
  },

  /**
   * 增加奖励配额（看广告后）
   */
  async addBonusQuota(bonus = 5) {
    const res = await this.request('/quota/bonus', 'POST', { bonus });
    return res;
  },

  /**
   * 获取历史记录
   */
  async getHistory(skip = 0, limit = 20) {
    const res = await this.request(`/history?skip=${skip}&limit=${limit}`);
    return res;
  }
};

module.exports = api;
