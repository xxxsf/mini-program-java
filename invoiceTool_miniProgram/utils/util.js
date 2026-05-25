// 自动判断环境：开发者工具用 localhost 或自定义，真机直接使用 callContainer 免域名呼叫
var isDevtools = false;
try {
  isDevtools = (typeof __wxConfig !== 'undefined' && __wxConfig.platform === 'devtools');
} catch (e) {
  isDevtools = false;
}

// 开发者工具下使用的本地/开发域名
var baseURL = 'https://springboot-yncv-260962-4-1386111991.sh.run.tcloudbase.com/';
var rootDocment = baseURL + 'api/';

var wxAppinfo = {
  'name': '微信发票助手',
  'logo': '/img/logo.png'
};

var AppConf = { 'appid': 'wxb95ae2df41575bc3' };

// 云托管配置
var cloudConfig = {
  env: 'prod-yncv-260962',      // 云托管环境 ID（带 prod- 前缀）
  service: 'springboot'    // 云托管服务名
};

function req(url, data, cb) {
  data.appid = AppConf.appid;
  
  if (!isDevtools) {
    // 真机：使用免域名的 callContainer 访问
    wx.cloud.callContainer({
      config: { env: cloudConfig.env },
      path: '/api/' + url,
      header: {
        'X-WX-SERVICE': cloudConfig.service,
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      data: data,
      success: function (res) {
        return typeof cb == 'function' && cb(res.data);
      },
      fail: function (err) {
        console.error('[CallContainer] post fail:', err);
        return typeof cb == 'function' && cb(false);
      }
    });
  } else {
    // 开发者工具：依然使用 request 方便开发者联调
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
}

function getReq(url, data, cb) {
  data.appid = AppConf.appid;

  if (!isDevtools) {
    wx.cloud.callContainer({
      config: { env: cloudConfig.env },
      path: '/api/' + url,
      header: {
        'X-WX-SERVICE': cloudConfig.service,
        'content-type': 'application/x-www-form-urlencoded'
      },
      method: 'GET',
      data: data,
      success: function (res) {
        return typeof cb == 'function' && cb(res.data);
      },
      fail: function (err) {
        console.error('[CallContainer] get fail:', err);
        return typeof cb == 'function' && cb(false);
      }
    });
  } else {
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
}

function jsonReq(url, data, cb) {
  if (!isDevtools) {
    wx.cloud.callContainer({
      config: { env: cloudConfig.env },
      path: '/api/' + url,
      header: {
        'X-WX-SERVICE': cloudConfig.service,
        'content-type': 'application/json'
      },
      method: 'POST',
      data: data || {},
      success: function (res) {
        return typeof cb == 'function' && cb(res.data);
      },
      fail: function (err) {
        console.error('[CallContainer] jsonPost fail:', err);
        return typeof cb == 'function' && cb(false);
      }
    });
  } else {
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
}

function uploadFile(filePath, name, formData, cb) {
  if (!isDevtools) {
    // 真机免域名上传：使用 callContainer 传递 filePath 参数
    wx.cloud.callContainer({
      config: { env: cloudConfig.env },
      path: '/api/upload',
      header: {
        'X-WX-SERVICE': cloudConfig.service
      },
      method: 'POST',
      filePath: filePath,
      name: name || 'file',
      formData: formData || {},
      success: function (res) {
        var data = false;
        try {
          // callContainer 在返回 json 时，res.data 已经是解析好的 Object 对象，不需要再次 JSON.parse
          if (typeof res.data === 'string') {
            data = JSON.parse(res.data);
          } else {
            data = res.data;
          }
        } catch (e) {
          console.error('[CallContainer] parse response fail:', e);
          data = false;
        }
        return typeof cb == 'function' && cb(data);
      },
      fail: function (err) {
        console.error('[CallContainer] upload fail:', err);
        var errMsg = '微信底层网络异常';
        if (err) {
          errMsg = err.errMsg || JSON.stringify(err) || errMsg;
        }
        return typeof cb == 'function' && cb({ status: 0, msg: errMsg });
      }
    });
  } else {
    // 开发者工具继续使用原有普通上传
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
