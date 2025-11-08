// pages/boat/index.js

Page({
  data: {
    mapHeight: 520,
    latitude: 30.0,
    longitude: 120.0,
    markers: [],
    city: '定位中',
    startText: '正在定位…',
    activeTab: 0,
    isDevtools: false
  },

  onLoad() {
    // 设置地图高度为设备窗口高度，避免底部空白
    const sys = wx.getSystemInfoSync();
    this.setData({ mapHeight: sys.windowHeight, isDevtools: sys.platform === 'devtools' });
    if (sys.platform === 'devtools') {
      wx.showToast({ title: '当前为开发者工具，可能是模拟定位', icon: 'none' });
    }
    // 定位并反向地理编码
    this.initLocation();
  },

  initLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 3000,
      success: (res) => {
        const { latitude, longitude } = res;
        this.setData({ latitude, longitude });

        // 放置当前位置标记
        this.setData({
          markers: [{
            id: 1,
            latitude,
            longitude,
            width: 24,
            height: 24,
            iconPath: '/img/people.png',
            callout: {
              content: '当前位置',
              color: '#333',
              fontSize: 12,
              borderRadius: 6,
              bgColor: '#ffffff',
              padding: 6,
              display: 'ALWAYS'
            }
          }]
        });
        // 不使用外部地图SDK，仅展示当前位置
        this.setData({ city: '已定位', startText: '当前位置' });
      },
      fail: () => {
        this.setData({ startText: '定位失败，请检查权限' });
      }
    });
  },

  reLocate() {
    this.initLocation();
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const { latitude, longitude, name, address } = res;
        this.setData({ latitude, longitude, startText: name || address || '所选位置' });
        this.setData({
          markers: [{
            id: 1,
            latitude,
            longitude,
            width: 24,
            height: 24,
            iconPath: '/img/people.png',
            callout: {
              content: '所选位置',
              color: '#333',
              fontSize: 12,
              borderRadius: 6,
              bgColor: '#ffffff',
              padding: 6,
              display: 'ALWAYS'
            }
          }]
        });
      }
    });
  },

  switchTab(e) {
    const idx = e.currentTarget.dataset.idx * 1;
    this.setData({ activeTab: idx });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/boat/search/index' });
  },

  goReserve() {
    wx.showToast({ title: '预约拼单开发中', icon: 'none' });
  },
  goHelp() {
    wx.showToast({ title: '帮人叫船开发中', icon: 'none' });
  },
  goBus() {
    wx.showToast({ title: '站点巴士开发中', icon: 'none' });
  },
  goDrive() {
    wx.showToast({ title: '手机驾驭开发中', icon: 'none' });
  }
  ,
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  }
});