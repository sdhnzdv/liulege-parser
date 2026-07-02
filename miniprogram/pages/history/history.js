// pages/history/history.js - 历史记录页
const api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    list: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    skip: 0,
    limit: 20,
    platformMap: util.platformNames
  },

  onShow() {
    // 每次显示时刷新第一页
    this.setData({ list: [], skip: 0, hasMore: true });
    this.loadHistory();
  },

  // 加载历史记录
  async loadHistory() {
    const { skip, limit } = this.data;

    try {
      const res = await api.getHistory(skip, limit);
      const newList = (res.list || []).map(item => ({
        ...item,
        createTimeStr: util.formatTime(item.createTime)
      }));

      const list = skip === 0 ? newList : [...this.data.list, ...newList];

      this.setData({
        list,
        loading: false,
        loadingMore: false,
        hasMore: newList.length >= limit,
        skip: skip + newList.length
      });
    } catch (err) {
      console.error('加载历史失败:', err);
      this.setData({ loading: false, loadingMore: false });
    }
  },

  // 加载更多
  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ loadingMore: true });
    this.loadHistory();
  },

  // 点击历史记录
  onTapItem(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: '/pages/result/result?data=' + encodeURIComponent(JSON.stringify(item))
    });
  },

  // 去解析
  onGoParse() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
