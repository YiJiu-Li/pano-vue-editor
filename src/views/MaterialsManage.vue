<template>
    <div class="materials-manage">
        <div class="action-bar">
            <el-button type="primary" @click="openUploadDialog">
                <el-icon>
                    <Upload />
                </el-icon> 上传素材
            </el-button>
            <el-input 
                v-model="searchQuery" 
                placeholder="搜索素材" 
                class="search-input"
                clearable
                prefix-icon="Search"
            ></el-input>
        </div>

        <div class="materials-container">
            <el-tabs v-model="activeTab" class="material-tabs">
                <el-tab-pane label="全景图" name="panorama">
                    <el-empty v-if="filteredMaterials.length === 0" description="暂无全景图素材" />
                    <div v-else class="materials-grid">
                        <el-card
                            v-for="material in filteredMaterials"
                            :key="material.id"
                            shadow="hover"
                            class="material-card"
                        >
                            <div class="material-image">
                                <img :src="getAssetUrl(material.thumbnail)" alt="素材">
                                <div class="material-actions">
                                    <el-button circle @click="previewMaterial(material)">
                                        <el-icon><View /></el-icon>
                                    </el-button>
                                    <el-button circle type="danger" @click="confirmDeleteMaterial(material)">
                                        <el-icon><Delete /></el-icon>
                                    </el-button>
                                </div>
                            </div>
                            <div class="material-info">
                                <h3 class="material-name">{{ material.name }}</h3>
                                <div class="material-meta">
                                    <el-tag size="small" type="success">{{ material.type }}</el-tag>
                                    <span class="material-time">{{ formatDate(material.createTime) }}</span>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="热点图标" name="hotspot">
                    <el-empty v-if="filteredMaterials.length === 0" description="暂无热点图标素材" />
                    <div v-else class="materials-grid">
                        <!-- 与全景图部分类似的卡片组件，代码类似 -->
                    </div>
                </el-tab-pane>

                <el-tab-pane label="音效" name="sound">
                    <el-empty v-if="filteredMaterials.length === 0" description="暂无音效素材" />
                    <div v-else class="materials-list">
                        <el-table :data="filteredMaterials" style="width: 100%">
                            <el-table-column prop="name" label="名称" />
                            <el-table-column label="类型" width="100">
                                <template #default="scope">
                                    <el-tag>{{ scope.row.type }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="添加时间" width="180">
                                <template #default="scope">
                                    {{ formatDate(scope.row.createTime) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="150">
                                <template #default="scope">
                                    <div class="table-actions">
                                        <el-button link @click="previewMaterial(scope.row)">预览</el-button>
                                        <el-button link type="danger" @click="confirmDeleteMaterial(scope.row)">删除</el-button>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-tab-pane>
            </el-tabs>
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

                <el-form-item label="文件">
                    <el-upload
                        action="#"
                        :auto-upload="false"
                        :file-list="fileList"
                        :on-change="handleFileChange"
                        :limit="1"
                    >
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

        <!-- 删除确认对话框 -->
        <el-dialog v-model="deleteDialogVisible" title="确认删除" width="30%">
            <span>确定要删除素材 "{{ currentMaterial?.name }}" 吗？此操作不可逆。</span>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteDialogVisible = false">取消</el-button>
                    <el-button type="danger" @click="deleteMaterial">确定删除</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, View, Delete, Search } from '@element-plus/icons-vue';
import materialService from '@/services/materialService';
import krpanoTools from '@/utils/krpano';
import fileSystem from '@/utils/fileSystem';

const activeTab = ref('panorama');
const materials = ref([]);
const uploadDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentMaterial = ref(null);
const newMaterial = ref({ name: '', type: 'panorama', path: '' });
const fileList = ref([]);
const searchQuery = ref('');
const uploading = ref(false);

onMounted(() => {
    loadMaterials();
});

// 同步选项卡类型和素材类型
watch(activeTab, (newTab) => {
    newMaterial.value.type = newTab;
});

// 过滤素材
const filteredMaterials = computed(() => {
    const typeFiltered = materials.value.filter(m => m.type === activeTab.value);
    
    if (!searchQuery.value) return typeFiltered;
    
    const query = searchQuery.value.toLowerCase();
    return typeFiltered.filter(m => 
        m.name.toLowerCase().includes(query)
    );
});

function loadMaterials() {
    materials.value = materialService.getAllMaterials();
}

function openUploadDialog() {
    newMaterial.value = { name: '', type: activeTab.value, path: '' };
    fileList.value = [];
    uploadDialogVisible.value = true;
}

function handleFileChange(file) {
    // 只保存最新的文件
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
        
        // 使用更新后的服务方法
        const result = await materialService.uploadAndSaveMaterial(newMaterial.value, file);
        
        if (result) {
            ElMessage.success('素材保存成功');
            loadMaterials();
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
function getAssetUrl(relativePath) {
    if (!relativePath) return '/default-thumbnail.jpg';
    if (relativePath.startsWith('http')) return relativePath; // 外部URL
    if (relativePath.startsWith('/')) return relativePath; // 相对于公共目录的路径
    
    // 文件系统中的资源需要转换为实际路径
    return fileSystem.getFilePath(relativePath);
}

// 修改预览方法，使用正确的文件路径
function previewMaterial(material) {
    currentMaterial.value = material;
    previewDialogVisible.value = true;

    // 如果是全景图，使用krpano进行预览
    if (material.type === 'panorama') {
        setTimeout(() => {
            try {
                const realPath = getAssetUrl(material.path);
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

function deleteMaterial() {
    if (currentMaterial.value) {
        const result = materialService.deleteMaterial(currentMaterial.value.id);
        if (result) {
            ElMessage.success('素材删除成功');
            loadMaterials();
        } else {
            ElMessage.error('素材删除失败');
        }
        deleteDialogVisible.value = false;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}
</script>

<style lang="scss" scoped>
.materials-manage {
    .action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        .search-input {
            width: 300px;
        }
    }
    
    .materials-container {
        background-color: #fff;
        border-radius: 4px;
        padding: 20px;
        box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    }
    
    .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
        
        .material-card {
            transition: all 0.3s;
            
            &:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            }
            
            .material-image {
                height: 160px;
                position: relative;
                overflow: hidden;
                
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
                    }
                }
            }
            
            .material-info {
                padding: 15px 0 5px;
                
                .material-name {
                    margin: 0 0 10px;
                    font-size: 16px;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
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
        margin-top: 20px;
    }
}
</style>
