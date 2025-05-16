<template>  <div class="work-viewer">
    <div class="viewer-header">
      <div class="header-left">
        <h1>{{ work?.name || '全景查看器' }}</h1>
        <span v-if="work" class="scene-count">共 {{ work.scenes.length }} 个场景</span>
      </div>
      <el-button type="primary" plain @click="goBack">
        <el-icon class="el-icon--left"><ArrowLeft /></el-icon>返回
      </el-button>
    </div>    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated>
        <template #template>
          <div class="skeleton-container">
            <div class="skeleton-header">
              <el-skeleton-item variant="h1" style="width: 50%"/>
            </div>
            <div class="skeleton-viewer">
              <el-skeleton-item variant="image" style="width: 100%; height: calc(100vh - 200px)"/>
            </div>
            <div class="skeleton-footer">
              <el-skeleton-item variant="button" style="width: 80px; margin-right: 10px"/>
              <el-skeleton-item variant="button" style="width: 80px; margin-right: 10px"/>
              <el-skeleton-item variant="button" style="width: 80px"/>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else-if="!work" class="error-container">
      <el-empty 
        description="作品不存在或已被删除" 
        :image-size="180"
        image="/assets/images/empty-work.svg">
        <el-button type="primary" @click="goBack">返回作品列表</el-button>
      </el-empty>
    </div>

    <div v-else class="pano-container">
      <template v-if="currentScene">
        <PanoViewer :xml="sceneXml" height="calc(100vh - 120px)" />

        <div class="scene-nav">
          <div class="scene-info">
            <span>当前场景: {{ currentScene.name }}</span>
          </div>

          <div class="scene-list">
            <el-button-group>
              <el-button v-for="scene in work.scenes" :key="scene.id"
                :type="scene.id === currentScene.id ? 'primary' : ''" @click="switchScene(scene.id)">
                {{ scene.name }}
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-empty v-else description="此作品没有场景"></el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PanoViewer from '@/components/common/PanoViewer.vue';
import workService from '@/services/workService';
import krpanoTools from '@/utils/krpano';

const route = useRoute();
const router = useRouter();
const work = ref(null);
const loading = ref(true);
const currentSceneId = ref('');

onMounted(() => {
  loadWork();
});

const currentScene = computed(() => {
  if (!work.value || !work.value.scenes.length) return null;

  if (currentSceneId.value) {
    const scene = work.value.scenes.find(s => s.id === currentSceneId.value);
    if (scene) return scene;
  }

  // 默认返回第一个场景
  return work.value.scenes[0];
});

const sceneXml = computed(() => {
  if (!currentScene.value) return '';
  return krpanoTools.generateSceneXml(currentScene.value, work.value.scenes);
});

function loadWork() {
  loading.value = true;
  const id = route.params.id;

  work.value = workService.getWorkById(id);

  // 如果存在querystring中的sceneId参数，则使用它
  const querySceneId = route.query.sceneId;
  if (querySceneId && work.value && work.value.scenes.some(s => s.id === querySceneId)) {
    currentSceneId.value = querySceneId;
  }

  loading.value = false;
}

function switchScene(sceneId) {
  currentSceneId.value = sceneId;
  // 更新URL但不重新加载页面
  router.replace({
    query: { ...route.query, sceneId }
  });
}

function goBack() {
  router.push('/works');
}
</script>

<style lang="scss" scoped>
.work-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .viewer-header {
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f7fa;
    border-bottom: 1px solid #e6e6e6;

    h1 {
      margin: 0;
      font-size: 18px;
    }
  }

  .loading-container,
  .error-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .pano-container {
    flex: 1;
    display: flex;
    flex-direction: column;

    .scene-nav {
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f5f7fa;
      border-top: 1px solid #e6e6e6;
    }
  }
}
</style>
