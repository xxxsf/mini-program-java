// // 自动判断环境：开发者工具用 localhost，生产用云托管
// var isDevtools = false;
// try {
//   isDevtools = (typeof __wxConfig !== 'undefined' && __wxConfig.platform === 'devtools');
// } catch (e) {
//   isDevtools = false;
// }

// var baseURL = isDevtools 
//   ? 'http://localhost:8080/' 
//   : 'https://springboot-yncv-260962-4-1386111991.sh.run.tcloudbase.com/';
// var rootDocment = baseURL + 'api/';

// 手动切换（如需强制指定，取消下面注释）：
// var baseURL = 'http://localhost:8080/';
var baseURL = 'https://springboot-yncv-260962-4-1386111991.sh.run.tcloudbase.com/';

var wxAppinfo = {
  'name': '微信发票助手',
  'logo': '/img/logo.png'
};

var AppConf = { 'appid': 'wxb95ae2df41575bc3' };

function req(url, data, cb) {
  data.appid = AppConf.appid;
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

function jsonReq(url, data, cb) {
  wx.request({
    url: rootDocment + url,
    data: data || {},
    method: 'post',
    header: { 'Content-Type': 'application/json' },
    success: function (res) {
      return typeof cb == 'function' && cb(res.data);
    },
    fail: function () {
      return typeof cb == 'function' && cb(false);
    }
  });
}

function uploadFile(filePath, name, formData, cb) {
  wx.uploadFile({
    url: rootDocment + 'upload',
    filePath: filePath,
    name: name || 'file',
    formData: formData || {},
    success: function (res) {
      var data = false;
      try {
        data = JSON.parse(res.data);
      } catch (e) {
        data = false;
      }
      return typeof cb == 'function' && cb(data);
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
  jsonReq: jsonReq,
  uploadFile: uploadFile,
  formatTime: formatTime,
  wxAppinfo: wxAppinfo,
  baseURL: baseURL
};
