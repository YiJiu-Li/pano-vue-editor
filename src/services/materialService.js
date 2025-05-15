import { Material } from '@/models';
import fileSystem from '@/utils/fileSystem';

const MATERIALS_FILE = 'materials.json';

export default {
    /**
     * 获取所有素材
     */
    async getAllMaterials() {
        return await fileSystem.readJsonFile(MATERIALS_FILE, []);
    },

    /**
     * 根据类型获取素材
     */
    async getMaterialsByType(type) {
        const materials = await this.getAllMaterials();
        return materials.filter(material => material.type === type);
    },

    /**
     * 根据ID获取素材
     */
    async getMaterialById(id) {
        const materials = await this.getAllMaterials();
        return materials.find(material => material.id === id) || null;
    },

    /**
     * 保存素材数据
     */
    async saveMaterial(materialData) {
        const materials = await this.getAllMaterials();
        const material = new Material(materialData);

        const index = materials.findIndex(m => m.id === material.id);
        if (index >= 0) {
            materials[index] = material;
        } else {
            materials.push(material);
        }

        const result = await fileSystem.saveJsonFile(MATERIALS_FILE, materials);
        return result ? material : null;
    },

    /**
     * 上传并保存文件
     * @param {Object} materialData 素材数据
     * @param {File} file 文件对象
     */
    async uploadAndSaveMaterial(materialData, file) {
        try {
            let subDir;
            // 根据素材类型确定保存的子目录
            switch (materialData.type) {
                case 'panorama':
                    subDir = 'panoramas';
                    break;
                case 'hotspot':
                    subDir = 'hotspots';
                    break;
                case 'sound':
                    subDir = 'sounds';
                    break;
                default:
                    subDir = 'panoramas';
            }

            // 保存文件到对应目录
            const savedPath = fileSystem.saveFile(file, subDir);
            if (!savedPath) {
                throw new Error('文件保存失败');
            }

            // 创建缩略图(对于图片类型)
            let thumbnailPath;
            if (materialData.type === 'panorama' || materialData.type === 'hotspot') {
                thumbnailPath = await fileSystem.createThumbnail(savedPath);
            } else {
                thumbnailPath = '/assets/default-thumbnail.jpg'; // 对于音频使用默认缩略图
            }

            // 更新素材数据
            const updatedMaterial = {
                ...materialData,
                path: savedPath,
                thumbnail: thumbnailPath
            };

            // 保存素材元数据
            return await this.saveMaterial(updatedMaterial);
        } catch (error) {
            console.error('上传素材失败:', error);
            return null;
        }
    },

    /**
     * 删除素材
     */
    async deleteMaterial(id) {
        const materials = await this.getAllMaterials();
        const materialToDelete = materials.find(m => m.id === id);

        if (materialToDelete) {
            // 删除关联的文件
            if (materialToDelete.path) {
                await fileSystem.deleteFile(materialToDelete.path);
            }

            // 删除缩略图文件(如果存在且不是默认缩略图)
            if (materialToDelete.thumbnail &&
                !materialToDelete.thumbnail.includes('default-thumbnail')) {
                await fileSystem.deleteFile(materialToDelete.thumbnail);
            }

            // 更新数据库
            const newMaterials = materials.filter(material => material.id !== id);
            return await fileSystem.saveJsonFile(MATERIALS_FILE, newMaterials);
        }

        return false;
    }
};
