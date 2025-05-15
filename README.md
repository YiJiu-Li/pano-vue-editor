# 全景编辑器 (Panorama Vue Editor)

一个基于 Vue.js 和 KRPano 的全景图像编辑器，用于创建、编辑和管理全景场景。

## 功能特点

- 全景场景创建与编辑
- 素材管理
- 作品管理
- 全景查看器
- 支持多种全景格式

## 技术栈

- Vue.js
- Vite
- KRPano 全景引擎
- JavaScript/ES6+
- SCSS

## 安装与运行

### 前提条件

- Node.js (>= 16.x)
- npm 或 yarn

### 安装步骤

1. 克隆项目
   ```
   git clone https://github.com/你的用户名/pano-vue-editor.git
   cd pano-vue-editor
   ```

2. 安装依赖
   ```
   npm install
   ```
   或
   ```
   yarn install
   ```

3. 启动开发服务器
   ```
   npm run dev
   ```
   或
   ```
   yarn dev
   ```

## 使用说明

1. 作品管理：在首页查看和管理所有全景作品
2. 创建新作品：点击"新建"按钮开始创建
3. 编辑作品：选择一个现有作品进行编辑
4. 素材管理：上传和管理全景素材
5. 预览：随时预览编辑中的全景效果

## 项目结构

```
src/
  ├── assets/ - 静态资源
  ├── components/ - 组件
  ├── models/ - 数据模型
  ├── router/ - 路由配置
  ├── services/ - 服务层
  ├── utils/ - 工具函数
  ├── views/ - 页面视图
  ├── App.vue - 根组件
  └── main.js - 入口文件
static/
  ├── panos/ - 全景图片资源
  ├── plugins/ - KRPano 插件
  └── skin/ - KRPano 皮肤
```

## 许可证

MIT

## 联系方式

如有问题或建议，欢迎联系我们。
