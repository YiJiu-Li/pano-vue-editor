import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import fileSystem from './utils/fileSystem';

// 导入全局样式
import './assets/styles/global.css';

// 初始化文件系统目录结构
fileSystem.initializeDirectories();

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

app.mount('#app');
