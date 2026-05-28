var app = getApp()
var util = require('../../../utils/util.js')

Page({
  data: {
    invoice: null,
    statusText: ''
  },

  onLoad: function (options) {
    if (options.id) {
      var invoices = app.globalData.invoices
      for (var i = 0; i < invoices.length; i++) {
        if (String(invoices[i].id) === String(options.id)) {
          var inv = invoices[i]
          var d = new Date(inv.date || inv.createTime)
          inv.dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'

          var statusMap = {
            'normal': '正常',
            'reimbursed': '已报销',
            'void': '已作废'
          }

          this.setData({
            invoice: inv,
            statusText: statusMap[inv.status] || '正常'
          })
          break
        }
      }
    }
  },

  onDelete: function () {
    var that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此发票吗？',
      success: function (res) {
        if (res.confirm) {
          app.deleteInvoice(that.data.invoice.id, function () {
            wx.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(function () {
              wx.navigateBack()
            }, 1500)
          })
        }
      }
    })
  },

  // 查看原件
  onViewOriginal: function () {
    var invoice = this.data.invoice
    if (!invoice || !invoice.filePath) {
      wx.showToast({ title: '无原件文件', icon: 'none' })
      return
    }

    var isImage = invoice.fileName && invoice.fileName.match(/\.(jpg|jpeg|png|gif)$/i)

    wx.showLoading({ title: '正在下载原件...' })
    util.downloadFile(invoice.filePath, function (tempPath) {
      wx.hideLoading()
      if (tempPath) {
        if (isImage) {
          wx.previewImage({
            urls: [tempPath],
            current: tempPath
          })
        } else {
          wx.openDocument({
            filePath: tempPath,
            fileType: 'pdf',
            fail: function () {
              wx.showToast({ title: '无法打开此文件', icon: 'none' })
            }
          })
        }
      } else {
        wx.showToast({ title: '下载失败', icon: 'none' })
      }
    })
  }
})
