var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    importedFiles: [],
    importing: false
  },

  // 从手机相册选择发票图片
  onChooseFromAlbum: function () {
    var that = this;
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: function (res) {
        that.processMediaFiles(res.tempFiles, 'local_album');
      },
      fail: function () {
        wx.showToast({ title: '未选择图片', icon: 'none' });
      }
    });
  },

  // 拍照导入发票
  onTakePhoto: function () {
    var that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: function (res) {
        that.processMediaFiles(res.tempFiles, 'local_camera');
      },
      fail: function () {
        wx.showToast({ title: '未拍摄照片', icon: 'none' });
      }
    });
  },

  // 从手机本地选择 PDF 文件（通过微信文件管理器）
  onSelectFile: function () {
    var that = this;
    wx.chooseMessageFile({
      count: 10,
      type: 'file',
      extension: ['pdf'],
      success: function (res) {
        that.processPdfFiles(res.tempFiles);
      },
      fail: function () {
        wx.showToast({ title: '未选择文件', icon: 'none' });
      }
    });
  },

  // 处理图片文件（相册/拍照）
  processMediaFiles: function (tempFiles, source) {
    if (!tempFiles || tempFiles.length === 0) return;

    wx.showLoading({ title: '正在导入...' });

    var invoices = wx.getStorageSync('my_invoices') || [];
    var now = new Date();
    var newFiles = [];

    for (var i = 0; i < tempFiles.length; i++) {
      var file = tempFiles[i];
      var fileName = '发票图片_' + util.formatTime(now) + '_' + (i + 1);
      var invoice = {
        id: Date.now().toString() + '_' + i,
        source: source,
        fileName: fileName,
        filePath: file.tempFilePath,
        fileSize: file.size,
        fileType: 'image',
        industry: '待识别',
        company: '待识别',
        amount: '待识别',
        date: util.formatTime(now),
        payer: '待识别',
        createTime: now.getTime(),
        status: 'pending'
      };
      invoices.unshift(invoice);
      newFiles.push(invoice);
    }

    wx.setStorageSync('my_invoices', invoices);
    wx.hideLoading();

    this.setData({
      importedFiles: newFiles.concat(this.data.importedFiles)
    });

    wx.showToast({
      title: '成功导入 ' + tempFiles.length + ' 张发票',
      icon: 'success',
      duration: 1500
    });

    setTimeout(function () {
      wx.navigateTo({ url: '/pages/myInvoices/index' });
    }, 1500);
  },

  // 处理 PDF 文件
  processPdfFiles: function (tempFiles) {
    if (!tempFiles || tempFiles.length === 0) return;

    wx.showLoading({ title: '正在导入...' });

    var invoices = wx.getStorageSync('my_invoices') || [];
    var now = new Date();
    var newFiles = [];

    for (var i = 0; i < tempFiles.length; i++) {
      var file = tempFiles[i];
      var invoice = {
        id: Date.now().toString() + '_' + i,
        source: 'local_file',
        fileName: file.name,
        filePath: file.path,
        fileSize: file.size,
        fileType: 'pdf',
        industry: '待识别',
        company: file.name.replace(/\.pdf$/i, ''),
        amount: '待识别',
        date: util.formatTime(now),
        payer: '待识别',
        createTime: now.getTime(),
        status: 'pending'
      };
      invoices.unshift(invoice);
      newFiles.push(invoice);
    }

    wx.setStorageSync('my_invoices', invoices);
    wx.hideLoading();

    this.setData({
      importedFiles: newFiles.concat(this.data.importedFiles)
    });

    wx.showToast({
      title: '成功导入 ' + tempFiles.length + ' 张发票',
      icon: 'success',
      duration: 1500
    });

    setTimeout(function () {
      wx.navigateTo({ url: '/pages/myInvoices/index' });
    }, 1500);
  },

  onViewInvoices: function () {
    wx.navigateTo({ url: '/pages/myInvoices/index' });
  }
});
