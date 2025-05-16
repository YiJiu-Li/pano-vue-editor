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
      try {
        // WPF调用JS的回调处理
        console.log('收到WPF回调:', action);

        const parsedData = JSON.parse(data);
        const callbackId = parsedData.callbackId;

        // 检查回调是否存在
        if (this.callbacks[callbackId]) {
          this.callbacks[callbackId](parsedData.result);
          // 调用后立即删除回调，防止重复调用
          delete this.callbacks[callbackId];
        } else {
          console.warn(`未找到回调: ${callbackId}，可能已经被处理或不存在`);
        }
      } catch (error) {
        console.error('处理WPF回调失败:', error);
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
   */  callWpf(method, params = {}) {
    return new Promise((resolve, reject) => {
      try {
        const callbackId = 'cb_' + (++this.callbackId);

        // 注册回调函数
        if (this.callbacks[callbackId]) {
          console.warn(`回调ID ${callbackId} 已存在，将被覆盖`);
        }
        this.callbacks[callbackId] = (result) => {
          resolve(result);
          delete this.callbacks[callbackId];
        };

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
          console.log('向WPF发送消息(模拟):', method, JSON.stringify(params));
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

    // 防止重复日志记录，日志只在消息发送时记录一次
    // console.log('模拟处理WPF请求:', method, params);    // 模拟不同方法的响应
    switch (method) {
      case 'readJsonFile':
        result = this._getMockData(params.fileName);
        break;
      case 'saveJsonFile':
        // 保存数据到本地存储
        localStorage.setItem(`mock_${params.fileName}`, JSON.stringify(params.data));
        result = true;
        break;
      case 'prepareFileBinary':
        // 模拟准备二进制文件上传
        const fileId = `file_${Date.now()}`;
        // 在实际环境中，WPF会创建临时文件并返回fileId
        console.log('准备二进制文件上传:', params.fileName, params.subDir, 'fileId:', fileId);
        result = fileId;
        
        // 模拟WebView2消息事件
        setTimeout(() => {
          // 在真实环境中，WPF会在收到二进制数据后发送这个事件
          const event = new MessageEvent('message', {
            data: {
              fileId: fileId,
              method: 'fileSaved',
              path: `assets/${params.subDir}/${Date.now()}-${params.fileName || 'file'}`
            }
          });
          window.dispatchEvent(event);
        }, 300);
        break;
      case 'saveFile':
        // 模拟返回文件路径
        result = `assets/${params.subDir}/${Date.now()}-${params.fileName || 'file'}`;
        break;
      case 'deleteFile':
        // 如果是删除存储的JSON文件，从localStorage中删除
        if (params.path && params.path.endsWith('.json')) {
          const fileName = params.path.split('/').pop();
          localStorage.removeItem(`mock_${fileName}`);
        }
        result = true;
        break;      case 'initChunkUpload':
        // 模拟初始化分块上传
        result = `chunk_${Date.now()}`;
        break;
        
      case 'uploadChunk':
        // 模拟上传数据块
        console.log(`模拟接收分块 ${params.chunkIndex+1}/${params.totalChunks}`);
        result = true;
        break;
        
      case 'completeChunkUpload':
        // 模拟完成分块上传
        result = `assets/${params.subDir || 'files'}/${Date.now()}-chunked-file`;
        break;
        
      case 'checkFileExists':
        // 模拟检查文件是否存在于缓存
        const cacheKey = `file_cache_${params.identifier}`;
        result = localStorage.getItem(cacheKey) || null;
        break;
        
      case 'registerFileCache':
        // 模拟注册文件缓存
        const cacheEntry = `file_cache_${params.identifier}`;
        localStorage.setItem(cacheEntry, params.path);
        result = true;
        break;
        
      default:
        console.warn('未知的WPF方法:', method);
        result = null;
    }

    // 模拟异步响应，使用一个标记确保回调只触发一次
    const responseTimer = setTimeout(() => {
      window.receiveFromWpf('callback', JSON.stringify({
        callbackId,
        result
      }));
      clearTimeout(responseTimer);
    }, 100);
  }

  // 获取模拟数据
  _getMockData(fileName) {
    try {
      const mockData = localStorage.getItem(`mock_${fileName}`);
      if (mockData) {
        return JSON.parse(mockData);
      }

      // 如果本地存储中没有数据，返回默认的初始数据
      if (fileName === 'materials.json') return [];
      if (fileName === 'works.json') return [];
      if (fileName === 'material_folders.json') return [
        { id: 'root', name: '根目录', parentId: '' }
      ];

      return null;
    } catch (error) {
      console.error(`获取模拟数据失败: ${fileName}`, error);
      return null;
    }
  }
}

export default new WpfBridge();
