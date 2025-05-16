<template>
    <el-config-provider :locale="zhCn">
        <el-container class="app-container">
            <!-- 侧边导航栏 -->
            <el-aside width="220px" class="app-sidebar">
                <div class="logo-container">
                    <h1 class="logo">Krpano编辑器</h1>
                </div>
                <el-menu :default-active="activeMenu" router class="app-menu" background-color="#ffffff"
                    text-color="#606266" active-text-color="#409EFF">
                    <el-menu-item index="/works">
                        <el-icon>
                            <Document />
                        </el-icon>
                        <span>作品管理</span>
                    </el-menu-item>
                    <el-menu-item index="/materials">
                        <el-icon>
                            <Picture />
                        </el-icon>
                        <span>素材管理</span>
                    </el-menu-item>
                </el-menu>
            </el-aside>

            <!-- 主内容区 -->
            <el-container class="main-container">
                <el-header height="60px" class="app-header">
                    <div class="header-left">
                        <h2 class="page-title">{{ pageTitle }}</h2>
                    </div>
                    <div class="header-right">
                        <el-dropdown trigger="click">
                            <div class="user-info">
                                <el-avatar size="small" icon="el-icon-user"></el-avatar>
                                <span class="username">管理员</span>
                                <el-icon>
                                    <ArrowDown />
                                </el-icon>
                            </div>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item>帮助文档</el-dropdown-item>
                                    <el-dropdown-item>设置</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </el-header>

                <el-main class="app-main">
                    <router-view v-slot="{ Component }">
                        <transition name="fade" mode="out-in">
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </el-main>

                <el-footer height="40px" class="app-footer">
                    <span>© 2025 Krpano全景编辑器</span>
                    <span>版本 v1.0.0</span>
                </el-footer>
            </el-container>
        </el-container>
    </el-config-provider>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Document, Picture, ArrowDown } from '@element-plus/icons-vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const route = useRoute();

// 当前激活的菜单项
const activeMenu = computed(() => {
    // 从路由路径中提取基本路径
    const path = route.path;
    if (path.startsWith('/works')) {
        return '/works';
    } else if (path.startsWith('/materials')) {
        return '/materials';
    }
    return path;
});

// 根据路由动态设置页面标题
const pageTitle = computed(() => {
    switch (activeMenu.value) {
        case '/works':
            return '作品管理';
        case '/materials':
            return '素材管理';
        default:
            return 'Krpano全景编辑器';
    }
});
</script>

<style>
@import './assets/styles/main.scss';

.app-container {
    height: 100vh;
}

.app-sidebar {
    background-color: #ffffff;
    border-right: 1px solid var(--border-color);
}

.logo-container {
    padding: 16px;
    margin-bottom: 8px;
    text-align: center;
    position: relative;
    /* 添加定位 */
    background-color: #ffffff;
    /* 确保背景是纯色 */
    z-index: 1;
    /* 确保显示在顶层 */
    transform: translateZ(0);
    /* 强制硬件加速，减少模糊 */
    border-bottom: 1px solid #f0f0f0;
    /* 添加底部边框增强区分 */
}

.logo {
    margin: 0;
    padding: 0;
    font-size: 18px;
    /* 调整为更常用的像素值 */
    font-weight: 600;
    color: #333333;
    /* 使用更深的颜色增加对比度 */
    line-height: 1.5;
    letter-spacing: 0.5px;

    /* 确保没有任何特殊效果 */
    text-transform: none;
    white-space: nowrap;
    background: none;
    -webkit-text-fill-color: initial;
    text-shadow: none;
    transform: none;
    box-shadow: none;
    filter: none;
    display: inline-block;
    /* 使用行内块，防止布局影响 */
}

.app-header {
    background-color: #ffffff;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius);
    transition: var(--transition);

    &:hover {
        background-color: rgba(0, 0, 0, 0.04);
    }

    .username {
        margin: 0 8px;
        font-size: 14px;
    }
}

.app-main {
    background-color: var(--background-color);
    padding: 0;
    overflow: hidden;
    /* 防止内容溢出 */
    display: flex;
    flex-direction: column;
}

.app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    color: var(--text-secondary);
    font-size: 14px;
    background-color: #ffffff;
    border-top: 1px solid var(--border-color);
}
</style>
