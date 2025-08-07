<template>
  <div class="app-container">
    <!-- 顶部标题 -->
    <header class="header">
      <div class="header-content">
        <h1>云边融合存储系统展示平台</h1>
      </div>
    </header>

    <div class="main-content">
      <!-- 左侧导航栏 -->
      <aside class="sidebar">
        <el-menu
          default-active="overview"
          class="el-menu-vertical-demo"
          @open="handleOpen"
          @close="handleClose"
          background-color="#f0f9eb"
          text-color="#303133"
          active-text-color="#27ae60"
          router
        >
          <el-menu-item index="/"
            ><i class="el-icon-s-home"></i><span>总览</span></el-menu-item
          >
          <el-sub-menu index="/debeclient">
            <template #title>
              <i class="el-icon-laptop"></i><span>Client</span>
            </template>
            <el-menu-item index="/debeclient"
              >客户端列表</el-menu-item
            >
            <el-menu-item index="/debeclient/upload"
              >上传</el-menu-item>
            <el-menu-item index="/debeclient/download"
              >下载</el-menu-item
            >
            <el-menu-item index="/debeclient/log"
              >历史日志</el-menu-item
            >
          </el-sub-menu>
          <el-sub-menu index="edgeserver">
            <template #title>
              <i class="el-icon-server"></i><span>EdgeServer</span>
            </template>
            <el-menu-item index="/edgeserver/workbench1"
              >工作台</el-menu-item
            >
          </el-sub-menu>
          <el-sub-menu index="cloudserver">
            <template #title>
              <i class="el-icon-cloud"></i><span>Cloud</span>
            </template>
            <el-menu-item index="/cloudserver/workbench1"
              >工作台</el-menu-item
            >
          </el-sub-menu>
        </el-menu>
      </aside>

      <!-- 主内容区域 -->
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App',
  methods: {
    handleOpen(key, keyPath) {
      console.log(key, keyPath)
    },
    handleClose(key, keyPath) {
      console.log(key, keyPath)
    }
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.header {
  height: 64px;
  background-color: #2c3e50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.logo-container {
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c3e50;
  font-size: 24px;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background-color: #f0f9eb;
  box-shadow: 1px 0 10px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f7f7f7;
}

/* 自定义ElementUI样式 */
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 220px;
  min-height: 400px;
}
</style>