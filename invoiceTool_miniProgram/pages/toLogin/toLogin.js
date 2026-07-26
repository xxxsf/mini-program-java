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
  onLogin: function (e) {
    // wx.getUserProfile 已被微信回收，改为静默登录：仅用 wx.login 取 code 交给后端
    wx.login({
      success: function (res) {
        console.log('wx.login 成功，code:', res.code);
        if (!res.code) {
          wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          return;
        }
        console.log('开始发送登录请求到后端...');
        util.req('user/login', { "code": res.code }, function (data) {
          console.log('后端返回登录结果:', data);
          if (data && data.status == 1) {
            app.setUserInfo(data.user);
            app.setSk(data.sk);
            wx.reLaunch({ url: '/pages/home/index' });
          } else {
            wx.showToast({
              title: (data && data.msg) || '登录失败',
              icon: 'none'
            });
          }
        });
      },
      fail: function (res) {
        console.log('wx.login fail', res);
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    });
  },

  onLogout: function () {
    wx.removeStorageSync('sk');
    wx.removeStorageSync('userInfo');
    wx.showToast({ title: '已退出', icon: 'none' });
  }
})
