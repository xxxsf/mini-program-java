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
    canSave: false,
    privacyAgreed: false
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

  onPrivacyChange: function () {
    this.setData({ privacyAgreed: !this.data.privacyAgreed })
  },

  onViewPrivacy: function () {
    wx.showModal({
      title: '隐私政策',
      content: '本小程序收集您的发票抬头信息（包括名称、税号、地址、电话、开户行及账号），仅用于帮助您管理和开具发票。\n\n1. 数据用途：仅用于发票管理功能\n2. 数据存储：数据仅存储在您的设备和我们的服务器，用于同步功能\n3. 数据共享：我们不会向任何第三方共享或出售您的信息\n4. 数据安全：我们采取安全措施保护您的数据\n5. 用户权利：您可以随时删除您的数据',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  onSave: function () {
    if (!this.data.canSave) {
      wx.showToast({ title: '请填写名称和税号', icon: 'none' })
      return
    }
    if (!this.data.privacyAgreed) {
      wx.showToast({ title: '请先同意隐私政策', icon: 'none' })
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
