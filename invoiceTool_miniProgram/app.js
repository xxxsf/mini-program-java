App({
  onLaunch: function () {
    this.checkLogin()
    this.loadInvoiceHeaders()
    this.loadInvoices()
  },

  // ===== 登录认证 =====

  checkLogin: function () {
    var that = this
    try {
      var userInfo = wx.getStorageSync('userInfo')
      if (userInfo && userInfo.nickName) {
        that.globalData.userInfo = userInfo
        that.globalData.isLoggedIn = true

        wx.checkSession({
          success: function () {
            // session 有效
          },
          fail: function () {
            that.silentLogin()
          }
        })
      }
    } catch (e) {
      console.error('检查登录状态失败', e)
    }
  },

  silentLogin: function () {
    wx.login({
      success: function (res) {
        if (res.code) {
          // 获取到 code，可用于向后端换取 session_key
          // 当前为本地模式，仅刷新登录态
          console.log('静默登录成功，code:', res.code)
        }
      }
    })
  },

  onLoginSuccess: function (userInfo) {
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true
    wx.setStorageSync('userInfo', userInfo)
  },

  logout: function () {
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('userInfo')
    wx.reLaunch({ url: '/pages/invoice/login/index' })
  },

  checkAuth: function () {
    if (!this.globalData.isLoggedIn) {
      wx.reLaunch({ url: '/pages/invoice/login/index' })
      return false
    }
    return true
  },

  // ===== 发票抬头管理 =====

  loadInvoiceHeaders: function () {
    try {
      var headers = wx.getStorageSync('invoiceHeaders')
      if (headers) {
        this.globalData.invoiceHeaders = headers
      }
    } catch (e) {
      console.error('加载发票抬头失败', e)
    }
  },

  loadInvoices: function () {
    try {
      var invoices = wx.getStorageSync('invoices')
      if (invoices) {
        this.globalData.invoices = invoices
      }
    } catch (e) {
      console.error('加载发票失败', e)
    }
  },

  saveInvoiceHeaders: function () {
    wx.setStorageSync('invoiceHeaders', this.globalData.invoiceHeaders)
  },

  saveInvoices: function () {
    wx.setStorageSync('invoices', this.globalData.invoices)
  },

  addInvoiceHeader: function (header) {
    header.id = Date.now().toString()
    this.globalData.invoiceHeaders.push(header)
    this.saveInvoiceHeaders()
  },

  updateInvoiceHeader: function (id, header) {
    var headers = this.globalData.invoiceHeaders
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].id === id) {
        headers[i] = Object.assign(headers[i], header)
        break
      }
    }
    this.saveInvoiceHeaders()
  },

  deleteInvoiceHeader: function (id) {
    this.globalData.invoiceHeaders = this.globalData.invoiceHeaders.filter(function (h) {
      return h.id !== id
    })
    this.saveInvoiceHeaders()
  },

  addInvoice: function (invoice) {
    invoice.id = Date.now().toString()
    invoice.createTime = new Date().getTime()
    this.globalData.invoices.unshift(invoice)
    this.saveInvoices()
  },

  deleteInvoice: function (id) {
    this.globalData.invoices = this.globalData.invoices.filter(function (inv) {
      return inv.id !== id
    })
    this.saveInvoices()
  },

  deleteInvoices: function (ids) {
    this.globalData.invoices = this.globalData.invoices.filter(function (inv) {
      return ids.indexOf(inv.id) === -1
    })
    this.saveInvoices()
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    invoiceHeaders: [],
    invoices: []
  }
})
