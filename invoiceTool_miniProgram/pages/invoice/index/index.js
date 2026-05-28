var app = getApp()

Page({
  data: {
    invoiceHeaders: [],
    showSourceModal: false,
    userInfo: null,
    isLoggedIn: false
  },

  onShow: function () {
    var isLoggedIn = app.globalData.isLoggedIn
    this.setData({
      invoiceHeaders: app.globalData.invoiceHeaders,
      userInfo: app.globalData.userInfo,
      isLoggedIn: isLoggedIn
    })

    if (!isLoggedIn) {
      wx.reLaunch({ url: '/pages/invoice/login/index' })
    }
  },

  onAddInvoice: function () {
    this.setData({ showSourceModal: true })
  },

  onMyInvoices: function () {
    wx.navigateTo({ url: '/pages/invoice/myInvoices/index' })
  },

  onCloseSourceModal: function () {
    this.setData({ showSourceModal: false })
  },

  onSourceChat: function () {
    this.setData({ showSourceModal: false })
    wx.showToast({ title: '请在微信聊天中选择发票文件转发', icon: 'none' })
  },

  onSourceFile: function () {
    this.setData({ showSourceModal: false })
    wx.navigateTo({ url: '/pages/invoice/upload/index' })
  },

  onLinkEmail: function () {
    wx.showToast({ title: '关联QQ邮箱功能开发中', icon: 'none' })
  },

  onOtherChannel: function () {
    wx.showToast({ title: '其他渠道导入功能开发中', icon: 'none' })
  },

  onPromo: function () {
    wx.showToast({ title: '活动详情页开发中', icon: 'none' })
  },

  onAddHeader: function () {
    wx.navigateTo({ url: '/pages/invoice/headerAdd/index' })
  },

  onHeaderTap: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/invoice/headerDetail/index?id=' + id })
  },

  onFaq: function () {
    wx.showToast({ title: '常见问题页面开发中', icon: 'none' })
  },

  onLogout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) {
          app.logout()
        }
      }
    })
  }
})
