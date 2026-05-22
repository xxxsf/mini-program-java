// pages/boat/route/index.js

Page({
  data: {
    mapHeight: 520,
    origin: { lat: 0, lng: 0 },
    dest: { lat: 0, lng: 0, name: '' },
    markers: [],
    polyline: [],
    distanceKm: '0.0',
    durationMin: '0',
    boatTypes: [
      { id: 'b1', name: '惊喜特价', desc: '天天有折扣', price: 68.8, icon: '/img/vehicle.png' },
      { id: 'b2', name: '博道快线', desc: '6座标配', price: 98.8, icon: '/img/vehicle.png' },
      { id: 'b3', name: '博道豪华船', desc: '舒适服务', price: 198.8, icon: '/img/vehicle.png' }
    ],
    selectedType: 'b1'
  },

  onLoad(query) {
    const sys = wx.getSystemInfoSync();
    this.setData({ mapHeight: sys.windowHeight });
    let dest = null;
    try { dest = JSON.parse(decodeURIComponent(query.dest || '')); } catch (_) {}
    if (dest && dest.location) {
      this.setData({ dest: { lat: dest.location.lat, lng: dest.location.lng, name: dest.name } });
    }
    // 获取当前位置作为起点
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const origin = { lat: res.latitude, lng: res.longitude };
        this.setData({ origin });
        this.drawRoute();
      },
      fail: () => {
        // 无法定位时，以目的地附近构造示例起点
        if (this.data.dest.lat) {
          const origin = { lat: this.data.dest.lat + 0.01, lng: this.data.dest.lng + 0.01 };
          this.setData({ origin });
          this.drawRoute();
        }
      }
    });
  },

  drawRoute() {
    const { origin, dest } = this.data;
    if (!origin.lat || !dest.lat) return;
    const markers = [
      { id: 1, latitude: origin.lat, longitude: origin.lng, iconPath: '/img/people.png', width: 24, height: 24 },
      { id: 2, latitude: dest.lat, longitude: dest.lng, iconPath: '/img/to.png', width: 24, height: 24 }
    ];
    const polyline = [{ points: [ { latitude: origin.lat, longitude: origin.lng }, { latitude: dest.lat, longitude: dest.lng } ], color: '#1E90FF', width: 4 }];
    const distance = this.calcDistance(origin.lat, origin.lng, dest.lat, dest.lng); // meters
    const km = (distance / 1000).toFixed(1);
    // 简单用平均速度 30km/h 预估时间
    const durationMin = Math.max(1, Math.round((distance / 1000) / 30 * 60));
    this.setData({ markers, polyline, distanceKm: km, durationMin });
  },

  calcDistance(lat1, lon1, lat2, lon2) {
    const toRad = (d) => d * Math.PI / 180;
    const R = 6378137;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  chooseType(e) {
    this.setData({ selectedType: e.detail.value });
  },

  callBoat() {
    const { selectedType, dest } = this.data;
    wx.showToast({ title: `已呼叫(${selectedType}) → ${dest.name || '目的地'}`, icon: 'none' });
  }
});