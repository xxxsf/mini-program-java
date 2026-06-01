var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    headers: [],
    showSourceSheet: false,
    email: '',
    emailInput: '',
    showEmailModal: false,
    loadingHeaders: false // 防止重复请求
  },

  onLoad: function () {
    // 扫码进入时，onShow可能延迟执行，先在onLoad加载缓存数据
    var headers = wx.getStorageSync('invoice_headers') || [];
    this.setData({ headers: headers });
    // 立即加载一次数据
    this.loadHeaders();
  },

  onShow: function () {
    // 每次显示页面时刷新数据
    this.loadHeaders();
  },

  // 加载抬头列表（带防重复请求）
  loadHeaders: function () {
    var that = this;
    if (that.data.loadingHeaders) return; // 防止重复请求

    var sk = wx.getStorageSync('sk');

    // 未登录：允许浏览首页（符合微信审核要求），仅展示离线缓存抬头
    if (!sk) {
      var headers = wx.getStorageSync('invoice_headers') || [];
      that.setData({ headers: headers, email: '' });
      return;
    }

    that.setData({ loadingHeaders: true });

    // 已登录：从云端加载发票抬头列表，并更新本地缓存
    util.req('invoiceHeader/list', { sk: sk }, function (res) {
      if (res && res.status == 1) {
        that.setData({ headers: res.data || [], loadingHeaders: false });
        wx.setStorageSync('invoice_headers', res.data || []);
      } else {
        var headers = wx.getStorageSync('invoice_headers') || [];
        that.setData({ headers: headers, loadingHeaders: false });
      }
    });

    // 检查并拉取用户的绑定邮箱
    util.req('user/vaild_sk', { sk: sk }, function (res) {
      if (res && res.status == 1 && res.email) {
        that.setData({ email: res.email, emailInput: res.email });
      }
    });
  },

  // 通用登录拦截：未登录时弹窗引导用户去登录页
  requireLogin: function (cb) {
    var sk = wx.getStorageSync('sk');
    if (sk) {
      if (typeof cb === 'function') cb();
      return true;
    }
    wx.showModal({
      title: '需要登录',
      content: '该功能需登录后使用，是否前往登录？',
      confirmText: '去登录',
      cancelText: '再看看',
      success: function (res) {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/toLogin/toLogin' });
        }
      }
    });
    return false;
  },

  onAddInvoice: function () {
    if (!this.requireLogin()) return;
    this.setData({ showSourceSheet: true });
  },

  closeSourceSheet: function () {
    this.setData({ showSourceSheet: false });
  },

  onMyInvoices: function () {
    if (!this.requireLogin()) return;
    wx.navigateTo({ url: '/pages/myInvoices/index' });
  },

  onShowAdContact: function () {
    wx.showModal({
      title: '广告位招租',
      content: '联系邮箱：evotree@foxmail.com',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onShowFeedbackContact: function () {
    wx.showModal({
      title: '问题反馈',
      content: '联系邮箱：evotree@foxmail.com',
      showCancel: false,
      confirmText: '知道了'
    });
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

    // 智能文件名识别解析（例如：餐饮费-529.00元-湖州福宴餐饮服务有限公司.pdf）
    var fileName = file.name || "";
    var category = "其他";
    var parsedAmount = "";
    var sellerName = fileName.replace(/\.pdf$/i, '');
    // 微信临时文件名不作为商家名
    if (/^tmp_/i.test(sellerName) || /^wx_/i.test(sellerName)) {
      sellerName = '';
    }

    // 模式一：分段式 餐饮费-529.00元-湖州福宴...
    var parts = fileName.split('-');
    if (parts.length >= 3) {
      category = parts[0];
      var amtPart = parts[1];
      if (amtPart.indexOf('元') !== -1) {
        parsedAmount = amtPart.replace('元', '');
      } else {
        parsedAmount = amtPart;
      }
      sellerName = parts[2].replace(/\.pdf$/i, '');
    } else {
      // 模式二：名字中提取 XX元 字符
      var match = fileName.match(/([\d\.]+)元/);
      if (match) {
        parsedAmount = match[1];
        // 尝试分隔提取商家名称
        var parts2 = fileName.split('-');
        if (parts2.length >= 2) {
          sellerName = parts2[parts2.length - 1].replace(/\.pdf$/i, '');
        }
      }
    }

    var uploadData = {
      sk: sk,
      sellerName: sellerName,
      category: category
    };
    
    // 如果提取到了有效金额，则作为参数传递
    if (parsedAmount && !isNaN(parseFloat(parsedAmount))) {
      uploadData.amount = parseFloat(parsedAmount);
    }

    util.uploadFile(file.path, 'file', uploadData, function (data) {
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
          industry: (data.data && data.data.category) || category || '待识别',
          company: (data.data && data.data.sellerName) || sellerName || file.name.replace(/\.pdf$/i, ''),
          amount: (data.data && data.data.amount !== undefined) ? data.data.amount : (parsedAmount || '待识别'),
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
    if (!this.requireLogin()) return;
    wx.navigateTo({ url: '/pages/addInvoice/index' });
  },

  onLinkEmail: function () {
    var that = this;
    if (!this.requireLogin()) {
      this.setData({ showSourceSheet: false });
      return;
    }
    that.setData({ showSourceSheet: false, showEmailModal: true });
  },

  onCloseEmailModal: function () {
    this.setData({ showEmailModal: false });
  },

  onEmailInput: function (e) {
    this.setData({ emailInput: e.detail.value.trim() });
  },

  onSaveEmail: function () {
    var that = this;
    var email = this.data.emailInput;
    if (!email || email.indexOf('@') === -1) {
      wx.showToast({ title: '请输入正确的邮箱格式', icon: 'none' });
      return;
    }

    var sk = wx.getStorageSync('sk');
    wx.showLoading({ title: '正在绑定云端...' });

    util.req('user/bindEmail', { sk: sk, email: email }, function (res) {
      wx.hideLoading();
      if (res && res.status == 1) {
        wx.showToast({ title: '关联成功', icon: 'success' });
        that.setData({
          email: email,
          showEmailModal: false
        });
      } else {
        wx.showToast({ title: (res && res.msg) || '绑定失败', icon: 'none' });
      }
    });
  },

  onOtherSource: function () {
    wx.showToast({ title: '其他渠道导入开发中', icon: 'none' });
  },

  onAddHeader: function () {
    if (!this.requireLogin()) return;
    wx.navigateTo({ url: '/pages/invoiceHeader/add' });
  },

  onHeaderTap: function (e) {
    if (!this.requireLogin()) return;
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/invoice/headerDetail/index?id=' + id });
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
