import { Work } from '@/models';
import fileSystem from '@/utils/fileSystem';

const WORKS_FILE = 'works.json';

export default {
    /**
     * 获取所有作品
     */
    async getAllWorks() {
        return await fileSystem.readJsonFile(WORKS_FILE, []);
    },

    /**
     * 根据ID获取作品
     */
    async getWorkById(id) {
        const works = await this.getAllWorks();
        return works.find(work => work.id === id) || null;
    },

    /**
     * 保存作品
     */
    async saveWork(workData) {
        const works = await this.getAllWorks();
        const work = new Work(workData);

        const index = works.findIndex(w => w.id === work.id);
        if (index >= 0) {
            // 更新
            work.updateTime = new Date().toISOString();
            works[index] = work;
        } else {
            // 新增
            works.push(work);
        }

        const result = await fileSystem.saveJsonFile(WORKS_FILE, works);
        return result ? work : null;
    },

    /**
     * 上传作品封面图片
     * @param {String} workId 作品ID
     * @param {File} file 文件对象
     */
    async uploadWorkCover(workId, file) {
        try {
            const savedPath = fileSystem.saveFile(file, 'panoramas', `cover-${workId}-${Date.now()}.jpg`);
            if (!savedPath) {
                throw new Error('封面图片保存失败');
            }

            const work = await this.getWorkById(workId);
            if (work) {
                // 如果有旧的封面图，先删除
                if (work.coverImage && !work.coverImage.includes('default')) {
                    await fileSystem.deleteFile(work.coverImage);
                }

                // 更新封面路径
                work.coverImage = savedPath;
                return await this.saveWork(work);
            }
            return null;
        } catch (error) {
            console.error('上传封面失败:', error);
            return null;
        }
    },    /**
     * 删除作品
     */
    async deleteWork(id) {
        try {
            const works = await this.getAllWorks();
            const workToDelete = works.find(w => w.id === id);

            if (!workToDelete) {
                console.warn(`未找到要删除的作品: ${id}`);
                return false;
            }

            // 删除封面图片
            if (workToDelete.coverImage && !workToDelete.coverImage.includes('default')) {
                const deleteResult = await fileSystem.deleteFile(workToDelete.coverImage);
                if (!deleteResult) {
                    console.warn(`删除作品封面失败: ${workToDelete.coverImage}`);
                }
            }

            // 更新数据库
            const newWorks = works.filter(work => work.id !== id);
            console.log(`删除作品 ${id}，剩余作品数量: ${newWorks.length}`);
            return await fileSystem.saveJsonFile(WORKS_FILE, newWorks);
        } catch (error) {
            console.error(`删除作品失败: ${id}`, error);
            return false;
        }
    }
};
