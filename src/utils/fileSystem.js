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
      return await wpfBridge.callWpf('saveJsonFile', {
        fileName,
        data
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
      // 将文件转为base64以便传输
      const base64 = await this._fileToBase64(file);
      
      // 调用WPF保存文件
      return await wpfBridge.callWpf('saveFile', {
        fileContent: base64,
        fileName: newFileName || file.name,
        subDir,
        contentType: file.type
      });
    } catch (error) {
      console.error('保存文件失败:', error);
      return null;
    }
  },

  /**
   * 获取文件URL
   * @param {string} relativePath 相对路径
   */
  getFileUrl(relativePath) {
    if (!relativePath) return '';
    if (relativePath.startsWith('http') || relativePath.startsWith('blob:') || relativePath.startsWith('data:')) {
      return relativePath;
    }
    
    // 调用WPF获取文件URL或Base64
    return wpfBridge.callWpf('getFileUrl', { path: relativePath });
  },

  /**
   * 删除文件
   * @param {string} relativePath 相对路径
   */
  async deleteFile(relativePath) {
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
