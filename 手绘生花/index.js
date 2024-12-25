const app = getApp()

Page({
  data: {
    videoSrc: '',
    aiVideoSrc: '',
    isProcessing: false
  },

  // 选择视频
  chooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: (res) => {
        this.setData({
          videoSrc: res.tempFiles[0].tempFilePath,
          aiVideoSrc: '' // 清除之前生成的视频
        });
      }
    });
  },

  // 生成AI视频
  generateVideo() {
    if (!this.data.videoSrc) {
      wx.showToast({
        title: '请先上传视频',
        icon: 'none'
      });
      return;
    }

    this.setData({ isProcessing: true });

    // 这里添加调用AI处理API的代码
    setTimeout(() => {
      // 模拟AI处理完成
      this.setData({
        isProcessing: false,
        aiVideoSrc: this.data.videoSrc // 实际应该是AI处理后的视频URL
      });
    }, 3000);
  },

  // 下载视频
  downloadVideo() {
    if (!this.data.aiVideoSrc) {
      return;
    }

    wx.showLoading({
      title: '下载中...',
    });

    wx.downloadFile({
      url: this.data.aiVideoSrc,
      success: (res) => {
        wx.saveVideoToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          },
          fail: () => {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
}) 