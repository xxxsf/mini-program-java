var app = getApp();

Page({
  data: { userInfo: {} },

  onShow: function () {
    this.setData({ userInfo: app.globalData.userInfo || {} });
  },

  goInfo: function () {
    wx.navigateTo({ url: '/pages/my/info' });
  },

  goMyInvoices: function () {
    wx.navigateTo({ url: '/pages/myInvoices/index' });
  },

  goHeaders: function () {
    wx.navigateTo({ url: '/pages/home/index' });
  },

  onLogout: function () {
    wx.removeStorageSync('sk');
    wx.removeStorageSync('userInfo');
    app.globalData.sk = null;
    app.globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/toLogin/toLogin' });
  }
});
