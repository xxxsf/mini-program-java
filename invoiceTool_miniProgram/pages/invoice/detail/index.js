var app = getApp()
var util = require('../../../utils/util.js')

Page({
  data: {
    invoice: null,
    statusText: '',
    showActions: true, // 是否显示操作按钮
    plainText: '' // 纯文本格式
  },

  onLoad: function (options) {
    // 检测是否从分享场景打开
    var scene = options.scene || '';
    var fromShare = options.from === 'share' || scene === '1044' || scene === '1007' || scene === '1008';
    
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

          // 生成纯文本
          var plainText = this.formatInvoicePlainText(inv);

          this.setData({
            invoice: inv,
            statusText: statusMap[inv.status] || '正常',
            showActions: !fromShare,
            plainText: plainText
          })
          break
        }
      }
    }
  },

  // 生成发票纯文本
  formatInvoicePlainText: function (inv) {
    var text = '发票详情\n';
    text += '========================\n';
    text += '金额：¥' + (inv.amount || '0.00') + '\n';
    text += '发票号码：' + (inv.invoiceNo || '') + '\n';
    text += '开票日期：' + (inv.dateStr || '') + '\n';
    text += '销售方：' + (inv.sellerName || '') + '\n';
    text += '购买方：' + (inv.buyerName || '') + '\n';
    if (inv.category) {
      text += '发票类型：' + inv.category + '\n';
    }
    return text;
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

  // 分享给好友
  onShareAppMessage: function () {
    var invoice = this.data.invoice;
    var title = invoice ? ('发票：¥' + invoice.amount + ' - ' + invoice.sellerName) : '发票详情';
    return {
      title: title,
      path: '/pages/invoice/detail/index?id=' + (invoice ? invoice.id : '')
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    var invoice = this.data.invoice;
    return {
      title: invoice ? ('发票：¥' + invoice.amount) : '发票详情',
      query: 'id=' + (invoice ? invoice.id : '')
    };
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
