Component({
  properties: {
    title: {
      type: String,
      value: '六了个六解析助手'
    },
    showBack: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: (menuButton.top - systemInfo.statusBarHeight) * 2 + menuButton.height
      });
    }
  },

  methods: {
    onBack() {
      wx.navigateBack({ delta: 1 });
    }
  }
});
