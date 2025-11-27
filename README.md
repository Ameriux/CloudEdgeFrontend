# 云边融合存储系统展示平台

## 项目介绍
这是一个基于Vue.js+ElementUI+Echarts+D3.js的前端项目，用于展示云边融合存储系统的相关功能和数据。

## 技术栈
- Vue.js 3
- Element Plus (ElementUI的Vue 3版本)
- Echarts
- D3.js

## 如何运行
1. 确保已安装Node.js (https://nodejs.org/)
2. 安装项目依赖
```bash
npm install
```
3. 运行开发服务器
```bash
npm run dev
```
4. 在浏览器中访问 http://localhost:3000

## 项目结构
- `public/`: 静态资源
- `src/`: 源代码
  - `assets/`: 资源文件
  - `components/`: 组件
  - `router/`: 路由配置
  - `store/`: 状态管理
  - `views/`: 页面视图
  - `App.vue`: 根组件
  - `main.js`: 入口文件
- `index.html`: 入口HTML文件
- `package.json`: 项目配置
- `vite.config.js`: Vite配置文件
- `api-gateway/`: API网关服务

## API网关服务
项目包含一个独立的API网关服务，用于管理EdgeServer-Client的配置和操作。

### 如何运行API网关服务
1. 进入API网关目录
```bash
cd api-gateway
```
2. 安装依赖
```bash
npm install
```
3. 运行API网关服务
```bash
npm start
# 或开发模式（支持自动重启）
npm run dev
```

### API文档
API网关服务集成了Swagger UI，可以通过以下地址访问完整的API文档：
http://localhost:4000/api-docs

### 主要功能
- 获取和更新EdgeServer-Client的配置文件
- 获取注册配置文件
- 执行DEBEClient命令
- 获取和下载可访问的文件

### 前端访问方式
前端项目已配置代理，可以通过`/api-gateway`前缀访问API网关服务，也可以直接导入`src/api/request.js`中的`apiGateway`实例来调用API。