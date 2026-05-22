// pages/boat/search/index.js

const QQ_MAP_KEY = ''; // 如需真实搜索，请填入腾讯位置服务 WebService KEY

Page({
  data: {
    keyword: '',
    results: [],
    history: [],
    latitude: null,
    longitude: null
  },

  onLoad() {
    // 读取历史
    const history = wx.getStorageSync('search_history') || [];
    this.setData({ history });
    // 获取当前位置以便计算距离
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({ latitude: res.latitude, longitude: res.longitude });
      }
    });
  },

  onInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ keyword });
  },

  doSearch() {
    const { keyword } = this.data;
    if (!keyword) return;
    if (!QQ_MAP_KEY) {
      // 无 KEY 时提供示例数据，保证流程可用
      const demo = [
        { id: 'd1', name: 'Bokus博库码头（温州点）', address: '浙江省温州市鹿城区文化街1号', location: { lat: 27.998, lng: 120.666 } },
        { id: 'd2', name: '温州南门码头', address: '温州南门街道江边路88号', location: { lat: 27.999, lng: 120.671 } },
        { id: 'd3', name: '三垟湿地码头', address: '温州三垟湿地公园北门', location: { lat: 27.990, lng: 120.680 } }
      ];
      this.setData({ results: this.withDistance(demo) });
      return;
    }
    // 真实联网上搜（需 KEY）
    const { latitude, longitude } = this.data;
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/suggestion',
      method: 'GET',
      data: {
        keyword,
        key: QQ_MAP_KEY,
        region_fix: 1,
        location: latitude && longitude ? `${latitude},${longitude}` : ''
      },
      success: (res) => {
        const list = (res.data && res.data.data) || [];
        const mapped = list.map((it, idx) => ({
          id: it.id || String(idx),
          name: it.title,
          address: it.address,
          location: { lat: it.location.lat, lng: it.location.lng }
        }));
        this.setData({ results: this.withDistance(mapped) });
      },
      fail: () => {
        wx.showToast({ title: '搜索失败', icon: 'none' });
      }
    });
  },

  withDistance(list) {
    const { latitude, longitude } = this.data;
    if (!latitude || !longitude) return list;
    return list.map((it) => {
      const d = this.calcDistance(latitude, longitude, it.location.lat, it.location.lng);
      return Object.assign({}, it, { _distance: (d / 1000).toFixed(1) });
    });
  },

  calcDistance(lat1, lon1, lat2, lon2) {
    const toRad = (d) => d * Math.PI / 180;
    const R = 6378137; // 地球半径
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  chooseOnMap() {
    wx.chooseLocation({
      success: (res) => {
        const item = {
          id: 'mapSel',
          name: res.name || res.address || '所选位置',
          address: res.address || '',
          location: { lat: res.latitude, lng: res.longitude }
        };
        this.goRoute(item);
      }
    });
  },

  tapHistory(e) {
    const item = e.currentTarget.dataset.item;
    this.goRoute(item);
  },

  pickPlace(e) {
    const item = e.currentTarget.dataset.item;
    // 保存到历史
    const history = this.data.history.slice(0);
    history.unshift({ name: item.name, address: item.address, location: item.location });
    wx.setStorageSync('search_history', history.slice(0, 10));
    this.setData({ history: history.slice(0, 10) });
    this.goRoute(item);
  },

  clearHistory() {
    wx.removeStorageSync('search_history');
    this.setData({ history: [] });
  },

  goRoute(item) {
    const q = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({ url: `/pages/boat/route/index?dest=${q}` });
  }
});