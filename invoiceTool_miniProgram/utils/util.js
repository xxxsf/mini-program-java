// 是否强制使用公网 HTTPS 域名（开启后，真机只需打开“开发调试”即可完美免域名限制测试，100% 成功）
var forceUseDomain = false;
var forceUploadUseDomain = true;

// 自动判断环境：开发者工具用 localhost 或自定义，真机直接使用 callContainer 免域名呼叫
var isDevtools = false;
try {
  isDevtools = (typeof __wxConfig !== 'undefined' && __wxConfig.platform === 'devtools');
} catch (e) {
  isDevtools = false;
}

// 开发者工具和真机调试使用的公网域名
var baseURL = 'https://api.evotree.top/';
var rootDocment = baseURL + 'api/';

var wxAppinfo = {
  'name': '微信发票助手',
  'logo': '/img/logo.png'
};

var AppConf = { 'appid': 'wxb95ae2df41575bc3' };

// 云托管配置
var cloudConfig = {
  env: 'prod-d8g4lh96w1851d968',      // 云托管环境 ID
  service: 'springboot-yncv'    // 云托管服务名
};

function req(url, data, cb) {
  data.appid = AppConf.appid;

  if (!isDevtools && !forceUseDomain) {
    // 真机：使用免域名的 callContainer 访问
    if (!wx.cloud) {
      console.error('[req] wx.cloud 未初始化');
      return typeof cb == 'function' && cb(false);
    }
    console.log('[req] 使用 callContainer, env:', cloudConfig.env, 'service:', cloudConfig.service, 'url:', url);
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
        console.log('[CallContainer] success:', res);
        return typeof cb == 'function' && cb(res.data);
      },
      fail: function (err) {
        console.error('[CallContainer] fail:', err);
        console.error('[CallContainer] err.errMsg:', err.errMsg);
        console.error('[CallContainer] err.errCode:', err.errCode);
        return typeof cb == 'function' && cb(false);
      }
    });
  } else {
    // 开发者工具/强制公网域名：使用标准 request
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

  if (!isDevtools && !forceUseDomain) {
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
  if (!isDevtools && !forceUseDomain) {
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
  console.log('[Upload] start, filePath:', filePath, 'name:', name, 'useCallContainer:', !isDevtools && !forceUseDomain && !forceUploadUseDomain);
  if (!isDevtools && !forceUseDomain && !forceUploadUseDomain) {
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
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            var cloudMsg = data && data.msg ? data.msg : ('上传失败，云托管返回 ' + res.statusCode);
            return typeof cb == 'function' && cb({ status: 0, msg: cloudMsg });
          }
          if (!data) {
            data = { status: 0, msg: '上传失败，云托管返回为空' };
          } else if (data.status != 1 && !data.msg) {
            data.msg = '上传失败，后端未返回错误原因';
          }
        } catch (e) {
          console.error('[CallContainer] upload parse response fail:', e, res);
          data = { status: 0, msg: '上传失败，云托管返回异常: ' + (res && res.data ? String(res.data).substring(0, 80) : e.message) };
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
    // 开发者工具/强制公网：继续使用原有普通上传
    wx.uploadFile({
      url: rootDocment + 'upload',
      filePath: filePath,
      name: name || 'file',
      formData: formData || {},
      success: function (res) {
        var data = false;
        try {
          data = JSON.parse(res.data);
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            var serverMsg = data && data.msg ? data.msg : ('上传失败，服务器返回 ' + res.statusCode);
            return typeof cb == 'function' && cb({ status: 0, msg: serverMsg });
          }
        } catch (e) {
          console.error('[Upload] parse response fail:', e, res);
          data = { status: 0, msg: '上传失败，服务器返回异常: ' + (res && res.data ? String(res.data).substring(0, 80) : e.message) };
        }
        return typeof cb == 'function' && cb(data);
      },
      fail: function (err) {
        console.error('[Upload] wx.uploadFile fail:', err);
        return typeof cb == 'function' && cb({ status: 0, msg: (err && err.errMsg) || '上传网络异常' });
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

function downloadFile(fileUrl, cb) {
  var path = fileUrl;
  if (path.indexOf(baseURL) === 0) {
    path = '/' + path.substring(baseURL.length);
  } else if (path.indexOf('http') !== 0) {
    if (path.indexOf('/') !== 0) {
      path = '/' + path;
    }
  } else {
    // 外部链接，直接使用原生下载
    wx.downloadFile({
      url: fileUrl,
      success: function (res) {
        if (res.statusCode === 200 && res.tempFilePath) {
          cb && cb(res.tempFilePath);
        } else {
          cb && cb(false);
        }
      },
      fail: function () {
        cb && cb(false);
      }
    });
    return;
  }

  // 保证路径正确，剔除多余的 //
  path = path.replace(/\/+/g, '/');

  // 真机始终优先走 callContainer 二进制下载（免域名白名单），仅开发者工具走 wx.downloadFile
  if (!isDevtools) {
    // 真机走免域名云托管 callContainer
    wx.cloud.callContainer({
      config: { env: cloudConfig.env },
      path: path,
      header: {
        'X-WX-SERVICE': cloudConfig.service
      },
      method: 'GET',
      responseType: 'arraybuffer', // 获取二进制 buffer
      success: function (res) {
        if (res.statusCode === 200 && res.data) {
          var fs = wx.getFileSystemManager();
          var ext = 'zip';
          if (path.indexOf('.') !== -1) {
            ext = path.split('.').pop();
          }
          var tempPath = wx.env.USER_DATA_PATH + '/temp_dl_' + Date.now() + '.' + ext;
          try {
            fs.writeFileSync(tempPath, res.data, 'binary');
            cb && cb(tempPath);
          } catch (e) {
            console.error('[Download] write error:', e);
            cb && cb(false);
          }
        } else {
          cb && cb(false);
        }
      },
      fail: function (err) {
        console.error('[CallContainer] download error:', err);
        cb && cb(false);
      }
    });
  } else {
    // 开发者工具 / 公网域名走原生
    var downloadUrl = baseURL + (path.indexOf('/') === 0 ? path.substring(1) : path);
    // 保证 URL 协议无误
    downloadUrl = downloadUrl.replace(/([^:])\/+/g, '$1/');
    
    wx.downloadFile({
      url: downloadUrl,
      success: function (res) {
        if (res.statusCode === 200 && res.tempFilePath) {
          cb && cb(res.tempFilePath);
        } else {
          cb && cb(false);
        }
      },
      fail: function (err) {
        console.error('wx.downloadFile error:', err);
        cb && cb(false);
      }
    });
  }
}

module.exports = {
  req: req,
  getReq: getReq,
  jsonReq: jsonReq,
  uploadFile: uploadFile,
  downloadFile: downloadFile,
  formatTime: formatTime,
  wxAppinfo: wxAppinfo,
  baseURL: baseURL
};
