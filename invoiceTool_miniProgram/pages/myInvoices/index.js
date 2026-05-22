var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    keyword: '',
    invoices: [],
    filteredList: []
  },

  onShow: function () {
    var invoices = wx.getStorageSync('my_invoices') || [];
    if (!invoices.length) {
      invoices = this.getDemoData();
    }
    this.setData({ invoices: invoices, filteredList: invoices });
  },

  getDemoData: function () {
    return [
      {
        id: '1',
        industry: '酒店行业',
        company: '湖州美高美雅轩酒店有限公司',
        amount: '189.00',
        date: '2026年5月20日',
        payer: '杭州进化树科技有限公司'
      },
      {
        id: '2',
        industry: '酒店行业',
        company: '湖州美高美雅轩酒店有限公司',
        amount: '461.31',
        date: '2026年5月20日',
        payer: '杭州进化树科技有限公司'
      }
    ];
  },

  onSearchInput: function (e) {
    var keyword = e.detail.value.trim();
    this.setData({ keyword: keyword });
    this.filterList(keyword);
  },

  filterList: function (keyword) {
    if (!keyword) {
      this.setData({ filteredList: this.data.invoices });
      return;
    }
    var list = this.data.invoices.filter(function (item) {
      return item.company.indexOf(keyword) >= 0 || item.payer.indexOf(keyword) >= 0;
    });
    this.setData({ filteredList: list });
  },

  onFilterTime: function () {
    wx.showToast({ title: '时间筛选开发中', icon: 'none' });
  },
  onFilterStatus: function () {
    wx.showToast({ title: '状态筛选开发中', icon: 'none' });
  },
  onFilterType: function () {
    wx.showToast({ title: '类型筛选开发中', icon: 'none' });
  },
  onBatchSelect: function () {
    wx.showToast({ title: '批量选择开发中', icon: 'none' });
  },

  onAddInvoice: function () {
    wx.navigateTo({ url: '/pages/addInvoice/index' });
  },

  onLinkEmail: function () {
    wx.showToast({ title: '邮箱关联功能开发中', icon: 'none' });
  },

  onInvoiceDetail: function (e) {
    wx.showToast({ title: '发票详情开发中', icon: 'none' });
  }
});
