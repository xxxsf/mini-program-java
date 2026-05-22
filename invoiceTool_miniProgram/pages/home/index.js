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

  onSourceChat: function () {
    this.setData({ showSourceSheet: false });
    wx.showToast({ title: '请从聊天中转发文件', icon: 'none' });
  },

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
