var util = require('utils/util.js');

App({
  onLaunch: function () {
    var that = this;
    wx.checkSession({
      success: function () {
        wx.getStorage({
          key: 'sk',
          success: function (res) {
            var sk = res.data;
            util.req('user/vaild_sk', { sk: sk }, function (data) {
              if (data.status == 1) {
                that.globalData.sk = sk;
              } else {
                that.login();
              }
            });
          },
          fail: function () { that.login(); }
        });
        wx.getStorage({
          key: 'userInfo',
          success: function (res) { that.globalData.userInfo = res.data; },
          fail: function () { that.login(); }
        });
      },
      fail: function () { that.login(); }
    });
  },

  login: function () {
    wx.reLaunch({ url: '/pages/toLogin/toLogin' });
  },

  setUserInfo: function (data) {
    this.globalData.userInfo = data;
    wx.setStorage({ key: 'userInfo', data: data });
  },

  setSk: function (data) {
    this.globalData.sk = data;
    wx.setStorage({ key: 'sk', data: data });
  },

  globalData: {
    userInfo: null,
    sk: null
  }
});
