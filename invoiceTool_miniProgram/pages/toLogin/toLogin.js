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
    // 先获取用户信息（弹窗授权）
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: function (userRes) {
        console.log('用户信息：', userRes.userInfo);
        // 再调用登录获取 code
        wx.login({
          success: function (res) {
            if (res.code) {
              util.req('user/login', {
                "code": res.code,
                "encryptedData": userRes.encryptedData,
                "iv": userRes.iv
              }, function (data) {
                if (data && data.status == 1) {
                  app.setUserInfo(data.user);
                  app.setSk(data.sk);
                  wx.reLaunch({
                    url: '/pages/home/index',
                  });
                } else {
                  wx.showToast({
                    title: (data && data.msg) || '登录失败',
                    icon: 'none'
                  });
                }
              });
            }
          },
          fail: function (res) {
            console.log('wx.login fail', res);
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: function (err) {
        console.log('用户拒绝授权', err);
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        });
      }
    });
  }
})
