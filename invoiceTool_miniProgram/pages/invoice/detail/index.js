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
    // 检测是否从分享场景打开（scene码或分享数据参数）
    var scene = options.scene || '';
    var fromShareScene = options.from === 'share' || scene === '1044' || scene === '1007' || scene === '1008';
    // 如果有分享数据参数，说明是从分享链接打开
    var hasShareData = options.amount !== undefined;
    var isFromShare = fromShareScene || hasShareData;
    
    var inv = null;
    
    // 优先从分享链接参数获取数据
    if (hasShareData) {
      var dateStr = options.dateStr || '';
      if (!dateStr && options.date) {
        var d = new Date(parseInt(options.date));
        dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
      }
      
      inv = {
        id: options.id,
        amount: decodeURIComponent(options.amount || '0'),
        invoiceNo: decodeURIComponent(options.invoiceNo || ''),
        dateStr: decodeURIComponent(dateStr || ''),
        sellerName: decodeURIComponent(options.sellerName || ''),
        buyerName: decodeURIComponent(options.buyerName || ''),
        category: decodeURIComponent(options.category || '')
      };
    }
    
    if (inv) {
      // 从分享链接获取数据
      var plainText = this.formatInvoicePlainText(inv);
      this.setData({
        invoice: inv,
        statusText: '正常',
        showActions: !isFromShare,
        plainText: plainText
      });
    } else if (options.id) {
      this.loadInvoiceDetail(options.id, isFromShare);
    }
  },

  loadInvoiceDetail: function (id, isFromShare) {
    var that = this;
    var sk = wx.getStorageSync('sk') || app.globalData.sk;
    console.log('[InvoiceDetail] load from server, id:', id);
    if (!sk) {
      return;
    }
    wx.showLoading({ title: '加载中...' });
    util.req('invoice/detail', { sk: sk, id: id }, function (data) {
      wx.hideLoading();
      if (data && data.status == 1 && data.data) {
        var inv = data.data;
        var d = new Date(inv.invoiceDate || inv.date || inv.createTime);
        inv.dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
        var statusMap = {
          'normal': '正常',
          'reimbursed': '已报销',
          'void': '已作废'
        };
        var plainText = that.formatInvoicePlainText(inv);
        that.setData({
          invoice: inv,
          statusText: statusMap[inv.status] || '正常',
          showActions: !isFromShare,
          plainText: plainText
        });
      } else {
        wx.showToast({ title: (data && data.msg) || '发票不存在', icon: 'none' });
      }
    });
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

  // 分享给好友 - 编码完整数据到链接
  onShareAppMessage: function () {
    var invoice = this.data.invoice;
    var title = invoice ? ('发票：¥' + invoice.amount + ' - ' + invoice.sellerName) : '发票详情';
    
    var path = '/pages/invoice/detail/index?id=' + (invoice ? invoice.id : '');
    if (invoice) {
      path += '&amount=' + encodeURIComponent(invoice.amount || '0');
      path += '&invoiceNo=' + encodeURIComponent(invoice.invoiceNo || '');
      path += '&dateStr=' + encodeURIComponent(invoice.dateStr || '');
      path += '&sellerName=' + encodeURIComponent(invoice.sellerName || '');
      path += '&buyerName=' + encodeURIComponent(invoice.buyerName || '');
      path += '&category=' + encodeURIComponent(invoice.category || '');
    }
    
    return {
      title: title,
      path: path
    };
  },

  // 分享到朋友圈 - 编码完整数据
  onShareTimeline: function () {
    var invoice = this.data.invoice;
    var query = 'id=' + (invoice ? invoice.id : '');
    if (invoice) {
      query += '&amount=' + encodeURIComponent(invoice.amount || '0');
      query += '&invoiceNo=' + encodeURIComponent(invoice.invoiceNo || '');
      query += '&dateStr=' + encodeURIComponent(invoice.dateStr || '');
      query += '&sellerName=' + encodeURIComponent(invoice.sellerName || '');
      query += '&buyerName=' + encodeURIComponent(invoice.buyerName || '');
      query += '&category=' + encodeURIComponent(invoice.category || '');
    }
    
    return {
      title: invoice ? ('发票：¥' + invoice.amount) : '发票详情',
      query: query
    };
  },

  // 查看原件
  onViewOriginal: function () {
    var invoice = this.data.invoice
    var sk = wx.getStorageSync('sk') || app.globalData.sk
    if (!invoice || !invoice.id || !sk) {
      wx.showToast({ title: '无原件文件', icon: 'none' })
      return
    }

    var isImage = invoice.fileName && invoice.fileName.match(/\.(jpg|jpeg|png|gif)$/i)

    wx.showLoading({ title: '正在下载原件...' })
    util.downloadFile('api/invoice/downloadOriginal?sk=' + encodeURIComponent(sk) + '&id=' + encodeURIComponent(invoice.id), function (tempPath) {
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
