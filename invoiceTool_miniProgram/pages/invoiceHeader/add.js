Page({
  data: {
    id: '',
    name: '',
    taxNo: '',
    address: '',
    phone: '',
    bank: '',
    bankAccount: '',
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
