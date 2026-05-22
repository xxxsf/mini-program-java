var app = getApp()
var util = require('../../../utils/util.js')

var defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI9FhqR54SAoQBe2yrEMKmRPiaTd3g9QRIbCqOa30MBMbApRQConnQhItfN7NZLIM7m3d3OA/0'

Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    nickname: '',
    agreed: false
  },

  onChooseAvatar: function (e) {
    this.setData({ avatarUrl: e.detail.avatarUrl })
  },

  onNicknameChange: function (e) {
    this.setData({ nickname: e.detail.value })
  },

  onToggleAgreement: function () {
    this.setData({ agreed: !this.data.agreed })
  },

  onLogin: function () {
    var that = this

    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
      return
    }

    if (!this.data.nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    wx.showLoading({ title: '登录中...' })

    wx.login({
      success: function (loginRes) {
        if (loginRes.code) {
          util.req('user/login', { code: loginRes.code }, function (data) {
            wx.hideLoading()
            if (data && data.status == 1) {
              var userInfo = data.user || {}
              userInfo.nickName = that.data.nickname.trim()
              userInfo.avatarUrl = that.data.avatarUrl
              app.onLoginSuccess(userInfo, data.sk)
              wx.showToast({ title: '登录成功', icon: 'success' })
              setTimeout(function () {
                wx.reLaunch({ url: '/pages/invoice/index/index' })
              }, 1500)
            } else {
              wx.showToast({ title: (data && data.msg) || '登录失败', icon: 'none' })
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败，请重试', icon: 'none' })
        }
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({ title: '微信登录失败，请重试', icon: 'none' })
      }
    })
  },

  onViewAgreement: function () {
    wx.showModal({
      title: '用户协议',
      content: '本协议是您与微信发票助手之间关于使用本小程序服务的协议。使用本服务即表示您同意遵守本协议的所有条款。我们将依法保护您的个人信息安全。',
      showCancel: false
    })
  },

  onViewPrivacy: function () {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护。本小程序收集的信息仅用于提供发票管理服务，包括您的微信昵称、头像以及您主动导入的发票信息。我们不会将您的信息分享给第三方。',
      showCancel: false
    })
  }
})
