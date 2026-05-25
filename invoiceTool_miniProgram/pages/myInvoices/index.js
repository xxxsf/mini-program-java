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

    // 批量模式状态
    isBatch: false,
    selectedIds: {}, // 记录选中的发票ID映射，形式如：{ "1": true, "3": true }
    selectedCount: 0,
    isAllSelected: false,

    // 弹窗状态
    showExportModal: false,
    showEmailModal: false,
    email: '', // 关联的邮箱
    emailInput: '',
    generatedZipUrl: '' // 云端导出的 ZIP 文件公网下载地址
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
            dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
          }
          return {
            id: String(item.id),
            source: 'wechat_chat',
            industry: item.category || '其他',
            company: item.sellerName || '待识别',
            amount: item.amount !== undefined ? item.amount : '待识别',
            date: dateStr,
            payer: item.buyerName || '个人',
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
          (item.fileName && item.fileName.indexOf(keyword) >= 0);
      });
    }

    // 2. 状态筛选
    if (onlyNormalStatus) {
      list = list.filter(function (item) {
        return item.status === 'normal';
      });
    }

    // 3. 类型筛选
    if (selectedType && selectedType !== '全部') {
      list = list.filter(function (item) {
        return item.industry === selectedType;
      });
    }

    // 4. 时间排序
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

  // 时间排序切换
  onFilterTime: function () {
    var nextSort = !this.data.timeSortAsc;
    this.setData({ timeSortAsc: nextSort });
    this.applyFiltersAndSort();
    wx.showToast({ title: nextSort ? '时间升序' : '时间降序', icon: 'none' });
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

  // 类型（消费分类）筛选切换
  onFilterType: function () {
    var that = this;
    // 自动搜集当前列表中所有的消费类型
    var types = ['全部'];
    this.data.invoices.forEach(function (item) {
      if (item.industry && types.indexOf(item.industry) === -1) {
        types.push(item.industry);
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
      isAllSelected: false
    });
    this.applyFiltersAndSort();
  },

  onExitBatch: function () {
    this.setData({
      isBatch: false,
      selectedIds: {},
      selectedCount: 0,
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
      selectedCount: count
    });
    this.updateSelectAllState();
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
      isAllSelected: isAllSelected
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
      if (res && res.status == 1 && res.url) {
        that.setData({
          generatedZipUrl: res.url,
          showExportModal: true
        });
      } else {
        wx.showToast({ title: (res && res.msg) || '云端打包失败', icon: 'none' });
      }
    });
  },

  // 微信官方极强 API：wx.shareFileMessage 实现直接在手机中一键弹出好友列表发送文件！
  onShareZipToChat: function () {
    var that = this;
    var fileUrl = this.data.generatedZipUrl;
    if (!fileUrl) return;

    wx.showLoading({ title: '正在下载打包文件...' });

    // 使用我们高度优化的通用多模式下载引擎
    util.downloadFile(fileUrl, function (tempPath) {
      wx.hideLoading();
      if (tempPath) {
        // 调用官方微信好友转发文件接口
        if (wx.shareFileMessage) {
          wx.shareFileMessage({
            filePath: tempPath,
            fileName: '含' + that.data.selectedCount + '张发票的文件.zip',
            success: function () {
              wx.showToast({ title: '分享文件成功', icon: 'success' });
              that.onCloseExportModal();
              that.onExitBatch();
            },
            fail: function (err) {
              console.error('Share fail:', err);
              wx.showToast({ title: '已取消分享', icon: 'none' });
            }
          });
        } else {
          // 如果基础库过低，采用打开文档预览保存模式
          wx.openDocument({
            filePath: tempPath,
            fileType: 'zip',
            showMenu: true,
            success: function () {
              wx.showToast({ title: '文件已打开，可点右上角分享', icon: 'none' });
              that.onCloseExportModal();
            }
          });
        }
      } else {
        wx.showToast({ title: '文件下载失败，请重试', icon: 'none' });
      }
    });
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
    var invoice = this.data.invoices.find(item => item.id === id);
    if (!invoice) return;

    if (invoice.filePath) {
      // 优先打开真实文件
      var isImage = invoice.fileName && invoice.fileName.match(/\.(jpg|jpeg|png|gif)$/i);
      
      wx.showLoading({ title: '正在下载原件...' });
      util.downloadFile(invoice.filePath, function (tempPath) {
        wx.hideLoading();
        if (tempPath) {
          if (isImage) {
            wx.previewImage({
              urls: [tempPath],
              current: tempPath
            });
          } else {
            wx.openDocument({
              filePath: tempPath,
              fileType: 'pdf',
              fail: function () {
                wx.showToast({ title: '无法打开此发票文件', icon: 'none' });
              }
            });
          }
        } else {
          wx.showToast({ title: '发票详情 (离线视图)', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: '发票详情', icon: 'none' });
    }
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

  onAddInvoice: function () {
    wx.navigateTo({ url: '/pages/home/index' });
  }
});
