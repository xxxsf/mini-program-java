Page({
  data:{
    city:'定位中',
    latitude:0,
    longitude:0,
    markers:[],
    activeTab:0,
    startText:'定位中'
  },
  onLoad(){
    const that = this;
    wx.getLocation({
      type:'gcj02',
      success(res){
        const {latitude, longitude} = res;
        that.setData({latitude, longitude, markers:[{id:1, latitude, longitude, iconPath:'/img/Taxi.png', width:24, height:24}]});
        // 反向地理编码（沿用现有项目用的百度接口）
        wx.request({
          url:`https://api.map.baidu.com/geocoder/v2/?ak=zIOkoO8wWrWA22ObIHPNkCgtLZpkP5lE&location=${latitude},${longitude}&output=json&pois=0`,
          method:'GET',
          success(r){
            const comp = r.data && r.data.result && r.data.result.addressComponent || {};
            const city = comp.city || '未知城市';
            const street = r.data && r.data.result && r.data.result.sematic_description || '';
            that.setData({city, startText: `${city}${street?('·'+street):''}`});
          }
        });
      }
    });
  },
  switchTab(e){
    this.setData({activeTab: Number(e.currentTarget.dataset.idx) });
  },
  onSearch(e){
    const value = (e.detail || {}).value || '';
    // 仅UI占位，后续可跳转到搜索页
    if(value){
      wx.showToast({title:`目标：${value}`, icon:'none'});
    }
  },
  goReserve(){wx.showToast({title:'预约拼单（占位）',icon:'none'})},
  goHelp(){wx.showToast({title:'帮人叫船（占位）',icon:'none'})},
  goBus(){wx.showToast({title:'站点巴士（占位）',icon:'none'})},
  goDrive(){wx.showToast({title:'手机驾驭（占位）',icon:'none'})}
});