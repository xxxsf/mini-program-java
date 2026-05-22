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
        source: 'demo',
        industry: '酒店行业',
        company: '湖州美高美雅轩酒店有限公司',
        amount: '189.00',
        date: '2026年5月20日',
        payer: '杭州进化树科技有限公司'
      },
      {
        id: '2',
        source: 'demo',
        industry: '酒店行业',
        company: '湖州美高美雅轩酒店有限公司',
        amount: '461.31',
        date: '2026年5月20日',
        payer: '杭州进化树科技有限公司'
      }
    ];
  },

  getSourceLabel: function (source) {
    var map = {
      'wechat_chat': '微信聊天',
      'local_album': '相册导入',
      'local_camera': '拍照导入',
      'local_file': '本地文件',
      'demo': '示例数据'
    };
    return map[source] || '其他';
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
      return (item.company && item.company.indexOf(keyword) >= 0) ||
        (item.payer && item.payer.indexOf(keyword) >= 0) ||
        (item.fileName && item.fileName.indexOf(keyword) >= 0);
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
    wx.navigateTo({ url: '/pages/home/index' });
  },

  onLinkEmail: function () {
    wx.showToast({ title: '邮箱关联功能开发中', icon: 'none' });
  },

  onInvoiceDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    var invoice = null;
    for (var i = 0; i < this.data.invoices.length; i++) {
      if (this.data.invoices[i].id === id) {
        invoice = this.data.invoices[i];
        break;
      }
    }
    if (invoice && invoice.filePath && invoice.fileType === 'image') {
      wx.previewImage({
        urls: [invoice.filePath],
        current: invoice.filePath
      });
    } else if (invoice && invoice.filePath && invoice.fileType === 'pdf') {
      wx.openDocument({
        filePath: invoice.filePath,
        fileType: 'pdf',
        fail: function () {
          wx.showToast({ title: '无法打开文件', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: '发票详情', icon: 'none' });
    }
  },

  onDeleteInvoice: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张发票吗？',
      success: function (res) {
        if (res.confirm) {
          var invoices = that.data.invoices.filter(function (item) {
            return item.id !== id;
          });
          wx.setStorageSync('my_invoices', invoices);
          that.setData({ invoices: invoices });
          that.filterList(that.data.keyword);
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});
