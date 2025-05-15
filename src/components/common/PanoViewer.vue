<template>
    <div ref="container" class="pano-viewer" :style="{ height: height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import krpanoTools from '@/utils/krpano';

const props = defineProps({
    xml: {
        type: String,
        required: true
    },
    height: {
        type: String,
        default: '500px'
    }
});

const container = ref(null);
let viewer = null;

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
            viewer = krpanoTools.embedPanoViewer(containerId, props.xml);
        }, 50);
    }
}

onBeforeUnmount(() => {
    if (viewer) {
        viewer.remove();
        viewer = null;
    }
});
</script>

<style scoped>
.pano-viewer {
    width: 100%;
    min-height: 300px;
    background-color: #000;
}
</style>
