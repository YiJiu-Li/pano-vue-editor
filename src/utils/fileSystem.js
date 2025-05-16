import wpfBridge from './wpfBridge';

/**
 * 文件系统工具 - 通过WPF桥接层操作本地文件
 */
const fileSystem = {
  /**
   * 初始化文件系统
   */
  async initializeDirectories() {
    try {
      // 请求WPF创建必要的目录结构
      return await wpfBridge.callWpf('initializeDirectories', {
        dirs: [
          'assets/panoramas',
          'assets/hotspots',
          'assets/sounds',
          'assets/thumbnails',
          'db'
        ]
      });
    } catch (error) {
      console.error('初始化目录失败:', error);
      return false;
    }
  },

  /**
   * 保存JSON数据到文件
   * @param {string} fileName 文件名
   * @param {object} data 数据对象
   */
  async saveJsonFile(fileName, data) {
    try {
      // 确保对象被正确序列化
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
      return await wpfBridge.callWpf('saveJsonFile', {
        fileName,
        data: JSON.parse(jsonData) // 保证数据是对象而不是字符串
      });
    } catch (error) {
      console.error(`保存JSON文件失败: ${fileName}`, error);
      return false;
    }
  },

  /**
   * 读取JSON文件
   * @param {string} fileName 文件名
   * @param {any} defaultValue 默认值
   */
  async readJsonFile(fileName, defaultValue = null) {
    try {
      const result = await wpfBridge.callWpf('readJsonFile', { fileName });
      return result || defaultValue;
    } catch (error) {
      console.error(`读取JSON文件失败: ${fileName}`, error);
      return defaultValue;
    }
  },
  /**
   * 保存文件
   * @param {File} file 文件对象
   * @param {string} subDir 子目录
   * @param {string} newFileName 新文件名(可选)
   */
  async saveFile(file, subDir, newFileName = null) {
    try {
      const fileName = newFileName || file.name;
      
      // 检测WebView2环境，使用更高效的二进制传输
      if (window.chrome && window.chrome.webview) {
        return await this._saveFileWebView2(file, subDir, fileName);
      } else {
        // 降级到base64传输
        return await this._saveFileBase64(file, subDir, fileName);
      }
    } catch (error) {
      console.error('保存文件失败:', error);
      return null;
    }
  },
  
  /**
   * 使用WebView2的二进制传输保存文件（更高效）
   * @private
   */
  async _saveFileWebView2(file, subDir, fileName) {
    // 准备文件元数据
    const fileId = await wpfBridge.callWpf('prepareFileBinary', {
      fileName: fileName,
      subDir: subDir,
      contentType: file.type,
      size: file.size
    });
    
    if (!fileId) {
      throw new Error('准备文件传输失败');
    }
    
    // 获取文件的ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 创建一个新的Promise来处理二进制文件传输的结果
    return new Promise((resolve, reject) => {
      try {
        // 设置一个回调处理器来接收保存完成的事件
        const messageHandler = function(event) {
          const data = event.data;
          if (data && data.fileId === fileId && data.method === 'fileSaved') {
            window.removeEventListener('message', messageHandler);
            resolve(data.path);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // 发送二进制数据
        window.chrome.webview.postMessage({
          method: 'uploadFileBinary',
          fileId: fileId,
          binary: arrayBuffer
        });
        
        // 设置超时处理
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('文件上传超时'));
        }, 30000); // 30秒超时
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * 使用base64编码保存文件（兼容模式）
   * @private
   */
  async _saveFileBase64(file, subDir, fileName) {
    // 将文件转为base64以便传输
    const base64 = await this._fileToBase64(file);

    // 调用WPF保存文件
    return await wpfBridge.callWpf('saveFile', {
      fileContent: base64,
      fileName: fileName,
      subDir,
      contentType: file.type
    });
  },
  
  /**
   * 获取文件URL
   * @param {string} relativePath 相对路径
   */
  async getFileUrl(relativePath) {
    if (!relativePath) return '';
    if (relativePath.startsWith('http') || relativePath.startsWith('blob:') || relativePath.startsWith('data:')) {
      return relativePath;
    }

    try {
      // 调用WPF获取文件URL或Base64
      const result = await wpfBridge.callWpf('getFileUrl', { path: relativePath });
      return result || relativePath;
    } catch (error) {
      console.error('获取文件URL失败:', error);
      return relativePath;
    }
  },

  /**
   * 获取文件路径（不转换为URL）
   */
  getFilePath(relativePath) {
    if (!relativePath) return '';
    if (relativePath.startsWith('http') || relativePath.startsWith('/')) {
      return relativePath;
    }
    return relativePath;
  },

  /**
   * 删除文件
   * @param {string} relativePath 相对路径
   */
  async deleteFile(relativePath) {
    if (!relativePath) return false;
    
    try {
      return await wpfBridge.callWpf('deleteFile', { path: relativePath });
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  },

  /**
   * 创建缩略图
   * @param {string} imagePath 图片路径
   * @param {number} width 宽度
   * @param {number} height 高度
   */
  async createThumbnail(imagePath, width = 200, height = 200) {
    try {
      return await wpfBridge.callWpf('createThumbnail', {
        imagePath,
        width,
        height
      });
    } catch (error) {
      console.error('创建缩略图失败:', error);
      return imagePath; // 失败时返回原图
    }
  },

  /**
   * 上传大文件（使用分块传输）
   * @param {File} file 文件对象
   * @param {string} subDir 子目录
   * @param {string} newFileName 新文件名(可选)
   * @param {number} chunkSize 块大小，默认1MB
   */
  async saveFileLarge(file, subDir, newFileName = null, chunkSize = 1024 * 1024) {
    try {
      const fileName = newFileName || file.name;
      const totalChunks = Math.ceil(file.size / chunkSize);
      
      // 如果不是大文件，使用标准方法上传
      if (file.size <= chunkSize) {
        return await this.saveFile(file, subDir, fileName);
      }

      // 1. 初始化分块传输
      const fileId = await wpfBridge.callWpf('initChunkUpload', {
        fileName,
        subDir,
        contentType: file.type,
        totalChunks,
        totalSize: file.size
      });

      if (!fileId) {
        throw new Error('初始化分块上传失败');
      }

      // 2. 分块上传
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        
        // 转换为base64或使用二进制（取决于环境）
        let chunkData;
        
        if (window.chrome && window.chrome.webview) {
          // 使用WebView2的二进制传输
          chunkData = await chunk.arrayBuffer();
          
          // 上传二进制块
          await new Promise((resolve, reject) => {
            try {
              // 设置一次性事件监听器接收结果
              const messageHandler = function(event) {
                const data = event.data;
                if (data && data.fileId === fileId && data.chunkIndex === i && data.method === 'chunkSaved') {
                  window.removeEventListener('message', messageHandler);
                  resolve();
                }
              };
              
              window.addEventListener('message', messageHandler);
              
              // 发送二进制块
              window.chrome.webview.postMessage({
                method: 'uploadChunkBinary',
                fileId: fileId,
                chunkIndex: i,
                totalChunks: totalChunks,
                binary: chunkData
              });
              
              // 超时处理
              setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                reject(new Error(`上传块${i}超时`));
              }, 10000); // 10秒超时
            } catch (error) {
              reject(error);
            }
          });
        } else {
          // 降级使用base64
          chunkData = await this._fileToBase64(chunk);
          
          // 上传base64编码的块
          await wpfBridge.callWpf('uploadChunk', {
            fileId,
            chunkIndex: i,
            totalChunks: totalChunks,
            chunk: chunkData
          });
        }
      }

      // 3. 完成上传并获取结果
      return await wpfBridge.callWpf('completeChunkUpload', { fileId });
    } catch (error) {
      console.error('大文件上传失败:', error);
      return null;
    }
  },

  /**
   * 带缓存的文件上传
   * @param {File} file 文件对象
   * @param {string} subDir 子目录
   * @param {string} newFileName 新文件名(可选)
   */
  async saveFileWithCache(file, subDir, newFileName = null) {
    try {
      // 计算文件的简单标识
      const fileIdentifier = await this._computeFileIdentifier(file);
      
      // 检查是否已存在
      const existingPath = await wpfBridge.callWpf('checkFileExists', {
        identifier: fileIdentifier,
        subDir
      });
      
      // 如果文件已存在，直接返回路径
      if (existingPath) {
        console.log('文件已存在于缓存中，重用路径:', existingPath);
        return existingPath;
      }
      
      // 文件不存在，上传并缓存
      const uploadPath = await this.saveFile(file, subDir, newFileName);
      
      if (uploadPath) {
        // 注册到缓存
        await wpfBridge.callWpf('registerFileCache', {
          path: uploadPath,
          identifier: fileIdentifier
        });
      }
      
      return uploadPath;
    } catch (error) {
      console.error('缓存文件上传失败:', error);
      // 降级到普通上传
      return await this.saveFile(file, subDir, newFileName);
    }
  },
  
  /**
   * 计算文件标识
   * @private
   */
  async _computeFileIdentifier(file) {
    // 一个简单的文件标识方法，实际环境可能需要更复杂的哈希
    return `${file.name}_${file.size}_${file.lastModified}`;
  },

  // 将文件转为base64
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
};

export default fileSystem;
