/**
 * WPF桥接工具 - 用于在WebView环境中与WPF宿主通信
 */
class WpfBridge {
  constructor() {
    this.isWpfEnvironment = false;
    this.init();
  }

  init() {
    // 检测是否在WPF WebView环境中
    try {
      this.isWpfEnvironment = window.chrome && window.chrome.webview || 
                             window.CefSharp || 
                             window.external && window.external.notify;
      
      if (this.isWpfEnvironment) {
        console.log('检测到WPF WebView环境');
      } else {
        console.warn('未检测到WPF环境，将使用模拟模式');
      }
    } catch (e) {
      console.warn('环境检测失败，将使用模拟模式', e);
      this.isWpfEnvironment = false;
    }

    // 为WPF宿主提供回调接口
    window.receiveFromWpf = (action, data) => {
      // WPF调用JS的回调处理
      console.log('收到WPF回调:', action, data);
      // 触发注册的回调函数
      const callbackId = JSON.parse(data).callbackId;
      if (this.callbacks[callbackId]) {
        this.callbacks[callbackId](JSON.parse(data).result);
        delete this.callbacks[callbackId];
      }
    };
  }

  // 回调管理
  callbacks = {};
  callbackId = 0;

  /**
   * 调用WPF方法
   * @param {string} method 方法名
   * @param {object} params 参数
   * @returns {Promise} 返回Promise
   */
  callWpf(method, params = {}) {
    return new Promise((resolve, reject) => {
      try {
        const callbackId = 'cb_' + (++this.callbackId);
        this.callbacks[callbackId] = resolve;

        const message = JSON.stringify({
          method,
          params,
          callbackId
        });

        if (this.isWpfEnvironment) {
          // 根据不同WebView实现调用宿主
          if (window.chrome && window.chrome.webview) {
            // WebView2
            window.chrome.webview.postMessage(message);
          } else if (window.external && window.external.notify) {
            // 传统WebBrowser控件
            window.external.notify(message);
          } else if (window.CefSharp) {
            // CefSharp
            window.CefSharp.postMessage(message);
          }
        } else {
          // 在普通浏览器环境中模拟WPF行为（用于开发测试）
          console.log('向WPF发送消息(模拟):', message);
          this._mockWpfResponse(method, params, callbackId);
        }
      } catch (error) {
        console.error('调用WPF方法失败:', error);
        reject(error);
      }
    });
  }

  // 模拟WPF响应（用于开发测试）
  _mockWpfResponse(method, params, callbackId) {
    let result = null;
    
    // 模拟不同方法的响应
    switch (method) {
      case 'readJsonFile':
        result = this._getMockData(params.fileName);
        break;
      case 'saveJsonFile':
        console.log('模拟保存JSON文件:', params.fileName, params.data);
        localStorage.setItem(`mock_${params.fileName}`, JSON.stringify(params.data));
        result = true;
        break;
      case 'saveFile':
        console.log('模拟保存文件:', params);
        // 模拟返回文件路径
        result = `assets/${params.subDir}/${Date.now()}-${params.fileName}`;
        break;
      case 'deleteFile':
        console.log('模拟删除文件:', params.path);
        result = true;
        break;
      default:
        console.warn('未知的WPF方法:', method);
        result = null;
    }

    // 模拟异步响应
    setTimeout(() => {
      window.receiveFromWpf('callback', JSON.stringify({
        callbackId,
        result
      }));
    }, 100);
  }

  // 获取模拟数据
  _getMockData(fileName) {
    const mockData = localStorage.getItem(`mock_${fileName}`);
    if (mockData) {
      return JSON.parse(mockData);
    }
    
    // 默认空数据
    if (fileName === 'materials.json') return [];
    if (fileName === 'works.json') return [];
    return null;
  }
}

export default new WpfBridge();
