// pages/result/result.js - 解析结果页
const util = require('../../utils/util');

Page({
  data: {
    result: null,
    platformName: '',
    loading: true
  },

  onLoad(options) {
    if (options.data) {
      try {
        const result = JSON.parse(decodeURIComponent(options.data));
        const platformName = util.platformNames[result.platform] || '';
        this.setData({
          result,
          platformName,
          loading: false
        });
      } catch (err) {
        console.error('解析数据失败:', err);
        this.setData({ loading: false });
        util.showToast('数据加载失败');
      }
    } else {
      this.setData({ loading: false });
    }
  },

  // 复制文本
  onCopyText(e) {
    const text = e.currentTarget.dataset.text;
    if (!text) return;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success', duration: 1500 });
      }
    });
  },

  // 预览封面大图
  onPreviewMedia() {
    const { result } = this.data;
    if (!result || !result.cover) return;
    wx.previewImage({
      urls: [result.cover],
      current: result.cover
    });
  },

  // 下载视频
  async onDownloadVideo() {
    const { result } = this.data;
    if (!result || !result.mediaUrl) {
      util.showToast('视频链接不可用');
      return;
    }

    const authSetting = await this.checkAlbumAuth();
    if (!authSetting) return;

    util.showLoading('下载中...');
    try {
      const tempPath = await util.downloadFile(result.mediaUrl);
      await util.saveVideoToAlbum(tempPath);
      util.hideLoading();
      util.showToast('保存成功', 'success');
    } catch (err) {
      util.hideLoading();
      console.error('下载视频失败:', err);
      if (err.errMsg && err.errMsg.includes('auth deny')) {
        this.showAuthModal();
      } else {
        util.showToast('下载失败，请重试');
      }
    }
  },

  // 检查相册权限
  async checkAlbumAuth() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.writePhotosAlbum']) {
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success: () => resolve(true),
              fail: () => {
                this.showAuthModal();
                resolve(false);
              }
            });
          } else {
            resolve(true);
          }
        }
      });
    });
  },

  // 显示权限弹窗
  showAuthModal() {
    wx.showModal({
      title: '需要相册权限',
      content: '请允许访问相册以保存视频',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting();
        }
      }
    });
  },

  // 返回首页
  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
