var app = getApp();
var util = require('../../../utils/util.js');

Page({
  data: {
    headerId: '',
    header: {},
    showActions: true,
    plainText: ''
  },

  onLoad: function (options) {
    // 检测是否从分享场景打开（scene码或分享数据参数）
    var scene = options.scene || '';
    var fromShareScene = options.from === 'share' || scene === '1044' || scene === '1007' || scene === '1008';
    // 如果有分享数据参数，说明是从分享链接打开
    var hasShareData = options.name !== undefined;
    var isFromShare = fromShareScene || hasShareData;
    
    // 优先从分享链接参数中获取数据（被分享者场景）
    var header = null;
    if (hasShareData) {
      // 从分享链接参数构建抬头数据
      header = {
        id: options.id,
        name: decodeURIComponent(options.name || ''),
        taxNo: decodeURIComponent(options.taxNo || ''),
        address: decodeURIComponent(options.address || ''),
        phone: decodeURIComponent(options.phone || ''),
        bank: decodeURIComponent(options.bank || ''),
        bankAccount: decodeURIComponent(options.bankAccount || '')
      };
    }
    
    if (header) {
      // 从分享链接获取到数据
      var plainText = this.formatPlainText(header);
      this.setData({
        headerId: options.id,
        header: header,
        plainText: plainText,
        showActions: !isFromShare
      });
    } else if (options.id) {
      // 没有分享数据，从本地/服务器加载
      this.setData({ 
        headerId: options.id,
        showActions: !isFromShare 
      });
      this.loadHeaderDetail(options.id);
    }
  },

  // 加载抬头详情
  loadHeaderDetail: function (id) {
    var headers = app.globalData.invoiceHeaders || [];
    var header = headers.find(function (h) {
      return String(h.id) === String(id);
    });

    if (!header) {
      // 如果全局数据中没有，尝试从本地存储获取
      var localHeaders = wx.getStorageSync('invoice_headers') || [];
      header = localHeaders.find(function (h) {
        return String(h.id) === String(id);
      });
    }

    if (header) {
      // 生成纯文本格式
      var plainText = this.formatPlainText(header);
      this.setData({ 
        header: header,
        plainText: plainText
      });
    }
  },

  // 生成纯文本格式
  formatPlainText: function (h) {
    var text = '';
    text += '名称：' + (h.name || '') + '\n';
    if (h.taxNo) {
      text += '纳税人识别号：' + h.taxNo + '\n';
    }
    if (h.address) {
      text += '地址：' + h.address + '\n';
    }
    if (h.phone) {
      text += '电话：' + h.phone + '\n';
    }
    if (h.bank) {
      text += '开户行：' + h.bank + '\n';
    }
    if (h.bankAccount) {
      text += '银行账号：' + h.bankAccount + '\n';
    }
    return text;
  },

  // 分享给好友 - 把完整数据编码到链接中
  onShareAppMessage: function () {
    var header = this.data.header;
    var title = header.name ? ('发票抬头：' + header.name) : '发票抬头详情';
    
    // 构建分享链接，包含完整数据
    var path = '/pages/invoice/headerDetail/index?id=' + this.data.headerId;
    path += '&name=' + encodeURIComponent(header.name || '');
    path += '&taxNo=' + encodeURIComponent(header.taxNo || '');
    path += '&address=' + encodeURIComponent(header.address || '');
    path += '&phone=' + encodeURIComponent(header.phone || '');
    path += '&bank=' + encodeURIComponent(header.bank || '');
    path += '&bankAccount=' + encodeURIComponent(header.bankAccount || '');

    return {
      title: title,
      path: path,
      imageUrl: '/img/share_header.png'
    };
  },

  // 分享到朋友圈 - 同样编码完整数据
  onShareTimeline: function () {
    var header = this.data.header;
    var query = 'id=' + this.data.headerId;
    query += '&name=' + encodeURIComponent(header.name || '');
    query += '&taxNo=' + encodeURIComponent(header.taxNo || '');
    query += '&address=' + encodeURIComponent(header.address || '');
    query += '&phone=' + encodeURIComponent(header.phone || '');
    query += '&bank=' + encodeURIComponent(header.bank || '');
    query += '&bankAccount=' + encodeURIComponent(header.bankAccount || '');
    
    return {
      title: header.name ? ('发票抬头：' + header.name) : '发票抬头详情',
      query: query
    };
  },

  // 复制完整信息
  onCopy: function () {
    var h = this.data.header;
    var text = '名称：' + (h.name || '') + '\n';
    if (h.taxNo) {
      text += '纳税人识别号：' + h.taxNo + '\n';
    }
    if (h.address) {
      text += '地址：' + h.address + '\n';
    }
    if (h.phone) {
      text += '电话：' + h.phone + '\n';
    }
    if (h.bank) {
      text += '开户行：' + h.bank + '\n';
    }
    if (h.bankAccount) {
      text += '账号：' + h.bankAccount + '\n';
    }

    wx.setClipboardData({
      data: text,
      success: function () {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  },

  // 编辑抬头
  onEdit: function () {
    wx.navigateTo({
      url: '/pages/invoice/headerAdd/index?id=' + this.data.headerId
    });
  },

  // 删除抬头
  onDelete: function () {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此发票抬头吗？',
      success: function (res) {
        if (res.confirm) {
          app.deleteInvoiceHeader(that.data.headerId, function () {
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(function () {
              wx.navigateBack();
            }, 1000);
          });
        }
      }
    });
  }
});
