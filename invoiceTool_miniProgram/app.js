var util = require('./utils/util.js')

App({
  onLaunch: function () {
    // 初始化微信云托管环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'prod-yncv-260962', // 您的云托管环境 ID（必须带 prod- 前缀）
        traceUser: true
      })
    } else {
      console.error('当前微信基础库不支持云托管，请升级基础库')
    }
    this.checkLogin()
    this.loadInvoiceHeaders()
    this.loadInvoices()
  },

  // ===== 登录认证 =====

  checkLogin: function () {
    var that = this
    try {
      var userInfo = wx.getStorageSync('userInfo')
      var sk = wx.getStorageSync('sk')
      if (userInfo && userInfo.nickName && sk) {
        that.globalData.userInfo = userInfo
        that.globalData.sk = sk
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
          console.log('静默登录成功，code:', res.code)
        }
      }
    })
  },

  onLoginSuccess: function (userInfo, sk) {
    this.globalData.userInfo = userInfo
    this.globalData.sk = sk
    this.globalData.isLoggedIn = true
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('sk', sk)
    this.loadInvoiceHeaders()
    this.loadInvoices()
  },

  setUserInfo: function (userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  setSk: function (sk) {
    this.globalData.sk = sk
    this.globalData.isLoggedIn = true
    wx.setStorageSync('sk', sk)
  },

  logout: function () {
    this.globalData.userInfo = null
    this.globalData.sk = ''
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('sk')
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
    var that = this
    if (this.globalData.sk) {
      util.req('invoiceHeader/list', { sk: this.globalData.sk }, function (data) {
        if (data && data.status == 1) {
          that.globalData.invoiceHeaders = data.data || []
          wx.setStorageSync('invoiceHeaders', that.globalData.invoiceHeaders)
        }
      })
      return
    }
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
    var that = this
    if (this.globalData.sk) {
      util.req('invoice/list', { sk: this.globalData.sk }, function (data) {
        if (data && data.status == 1) {
          that.globalData.invoices = data.data || []
          wx.setStorageSync('invoices', that.globalData.invoices)
        }
      })
      return
    }
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

  addInvoiceHeader: function (header, cb) {
    var that = this
    util.jsonReq('invoiceHeader/save?sk=' + this.globalData.sk, header, function (data) {
      if (data && data.status == 1) {
        that.loadInvoiceHeaders()
      }
      if (typeof cb == 'function') cb(data)
    })
  },

  updateInvoiceHeader: function (id, header, cb) {
    header.id = parseInt(id)
    this.addInvoiceHeader(header, cb)
  },

  deleteInvoiceHeader: function (id, cb) {
    var that = this
    util.req('invoiceHeader/delete', { sk: this.globalData.sk, id: id }, function (data) {
      if (data && data.status == 1) {
        that.loadInvoiceHeaders()
      }
      if (typeof cb == 'function') cb(data)
    })
  },

  addInvoice: function (invoice, cb) {
    var that = this
    util.jsonReq('invoice/save?sk=' + this.globalData.sk, invoice, function (data) {
      if (data && data.status == 1) {
        that.loadInvoices()
      }
      if (typeof cb == 'function') cb(data)
    })
  },

  deleteInvoice: function (id, cb) {
    var that = this
    util.req('invoice/delete', { sk: this.globalData.sk, id: id }, function (data) {
      if (data && data.status == 1) {
        that.loadInvoices()
      }
      if (typeof cb == 'function') cb(data)
    })
  },

  deleteInvoices: function (ids, cb) {
    var that = this
    var finished = 0
    if (!ids.length) {
      if (typeof cb == 'function') cb({ status: 1 })
      return
    }
    ids.forEach(function (id) {
      that.deleteInvoice(id, function () {
        finished++
        if (finished === ids.length && typeof cb == 'function') cb({ status: 1 })
      })
    })
  },

  globalData: {
    userInfo: null,
    sk: '',
    isLoggedIn: false,
    invoiceHeaders: [],
    invoices: []
  }
})
