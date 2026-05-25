Page({
  data: {
    id: '',
    name: '',
    taxNo: '',
    address: '',
    phone: '',
    bank: '',
    bankAccount: '',
    smartText: '',
    isEdit: false
  },

  onLoad: function (options) {
    if (options.id) {
      var headers = wx.getStorageSync('invoice_headers') || [];
      var item = headers.find(function (h) { return h.id === options.id; });
      if (item) {
        this.setData({
          id: item.id,
          name: item.name || '',
          taxNo: item.taxNo || '',
          address: item.address || '',
          phone: item.phone || '',
          bank: item.bank || '',
          bankAccount: item.bankAccount || '',
          isEdit: true
        });
      }
    }
  },

  onNameInput: function (e) { this.setData({ name: e.detail.value }); },
  onTaxInput: function (e) { this.setData({ taxNo: e.detail.value }); },
  onAddressInput: function (e) { this.setData({ address: e.detail.value }); },
  onPhoneInput: function (e) { this.setData({ phone: e.detail.value }); },
  onBankInput: function (e) { this.setData({ bank: e.detail.value }); },
  onAccountInput: function (e) { this.setData({ bankAccount: e.detail.value }); },

  onSmartInput: function (e) {
    this.setData({ smartText: e.detail.value });
  },

  onSmartParse: function () {
    var text = this.data.smartText;
    if (!text || !text.trim()) {
      wx.showToast({ title: '请先粘贴或输入需要识别的发票信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在识别中...' });

    // 辅助清洗函数：清除行首的 bullet (•)、*、-、数字序号、冒号、空格等噪音字符
    var cleanField = function (val) {
      if (!val) return '';
      // 1. 去除行首的 • 、*、-、以及数字编号（如 1. 2. 等）
      var cleaned = val.replace(/^[•\s\-\*\d\.．]+/g, '');
      // 2. 去除行首的各种冒号（包括中文 ：和英文 :）
      cleaned = cleaned.replace(/^[:：\s]+/g, '');
      return cleaned.trim();
    };

    var parsedData = {
      name: '',
      taxNo: '',
      address: '',
      phone: '',
      bank: '',
      bankAccount: ''
    };

    // 1. 将文本按常见分隔符（换行、逗号、分号等）拆分成单行
    var lines = text.split(/[\n\r,，、;；]/);

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      // 智能识别名称
      if (line.match(/(名称|单位名称|抬头名称|公司名称|抬头:)/)) {
        var rawVal = line.replace(/(名称|单位名称|抬头名称|公司名称|公司|抬头|单位|:：)/g, '');
        parsedData.name = cleanField(rawVal);
      }
      // 智能识别税号
      else if (line.match(/(税号|纳税人识别号|信用代码|统一社会信用代码)/)) {
        var rawVal = line.replace(/(纳税人识别号|统一社会信用代码|信用代码|税号|:：)/g, '');
        parsedData.taxNo = cleanField(rawVal);
      }
      // 智能识别地址
      else if (line.match(/(地址|单位地址|公司地址|注册地址)/)) {
        var rawVal = line.replace(/(单位地址|公司地址|注册地址|地址|:：)/g, '');
        parsedData.address = cleanField(rawVal);
      }
      // 智能识别电话
      else if (line.match(/(电话|联系电话|电话号码|公司电话)/)) {
        var rawVal = line.replace(/(联系电话|电话号码|公司电话|电话|:：)/g, '');
        parsedData.phone = cleanField(rawVal);
      }
      // 智能识别开户行
      else if (line.match(/(开户行|开户银行|开户行名称)/)) {
        var rawVal = line.replace(/(开户行名称|开户银行|开户行|银行|:：)/g, '');
        parsedData.bank = cleanField(rawVal);
      }
      // 智能识别银行账号
      else if (line.match(/(账号|银行账号|银行账户|账户)/)) {
        // 防止银行行号（支付系统行号）混淆，优先提取纯数字的长账号
        if (line.indexOf('行号') === -1) {
          var rawVal = line.replace(/(银行账号|银行账户|账号|账户|:：)/g, '');
          parsedData.bankAccount = cleanField(rawVal);
        }
      }
    }

    // 2. 兜底强特征正则匹配（如果某些单行没有明显的引导词，通过正则直接捞取）
    
    // 兜底匹配税号 (标准 15位, 18位 或 20位大写字母和数字组合)
    if (!parsedData.taxNo) {
      var taxMatch = text.match(/\b[A-Z0-9]{15,20}\b/);
      if (taxMatch) {
        parsedData.taxNo = taxMatch[0];
      }
    }

    // 兜底匹配银行账号 (12位到25位的纯数字，且不属于手机号 11 位)
    if (!parsedData.bankAccount) {
      // 剔除非数字字符
      var cleanNumText = text.replace(/[^0-9\n]/g, ' '); 
      var accounts = cleanNumText.match(/\b\d{12,25}\b/g);
      if (accounts) {
        parsedData.bankAccount = accounts[0];
      }
    }

    // 兜底匹配电话号码：只在真正可能包含电话的单行中，匹配固定电话或手机号，避免错吸银行卡中段
    if (!parsedData.phone) {
      for (var j = 0; j < lines.length; j++) {
        var pl = lines[j];
        if (pl.match(/(电话|联系电话|手机|公司电话|座机|Tel|TEL|phone|PHONE)/i)) {
          var phoneMatch = pl.match(/((\d{3,4}-\d{7,8})|1[3-9]\d{9})/);
          if (phoneMatch) {
            parsedData.phone = phoneMatch[0];
            break;
          }
        }
      }
    }

    // 兜底匹配公司名称 (寻找包含“公司”、“厂”、“院”、“局”、“中心”、“学”等名称特征的长词)
    if (!parsedData.name) {
      var nameLines = lines.filter(function(l) {
        return l.match(/(公司|集团|分公司|厂|大学|学院|局|所|院|医院|合伙|商行|部|中心)/);
      });
      if (nameLines.length > 0) {
        var rawName = nameLines[0].replace(/(名称|单位名称|抬头名称|公司名称|抬头|单位|:：)/g, '');
        parsedData.name = cleanField(rawName);
      }
    }

    // 填充数据
    this.setData({
      name: parsedData.name || this.data.name,
      taxNo: parsedData.taxNo || this.data.taxNo,
      address: parsedData.address || this.data.address,
      phone: parsedData.phone || this.data.phone,
      bank: parsedData.bank || this.data.bank,
      bankAccount: parsedData.bankAccount || this.data.bankAccount
    });

    wx.hideLoading();
    wx.showToast({ title: '识别填充成功', icon: 'success' });
  },

  onSave: function () {
    var data = this.data;
    if (!data.name.trim()) {
      wx.showToast({ title: '请填写抬头名称', icon: 'none' });
      return;
    }

    var sk = wx.getStorageSync('sk');
    if (!sk) {
      wx.showToast({ title: '登录已失效，请重新登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在同步到云端...' });

    var item = {
      name: data.name.trim(),
      taxNo: data.taxNo.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      bank: data.bank.trim(),
      bankAccount: data.bankAccount.trim()
    };
    if (data.isEdit && data.id) {
      // 数据库 ID 是整数
      item.id = parseInt(data.id);
    }

    var util = require('../../utils/util.js');
    util.jsonReq('invoiceHeader/save?sk=' + sk, item, function (res) {
      wx.hideLoading();
      if (res && res.status == 1) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(function () { wx.navigateBack(); }, 1000);
      } else {
        // 网络请求失败，离线兜底写入本地缓存
        var headers = wx.getStorageSync('invoice_headers') || [];
        var fallbackItem = { ...item, id: data.id || String(Date.now()) };
        if (data.isEdit) {
          var idx = headers.findIndex(function (h) { return h.id === data.id; });
          if (idx >= 0) headers[idx] = fallbackItem;
        } else {
          headers.push(fallbackItem);
        }
        wx.setStorageSync('invoice_headers', headers);
        wx.showToast({ title: '保存成功（本地暂存）', icon: 'success' });
        setTimeout(function () { wx.navigateBack(); }, 1000);
      }
    });
  }
});
