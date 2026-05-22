var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    userInfo: {},
    sex: ['保密', '男', '女']
  },

  onLoad: function () {
    var that = this;
    wx.getStorage({
      key: 'userInfo',
      success: function (res) {
        that.setData({ userInfo: res.data });
      },
      fail: function () { app.login(); }
    });
  },

  selectsex: function (e) {
    this.setData({ 'userInfo.gender': e.detail.value });
  },

  dateAvatar: function () {
    var that = this;
    wx.chooseImage({
      count: 1,
      success: function (res) {
        wx.uploadFile({
          url: util.baseURL + 'api/upload',
          filePath: res.tempFilePaths[0],
          name: 'file',
          formData: { user: app.globalData.userInfo.id },
          success: function (res) {
            var data = JSON.parse(res.data);
            if (data.status == 1) {
              that.setData({ 'userInfo.avatarUrl': data.data });
            } else {
              wx.showToast({ title: data.msg || '上传失败', icon: 'none' });
            }
          },
          fail: function () {
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },

  formSubmit: function (e) {
    var that = this;
    var val = e.detail.value;
    if (val.phone && !(/^1[3-9]\d{9}$/.test(val.phone))) {
      wx.showToast({ title: '手机号码错误', icon: 'none' });
      return;
    }
    this.setData({
      'userInfo.nickName': val.nickName,
      'userInfo.phone': val.phone
    });
    wx.request({
      url: util.baseURL + 'api/user/editUser',
      data: { userInfo: that.data.userInfo, sk: app.globalData.sk },
      method: 'POST',
      header: { 'Content-type': 'application/json' },
      success: function (res) {
        if (res.data.status == '1') {
          app.setUserInfo(res.data.user);
          wx.navigateBack({ delta: 1 });
        } else {
          wx.showToast({ title: res.data.msg || '修改失败', icon: 'none' });
        }
      },
      fail: function () {
        wx.showToast({ title: '修改失败', icon: 'none' });
      }
    });
  }
});
