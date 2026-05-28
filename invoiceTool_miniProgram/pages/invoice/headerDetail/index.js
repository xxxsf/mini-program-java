var app = getApp();

Page({
  data: {
    headerId: '',
    header: {},
    showActions: true, // 是否显示操作按钮（分享模式为false）
    plainText: '' // 纯文本格式
  },

  onLoad: function (options) {
    if (options.id) {
      // 从分享场景打开时，隐藏操作按钮
      var scene = options.scene || '';
      var fromShare = options.from === 'share' || scene === '1044' || scene === '1007' || scene === '1008';
      this.setData({ 
        headerId: options.id,
        showActions: !fromShare 
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

  // 分享给好友
  onShareAppMessage: function () {
    var header = this.data.header;
    var title = header.name ? ('发票抬头：' + header.name) : '发票抬头详情';

    return {
      title: title,
      path: '/pages/invoice/headerDetail/index?id=' + this.data.headerId,
      imageUrl: '/img/share_header.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    var header = this.data.header;
    return {
      title: header.name ? ('发票抬头：' + header.name) : '发票抬头详情',
      query: 'id=' + this.data.headerId
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
