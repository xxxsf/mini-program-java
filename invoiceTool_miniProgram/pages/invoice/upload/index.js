var app = getApp()

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

    var categories = ['酒店行业', '餐饮行业', '交通出行', '其他']

    for (var i = 0; i < files.length; i++) {
      var fileName = files[i].name || '未知文件'
      var sellerName = fileName.replace('.pdf', '').replace('.PDF', '')

      var invoice = {
        sellerName: sellerName,
        buyerName: '个人',
        amount: (Math.random() * 1000 + 50).toFixed(2),
        date: Date.now(),
        category: categories[Math.floor(Math.random() * categories.length)],
        status: 'normal',
        invoiceNo: 'FP' + Date.now() + i,
        fileName: fileName,
        fileSize: files[i].size,
        filePath: files[i].path
      }

      app.addInvoice(invoice)
    }

    wx.hideLoading()
    wx.showToast({
      title: '成功导入' + files.length + '张发票',
      icon: 'success'
    })

    setTimeout(function () {
      wx.navigateTo({ url: '/pages/invoice/myInvoices/index' })
    }, 1500)
  }
})
