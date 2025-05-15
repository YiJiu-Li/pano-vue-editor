<template>
    <div class="works-manage page-container">
        <div class="action-bar">
            <div class="left">
                <el-button type="primary" @click="createWork">新建作品</el-button>
            </div>
            <div class="right">
                <el-input v-model="searchQuery" placeholder="搜索作品" class="search-input" clearable>
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
        </div>

        <div v-if="filteredWorks.length === 0" class="empty-state">
            <el-empty description="暂无作品，开始创建吧" :image-size="120">
                <el-button type="primary" @click="createWork">新建作品</el-button>
            </el-empty>
        </div>

        <template v-else>
            <!-- 表格视图 -->
            <el-table :data="filteredWorks" style="width: 100%" border row-key="id">
                <el-table-column label="封面" width="160">
                    <template #default="scope">
                        <div class="table-cover">
                            <img :src="scope.row.coverImage || '/default-cover.jpg'" alt="封面">
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="name" label="名称" />

                <el-table-column prop="description" label="描述" show-overflow-tooltip />

                <el-table-column label="场景数" width="100" align="center">
                    <template #default="scope">
                        <el-tag effect="plain" size="small">{{ scope.row.scenes.length }}</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="更新时间" width="180">
                    <template #default="scope">
                        {{ formatDate(scope.row.updateTime) }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="220" fixed="right">
                    <template #default="scope">
                        <div class="table-actions">
                            <el-button size="small" plain @click="viewWork(scope.row.id)">查看</el-button>
                            <el-button size="small" link @click="editWork(scope.row.id)">编辑</el-button>
                            <el-button size="small" type="danger" plain @click="confirmDelete(scope.row)">删除</el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </template>

        <el-dialog v-model="deleteDialogVisible" title="确认删除" width="420px">
            <div class="delete-confirm">
                <el-icon class="warning-icon">
                    <WarningFilled />
                </el-icon>
                <p>确定要删除作品 "{{ currentWork?.name }}" 吗？</p>
                <p class="delete-hint">此操作不可逆，删除后将无法恢复。</p>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="deleteDialogVisible = false">取消</el-button>
                    <el-button type="danger" @click="deleteWork">确定删除</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, WarningFilled } from '@element-plus/icons-vue';
import workService from '@/services/workService';

const router = useRouter();
const works = ref([]);
const loading = ref(false);
const deleteDialogVisible = ref(false);
const currentWork = ref(null);
const searchQuery = ref('');

onMounted(() => {
    loadWorks();
});

// 过滤作品列表
const filteredWorks = computed(() => {
    if (!searchQuery.value) return works.value;

    const query = searchQuery.value.toLowerCase();
    return works.value.filter(work =>
        work.name.toLowerCase().includes(query) ||
        (work.description && work.description.toLowerCase().includes(query))
    );
});

function loadWorks() {
    loading.value = true;
    works.value = workService.getAllWorks();
    loading.value = false;
}

function createWork() {
    router.push('/works/edit');
}

function viewWork(id) {
    router.push(`/works/view/${id}`);
}

function editWork(id) {
    router.push(`/works/edit/${id}`);
}

function confirmDelete(work) {
    currentWork.value = work;
    deleteDialogVisible.value = true;
}

function deleteWork() {
    if (currentWork.value) {
        const result = workService.deleteWork(currentWork.value.id);
        if (result) {
            ElMessage.success('作品已删除');
            loadWorks();
        } else {
            ElMessage.error('删除失败');
        }
        deleteDialogVisible.value = false;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
</script>

<style lang="scss" scoped>
.works-manage {
    min-height: calc(100vh - 160px);

    .action-bar {
        .right {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .search-input {
            width: 240px;
        }
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
    }

    .table-cover {
        width: 120px;
        height: 70px;
        border-radius: 4px;
        overflow: hidden;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .table-actions {
        display: flex;
        justify-content: center;
        gap: 8px;

        .el-button {
            padding: 6px 12px;
            font-size: 13px;
            border-radius: 4px;
            transition: all 0.2s;

            &:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            &.is-plain {
                &:hover {
                    opacity: 0.85;
                }
            }
        }
    }

    .delete-confirm {
        text-align: center;
        padding: 10px 0;

        .warning-icon {
            font-size: 48px;
            color: var(--warning-color);
            margin-bottom: 16px;
        }

        p {
            margin: 8px 0;
            font-size: 16px;
            color: var(--text-primary);
        }

        .delete-hint {
            color: var(--text-secondary);
            font-size: 14px;
        }
    }
}
</style>
