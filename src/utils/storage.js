/**
 * 本地存储工具类
 */
export const LocalStorage = {
    /**
     * 保存数据到本地
     * @param {string} key 键名
     * @param {any} data 要保存的数据
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`数据已保存到本地: ${key}`);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    /**
     * 从本地获取数据
     * @param {string} key 键名
     * @param {any} defaultValue 默认值
     */
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('获取数据失败:', error);
            return defaultValue;
        }
    },

    /**
     * 从本地删除数据
     * @param {string} key 键名
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    },

    /**
     * 清除所有本地数据
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    }
};

/**
 * 处理文件上传并转为Base64格式
 * @param {File} file 文件对象
 * @returns {Promise<string>} 返回Base64格式的字符串
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};
