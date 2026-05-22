var app = getApp()
var util = require('../../../utils/util.js')

Page({
  data: {},

  onSelectFile: function () {
    var that = this
    wx.chooseMessageFile({
      count: 10,
      type: 'file',
      extension: ['pdf'],
      success: function (res) {
        var files = res.tempFiles
        var validFiles = []
        var oversizedFiles = []

        for (var i = 0; i < files.length; i++) {
          if (files[i].size > 102400) {
            oversizedFiles.push(files[i].name)
          } else {
            validFiles.push(files[i])
          }
        }

        if (oversizedFiles.length > 0) {
          wx.showToast({
            title: oversizedFiles.length + '个文件超过100K限制',
            icon: 'none'
          })
        }

        if (validFiles.length > 0) {
          that.processFiles(validFiles)
        }
      },
      fail: function () {
        wx.showToast({ title: '未选择文件', icon: 'none' })
      }
    })
  },

  processFiles: function (files) {
    wx.showLoading({ title: '正在处理...' })
    if (!app.globalData.sk) {
      wx.hideLoading()
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    this.uploadNext(files, 0, 0)
  },

  uploadNext: function (files, index, successCount) {
    var that = this
    if (index >= files.length) {
      app.loadInvoices()
      wx.hideLoading()
      wx.showToast({
        title: '成功导入' + successCount + '张发票',
        icon: successCount > 0 ? 'success' : 'none'
      })
      setTimeout(function () {
        wx.navigateTo({ url: '/pages/invoice/myInvoices/index' })
      }, 1500)
      return
    }
    util.uploadFile(files[index].path, 'file', { sk: app.globalData.sk }, function (data) {
      that.uploadNext(files, index + 1, data && data.status == 1 ? successCount + 1 : successCount)
    })
  }
})
