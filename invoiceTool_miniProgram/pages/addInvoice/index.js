Page({
  onSelectFile: function () {
    wx.chooseMessageFile({
      count: 10,
      type: 'file',
      extension: ['pdf'],
      success: function (res) {
        var files = res.tempFiles;
        var names = files.map(function (f) { return f.name; }).join(', ');
        wx.showToast({ title: '已选择 ' + files.length + ' 个文件', icon: 'none' });
        // TODO: upload files to server
      },
      fail: function () {
        wx.showToast({ title: '未选择文件', icon: 'none' });
      }
    });
  }
});
