var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    headers: [],
    showSourceSheet: false
  },

  onShow: function () {
    var headers = wx.getStorageSync('invoice_headers') || [];
    this.setData({ headers: headers });

    // 强制登录检查
    var sk = wx.getStorageSync('sk');
    if (!sk) {
      wx.reLaunch({ url: '/pages/toLogin/toLogin' });
      return;
    }
  },

  onAddInvoice: function () {
    this.setData({ showSourceSheet: true });
  },

  closeSourceSheet: function () {
    this.setData({ showSourceSheet: false });
  },

  onMyInvoices: function () {
    wx.navigateTo({ url: '/pages/myInvoices/index' });
  },

  goToMy: function () {
    wx.navigateTo({ url: '/pages/my/index' });
  },

  // 从微信聊天导入 PDF 发票
  onSourceChat: function () {
    var that = this;
    that.setData({ showSourceSheet: false });

    wx.chooseMessageFile({
      count: 10,
      type: 'file',
      extension: ['pdf'],
      success: function (res) {
        var files = res.tempFiles;
        if (!files || files.length === 0) {
          wx.showToast({ title: '未选择文件', icon: 'none' });
          return;
        }

        wx.showLoading({ title: '正在导入...' });

        var invoices = wx.getStorageSync('my_invoices') || [];
        var now = new Date();

        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          var invoice = {
            id: Date.now().toString() + '_' + i,
            source: 'wechat_chat',
            fileName: file.name,
            filePath: file.path,
            fileSize: file.size,
            industry: '待识别',
            company: file.name.replace(/\.pdf$/i, ''),
            amount: '待识别',
            date: util.formatTime(now),
            payer: '待识别',
            createTime: now.getTime(),
            status: 'pending'
          };
          invoices.unshift(invoice);
        }

        wx.setStorageSync('my_invoices', invoices);
        wx.hideLoading();

        wx.showToast({
          title: '成功导入 ' + files.length + ' 张发票',
          icon: 'success',
          duration: 1500
        });

        setTimeout(function () {
          wx.navigateTo({ url: '/pages/myInvoices/index' });
        }, 1500);
      },
      fail: function () {
        wx.showToast({ title: '未选择文件', icon: 'none' });
      }
    });
  },

  // 从手机本地导入（跳转到本地导入页面）
  onSourceLocal: function () {
    this.setData({ showSourceSheet: false });
    wx.navigateTo({ url: '/pages/addInvoice/index' });
  },

  onLinkEmail: function () {
    wx.showToast({ title: '邮箱关联功能开发中', icon: 'none' });
  },

  onOtherSource: function () {
    wx.showToast({ title: '其他渠道导入开发中', icon: 'none' });
  },

  onAddHeader: function () {
    wx.navigateTo({ url: '/pages/invoiceHeader/add' });
  },

  onEditHeader: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/invoiceHeader/add?id=' + id });
  },

  onFaq: function () {
    wx.showToast({ title: '常见问题开发中', icon: 'none' });
  },

  onShareAppMessage: function () {
    return {
      title: '微信发票助手',
      path: 'pages/home/index'
    };
  }
});
