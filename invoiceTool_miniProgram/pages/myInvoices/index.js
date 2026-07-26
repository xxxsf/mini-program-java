var app = getApp();
var util = require('../../utils/util.js');

Page({
  data: {
    keyword: '',
    invoices: [],
    filteredList: [],
    
    // 筛选状态
    timeSortAsc: false, // 时间排序：默认降序
    onlyNormalStatus: false, // 仅展示正常状态
    selectedType: '全部', // 选中的类型

    // 时间范围筛选（已生效值）
    timeRange: 'all', // 'all' | 'month' | 'custom'
    customStart: '',  // 'YYYY-MM-DD'
    customEnd: '',
    // 时间范围弹层临时态（确定后才提交）
    showTimeModal: false,
    tempTimeRange: 'all',
    tempStart: '',
    tempEnd: '',

    // 批量模式状态
    isBatch: false,
    selectedIds: {}, // 记录选中的发票ID映射，形式如：{ "1": true, "3": true }
    selectedCount: 0,
    selectedAmount: '0.00', // 选中发票的金额合计
    isAllSelected: false,

    // 弹窗状态
    showExportModal: false,
    showEmailModal: false,
    showSourceSheet: false, // 添加发票来源选择
    email: '', // 关联的邮箱
    emailInput: '',
    generatedZipUrl: '', // 兼容字段，已废弃公网 URL 方式
    exportSk: '',   // 当前批次校验用 sk（导出预检通过后缓存）
    exportIds: '',  // 当前批次发票 ID 串
    exportCount: 0  // 本批次预检通过的发票数
  },

  onShow: function () {
    this.checkUserEmail();
    this.loadInvoices();
  },

  // 检查并拉取用户的绑定邮箱
  checkUserEmail: function () {
    var that = this;
    var sk = wx.getStorageSync('sk');
    if (!sk) return;
    
    util.req('user/vaild_sk', { sk: sk }, function (res) {
      if (res && res.status == 1 && res.email) {
        that.setData({ email: res.email, emailInput: res.email });
      }
    });
  },

  // 从云端加载发票列表
  loadInvoices: function () {
    var that = this;
    var sk = wx.getStorageSync('sk');
    if (!sk) return;

    wx.showLoading({ title: '加载中...' });
    util.req('invoice/list', { sk: sk }, function (res) {
      wx.hideLoading();
      if (res && res.status == 1) {
        var list = res.data || [];
        var formattedList = list.map(function (item) {
          var dateStr = '待识别';
          if (item.createTime) {
            var d = new Date(item.createTime);
            var h = d.getHours().toString().padStart(2, '0');
            var m = d.getMinutes().toString().padStart(2, '0');
            dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + h + ':' + m;
          }
          // 处理金额：转换为字符串，过滤无效值（如年份 2026）
          var amountStr = '待识别';
          if (item.amount !== undefined && item.amount !== null && item.amount !== '') {
            var amt = String(item.amount).trim();
            // 过滤明显错误的金额（如年份 2020-2030，或过大金额）
            var amtNum = parseFloat(amt);
            if (amt && !amt.match(/^202[0-9]$/) && amtNum > 0 && amtNum < 1000000) {
              amountStr = amt;
            }
          }
          // 处理标题：优先使用销售方名称，其次是文件名，最后使用发票号码
          var titleStr = '待识别';
          if (item.sellerName && item.sellerName.trim() && !item.sellerName.match(/^\d+\.?\d*$/) && item.sellerName !== '待识别') {
            // 优先使用销售方名称（不能是纯数字）
            titleStr = item.sellerName;
          } else if (item.fileName) {
            titleStr = item.fileName.replace(/\.pdf$/i, '');
          } else if (item.invoiceNo && !item.invoiceNo.startsWith('FP')) {
            titleStr = '发票 ' + item.invoiceNo;
          }
          return {
            id: String(item.id),
            source: 'wechat_chat',
            industry: item.category || '其他',
            company: titleStr,
            amount: amountStr,
            date: dateStr,
            payer: item.buyerName || '个人',
            seller: (item.sellerName && item.sellerName.trim() && !item.sellerName.match(/^\d+\.?\d*$/) && item.sellerName !== '待识别') ? item.sellerName : '',
            fileName: item.fileName,
            filePath: item.filePath,
            fileSize: item.fileSize,
            status: item.status || 'normal',
            createTime: item.createTime || Date.now()
          };
        });
        
        that.setData({ invoices: formattedList });
        that.applyFiltersAndSort();
        wx.setStorageSync('my_invoices', formattedList);
      } else {
        // 本地离线兜底
        var invoices = wx.getStorageSync('my_invoices') || [];
        that.setData({ invoices: invoices });
        that.applyFiltersAndSort();
      }
    });
  },

  // 应用所有的检索、筛选和排序
  applyFiltersAndSort: function () {
    var list = [...this.data.invoices];
    var keyword = this.data.keyword.trim();
    var onlyNormalStatus = this.data.onlyNormalStatus;
    var selectedType = this.data.selectedType;
    var timeSortAsc = this.data.timeSortAsc;

    // 1. 关键词检索
    if (keyword) {
      list = list.filter(function (item) {
        return (item.company && item.company.indexOf(keyword) >= 0) ||
          (item.payer && item.payer.indexOf(keyword) >= 0) ||
          (item.fileName && item.fileName.indexOf(keyword) >= 0) ||
          (item.amount !== undefined && item.amount !== null && String(item.amount).indexOf(keyword) >= 0);
      });
    }

    // 2. 状态筛选
    if (onlyNormalStatus) {
      list = list.filter(function (item) {
        return item.status === 'normal';
      });
    }

    // 3. 购买方筛选
    if (selectedType && selectedType !== '全部') {
      list = list.filter(function (item) {
        return item.payer === selectedType;
      });
    }

    // 4. 时间范围筛选
    var timeRange = this.data.timeRange;
    if (timeRange === 'month') {
      var monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      list = list.filter(function (item) {
        return item.createTime && item.createTime >= monthAgo;
      });
    } else if (timeRange === 'custom' && this.data.customStart && this.data.customEnd) {
      var startTs = new Date(this.data.customStart.replace(/-/g, '/') + ' 00:00:00').getTime();
      var endTs = new Date(this.data.customEnd.replace(/-/g, '/') + ' 23:59:59').getTime();
      list = list.filter(function (item) {
        return item.createTime && item.createTime >= startTs && item.createTime <= endTs;
      });
    }

    // 5. 时间排序
    list.sort(function (a, b) {
      return timeSortAsc ? (a.createTime - b.createTime) : (b.createTime - a.createTime);
    });

    this.setData({ filteredList: list });
    this.updateSelectAllState();
  },

  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value.trim() });
    this.applyFiltersAndSort();
  },

  // 打开时间范围弹层
  onFilterTime: function () {
    this.setData({
      showTimeModal: true,
      tempTimeRange: this.data.timeRange,
      tempStart: this.data.customStart,
      tempEnd: this.data.customEnd
    });
  },

  closeTimeModal: function () {
    this.setData({ showTimeModal: false });
  },

  onSelectTimeRange: function (e) {
    this.setData({ tempTimeRange: e.currentTarget.dataset.range });
  },

  onCustomStartChange: function (e) {
    this.setData({ tempStart: e.detail.value });
  },

  onCustomEndChange: function (e) {
    this.setData({ tempEnd: e.detail.value });
  },

  onConfirmTimeRange: function () {
    var range = this.data.tempTimeRange;
    if (range === 'custom') {
      if (!this.data.tempStart || !this.data.tempEnd) {
        wx.showToast({ title: '请选择起止时间', icon: 'none' });
        return;
      }
      if (this.data.tempStart > this.data.tempEnd) {
        wx.showToast({ title: '起始时间不能晚于截止时间', icon: 'none' });
        return;
      }
    }
    this.setData({
      timeRange: range,
      customStart: this.data.tempStart,
      customEnd: this.data.tempEnd,
      showTimeModal: false
    });
    this.applyFiltersAndSort();
  },

  // 状态筛选切换
  onFilterStatus: function () {
    var that = this;
    wx.showActionSheet({
      itemList: ['全部状态', '仅正常状态'],
      success: function (res) {
        var onlyNormal = (res.tapIndex === 1);
        that.setData({ onlyNormalStatus: onlyNormal });
        that.applyFiltersAndSort();
      }
    });
  },

  // 购买方（公司名称）筛选切换
  onFilterType: function () {
    var that = this;
    // 自动搜集当前列表中所有的购买方
    var types = ['全部'];
    this.data.invoices.forEach(function (item) {
      if (item.payer && types.indexOf(item.payer) === -1) {
        types.push(item.payer);
      }
    });

    // 小程序 ActionSheet 限制最多 6 个，如果太多则做截断
    var displayTypes = types.slice(0, 6);

    wx.showActionSheet({
      itemList: displayTypes,
      success: function (res) {
        var chosen = displayTypes[res.tapIndex];
        that.setData({ selectedType: chosen });
        that.applyFiltersAndSort();
      }
    });
  },

  // ===== 批量选择模式 =====

  onBatchSelect: function () {
    this.setData({
      isBatch: true,
      selectedIds: {},
      selectedCount: 0,
      selectedAmount: '0.00',
      isAllSelected: false
    });
    this.applyFiltersAndSort();
  },

  onExitBatch: function () {
    this.setData({
      isBatch: false,
      selectedIds: {},
      selectedCount: 0,
      selectedAmount: '0.00',
      isAllSelected: false
    });
  },

  // 点击卡片：单选打勾 或 查看详情
  onCardTap: function (e) {
    var id = e.currentTarget.dataset.id;
    if (this.data.isBatch) {
      this.toggleSelect(id);
    } else {
      this.showInvoiceDetail(id);
    }
  },

  toggleSelect: function (id) {
    var selectedIds = { ...this.data.selectedIds };
    if (selectedIds[id]) {
      delete selectedIds[id];
    } else {
      selectedIds[id] = true;
    }

    var count = Object.keys(selectedIds).length;
    this.setData({
      selectedIds: selectedIds,
      selectedCount: count,
      selectedAmount: this.computeSelectedAmount(selectedIds)
    });
    this.updateSelectAllState();
  },

  // 计算选中发票的金额合计（跳过“待识别”等非数字金额）
  computeSelectedAmount: function (selectedIds) {
    var list = this.data.invoices || [];
    var total = 0;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (selectedIds[item.id]) {
        var amt = parseFloat(item.amount);
        if (!isNaN(amt)) total += amt;
      }
    }
    return total.toFixed(2);
  },

  // 更新“全选”状态标志
  updateSelectAllState: function () {
    if (!this.data.isBatch || this.data.filteredList.length === 0) {
      this.setData({ isAllSelected: false });
      return;
    }

    var allSelected = true;
    for (var i = 0; i < this.data.filteredList.length; i++) {
      var item = this.data.filteredList[i];
      if (!this.data.selectedIds[item.id]) {
        allSelected = false;
        break;
      }
    }
    this.setData({ isAllSelected: allSelected });
  },

  onToggleSelectAll: function () {
    var selectedIds = {};
    var isAllSelected = !this.data.isAllSelected;

    if (isAllSelected) {
      this.data.filteredList.forEach(function (item) {
        selectedIds[item.id] = true;
      });
    }

    var count = Object.keys(selectedIds).length;
    this.setData({
      selectedIds: selectedIds,
      selectedCount: count,
      isAllSelected: isAllSelected,
      selectedAmount: this.computeSelectedAmount(selectedIds)
    });
  },

  // ===== 批量导出及转发功能 =====

  // 1. 批量导出至微信聊天（原件打包 ZIP + Excel 报销单.csv）
  onExportToChat: function () {
    var that = this;
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先勾选需要导出的发票', icon: 'none' });
      return;
    }

    var ids = Object.keys(this.data.selectedIds).join(',');
    var sk = wx.getStorageSync('sk');

    wx.showLoading({ title: '正在云端打包...' });
    
    // 呼叫云端打包压缩服务
    util.req('invoice/export', { sk: sk, ids: ids }, function (res) {
      wx.hideLoading();
      if (res && res.status == 1) {
        that.setData({
          generatedZipUrl: res.url || 'ready',
          exportSk: sk,
          exportIds: ids,
          exportCount: res.count || that.data.selectedCount,
          showExportModal: true
        });
      } else {
        wx.showToast({ title: (res && res.msg) || '云端打包失败', icon: 'none' });
      }
    });
  },

  // 一次性请求后端 /invoice/exportZip 拿到二进制 ZIP，写到本地后再转发好友
  // 该流程不依赖容器 /tmp 文件，避免云托管多实例不共享导致下载失败
  onShareZipToChat: function () {
    var that = this;
    var sk = this.data.exportSk || wx.getStorageSync('sk');
    var ids = this.data.exportIds;
    if (!sk || !ids) {
      wx.showToast({ title: '会话已失效，请重新打包', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在下载打包文件...' });

    that._fetchZipBinary(sk, ids, function (arrayBuffer) {
      if (!arrayBuffer) {
        wx.hideLoading();
        wx.showToast({ title: '文件下载失败，请重试', icon: 'none' });
        return;
      }
      // 写入本地临时文件
      var fs = wx.getFileSystemManager();
      var tempPath = wx.env.USER_DATA_PATH + '/invoices_' + Date.now() + '.zip';
      try {
        fs.writeFileSync(tempPath, arrayBuffer, 'binary');
      } catch (e) {
        wx.hideLoading();
        console.error('write zip error:', e);
        wx.showToast({ title: '文件写入失败', icon: 'none' });
        return;
      }
      wx.hideLoading();

      var fileName = '含' + (that.data.exportCount || that.data.selectedCount) + '张发票的文件.zip';
      // shareFileMessage 不支持 .zip，会 fail；统一走 openDocument 让用户在文档界面分享
      if (wx.shareFileMessage) {
        wx.shareFileMessage({
          filePath: tempPath,
          fileName: fileName,
          success: function () {
            wx.showToast({ title: '分享文件成功', icon: 'success' });
            that.onCloseExportModal();
            that.onExitBatch();
          },
          fail: function (err) {
            console.warn('shareFileMessage fail, fallback to openDocument:', err);
            wx.openDocument({
              filePath: tempPath,
              fileType: 'zip',
              showMenu: true,
              success: function () {
                wx.showToast({ title: '请点右上角分享给好友', icon: 'none' });
                that.onCloseExportModal();
              },
              fail: function () {
                wx.showToast({ title: '已取消分享', icon: 'none' });
              }
            });
          }
        });
      } else {
        wx.openDocument({
          filePath: tempPath,
          fileType: 'zip',
          showMenu: true,
          success: function () {
            wx.showToast({ title: '请点右上角分享给好友', icon: 'none' });
            that.onCloseExportModal();
          }
        });
      }
    });
  },

  // 内部方法：调用后端 /api/invoice/exportZip 流式拉取 ZIP 二进制
  _fetchZipBinary: function (sk, ids, cb) {
    var isDevtools = false;
    try { isDevtools = (typeof __wxConfig !== 'undefined' && __wxConfig.platform === 'devtools'); } catch (e) {}

    var forceUseDomain = true; // 与 util.js 中 forceUseDomain 保持一致

    if (!isDevtools && !forceUseDomain) {
      // 真机免域名走云托管 callContainer
      wx.cloud.callContainer({
        config: { env: 'prod-d8g4lh96w1851d968' },
        path: '/api/invoice/exportZip',
        header: {
          'X-WX-SERVICE': 'springboot-yncv',
          'content-type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        data: { sk: sk, ids: ids },
        responseType: 'arraybuffer',
        success: function (res) {
          if (res.statusCode === 200 && res.data) {
            cb(res.data);
          } else {
            console.error('exportZip non-200:', res.statusCode);
            cb(false);
          }
        },
        fail: function (err) {
          console.error('exportZip callContainer fail:', err);
          cb(false);
        }
      });
    } else {
      // 开发者工具 / 强制公网域名走 wx.request
      wx.request({
        url: util.baseURL + 'api/invoice/exportZip',
        method: 'POST',
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: { sk: sk, ids: ids },
        responseType: 'arraybuffer',
        success: function (res) {
          if (res.statusCode === 200 && res.data) {
            cb(res.data);
          } else {
            console.error('exportZip non-200:', res.statusCode);
            cb(false);
          }
        },
        fail: function (err) {
          console.error('exportZip request fail:', err);
          cb(false);
        }
      });
    }
  },

  onCloseExportModal: function () {
    this.setData({ showExportModal: false });
  },

  // 2. 批量发送到邮箱
  onExportToEmail: function () {
    var that = this;
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先勾选发票', icon: 'none' });
      return;
    }

    var email = this.data.email;
    if (!email) {
      // 没绑定过邮箱，先强力提醒绑定
      wx.showModal({
        title: '需要关联邮箱',
        content: '您尚未关联收件邮箱，是否现在关联？',
        success: function (res) {
          if (res.confirm) {
            that.setData({ showEmailModal: true });
          }
        }
      });
      return;
    }

    var ids = Object.keys(this.data.selectedIds).join(',');
    var sk = wx.getStorageSync('sk');

    wx.showLoading({ title: '正在云端推送邮件...' });

    util.req('invoice/sendEmail', { sk: sk, ids: ids, email: email }, function (res) {
      wx.hideLoading();
      if (res && res.status == 1) {
        wx.showModal({
          title: '推送成功',
          content: '您选中的 ' + that.data.selectedCount + ' 张发票及电子报销单，已成功打包并向您的关联邮箱 ' + email + ' 投递发送！',
          showCancel: false,
          success: function() {
            that.onExitBatch();
          }
        });
      } else {
        wx.showToast({ title: (res && res.msg) || '邮件投递失败', icon: 'none' });
      }
    });
  },

  // ===== 邮箱关联处理 =====

  onLinkEmail: function () {
    this.setData({ showEmailModal: true });
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

  // ===== 批量删除发票 =====

  onBatchDelete: function () {
    var that = this;
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先勾选发票', icon: 'none' });
      return;
    }

    var selectedCount = this.data.selectedCount;
    var ids = Object.keys(this.data.selectedIds);
    var sk = wx.getStorageSync('sk');

    wx.showModal({
      title: '确认批量删除',
      content: '确定要彻底删除选中的 ' + selectedCount + ' 张发票吗？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          // 循环顺序调用单张删除（或者您未来也可以设计一个批量删除Controller）
          var deleteSeq = function (index) {
            if (index >= ids.length) {
              wx.hideLoading();
              wx.showToast({ title: '批量删除成功', icon: 'success' });
              that.onExitBatch();
              that.loadInvoices();
              return;
            }
            util.req('invoice/delete', { sk: sk, id: parseInt(ids[index]) }, function () {
              deleteSeq(index + 1);
            });
          };

          deleteSeq(0);
        }
      }
    });
  },

  // ===== 单张查看与单张删除 =====

  showInvoiceDetail: function (id) {
    // 跳转到发票详情页
    wx.navigateTo({
      url: '/pages/invoice/detail/index?id=' + id
    });
  },

  onDeleteInvoice: function (e) {
    var id = e.currentTarget.dataset.id;
    var that = this;
    var sk = wx.getStorageSync('sk');
    if (!sk) return;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张发票吗？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          util.req('invoice/delete', { sk: sk, id: parseInt(id) }, function (res) {
            wx.hideLoading();
            if (res && res.status == 1) {
              wx.showToast({ title: '已删除', icon: 'success' });
              that.loadInvoices();
            } else {
              wx.showToast({ title: (res && res.msg) || '删除失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 通用登录拦截
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
        that.uploadPdfFiles(files);
      },
      fail: function () {
        wx.showToast({ title: '已取消选择', icon: 'none' });
      }
    });
  },

  // 从相册导入
  onSourceAlbum: function () {
    var that = this;
    that.setData({ showSourceSheet: false });

    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album'],
      success: function (res) {
        var files = res.tempFiles;
        if (!files || files.length === 0) return;
        that.uploadImageFiles(files);
      },
      fail: function () {
        wx.showToast({ title: '已取消选择', icon: 'none' });
      }
    });
  },

  // 拍照导入
  onSourceCamera: function () {
    var that = this;
    that.setData({ showSourceSheet: false });

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: function (res) {
        var files = res.tempFiles;
        if (!files || files.length === 0) return;
        that.uploadImageFiles(files);
      },
      fail: function () {
        wx.showToast({ title: '已取消拍照', icon: 'none' });
      }
    });
  },

  // 上传 PDF 文件
  uploadPdfFiles: function (files) {
    var that = this;
    var sk = wx.getStorageSync('sk');
    if (!sk) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    var uploadedCount = 0;
    var total = files.length;

    wx.showLoading({ title: '上传中...' });

    var uploadNext = function (index) {
      if (index >= total) {
        wx.hideLoading();
        wx.showToast({ title: '成功添加 ' + uploadedCount + ' 张发票', icon: 'success' });
        that.loadInvoices();
        return;
      }

      var file = files[index];
      util.uploadFile(file.path, 'file', { sk: sk }, function (res) {
        if (res && res.status == 1) {
          uploadedCount++;
        }
        uploadNext(index + 1);
      });
    };

    uploadNext(0);
  },

  // 上传图片文件
  uploadImageFiles: function (files) {
    var that = this;
    var sk = wx.getStorageSync('sk');
    if (!sk) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    var uploadedCount = 0;
    var total = files.length;

    wx.showLoading({ title: '上传中...' });

    var uploadNext = function (index) {
      if (index >= total) {
        wx.hideLoading();
        wx.showToast({ title: '成功添加 ' + uploadedCount + ' 张发票', icon: 'success' });
        that.loadInvoices();
        return;
      }

      var file = files[index];
      util.uploadFile(file.tempFilePath, 'file', { sk: sk }, function (res) {
        if (res && res.status == 1) {
          uploadedCount++;
        }
        uploadNext(index + 1);
      });
    };

    uploadNext(0);
  }
});
