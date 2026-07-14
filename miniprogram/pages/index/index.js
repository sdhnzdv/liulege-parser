// pages/index/index.js - 首页（解析页）- 自建后端版
const util = require('../../utils/util');
const api = require('../../utils/api');

Page({
  data: {
    inputUrl: '',
    platform: 'unknown',
    platformName: '',
    platformIcon: '',
    canParse: false,
    parsing: false,
    remainingQuota: 5,
    quotaLimit: 5,
    showAdHint: false,
    adUnitId: 'YOUR_AD_UNIT_ID' // 激励视频广告单元 ID
  },

  rewardedVideoAd: null,

  onLoad() {
    this.initAd();
    this.loadQuota();
  },

  onShow() {
    this.loadQuota();
  },

  initAd() {
    if (wx.createRewardedVideoAd) {
      this.rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: this.data.adUnitId
      });

      this.rewardedVideoAd.onError((err) => {
        console.error('广告加载失败:', err);
      });

      this.rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          util.showToast('获得 5 次额外解析次数', 'success');
          this.setData({ showAdHint: false });
          this.addBonusQuota();
        } else {
          util.showToast('需要看完视频才能获得次数哦');
        }
      });
    }
  },

  async loadQuota() {
    try {
      const quota = await api.getUserQuota();
      this.setData({
        remainingQuota: quota.remaining,
        quotaLimit: quota.limit,
        showAdHint: quota.remaining <= 0
      });
    } catch (err) {
      console.error('加载配额失败:', err);
    }
  },

  onInput(e) {
    const inputUrl = e.detail.value.trim();
    const platform = util.detectPlatform(inputUrl);
    this.setData({
      inputUrl,
      platform,
      platformName: util.platformNames[platform],
      platformIcon: util.platformIcons[platform],
      canParse: platform !== 'unknown' && inputUrl.length > 10
    });
  },

  onBlur(e) {
    const inputUrl = e.detail.value.trim();
    if (inputUrl) {
      const platform = util.detectPlatform(inputUrl);
      this.setData({
        platform,
        platformName: util.platformNames[platform],
        platformIcon: util.platformIcons[platform],
        canParse: platform !== 'unknown' && inputUrl.length > 10
      });
    }
  },

  onPaste() {
    wx.getClipboardData({
      success: (res) => {
        const inputUrl = res.data.trim();
        const platform = util.detectPlatform(inputUrl);
        this.setData({
          inputUrl,
          platform,
          platformName: util.platformNames[platform],
          platformIcon: util.platformIcons[platform],
          canParse: platform !== 'unknown' && inputUrl.length > 10
        });
      }
    });
  },

  onClear() {
    this.setData({
      inputUrl: '',
      platform: 'unknown',
      platformName: '',
      platformIcon: '',
      canParse: false
    });
  },

  async onParse() {
    if (this.data.parsing) return;
    if (!this.data.canParse) {
      util.showToast('请输入有效的分享链接');
      return;
    }

    try {
      const checkRes = await api.checkQuota();
      if (!checkRes.canParse) {
        this.showAdDialog();
        return;
      }
    } catch (err) {
      console.error('配额检查失败:', err);
      util.showToast('网络异常，请重试');
      return;
    }

    this.setData({ parsing: true });

    try {
      const result = await api.parseLink(this.data.inputUrl);

      if (result.success) {
        // 更新配额（后端已扣减）
        if (result.quota) {
          this.setData({
            remainingQuota: result.quota.remaining,
            showAdHint: result.quota.remaining <= 0
          });
        }

        wx.navigateTo({
          url: '/pages/result/result?data=' + encodeURIComponent(JSON.stringify(result.data))
        });

        this.setData({ inputUrl: '' });
      } else {
        util.showToast(result.message || '解析失败，请检查链接');
      }
    } catch (err) {
      console.error('解析失败:', err);
      util.showToast('解析失败，请稍后重试');
    } finally {
      this.setData({ parsing: false });
      this.loadQuota();
    }
  },

  showAdDialog() {
    wx.showModal({
      title: '今日次数已用完',
      content: '观看激励视频可获得 5 次额外解析机会',
      confirmText: '观看视频',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          this.showRewardedVideo();
        }
      }
    });
  },

  showRewardedVideo() {
    if (this.rewardedVideoAd) {
      this.rewardedVideoAd.show().catch(() => {
        this.rewardedVideoAd.load().then(() => this.rewardedVideoAd.show());
      });
    } else {
      util.showToast('广告加载中，请稍后');
    }
  },

  async addBonusQuota() {
    try {
      const res = await api.addBonusQuota(5);
      if (res.success) {
        this.loadQuota();
      }
    } catch (err) {
      console.error('增加配额失败:', err);
    }
  }
});
