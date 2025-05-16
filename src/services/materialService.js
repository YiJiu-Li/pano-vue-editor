import { Material, Folder } from '@/models';
import fileSystem from '@/utils/fileSystem';

const MATERIALS_FILE = 'materials.json';
const FOLDERS_FILE = 'material_folders.json';

export default {
    /**
     * 获取所有素材
     */
    async getAllMaterials() {
        return await fileSystem.readJsonFile(MATERIALS_FILE, []);
    },

    /**
     * 获取特定文件夹中的素材
     */
    async getMaterialsByFolder(folderId = 'root') {
        const materials = await this.getAllMaterials();
        return materials.filter(material => material.folderId === folderId);
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
    },

    /**
     * 获取所有文件夹
     */
    async getAllFolders() {
        return await fileSystem.readJsonFile(FOLDERS_FILE, [
            new Folder({ id: 'root', name: '根目录', parentId: '' }) // 确保根目录始终存在
        ]);
    },

    /**
     * 获取特定文件夹的子文件夹
     */
    async getSubFolders(parentId = 'root') {
        const folders = await this.getAllFolders();
        return folders.filter(folder => folder.parentId === parentId);
    },

    /**
     * 创建新文件夹
     */
    async createFolder(folderData) {
        const folders = await this.getAllFolders();
        const folder = new Folder(folderData);

        // 检查同级目录下是否已有同名文件夹
        const existingSameNameFolder = folders.find(f =>
            f.parentId === folder.parentId && f.name === folder.name
        );

        if (existingSameNameFolder) {
            return { success: false, message: '同一位置已存在同名文件夹' };
        }

        folders.push(folder);
        const success = await fileSystem.saveJsonFile(FOLDERS_FILE, folders);
        return { success, folder };
    },

    /**
     * 删除文件夹
     */
    async deleteFolder(folderId) {
        // 不允许删除根目录
        if (folderId === 'root') {
            return { success: false, message: '不能删除根目录' };
        }

        // 获取所有子文件夹
        const folders = await this.getAllFolders();
        const subFolders = this.getAllSubFoldersRecursive(folders, folderId);
        const folderIdsToDelete = [folderId, ...subFolders.map(f => f.id)];

        // 检查文件夹及其子文件夹是否包含素材
        const materials = await this.getAllMaterials();
        const materialsInFolders = materials.filter(m => folderIdsToDelete.includes(m.folderId));

        if (materialsInFolders.length > 0) {
            return {
                success: false,
                message: `文件夹包含 ${materialsInFolders.length} 个素材，请先移动或删除这些素材`
            };
        }

        // 删除文件夹
        const newFolders = folders.filter(f => !folderIdsToDelete.includes(f.id));
        const success = await fileSystem.saveJsonFile(FOLDERS_FILE, newFolders);
        return { success };
    },

    /**
     * 递归获取所有子文件夹
     * @private
     */
    getAllSubFoldersRecursive(allFolders, parentId) {
        const directChildren = allFolders.filter(f => f.parentId === parentId);
        let allDescendants = [...directChildren];

        for (const child of directChildren) {
            const descendants = this.getAllSubFoldersRecursive(allFolders, child.id);
            allDescendants = [...allDescendants, ...descendants];
        }

        return allDescendants;
    },

    /**
     * 重命名文件夹
     */
    async renameFolder(folderId, newName) {
        // 不允许修改根目录
        if (folderId === 'root') {
            return { success: false, message: '不能修改根目录' };
        }

        const folders = await this.getAllFolders();
        const folderIndex = folders.findIndex(f => f.id === folderId);

        if (folderIndex === -1) {
            return { success: false, message: '文件夹不存在' };
        }

        // 检查同级目录下是否已有同名文件夹
        const parentId = folders[folderIndex].parentId;
        const existingSameNameFolder = folders.find(f =>
            f.id !== folderId && f.parentId === parentId && f.name === newName
        );

        if (existingSameNameFolder) {
            return { success: false, message: '同一位置已存在同名文件夹' };
        }

        folders[folderIndex].name = newName;
        const success = await fileSystem.saveJsonFile(FOLDERS_FILE, folders);
        return { success };
    },

    /**
     * 移动素材到指定文件夹
     */
    async moveMaterialToFolder(materialId, targetFolderId) {
        const materials = await this.getAllMaterials();
        const materialIndex = materials.findIndex(m => m.id === materialId);

        if (materialIndex === -1) {
            return { success: false, message: '素材不存在' };
        }

        // 检查目标文件夹是否存在
        const folders = await this.getAllFolders();
        const targetFolder = folders.find(f => f.id === targetFolderId);

        if (!targetFolder && targetFolderId !== 'root') {
            return { success: false, message: '目标文件夹不存在' };
        }

        materials[materialIndex].folderId = targetFolderId;
        const success = await fileSystem.saveJsonFile(MATERIALS_FILE, materials);
        return { success };
    },
};
