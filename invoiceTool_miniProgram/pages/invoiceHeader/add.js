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
      if (line.match(/(名称|单位名称|抬头名称|公司名称|名称:|公司:|抬头:|单位:)/)) {
        parsedData.name = line.replace(/(名称|单位名称|抬头名称|公司名称|名称:|公司:|抬头:|单位:|:：)/g, '').trim();
      }
      // 智能识别税号
      else if (line.match(/(税号|纳税人识别号|信用代码|统一社会信用代码|纳税人识别号:|税号:)/)) {
        parsedData.taxNo = line.replace(/(税号|纳税人识别号|信用代码|统一社会信用代码|纳税人识别号:|税号:|:：)/g, '').trim();
      }
      // 智能识别地址
      else if (line.match(/(地址|单位地址|公司地址|注册地址|地址:)/)) {
        parsedData.address = line.replace(/(地址|单位地址|公司地址|注册地址|地址:|:：)/g, '').trim();
      }
      // 智能识别电话
      else if (line.match(/(电话|联系电话|电话号码|公司电话|电话:)/)) {
        parsedData.phone = line.replace(/(电话|联系电话|电话号码|公司电话|电话:|:：)/g, '').trim();
      }
      // 智能识别开户行
      else if (line.match(/(开户行|开户银行|开户行:|银行:|开户行名称)/)) {
        parsedData.bank = line.replace(/(开户行|开户银行|开户行:|银行:|开户行名称|:：)/g, '').trim();
      }
      // 智能识别银行账号
      else if (line.match(/(账号|银行账号|银行账户|账户|账号:)/)) {
        parsedData.bankAccount = line.replace(/(账号|银行账号|银行账户|账户|账号:|:：)/g, '').trim();
      }
    }

    // 2. 兜底正则匹配（如果某些单行没有明显的冒号引导词，通过强特征正则直接捞取）
    
    // 兜底匹配税号 (标准 15位, 18位 或 20位大写字母和数字组合)
    if (!parsedData.taxNo) {
      var taxMatch = text.match(/[A-Z0-9]{15,20}/);
      if (taxMatch) {
        parsedData.taxNo = taxMatch[0];
      }
    }

    // 兜底匹配银行账号 (12位到25位的纯数字/含空格组合)
    if (!parsedData.bankAccount) {
      var cleanTextForAccount = text.replace(/[^0-9]/g, ' '); // 移除非数字
      var accounts = cleanTextForAccount.match(/\b\d{12,25}\b/g);
      if (accounts) {
        // 过滤掉可能是手机号或税号的纯数字
        for (var k = 0; i < accounts.length; k++) {
          var possibleAccount = accounts[k];
          if (possibleAccount.length !== 18 && possibleAccount.length !== 11) {
            parsedData.bankAccount = possibleAccount;
            break;
          }
        }
      }
    }

    // 兜底匹配电话号码 (固定电话 xxx-xxxxxxx 或 手机号 1xxxxxxxxxx)
    if (!parsedData.phone) {
      var phoneMatch = text.match(/((\d{3,4}-\d{7,8})|1[3-9]\d{9})/);
      if (phoneMatch) {
        parsedData.phone = phoneMatch[0];
      }
    }

    // 兜底匹配公司名称 (寻找包含“公司”、“厂”、“院”、“局”、“中心”、“学”等名称特征的长词)
    if (!parsedData.name) {
      var nameLines = lines.filter(function(l) {
        return l.match(/(公司|集团|分公司|厂|大学|学院|局|所|院|医院|合伙|商行|部|中心)/);
      });
      if (nameLines.length > 0) {
        parsedData.name = nameLines[0].replace(/(名称|单位名称|抬头名称|公司名称|名称:|公司:|抬头:|:：)/g, '').trim();
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

    var headers = wx.getStorageSync('invoice_headers') || [];
    var item = {
      id: data.id || String(Date.now()),
      name: data.name.trim(),
      taxNo: data.taxNo.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      bank: data.bank.trim(),
      bankAccount: data.bankAccount.trim()
    };

    if (data.isEdit) {
      var idx = headers.findIndex(function (h) { return h.id === data.id; });
      if (idx >= 0) headers[idx] = item;
    } else {
      headers.push(item);
    }

    wx.setStorageSync('invoice_headers', headers);
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(function () { wx.navigateBack(); }, 1000);
  }
});
