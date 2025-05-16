<template>
    <div class="materials-manage">
        <el-tabs v-model="activeTab" class="category-tabs" type="card">
            <el-tab-pane label="全景图" name="panorama"></el-tab-pane>
            <el-tab-pane label="热点图标" name="hotspot"></el-tab-pane>
            <el-tab-pane label="音效" name="sound"></el-tab-pane>
        </el-tabs>

        <div class="breadcrumb-and-actions">
            <!-- 文件夹路径导航 -->
            <div class="folder-breadcrumb">
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item @click="navigateToFolder('root')">
                        <el-icon>
                            <Folder />
                        </el-icon> 根目录
                    </el-breadcrumb-item>
                    <el-breadcrumb-item v-for="folder in folderPath" :key="folder.id"
                        @click="navigateToFolder(folder.id)">
                        {{ folder.name }}
                    </el-breadcrumb-item>
                </el-breadcrumb>
            </div>

            <div class="action-bar">
                <div class="action-buttons">
                    <el-button type="primary" @click="openUploadDialog" :icon="Upload">
                        上传素材
                    </el-button>
                    <el-button @click="openNewFolderDialog" :icon="Plus">
                        新建文件夹
                    </el-button>
                </div>
                <el-input v-model="searchQuery" placeholder="搜索素材" class="search-input" clearable>
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
        </div>

        <div class="content-container">
            <!-- 文件夹列表 -->
            <template v-if="subFolders.length > 0">
                <div class="section-title">
                    <el-icon>
                        <FolderOpened />
                    </el-icon>
                    <span>文件夹</span>
                </div>
                <div class="folders-grid">
                    <el-card v-for="folder in subFolders" :key="folder.id" shadow="hover" class="folder-card"
                        @click="navigateToFolder(folder.id)">
                        <div class="folder-icon">
                            <el-icon :size="40">
                                <FolderOpened />
                            </el-icon>
                        </div>
                        <div class="folder-info">
                            <h3 class="folder-name">{{ folder.name }}</h3>
                            <div class="folder-actions">
                                <el-button size="small" @click.stop="openRenameFolderDialog(folder)" :icon="Edit"
                                    circle>
                                </el-button>
                                <el-button size="small" @click.stop="confirmDeleteFolder(folder)" :icon="Delete"
                                    type="danger" circle>
                                </el-button>
                            </div>
                        </div>
                    </el-card>
                </div>
            </template>

            <!-- 素材内容 -->
            <div class="materials-content">
                <div v-if="subFolders.length > 0" class="section-title">
                    <el-icon>
                        <Picture />
                    </el-icon>
                    <span>{{ activeTab === 'panorama' ? '全景图' : activeTab === 'hotspot' ? '热点图标' : '音效' }}</span>
                </div>
                <el-empty v-if="filteredMaterials.length === 0 && !loading"
                    :description="`暂无${activeTab === 'panorama' ? '全景图' : activeTab === 'hotspot' ? '热点图标' : '音效'}素材`" />

                <div v-else-if="!loading"
                    :class="{ 'materials-grid': activeTab !== 'sound', 'materials-list': activeTab === 'sound' }">
                    <!-- 全景图和热点图标使用卡片视图 -->
                    <template v-if="activeTab !== 'sound'">
                        <el-card v-for="material in filteredMaterials" :key="material.id" shadow="hover"
                            class="material-card" :draggable="true" @dragstart="dragStart($event, material)">
                            <div class="material-image">
                                <img :src="materialThumbnails[material.id] || '/default-thumbnail.jpg'" alt="素材">
                                <div class="material-actions">
                                    <el-button circle @click="previewMaterial(material)" :icon="View"></el-button>
                                    <el-button circle @click="openMoveMaterialDialog(material)"
                                        :icon="Position"></el-button>
                                    <el-button circle type="danger" @click="confirmDeleteMaterial(material)"
                                        :icon="Delete"></el-button>
                                </div>
                            </div>
                            <div class="material-info">
                                <h3 class="material-name">{{ material.name }}</h3>
                                <div class="material-meta">
                                    <el-tag size="small" effect="light" :type="getTagType(material.type)">{{
                                        material.type }}</el-tag>
                                    <span class="material-time">{{ formatDate(material.createTime) }}</span>
                                </div>
                            </div>
                        </el-card>
                    </template>

                    <!-- 音效使用表格视图 -->
                    <template v-else>
                        <el-table :data="filteredMaterials" style="width: 100%" stripe border highlight-current-row
                            @row-contextmenu="handleRowContextMenu">
                            <el-table-column prop="name" label="名称" />
                            <el-table-column label="类型" width="100" align="center">
                                <template #default="scope">
                                    <el-tag effect="light" type="warning">{{ scope.row.type }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="添加时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.createTime) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="200" align="center">
                                <template #default="scope">
                                    <div class="table-actions">
                                        <el-button type="primary" :icon="View" circle
                                            @click="previewMaterial(scope.row)" size="small"></el-button>
                                        <el-button type="info" :icon="Position" circle
                                            @click="openMoveMaterialDialog(scope.row)" size="small"></el-button>
                                        <el-button type="danger" :icon="Delete" circle
                                            @click="confirmDeleteMaterial(scope.row)" size="small"></el-button>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </template>
                </div>
                <div v-if="loading" class="loading-container">
                    <el-skeleton :rows="3" animated />
                </div>
            </div>
        </div>

        <!-- 上传素材对话框 -->
        <el-dialog v-model="uploadDialogVisible" title="上传素材" width="50%">
            <el-form :model="newMaterial" label-width="80px">
                <el-form-item label="名称">
                    <el-input v-model="newMaterial.name" placeholder="请输入素材名称"></el-input>
                </el-form-item>

                <el-form-item label="类型">
                    <el-select v-model="newMaterial.type" placeholder="请选择素材类型">
                        <el-option label="全景图" value="panorama"></el-option>
                        <el-option label="热点图标" value="hotspot"></el-option>
                        <el-option label="音效" value="sound"></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="文件夹">
                    <el-select v-model="newMaterial.folderId" placeholder="请选择保存位置">
                        <el-option label="根目录" value="root"></el-option>
                        <el-option v-for="folder in allFolders" :key="folder.id" :label="folder.name"
                            :value="folder.id">
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="文件">
                    <el-upload action="#" :auto-upload="false" :file-list="fileList" :on-change="handleFileChange"
                        :limit="1">
                        <el-button type="primary">选择文件</el-button>
                    </el-upload>
                    <div class="upload-tip" v-if="newMaterial.type === 'panorama'">
                        支持jpg、png格式的全景图片，建议尺寸为4000x2000像素
                    </div>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="uploadDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveMaterial" :loading="uploading">保存</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 新建文件夹对话框 -->
        <el-dialog v-model="newFolderDialogVisible" title="新建文件夹" width="30%">
            <el-form :model="newFolder" label-width="80px">
                <el-form-item label="名称">
                    <el-input v-model="newFolder.name" placeholder="请输入文件夹名称"></el-input>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="newFolderDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="createFolder">创建</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 重命名文件夹对话框 -->
        <el-dialog v-model="renameFolderDialogVisible" title="重命名文件夹" width="30%">
            <el-form :model="folderToRename" label-width="80px">
                <el-form-item label="名称">
                    <el-input v-model="folderToRename.name" placeholder="请输入文件夹名称"></el-input>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="renameFolderDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="renameFolder">保存</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 移动素材对话框 -->
        <el-dialog v-model="moveMaterialDialogVisible" title="移动素材" width="30%">
            <el-form label-width="80px">
                <el-form-item label="移动到">
                    <el-select v-model="targetFolderId" placeholder="请选择目标文件夹">
                        <el-option label="根目录" value="root"></el-option>
                        <el-option v-for="folder in allFolders" :key="folder.id" :label="folder.name"
                            :value="folder.id">
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="moveMaterialDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="moveMaterial">移动</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 预览对话框 -->
        <el-dialog v-model="previewDialogVisible" title="素材预览" width="70%">
            <div v-if="currentMaterial" class="material-preview">
                <template v-if="currentMaterial.type === 'panorama'">
                    <div id="pano-preview" style="width: 100%; height: 400px;"></div>
                </template>
                <template v-else-if="currentMaterial.type === 'hotspot'">
                    <img :src="currentMaterial.path" style="max-width: 100%;" />
                </template>
                <template v-else-if="currentMaterial.type === 'sound'">
                    <audio controls :src="currentMaterial.path"></audio>
                </template>
            </div>
        </el-dialog>

        <!-- 删除素材确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%">
            <span>确定要删除素材 "{{ currentMaterial?.name }}" 吗？此操作不可逆。</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteDialogVisible = false">取消</el-button>
                    <el-button type="danger" @click="deleteMaterial">确定删除</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 删除文件夹确认对话框 -->
        <el-dialog v-model="deleteFolderDialogVisible" title="确认删除" width="30%">
            <span>确定要删除文件夹 "{{ folderToDelete?.name }}" 吗？此操作不可逆。</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteFolderDialogVisible = false">取消</el-button>
                    <el-button type="danger" @click="deleteFolder">确定删除</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, View, Delete, Search, Folder, FolderOpened, Position, Edit, Plus, Picture } from '@element-plus/icons-vue';
import materialService from '@/services/materialService';
import krpanoTools from '@/utils/krpano';
import fileSystem from '@/utils/fileSystem';

// 基础状态
const activeTab = ref('panorama');
const materials = ref([]);
const allFolders = ref([]);
const subFolders = ref([]);
const folderPath = ref([]);
const currentFolderId = ref('root');

// UI 状态
const loading = ref(false);
const uploadDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const deleteFolderDialogVisible = ref(false);
const newFolderDialogVisible = ref(false);
const renameFolderDialogVisible = ref(false);
const moveMaterialDialogVisible = ref(false);
const uploading = ref(false);

// 数据对象
const currentMaterial = ref(null);
const newMaterial = ref({
    name: '',
    type: 'panorama',
    path: '',
    folderId: 'root'
});
const newFolder = ref({
    name: '',
    parentId: 'root'
});
const folderToRename = ref(null);
const folderToDelete = ref(null);
const targetFolderId = ref(null);
const materialThumbnails = ref({});
const fileList = ref([]);
const searchQuery = ref('');

// 根据素材类型获取标签样式
function getTagType(type) {
    switch (type) {
        case 'panorama':
            return 'success';
        case 'hotspot':
            return 'primary';
        case 'sound':
            return 'warning';
        default:
            return 'info';
    }
}

// 监听当前文件夹ID变化，更新素材和子文件夹
watch(currentFolderId, async () => {
    await refreshCurrentFolder();
});

// 同步选项卡类型和素材类型
watch(activeTab, (newTab) => {
    newMaterial.value.type = newTab;
});

onMounted(async () => {
    loading.value = true;
    await Promise.all([
        loadAllFolders(),
        refreshCurrentFolder()
    ]);
    loading.value = false;
});

// 计算当前文件夹中的素材，按类型和搜索过滤
const filteredMaterials = computed(() => {
    const folderMaterials = materials.value.filter(m => m.folderId === currentFolderId.value);
    const typeFiltered = folderMaterials.filter(m => m.type === activeTab.value);

    if (!searchQuery.value) return typeFiltered;

    const query = searchQuery.value.toLowerCase();
    return typeFiltered.filter(m =>
        m.name.toLowerCase().includes(query)
    );
});

// 刷新当前文件夹的内容
async function refreshCurrentFolder() {
    loading.value = true;
    try {
        await Promise.all([
            loadFolderMaterials(),
            loadSubFolders()
        ]);
        await loadAllThumbnails();
    } catch (error) {
        console.error('加载文件夹内容失败:', error);
        ElMessage.error('加载文件夹内容失败');
    } finally {
        loading.value = false;
    }
}

// 加载所有文件夹，用于选择器
async function loadAllFolders() {
    try {
        allFolders.value = await materialService.getAllFolders();
    } catch (error) {
        console.error('加载文件夹列表失败:', error);
        ElMessage.error('加载文件夹列表失败');
    }
}

// 加载当前文件夹中的素材
async function loadFolderMaterials() {
    try {
        materials.value = await materialService.getMaterialsByFolder(currentFolderId.value);
    } catch (error) {
        console.error('加载素材失败:', error);
        ElMessage.error('加载素材失败');
        materials.value = [];
    }
}

// 加载当前文件夹的子文件夹
async function loadSubFolders() {
    try {
        subFolders.value = await materialService.getSubFolders(currentFolderId.value);
    } catch (error) {
        console.error('加载子文件夹失败:', error);
        ElMessage.error('加载子文件夹失败');
        subFolders.value = [];
    }
}

// 导航到指定文件夹
async function navigateToFolder(folderId) {
    if (folderId === 'root') {
        folderPath.value = [];
        currentFolderId.value = 'root';
        return;
    }

    // 如果是点击导航栏中的文件夹，截断路径
    const pathIndex = folderPath.value.findIndex(folder => folder.id === folderId);
    if (pathIndex >= 0) {
        folderPath.value = folderPath.value.slice(0, pathIndex + 1);
        currentFolderId.value = folderId;
        return;
    }

    // 否则是进入子文件夹
    const folder = subFolders.value.find(folder => folder.id === folderId);
    if (folder) {
        folderPath.value.push(folder);
        currentFolderId.value = folderId;
    }
}

// 打开新建文件夹对话框
function openNewFolderDialog() {
    newFolder.value = {
        name: '',
        parentId: currentFolderId.value
    };
    newFolderDialogVisible.value = true;
}

// 创建新文件夹
async function createFolder() {
    if (!newFolder.value.name.trim()) {
        ElMessage.warning('请输入文件夹名称');
        return;
    }

    try {
        const { success, folder, message } = await materialService.createFolder(newFolder.value);

        if (success) {
            ElMessage.success('文件夹创建成功');
            await Promise.all([
                loadAllFolders(),
                loadSubFolders()
            ]);
            newFolderDialogVisible.value = false;
        } else {
            ElMessage.error(message || '文件夹创建失败');
        }
    } catch (error) {
        console.error('创建文件夹失败:', error);
        ElMessage.error('创建文件夹失败');
    }
}

// 打开重命名文件夹对话框
function openRenameFolderDialog(folder) {
    folderToRename.value = { ...folder };
    renameFolderDialogVisible.value = true;
}

// 重命名文件夹
async function renameFolder() {
    if (!folderToRename.value || !folderToRename.value.name.trim()) {
        ElMessage.warning('请输入文件夹名称');
        return;
    }

    try {
        const { success, message } = await materialService.renameFolder(
            folderToRename.value.id,
            folderToRename.value.name
        );

        if (success) {
            ElMessage.success('文件夹重命名成功');

            // 如果是当前路径上的文件夹，更新路径显示
            const pathIndex = folderPath.value.findIndex(f => f.id === folderToRename.value.id);
            if (pathIndex >= 0) {
                folderPath.value[pathIndex].name = folderToRename.value.name;
            }

            await Promise.all([
                loadAllFolders(),
                loadSubFolders()
            ]);

            renameFolderDialogVisible.value = false;
        } else {
            ElMessage.error(message || '文件夹重命名失败');
        }
    } catch (error) {
        console.error('重命名文件夹失败:', error);
        ElMessage.error('重命名文件夹失败');
    }
}

// 确认删除文件夹
function confirmDeleteFolder(folder) {
    folderToDelete.value = folder;
    deleteFolderDialogVisible.value = true;
}

// 删除文件夹
async function deleteFolder() {
    if (!folderToDelete.value) return;

    try {
        const { success, message } = await materialService.deleteFolder(folderToDelete.value.id);

        if (success) {
            ElMessage.success('文件夹删除成功');
            await loadSubFolders();
            await loadAllFolders();
            deleteFolderDialogVisible.value = false;
        } else {
            ElMessage.error(message || '文件夹删除失败');
        }
    } catch (error) {
        console.error('删除文件夹失败:', error);
        ElMessage.error('删除文件夹失败');
    }
}

// 打开移动素材对话框
function openMoveMaterialDialog(material) {
    currentMaterial.value = material;
    targetFolderId.value = material.folderId;
    moveMaterialDialogVisible.value = true;
}

// 移动素材到其他文件夹
async function moveMaterial() {
    if (!currentMaterial.value || !targetFolderId.value) return;

    // 如果目标文件夹与当前文件夹相同，无需移动
    if (targetFolderId.value === currentMaterial.value.folderId) {
        moveMaterialDialogVisible.value = false;
        return;
    }

    try {
        const { success, message } = await materialService.moveMaterialToFolder(
            currentMaterial.value.id,
            targetFolderId.value
        );

        if (success) {
            ElMessage.success('素材移动成功');
            await loadFolderMaterials();
            moveMaterialDialogVisible.value = false;
        } else {
            ElMessage.error(message || '素材移动失败');
        }
    } catch (error) {
        console.error('移动素材失败:', error);
        ElMessage.error('移动素材失败');
    }
}

// 拖拽素材开始
function dragStart(event, material) {
    event.dataTransfer.setData('materialId', material.id);
    event.dataTransfer.effectAllowed = 'move';
}

// 处理表格行右键菜单
function handleRowContextMenu(row, column, event) {
    // 防止浏览器默认菜单
    event.preventDefault();

    // 如果需要实现右键菜单，可以在这里添加相关代码
    // 例如显示一个包含移动、删除等选项的自定义上下文菜单
    currentMaterial.value = row;
}

function openUploadDialog() {
    newMaterial.value = {
        name: '',
        type: activeTab.value,
        path: '',
        folderId: currentFolderId.value
    };
    fileList.value = [];
    uploadDialogVisible.value = true;
}

function handleFileChange(file) {
    fileList.value = [file];
}

async function saveMaterial() {
    if (!newMaterial.value.name) {
        ElMessage.warning('请输入素材名称');
        return;
    }

    if (fileList.value.length === 0) {
        ElMessage.warning('请选择文件');
        return;
    }

    try {
        uploading.value = true;
        const file = fileList.value[0].raw;

        const result = await materialService.uploadAndSaveMaterial(newMaterial.value, file);

        if (result) {
            ElMessage.success('素材保存成功');
            await refreshCurrentFolder();
            uploadDialogVisible.value = false;
        } else {
            ElMessage.error('素材保存失败');
        }
    } catch (error) {
        console.error('保存素材错误:', error);
        ElMessage.error('保存失败: ' + error.message);
    } finally {
        uploading.value = false;
    }
}

// 获取素材资源的实际URL
async function getAssetUrl(relativePath) {
    if (!relativePath) return '/default-thumbnail.jpg';
    if (relativePath.startsWith('http')) return relativePath;
    if (relativePath.startsWith('/')) return relativePath;

    return await fileSystem.getFileUrl(relativePath);
}

// 修改预览方法，使用正确的文件路径
async function previewMaterial(material) {
    currentMaterial.value = material;
    previewDialogVisible.value = true;

    // 如果是全景图，使用krpano进行预览
    if (material.type === 'panorama') {
        await nextTick();
        setTimeout(async () => {
            try {
                const realPath = await getAssetUrl(material.path);
                const xml = `<krpano>
          <image>
            <sphere url="${realPath}" />
          </image>
          <view hlookat="0" vlookat="0" fov="90" />
        </krpano>`;

                krpanoTools.embedPanoViewer('pano-preview', 'xml:' + encodeURIComponent(xml));
            } catch (error) {
                console.error('预览全景图失败:', error);
                ElMessage.error('无法预览全景图，请确保格式正确');
            }
        }, 100);
    }
}

function confirmDeleteMaterial(material) {
    currentMaterial.value = material;
    deleteDialogVisible.value = true;
}

async function deleteMaterial() {
    if (!currentMaterial.value) return;

    try {
        const result = await materialService.deleteMaterial(currentMaterial.value.id);
        if (result) {
            ElMessage.success('素材删除成功');
            await loadFolderMaterials();
        } else {
            ElMessage.error('素材删除失败');
        }
        deleteDialogVisible.value = false;
    } catch (error) {
        console.error('删除素材失败:', error);
        ElMessage.error('删除素材失败');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

// 加载所有缩略图
async function loadAllThumbnails() {
    const promises = [];
    for (const material of materials.value) {
        if (material.thumbnail && !material.thumbnail.startsWith('http') && !material.thumbnail.startsWith('/')) {
            promises.push(loadThumbnail(material.id, material.thumbnail));
        } else {
            materialThumbnails.value[material.id] = material.thumbnail || '/default-thumbnail.jpg';
        }
    }
    await Promise.all(promises);
}

// 加载单个缩略图
async function loadThumbnail(id, path) {
    try {
        materialThumbnails.value[id] = await fileSystem.getFileUrl(path);
    } catch (error) {
        console.error('加载缩略图失败:', error);
        materialThumbnails.value[id] = '/default-thumbnail.jpg';
    }
}
</script>

<style lang="scss" scoped>
.materials-manage {
    height: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #f5f7fa;

    .category-tabs {
        background-color: #fff;
        border-bottom: 1px solid #e4e7ed;
        padding: 0 16px;

        :deep(.el-tabs__header) {
            margin-bottom: 0;
        }

        :deep(.el-tabs__nav) {
            border: none;
        }

        :deep(.el-tabs__item) {
            font-size: 15px;
            font-weight: 500;
            height: 48px;
            line-height: 48px;

            &.is-active {
                color: var(--el-color-primary);
                font-weight: 600;
            }
        }
    }

    .breadcrumb-and-actions {
        padding: 16px;
        background-color: white;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

        .folder-breadcrumb {
            margin-bottom: 12px;

            :deep(.el-breadcrumb__item) {
                cursor: pointer;

                .el-icon {
                    margin-right: 4px;
                    color: #909399;
                }

                &:hover {
                    .el-breadcrumb__inner {
                        color: var(--el-color-primary);
                    }
                }
            }
        }

        .action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .action-buttons {
                display: flex;
                gap: 10px;

                .el-button {
                    padding: 10px 16px;
                }
            }

            .search-input {
                width: 300px;

                :deep(.el-input__wrapper) {
                    box-shadow: 0 0 0 1px #dcdfe6 inset;
                }
            }
        }
    }

    .content-container {
        flex: 1;
        overflow: auto;
        padding: 16px;

        .section-title {
            display: flex;
            align-items: center;
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
            color: #333;

            .el-icon {
                margin-right: 8px;
                color: #409eff;
            }
        }
    }

    .folders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 20px;

        .folder-card {
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 8px;
            border: none;

            :deep(.el-card__body) {
                padding: 16px;
            }

            &:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                background-color: #f0f7ff;
            }

            .folder-icon {
                display: flex;
                justify-content: center;
                margin: 10px 0;
                color: #409eff;
            }

            .folder-info {
                padding: 10px 0 5px;

                .folder-name {
                    margin: 0 0 10px;
                    font-size: 16px;
                    font-weight: 500;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #333;
                }

                .folder-actions {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
            }

            &:hover .folder-actions {
                opacity: 1;
            }
        }
    }

    .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 20px;

        .material-card {
            transition: all 0.3s;
            border-radius: 8px;
            overflow: hidden;
            border: none;

            :deep(.el-card__body) {
                padding: 0;
            }

            &:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }

            .material-image {
                height: 160px;
                position: relative;
                overflow: hidden;
                background-color: #f0f0f0;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s;
                }

                &:hover {
                    img {
                        transform: scale(1.05);
                    }

                    .material-actions {
                        opacity: 1;
                    }
                }

                .material-actions {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    opacity: 0;
                    transition: opacity 0.3s;
                    display: flex;
                    gap: 10px;

                    .el-button {
                        background-color: rgba(255, 255, 255, 0.9);
                        border: none;
                    }
                }
            }

            .material-info {
                padding: 15px;
                background-color: #fff;

                .material-name {
                    margin: 0 0 10px;
                    font-size: 16px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    color: #303133;
                }

                .material-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .material-time {
                        font-size: 12px;
                        color: #909399;
                    }
                }
            }
        }
    }

    .materials-list {
        margin-top: 12px;
        background-color: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

        :deep(.el-table) {
            --el-table-border-color: #ebeef5;
            --el-table-header-bg-color: #f5f7fa;

            .el-table__header-wrapper {
                th {
                    font-weight: 600;
                    color: #303133;
                    background-color: #f5f7fa;
                }
            }
        }

        .table-actions {
            display: flex;
            justify-content: center;
            gap: 8px;
        }
    }

    .loading-container {
        margin-top: 20px;
        text-align: center;
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .materials-content {
        margin-top: 20px;
    }
}

:deep(.el-dialog) {
    border-radius: 8px;
    overflow: hidden;

    .el-dialog__header {
        padding: 16px;
        margin: 0;
        background-color: #f5f7fa;
        border-bottom: 1px solid #e4e7ed;

        .el-dialog__title {
            font-size: 16px;
            font-weight: 600;
        }
    }

    .el-dialog__body {
        padding: 20px;
    }

    .el-dialog__footer {
        padding: 16px;
        border-top: 1px solid #e4e7ed;
    }
}
</style>
