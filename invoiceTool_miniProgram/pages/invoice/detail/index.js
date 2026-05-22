var app = getApp()

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
  }
})
