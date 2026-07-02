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

  // 预览媒体（图片）
  onPreviewMedia() {
    const { result } = this.data;
    if (!result || !result.cover) return;

    wx.previewImage({
      urls: [result.cover],
      current: result.cover
    });
  },

  // 预览视频
  onPreviewVideo() {
    const { result } = this.data;
    if (!result || !result.mediaUrl) {
      util.showToast('视频链接不可用');
      return;
    }

    // 跳转到视频播放（使用web-view或直接下载）
    wx.showModal({
      title: '提示',
      content: '视频将在下载后播放，是否下载？',
      confirmText: '下载',
      success: (res) => {
        if (res.confirm) {
          this.onDownloadVideo();
        }
      }
    });
  },

  // 复制链接
  onCopyLink() {
    const { result } = this.data;
    if (!result || !result.mediaUrl) {
      util.showToast('暂无下载链接');
      return;
    }

    util.copyText(result.mediaUrl).then(() => {
      util.showToast('链接已复制', 'success');
    });
  },

  // 下载视频
  async onDownloadVideo() {
    const { result } = this.data;
    if (!result || !result.mediaUrl) {
      util.showToast('视频链接不可用');
      return;
    }

    // 检查保存权限
    const authSetting = await this.checkAlbumAuth();
    if (!authSetting) return;

    try {
      const tempPath = await util.downloadFile(result.mediaUrl);
      await util.saveVideoToAlbum(tempPath);
      util.showToast('保存成功', 'success');
    } catch (err) {
      console.error('下载视频失败:', err);
      if (err.errMsg && err.errMsg.includes('auth deny')) {
        this.showAuthModal();
      } else {
        util.showToast('下载失败，请重试');
      }
    }
  },

  // 下载封面
  async onDownloadCover() {
    const { result } = this.data;
    const url = result.cover || result.mediaUrl;
    if (!url) {
      util.showToast('图片链接不可用');
      return;
    }

    const authSetting = await this.checkAlbumAuth();
    if (!authSetting) return;

    try {
      const tempPath = await util.downloadFile(url);
      await util.saveToAlbum(tempPath);
      util.showToast('保存成功', 'success');
    } catch (err) {
      console.error('下载封面失败:', err);
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
      content: '请允许访问相册以保存图片/视频',
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
