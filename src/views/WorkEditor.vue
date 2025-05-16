<template>
    <div class="work-editor">
        <div class="page-header">
            <h1>{{ isEdit ? '编辑作品' : '创建作品' }}</h1>
            <div class="actions">
                <el-button @click="goBack">返回</el-button>
                <el-button type="primary" @click="saveWork">保存</el-button>
            </div>
        </div>

        <el-form :model="work" label-width="100px" class="work-form">
            <el-form-item label="作品名称">
                <el-input v-model="work.name" placeholder="请输入作品名称"></el-input>
            </el-form-item>

            <el-form-item label="作品描述">
                <el-input v-model="work.description" type="textarea" :rows="3" placeholder="请输入作品描述">
                </el-input>
            </el-form-item>

            <el-form-item label="封面图">
                <el-upload class="cover-uploader" action="#" :auto-upload="false" :on-change="handleCoverChange"
                    :show-file-list="false">
                    <img v-if="work.coverImage" :src="getAssetUrl(work.coverImage)" class="cover-image" />
                    <el-icon v-else class="cover-uploader-icon">
                        <Plus />
                    </el-icon>
                </el-upload>
                <div class="upload-tip">点击上传封面图</div>
            </el-form-item>
        </el-form>

        <div class="scenes-section">
            <div class="section-header">
                <h2>场景列表</h2>
                <el-button type="primary" @click="addScene">
                    <el-icon>
                        <Plus />
                    </el-icon> 添加场景
                </el-button>
            </div>

            <el-empty v-if="work.scenes.length === 0" description="暂无场景，请添加"></el-empty>

            <div v-else class="scenes-list">
                <el-card v-for="(scene, index) in work.scenes" :key="scene.id" class="scene-card">
                    <template #header>
                        <div class="scene-header">
                            <span>{{ scene.name || '未命名场景' }}</span>
                            <div class="scene-actions">
                                <el-button type="text" @click="editScene(index)">编辑</el-button>
                                <el-button type="text" @click="removeScene(index)">删除</el-button>
                            </div>
                        </div>
                    </template>

                    <div class="scene-content">
                        <div class="scene-preview">
                            <img :src="getPanoramaImage(scene)" alt="场景预览">
                        </div>
                        <div class="scene-info">
                            <p>热点数: {{ scene.hotspots.length }}</p>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>

        <!-- 场景编辑对话框 -->
        <el-dialog v-model="sceneDialogVisible" :title="isEditScene ? '编辑场景' : '添加场景'" width="50%">
            <el-form :model="currentScene" label-width="100px">
                <el-form-item label="场景名称">
                    <el-input v-model="currentScene.name" placeholder="请输入场景名称"></el-input>
                </el-form-item>

                <el-form-item label="全景图">
                    <el-select v-model="currentScene.panoramaImage" placeholder="请选择全景图">
                        <el-option v-for="item in panoramaMaterials" :key="item.id" :label="item.name"
                            :value="item.path">
                            <div style="display: flex; align-items: center;">
                                <img :src="item.thumbnail" style="width: 50px; height: 30px; margin-right: 10px;">
                                <span>{{ item.name }}</span>
                            </div>
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="sceneDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveScene">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { Work, Scene } from '@/models';
import workService from '@/services/workService';
import materialService from '@/services/materialService';
import { fileToBase64 } from '@/utils/storage';
import fileSystem from '@/utils/fileSystem';

const route = useRoute();
const router = useRouter();
const work = ref(new Work());
const isEdit = computed(() => !!route.params.id);
const panoramaMaterials = ref([]);
const sceneDialogVisible = ref(false);
const isEditScene = ref(false);
const currentScene = ref(new Scene());
const currentSceneIndex = ref(-1);

onMounted(() => {
    if (isEdit.value) {
        loadWork();
    }
    loadPanoramaMaterials();
});

async function loadWork() {
    const id = route.params.id;
    const loadedWork = await workService.getWorkById(id);
    if (loadedWork) {
        work.value = loadedWork;
    } else {
        ElMessage.error('作品不存在');
        router.push('/works');
    }
}

async function loadPanoramaMaterials() {
    panoramaMaterials.value = await materialService.getMaterialsByType('panorama');
}

function goBack() {
    router.push('/works');
}

// 获取资源的实际URL
function getAssetUrl(relativePath) {
    if (!relativePath) return '/default-cover.jpg';
    if (relativePath.startsWith('http')) return relativePath;
    if (relativePath.startsWith('/')) return relativePath;

    return fileSystem.getFilePath(relativePath);
}

// 处理封面图片上传
async function handleCoverChange(file) {
    try {
        if (isEdit.value && work.value.id) {
            // 上传并保存封面图片
            await workService.uploadWorkCover(work.value.id, file.raw);
            // 重新加载作品数据
            loadWork();
        } else {
            ElMessage.warning('请先保存作品后再上传封面');
        }
    } catch (error) {
        console.error('处理封面图片失败:', error);
        ElMessage.error('上传封面失败');
    }
}

function saveWork() {
    if (!work.value.name) {
        ElMessage.warning('请输入作品名称');
        return;
    }

    const result = workService.saveWork(work.value);
    if (result) {
        ElMessage.success('保存成功');
        router.push('/works');
    } else {
        ElMessage.error('保存失败');
    }
}

function getPanoramaImage(scene) {
    return scene.panoramaImage || 'default-panorama.jpg';
}

function addScene() {
    currentScene.value = new Scene();
    isEditScene.value = false;
    sceneDialogVisible.value = true;
}

function editScene(index) {
    currentSceneIndex.value = index;
    currentScene.value = { ...work.value.scenes[index] };
    isEditScene.value = true;
    sceneDialogVisible.value = true;
}

function removeScene(index) {
    work.value.scenes.splice(index, 1);
}

function saveScene() {
    if (!currentScene.value.name) {
        ElMessage.warning('请输入场景名称');
        return;
    }

    if (!currentScene.value.panoramaImage) {
        ElMessage.warning('请选择全景图');
        return;
    }

    if (isEditScene.value) {
        // 编辑现有场景
        work.value.scenes[currentSceneIndex.value] = currentScene.value;
    } else {
        // 添加新场景
        work.value.scenes.push(currentScene.value);
    }

    sceneDialogVisible.value = false;
}
</script>

<style lang="scss" scoped>
.work-editor {
    padding: 20px;

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h1 {
            margin: 0;
        }
    }

    .work-form {
        margin-bottom: 30px;
    }

    .cover-uploader {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        width: 200px;
        height: 120px;

        .cover-uploader-icon {
            font-size: 28px;
            color: #8c939d;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .upload-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 5px;
    }

    .scenes-section {
        margin-top: 30px;

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;

            h2 {
                margin: 0;
            }
        }

        .scenes-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;

            .scene-card {
                .scene-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .scene-content {
                    .scene-preview {
                        height: 150px;
                        overflow: hidden;
                        margin-bottom: 10px;

                        img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                    }
                }
            }
        }
    }
}
</style>
