var app = getApp()

Page({
  data: {
    isEdit: false,
    editId: '',
    name: '',
    taxNo: '',
    address: '',
    phone: '',
    bank: '',
    bankAccount: '',
    canSave: false
  },

  onLoad: function (options) {
    if (options.id) {
      var headers = app.globalData.invoiceHeaders
      for (var i = 0; i < headers.length; i++) {
        if (headers[i].id === options.id) {
          var h = headers[i]
          this.setData({
            isEdit: true,
            editId: options.id,
            name: h.name || '',
            taxNo: h.taxNo || '',
            address: h.address || '',
            phone: h.phone || '',
            bank: h.bank || '',
            bankAccount: h.bankAccount || ''
          })
          this.checkCanSave()
          break
        }
      }
    }
  },

  onNameInput: function (e) {
    this.setData({ name: e.detail.value })
    this.checkCanSave()
  },

  onTaxNoInput: function (e) {
    this.setData({ taxNo: e.detail.value })
    this.checkCanSave()
  },

  onAddressInput: function (e) {
    this.setData({ address: e.detail.value })
  },

  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value })
  },

  onBankInput: function (e) {
    this.setData({ bank: e.detail.value })
  },

  onBankAccountInput: function (e) {
    this.setData({ bankAccount: e.detail.value })
  },

  checkCanSave: function () {
    var canSave = this.data.name.trim() !== '' && this.data.taxNo.trim() !== ''
    this.setData({ canSave: canSave })
  },

  onSave: function () {
    if (!this.data.canSave) {
      wx.showToast({ title: '请填写名称和税号', icon: 'none' })
      return
    }

    var header = {
      name: this.data.name.trim(),
      taxNo: this.data.taxNo.trim(),
      address: this.data.address.trim(),
      phone: this.data.phone.trim(),
      bank: this.data.bank.trim(),
      bankAccount: this.data.bankAccount.trim()
    }

    var successTitle = this.data.isEdit ? '更新成功' : '保存成功'
    var onSaved = function () {
      wx.showToast({ title: successTitle, icon: 'success' })
      setTimeout(function () {
        wx.navigateBack()
      }, 1500)
    }
    if (this.data.isEdit) {
      app.updateInvoiceHeader(this.data.editId, header, onSaved)
    } else {
      app.addInvoiceHeader(header, onSaved)
    }
  },

  onDelete: function () {
    var that = this
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此发票抬头吗？',
      success: function (res) {
        if (res.confirm) {
          app.deleteInvoiceHeader(that.data.editId, function () {
            wx.showToast({ title: '删除成功', icon: 'success' })
            setTimeout(function () {
              wx.navigateBack()
            }, 1500)
          })
        }
      }
    })
  }
})
