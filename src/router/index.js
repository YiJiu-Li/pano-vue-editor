import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';

const routes = [
  {
    path: '/',
    redirect: '/works'  // 修改默认路由为作品管理
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/works',
    name: 'Works',
    component: () => import('@/views/WorksManage.vue')
  },
  {
    path: '/works/edit/:id?',
    name: 'WorkEditor',
    component: () => import('@/views/WorkEditor.vue')
  },
  {
    path: '/works/view/:id',
    name: 'WorkViewer',
    component: () => import('@/views/WorkViewer.vue')
  },
  {
    path: '/materials',
    name: 'Materials',
    component: () => import('@/views/MaterialsManage.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
