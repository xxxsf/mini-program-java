var app = getApp()

Page({
  data: {
    invoices: [],
    filteredInvoices: [],
    searchText: '',
    batchMode: false,
    allSelected: false,
    selectedCount: 0,
    showTimeFilter: false,
    showStatusFilter: false,
    showTypeFilter: false,
    timeFilter: '',
    statusFilter: '',
    typeFilter: ''
  },

  onShow: function () {
    var that = this
    app.loadInvoices()
    setTimeout(function () {
      var invoices = app.globalData.invoices.map(function (inv) {
        var d = new Date(inv.date || inv.createTime)
        inv.dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'
        inv.selected = false
        return inv
      })
      that.setData({ invoices: invoices })
      that.applyFilters()
    }, 300)
  },

  onSearchInput: function (e) {
    this.setData({ searchText: e.detail.value })
    this.applyFilters()
  },

  applyFilters: function () {
    var that = this
    var list = this.data.invoices.slice()
    var search = this.data.searchText.toLowerCase()

    if (search) {
      list = list.filter(function (inv) {
        return (inv.sellerName || '').toLowerCase().indexOf(search) !== -1 ||
               (inv.buyerName || '').toLowerCase().indexOf(search) !== -1
      })
    }

    if (this.data.typeFilter) {
      list = list.filter(function (inv) {
        return inv.category === that.data.typeFilter
      })
    }

    if (this.data.statusFilter) {
      list = list.filter(function (inv) {
        return inv.status === that.data.statusFilter
      })
    }

    if (this.data.timeFilter) {
      var now = Date.now()
      var range = { week: 7, month: 30, quarter: 90, year: 365 }
      var days = range[this.data.timeFilter] || 365
      var cutoff = now - days * 24 * 60 * 60 * 1000
      list = list.filter(function (inv) {
        return (inv.date || inv.createTime) >= cutoff
      })
    }

    this.setData({ filteredInvoices: list })
    this.updateSelectedCount()
  },

  onToggleBatch: function () {
    var batchMode = !this.data.batchMode
    if (!batchMode) {
      var invoices = this.data.invoices.map(function (inv) {
        inv.selected = false
        return inv
      })
      this.setData({ invoices: invoices, batchMode: false, allSelected: false, selectedCount: 0 })
      this.applyFilters()
    } else {
      this.setData({ batchMode: true })
    }
  },

  onToggleSelect: function (e) {
    var id = e.currentTarget.dataset.id
    var invoices = this.data.invoices
    for (var i = 0; i < invoices.length; i++) {
      if (String(invoices[i].id) === String(id)) {
        invoices[i].selected = !invoices[i].selected
        break
      }
    }
    this.setData({ invoices: invoices })
    this.applyFilters()
  },

  onSelectAll: function () {
    var allSelected = !this.data.allSelected
    var invoices = this.data.invoices.map(function (inv) {
      inv.selected = allSelected
      return inv
    })
    this.setData({ invoices: invoices, allSelected: allSelected })
    this.applyFilters()
  },

  updateSelectedCount: function () {
    var count = 0
    var filtered = this.data.filteredInvoices
    for (var i = 0; i < filtered.length; i++) {
      if (filtered[i].selected) count++
    }
    var allSelected = filtered.length > 0 && count === filtered.length
    this.setData({ selectedCount: count, allSelected: allSelected })
  },

  onBatchDelete: function () {
    var that = this
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先选择发票', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认删除',
      content: '确定要删除选中的' + this.data.selectedCount + '张发票吗？',
      success: function (res) {
        if (res.confirm) {
          var ids = []
          var invoices = that.data.invoices
          for (var i = 0; i < invoices.length; i++) {
            if (invoices[i].selected) ids.push(invoices[i].id)
          }
          app.deleteInvoices(ids, function () {
            that.setData({ batchMode: false })
            that.onShow()
            wx.showToast({ title: '删除成功', icon: 'success' })
          })
        }
      }
    })
  },

  onAddInvoice: function () {
    wx.navigateTo({ url: '/pages/invoice/upload/index' })
  },

  onInvoiceTap: function (e) {
    if (this.data.batchMode) {
      this.onToggleSelect(e)
      return
    }
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/invoice/detail/index?id=' + id })
  },

  onFilterTime: function () {
    this.setData({
      showTimeFilter: !this.data.showTimeFilter,
      showStatusFilter: false,
      showTypeFilter: false
    })
  },

  onFilterStatus: function () {
    this.setData({
      showTimeFilter: false,
      showStatusFilter: !this.data.showStatusFilter,
      showTypeFilter: false
    })
  },

  onFilterType: function () {
    this.setData({
      showTimeFilter: false,
      showStatusFilter: false,
      showTypeFilter: !this.data.showTypeFilter
    })
  },

  onCloseFilter: function () {
    this.setData({
      showTimeFilter: false,
      showStatusFilter: false,
      showTypeFilter: false
    })
  },

  onSelectTimeFilter: function (e) {
    this.setData({ timeFilter: e.currentTarget.dataset.value, showTimeFilter: false })
    this.applyFilters()
  },

  onSelectStatusFilter: function (e) {
    this.setData({ statusFilter: e.currentTarget.dataset.value, showStatusFilter: false })
    this.applyFilters()
  },

  onSelectTypeFilter: function (e) {
    this.setData({ typeFilter: e.currentTarget.dataset.value, showTypeFilter: false })
    this.applyFilters()
  }
})
