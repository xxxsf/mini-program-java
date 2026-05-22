var baseURL = 'http://localhost:8080/';
var rootDocment = baseURL + 'api/';

var wxAppinfo = {
  'name': '微信发票助手',
  'logo': '/img/logo.png'
};

var AppConf = { 'appid': 'wxea2ccba308593803', 'appsecret': 'de7b8dd83ffb3a91c8479c25c6de26bc' };

function req(url, data, cb) {
  data.appid = AppConf.appid;
  data.appsecret = AppConf.appsecret;
  wx.request({
    url: rootDocment + url,
    data: data,
    method: 'post',
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    success: function (res) {
      return typeof cb == 'function' && cb(res.data);
    },
    fail: function () {
      return typeof cb == 'function' && cb(false);
    }
  });
}

function getReq(url, data, cb) {
  data.appid = AppConf.appid;
  data.appsecret = AppConf.appsecret;
  wx.request({
    url: rootDocment + url,
    data: data,
    method: 'get',
    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
    success: function (res) {
      return typeof cb == 'function' && cb(res.data);
    },
    fail: function () {
      return typeof cb == 'function' && cb(false);
    }
  });
}

function formatTime(date) {
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  var d = date.getDate();
  return y + '年' + m + '月' + d + '日';
}

module.exports = {
  req: req,
  getReq: getReq,
  formatTime: formatTime,
  wxAppinfo: wxAppinfo,
  baseURL: baseURL
};
