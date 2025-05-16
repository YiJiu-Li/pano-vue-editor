<template>
    <div class="pano-viewer-container">
        <div ref="container" class="pano-viewer" :style="{ height: height }"></div>
        <div v-if="showControls" class="pano-controls">
            <div class="control-button-group">
                <el-tooltip content="全屏查看" placement="top">
                    <el-button circle @click="toggleFullscreen">
                        <el-icon>
                            <FullScreen />
                        </el-icon>
                    </el-button>
                </el-tooltip>
                <el-tooltip content="重置视角" placement="top">
                    <el-button circle @click="resetView">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                    </el-button>
                </el-tooltip>
                <el-tooltip content="放大" placement="top">
                    <el-button circle @click="zoomIn">
                        <el-icon>
                            <ZoomIn />
                        </el-icon>
                    </el-button>
                </el-tooltip>
                <el-tooltip content="缩小" placement="top">
                    <el-button circle @click="zoomOut">
                        <el-icon>
                            <ZoomOut />
                        </el-icon>
                    </el-button>
                </el-tooltip>
                <el-tooltip content="自动旋转" placement="top">
                    <el-button circle :type="autoRotate ? 'primary' : ''" @click="toggleAutoRotate">
                        <el-icon>
                            <DCaret />
                        </el-icon>
                    </el-button>
                </el-tooltip>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { FullScreen, Refresh, ZoomIn, ZoomOut, DCaret } from '@element-plus/icons-vue';
import krpanoTools from '@/utils/krpano';

const props = defineProps({
    xml: {
        type: String,
        required: true
    },
    height: {
        type: String,
        default: '500px'
    },
    showControls: {
        type: Boolean,
        default: true
    }
});

const container = ref(null);
let viewer = null;
let krpano = null;
const autoRotate = ref(false);

onMounted(() => {
    initViewer();
});

watch(() => props.xml, () => {
    // 当XML更新时重新初始化查看器
    if (viewer) {
        viewer.remove();
        viewer = null;
    }
    initViewer();
});

function initViewer() {
    if (container.value) {
        const containerId = 'pano-' + Date.now();
        container.value.id = containerId;

        // 延迟一点点时间确保DOM已更新
        setTimeout(() => {
            viewer = krpanoTools.embedPanoViewer(containerId, props.xml, onKrpanoReady);
        }, 50);
    }
}

// 获取krpano API对象
function onKrpanoReady(krpanoObject) {
    krpano = krpanoObject;
}

// 全屏查看
function toggleFullscreen() {
    if (!krpano) return;

    try {
        if (krpano.get('fullscreen')) {
            krpano.set('fullscreen', false);
        } else {
            krpano.set('fullscreen', true);
        }
    } catch (e) {
        console.error('全屏切换失败', e);
    }
}

// 重置视角
function resetView() {
    if (!krpano) return;
    try {
        krpano.call('lookto(0, 0, 90, smooth(1.0, 1.0, 1.0));');
    } catch (e) {
        console.error('重置视角失败', e);
    }
}

// 放大
function zoomIn() {
    if (!krpano) return;
    try {
        const currentFov = krpano.get('view.fov');
        const newFov = Math.max(currentFov - 10, 30);
        krpano.call(`tween(view.fov, ${newFov}, 0.5);`);
    } catch (e) {
        console.error('放大失败', e);
    }
}

// 缩小
function zoomOut() {
    if (!krpano) return;
    try {
        const currentFov = krpano.get('view.fov');
        const newFov = Math.min(currentFov + 10, 120);
        krpano.call(`tween(view.fov, ${newFov}, 0.5);`);
    } catch (e) {
        console.error('缩小失败', e);
    }
}

// 自动旋转切换
function toggleAutoRotate() {
    if (!krpano) return;

    try {
        autoRotate.value = !autoRotate.value;
        if (autoRotate.value) {
            krpano.call('autorotate.start();');
        } else {
            krpano.call('autorotate.stop();');
        }
    } catch (e) {
        console.error('自动旋转切换失败', e);
    }
}

onBeforeUnmount(() => {
    if (viewer) {
        viewer.remove();
        viewer = null;
        krpano = null;
    }
});
</script>

<style scoped>
.pano-viewer-container {
    position: relative;
    width: 100%;
}

.pano-viewer {
    width: 100%;
    min-height: 300px;
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pano-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 100;

    .control-button-group {
        display: flex;
        gap: 8px;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 8px;
        border-radius: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;

        &:hover {
            background-color: rgba(255, 255, 255, 0.95);
        }

        .el-button {
            transition: transform 0.2s ease;

            &:hover {
                transform: scale(1.1);
            }
        }
    }
}
</style>
