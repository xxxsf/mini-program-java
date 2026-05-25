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

        var sk = wx.getStorageSync('sk');
        if (!sk) {
          wx.showToast({ title: '请先登录', icon: 'none' });
          return;
        }

        wx.showLoading({ title: '正在导入...' });
        that.uploadFilesToServer(files, 0, 0);
      },
      fail: function () {
        wx.showToast({ title: '未选择文件', icon: 'none' });
      }
    });
  },

  // 递归上传文件到云端后端
  uploadFilesToServer: function (files, index, successCount) {
    var that = this;
    if (index >= files.length) {
      wx.hideLoading();
      
      if (successCount > 0) {
        wx.showToast({
          title: '成功导入 ' + successCount + ' 张发票',
          icon: 'success',
          duration: 2000
        });
        setTimeout(function () {
          wx.navigateTo({ url: '/pages/myInvoices/index' });
        }, 1500);
      } else {
        wx.showModal({
          title: '导入失败',
          content: '发票上传至服务器失败，请检查网络或登录状态后重试。',
          showCancel: false
        });
      }
      return;
    }

    var file = files[index];
    var sk = wx.getStorageSync('sk');

    util.uploadFile(file.path, 'file', { sk: sk }, function (data) {
      if (data && data.status == 1) {
        // 后端真正保存成功，才写入本地缓存，确保展示
        var invoices = wx.getStorageSync('my_invoices') || [];
        var now = new Date();
        var localInvoice = {
          id: (data.data && data.data.id) || (Date.now().toString() + '_' + index),
          source: 'wechat_chat',
          fileName: file.name,
          filePath: file.path,
          fileSize: file.size,
          industry: (data.data && data.data.category) || '待识别',
          company: (data.data && data.data.sellerName) || file.name.replace(/\.pdf$/i, ''),
          amount: (data.data && data.data.amount) || '待识别',
          date: util.formatTime(now),
          payer: (data.data && data.data.buyerName) || '待识别',
          createTime: now.getTime(),
          status: 'success'
        };
        invoices.unshift(localInvoice);
        wx.setStorageSync('my_invoices', invoices);

        // 递归上传下一个（成功数 + 1）
        that.uploadFilesToServer(files, index + 1, successCount + 1);
      } else {
        // 上传失败：提示具体原因，并停止后续上传
        wx.hideLoading();
        var errorMsg = (data && data.msg) || '上传网络异常';
        wx.showModal({
          title: '上传失败',
          content: '第 ' + (index + 1) + ' 张发票导入失败原因: ' + errorMsg,
          showCancel: false,
          success: function() {
            // 发生错误，终止递归上传
          }
        });
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
