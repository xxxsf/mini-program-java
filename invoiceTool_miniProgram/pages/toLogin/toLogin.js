var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    appInfo: {},
    login: false
  },
  onLoad: function (options) {
    var that = this;
    that.setData({
      appInfo: util.wxAppinfo
    });
  },
  getUserProfile: function (e) {
    var that = this;
    wx.login({
      success: function (res) {
        util.req('user/login', {
          "code": res.code
        }, function (data) {
          if (data && data.status == 1) {
            app.setUserInfo(data.user);
            app.setSk(data.sk);
            wx.reLaunch({
              url: '/pages/invoice/index',
            })
          } else {
            wx.showToast({
              title: (data && data.msg) || '登录失败',
              icon: 'none'
            })
          }
        })
      },
      fail: function (res) {
        console.log('wx.login fail', res)
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }
    })
  }
})
