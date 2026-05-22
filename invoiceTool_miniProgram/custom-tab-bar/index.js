Component({
  data: {
    selected: 0,
    list: []
  },
  attached() {
    // Try to load from global config; fallback to app.json-like list
    let list = [];
    try {
      const app = getApp();
      const cfg = app?.globalData?.tabBarConfig;
      if (cfg && Array.isArray(cfg.list)) {
        list = cfg.list;
      }
    } catch (e) {}

    if (!list || !list.length) {
      list = [
        { pagePath: '/pages/boat/index', text: '首页', iconPath: '/img/index.png', selectedIconPath: '/img/index.png' },
        { pagePath: '/pages/boat/captain/index', text: '船主', iconPath: '/img/driver.png', selectedIconPath: '/img/driver.png' },
        { pagePath: '/pages/my/index', text: '个人中心', iconPath: '/img/account.png', selectedIconPath: '/img/account.png' }
      ];
    }

    // Set list and selected based on current route
    this.setData({ list });
    const pages = getCurrentPages();
    const route = pages && pages.length ? pages[pages.length - 1].route : '';
    const idx = list.findIndex(item => (item.pagePath || '').replace(/^\//, '') === route);
    this.setData({ selected: idx >= 0 ? idx : 0 });
  },
  methods: {
    switchTab(e) {
      const i = Number(e.currentTarget.dataset.index);
      this.setData({ selected: i });
      const list = this.data.list || [];
      const target = list[i];
      if (target && target.pagePath) {
        wx.switchTab({ url: target.pagePath });
      }
    }
  }
});