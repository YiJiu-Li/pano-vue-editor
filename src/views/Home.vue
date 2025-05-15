<template>
    <div class="home-container">
        <el-row :gutter="20">
            <el-col :span="24">
                <div class="welcome-card">
                    <h1>欢迎使用Krpano全景编辑器</h1>
                    <p>这是一个本地全景编辑工具，可以帮助您创建和管理全景项目</p>
                    <div class="action-buttons">
                        <el-button type="primary" @click="$router.push('/works')">
                            作品管理
                        </el-button>
                        <el-button type="success" @click="$router.push('/materials')">
                            素材管理
                        </el-button>
                    </div>
                </div>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="recent-works">
            <el-col :span="24">
                <h2>最近作品</h2>
            </el-col>
            <el-col v-for="work in recentWorks" :key="work.id" :span="6">
                <el-card :body-style="{ padding: '0px' }" shadow="hover">
                    <img :src="work.coverImage || 'default-cover.jpg'" class="work-cover">
                    <div class="work-info">
                        <h3>{{ work.name }}</h3>
                        <p>{{ formatDate(work.updateTime) }}</p>
                        <div class="card-actions">
                            <el-button size="small" @click="viewWork(work.id)">查看</el-button>
                            <el-button size="small" type="primary" @click="editWork(work.id)">编辑</el-button>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import workService from '@/services/workService';

const router = useRouter();
const recentWorks = ref([]);

onMounted(() => {
    loadRecentWorks();
});

function loadRecentWorks() {
    // 获取所有作品并按更新时间排序，取最近的4个
    const works = workService.getAllWorks();
    recentWorks.value = works
        .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
        .slice(0, 4);
}

function viewWork(id) {
    router.push(`/works/view/${id}`);
}

function editWork(id) {
    router.push(`/works/edit/${id}`);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}
</script>

<style scoped>
.home-container {
    padding: 20px;
}

.welcome-card {
    background-color: #f5f7fa;
    border-radius: 8px;
    padding: 30px;
    text-align: center;
    margin-bottom: 30px;
}

.action-buttons {
    margin-top: 20px;
}

.recent-works {
    margin-top: 20px;
}

.work-cover {
    width: 100%;
    height: 180px;
    object-fit: cover;
}

.work-info {
    padding: 15px;
}

.card-actions {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
}
</style>
