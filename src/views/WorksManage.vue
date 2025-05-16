<template>
    <div class="works-manage page-container">
        <div class="action-bar">
            <div class="left">
                <el-button type="primary" size="large" @click="createWork">
                    <el-icon class="el-icon--left">
                        <Plus />
                    </el-icon>新建作品
                </el-button>
            </div>
            <div class="right">
                <el-input v-model="searchQuery" placeholder="输入名称搜索作品" class="search-input" clearable>
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
        </div>

        <el-card class="table-card" shadow="hover" v-loading="loading">
            <div v-if="filteredWorks.length === 0" class="empty-state">
                <el-empty description="暂无作品，开始创建吧" :image-size="120">
                    <el-button type="primary" @click="createWork">新建作品</el-button>
                </el-empty>
            </div>

            <template v-else>
                <div class="table-container">
                    <el-table :data="paginatedWorks" style="width: 100%" row-key="id"
                        :row-class-name="tableRowClassName" :header-cell-style="{
                            background: '#F5F7FA',
                            color: '#303133',
                            fontWeight: '600',
                            height: '50px'
                        }" max-height="calc(100vh - 320px)">
                        <el-table-column label="封面" width="150" align="center">
                            <template #default="scope">
                                <div class="table-cover">
                                    <img v-if="scope.row.coverImage" :src="scope.row.coverImage" alt="封面">
                                    <div v-else class="empty-cover">
                                        <el-icon>
                                            <Picture />
                                        </el-icon>
                                        <span>{{ scope.row.name.substring(0, 1) }}</span>
                                    </div>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column prop="name" label="名称" min-width="180" />

                        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip>
                            <template #default="scope">
                                <span class="description-text">{{ scope.row.description || '-' }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="场景数" width="100" align="center">
                            <template #default="scope">
                                <el-tag effect="light" size="small" type="info" round>{{ scope.row.scenes.length
                                    }}</el-tag>
                            </template>
                        </el-table-column>

                        <el-table-column label="更新时间" width="150" align="center">
                            <template #default="scope">
                                <span class="time-text">{{ formatDate(scope.row.updateTime) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="操作" width="180" fixed="right" align="center">
                            <template #default="scope">
                                <div class="table-actions">
                                    <el-tooltip content="查看作品" placement="top">
                                        <el-button circle size="small" @click="viewWork(scope.row.id)">
                                            <el-icon>
                                                <View />
                                            </el-icon>
                                        </el-button>
                                    </el-tooltip>
                                    <el-tooltip content="编辑作品" placement="top">
                                        <el-button circle size="small" type="primary" @click="editWork(scope.row.id)">
                                            <el-icon>
                                                <Edit />
                                            </el-icon>
                                        </el-button>
                                    </el-tooltip>
                                    <el-tooltip content="删除" placement="top">
                                        <el-button circle size="small" type="danger" @click="confirmDelete(scope.row)">
                                            <el-icon>
                                                <Delete />
                                            </el-icon>
                                        </el-button>
                                    </el-tooltip>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <div class="pagination-container">
                    <el-pagination v-if="totalItems > 0" v-model:current-page="currentPage" v-model:page-size="pageSize"
                        :page-sizes="pageSizes" :total="totalItems" @size-change="handleSizeChange"
                        @current-change="handleCurrentChange" layout="total, sizes, prev, pager, next, jumper"
                        background />
                </div>
            </template>

            <el-dialog v-model="deleteDialogVisible" title="确认删除" width="420px" center align-center>
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
        </el-card>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, WarningFilled, Plus, View, Edit, Delete, Picture } from '@element-plus/icons-vue';
import workService from '@/services/workService';

const router = useRouter();
const works = ref([]);
const loading = ref(true);
const deleteDialogVisible = ref(false);
const currentWork = ref(null);
const searchQuery = ref('');

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizes = [5, 10, 20, 50];

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

// 分页后的数据
const paginatedWorks = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredWorks.value.slice(start, end);
});

// 总条目数
const totalItems = computed(() => {
    return filteredWorks.value.length;
});

async function loadWorks() {
    loading.value = true;
    works.value = await workService.getAllWorks();
    setTimeout(() => {
        loading.value = false;
    }, 300); // 添加小延迟，使加载动画更明显
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

async function deleteWork() {
    if (currentWork.value) {
        try {
            const result = await workService.deleteWork(currentWork.value.id);
            if (result) {
                ElMessage.success('作品已删除');
                await loadWorks();
            } else {
                ElMessage.error('删除失败');
            }
        } catch (error) {
            console.error('删除作品失败:', error);
            ElMessage.error('删除失败: ' + error.message);
        } finally {
            deleteDialogVisible.value = false;
        }
    }
}

// 表格行样式
function tableRowClassName({ rowIndex }) {
    return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
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

// 处理分页变化
function handleCurrentChange(val) {
    currentPage.value = val;
}

// 处理每页显示数量变化
function handleSizeChange(val) {
    pageSize.value = val;
    currentPage.value = 1; // 重置到第一页
}
</script>

<style lang="scss" scoped>
.works-manage {
    height: 100%;
    padding: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .left {
            display: flex;
            gap: 12px;
        }

        .right {
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .search-input {
            width: 280px;
        }
    }

    .table-card {
        margin-bottom: 12px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;

        :deep(.el-card__body) {
            padding: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
        }
    }

    .table-container {
        flex: 1;
        overflow: hidden;
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
        border-radius: 6px;
        overflow: hidden;
        margin: 0 auto;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s;
        position: relative;

        &:hover {
            transform: scale(1.05);
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .empty-cover {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #e0f2ff 0%, #d0def5 100%);

            .el-icon {
                font-size: 24px;
                color: #5e9bcc;
                margin-bottom: 4px;
                filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
            }

            span {
                font-size: 22px;
                font-weight: bold;
                color: #4a7bad;
                text-transform: uppercase;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
            }
        }
    }

    .description-text {
        color: #606266;
        line-height: 1.5;
    }

    .time-text {
        color: #909399;
        font-size: 13px;
    }

    .table-actions {
        display: flex;
        justify-content: center;
        gap: 8px;

        .el-button {
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            }
        }
    }

    :deep(.even-row) {
        background-color: #FAFAFA;
    }

    :deep(.odd-row) {
        background-color: #FFFFFF;
    }

    :deep(.el-table tr:hover) td {
        background-color: #F0F7FF !important;
    }

    .pagination-container {
        display: flex;
        justify-content: center;
        padding: 10px 0;
        margin: auto 0 0;
        border-top: 1px solid #ebeef5;

        :deep(.el-pagination) {
            justify-content: center;
            padding: 0;

            .el-pagination__total {
                margin-right: 16px;
            }

            .el-pagination__sizes {
                margin-right: 16px;
            }

            button {
                min-width: 32px;
                height: 32px;

                &:hover {
                    color: var(--el-color-primary);
                }
            }

            .el-pager li {
                min-width: 32px;
                height: 32px;

                &.is-active {
                    background-color: var(--el-color-primary);
                    color: white;
                }

                &:hover {
                    color: var(--el-color-primary);
                }
            }
        }
    }

    .delete-confirm {
        text-align: center;
        padding: 20px 0;

        .warning-icon {
            font-size: 48px;
            color: var(--el-color-warning);
            margin-bottom: 16px;
        }

        p {
            margin: 8px 0;
            font-size: 16px;
            color: #303133;
        }

        .delete-hint {
            color: #909399;
            font-size: 14px;
        }
    }
}
</style>
