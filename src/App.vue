<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <div class="header-logo">
          <svg class="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
            <path d="M10 22V14L16 10L22 14V22L16 26L10 22Z" stroke="white" stroke-width="1.5" fill="none"/>
            <circle cx="16" cy="18" r="3" fill="white" opacity="0.9"/>
            <path d="M16 10V12M16 24V26M10 18H8M24 18H26" stroke="white" stroke-width="1.2" opacity="0.6"/>
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stop-color="#3B82F6"/>
                <stop offset="100%" stop-color="#1E40AF"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="header-title-group">
          <span class="header-brand">云边融合的安全存储系统</span>
          <span class="header-subtitle">CloudEdge System</span>
        </div>
      </div>
      <div class="header-right">
        <div v-if="isLoggedIn && userInfo" class="header-user">
          <el-avatar :size="32" class="user-avatar">
            {{ (userInfo.username || 'U')[0].toUpperCase() }}
          </el-avatar>
          <span class="user-name">{{ userInfo.username }}</span>
        </div>
        <div v-else class="header-status">
          <span class="status-dot"></span>
          <span class="status-text">系统运行中</span>
        </div>
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
          background-color="transparent"
          text-color="#5b616e"
          active-text-color="#1d4ed8"
          router
        >
          <el-menu-item index="/" 
            ><i class="el-icon-s-home"></i><span>总览</span></el-menu-item
          >
          <el-sub-menu index="/mfa">
            <template #title>
              <i class="el-icon-lock"></i><span>多因子认证</span>
            </template>
            <el-menu-item index="/mfa/auth"
              >认证流程</el-menu-item
            >
            <el-menu-item v-if="userInfo && userInfo.is_superuser" index="/mfa/device"
              >设备管理</el-menu-item
            >
            <el-menu-item v-if="!isLoggedIn" index="/mfa/login"
              >登录</el-menu-item
            >
            <template v-else>
              <el-menu-item index="/mfa/Items"
                >Items</el-menu-item
              >
              <el-menu-item index="/mfa/userInfo"
                >用户信息</el-menu-item
              >
              <el-menu-item index="/mfa/ip-test"
                >IP异常测试</el-menu-item
              >
              <el-menu-item index="/mfa/email-alert"
                >邮件告警测试</el-menu-item
              >
              <el-menu-item index="/mfa/ErrorLog"
                >异常日志</el-menu-item
              >
            </template>
            
          </el-sub-menu>
          <el-sub-menu index="/debeclient">
            <template #title>
              <i class="el-icon-laptop"></i><span>Client</span>
            </template>
            <el-menu-item index="/debeclient"
              >客户端列表</el-menu-item
            >
            
            <!-- 上传目录 -->
            <el-sub-menu :index="'upload-dir'">
              <template #title>
                <i class="el-icon-upload"></i><span>上传</span>
              </template>
              <!-- 为每个客户端生成上传子菜单项 -->
              <el-menu-item 
                v-for="client in clients" 
                :key="`upload-${client.name}`" 
                :index="`/debeclient/upload/${client.name}`"
              >
                {{ client.name }}
              </el-menu-item>
            </el-sub-menu>
            
            <!-- 下载目录 -->
            <el-sub-menu :index="'download-dir'">
              <template #title>
                <i class="el-icon-download"></i><span>下载</span>
              </template>
              <!-- 为每个客户端生成下载子菜单项 -->
              <el-menu-item 
                v-for="client in clients" 
                :key="`download-${client.name}`" 
                :index="`/debeclient/download/${client.name}`"
              >
                {{ client.name }}
              </el-menu-item>
            </el-sub-menu>
            

          </el-sub-menu>
          <el-sub-menu index="/edgeserver">
            <template #title>
              <i class="el-icon-server"></i><span>EdgeServer</span>
            </template>
            <el-menu-item index="/edgeserver"
              >设备管理</el-menu-item
            >
            <!-- <el-menu-item index="/edgeserver/workbench1"
              >日志记录&同态加密</el-menu-item
            > -->
            <!-- 动态生成设备工作区子菜单 -->
            <el-sub-menu index="3-3" v-if="edgeServers.length > 0">
              <template #title>
                <el-icon><Menu /></el-icon>
                <span>设备工作区</span>
              </template>
              <el-menu-item
                v-for="server in edgeServers"
                :key="server.id"
                :index="`/edgeserver/workspace/${server.id}`"
              >
                {{ server.deviceName }}
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item index="/edgeserver/homomorphic-encryption-transfer"
              >同态加密-加密传输</el-menu-item
            >
          </el-sub-menu>
          <el-sub-menu index="/cloudserver">
            <template #title>
              <i class="el-icon-cloud"></i><span>Cloud</span>
            </template>
            <el-menu-item index="/cloudserver/workbench1"
              >工作台</el-menu-item
            >
            <!-- <el-menu-item index="/cloudserver/logs"
              >日志记录</el-menu-item
            > -->
            <el-menu-item index="/cloudserver/homomorphic-encryption-analysis"
              >同态加密-密文数据分析</el-menu-item
            >
            <el-sub-menu index="/cloudserver/federated-learning">
              <template #title>
                <i class="el-icon-s-data"></i><span>联邦学习</span>
              </template>
              <el-menu-item index="/cloudserver/federated-learning/model-training"
                >模型训练&投毒防御</el-menu-item
              >
              <el-menu-item index="/cloudserver/federated-learning/gradient-leakage"
                >梯度泄露防御</el-menu-item
              >
              <el-menu-item index="/cloudserver/federated-learning/log-dataset"
                >日志数据集</el-menu-item
              >
            </el-sub-menu>
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
import { defineComponent, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    // 从store中获取登录状态和用户信息
    const isLoggedIn = computed(() => store.state.auth.isLoggedIn)
    const userInfo = computed(() => store.state.auth.userInfo)
    // 从clients模块获取客户端列表
    const clients = computed(() => store.getters['clients/getAllClients'])
    // 从edgeServer模块获取EdgeServer列表
    const edgeServers = computed(() => store.getters['edgeServer/getAllServers'])
    
    // 处理下拉菜单命令
    const handleDropdownCommand = async (command) => {
      if (command === 'logout') {
        // 执行退出登录
        await store.dispatch('auth/logout')
        router.push('/mfa/login')
        ElMessage.success('已成功退出登录')
      } else if (command === 'userInfo') {
        // 跳转到用户信息页面
        router.push('/mfa/userInfo')
      }
    }
    
    // 初始化时检查认证状态
    const initAuth = async () => {
      try {
        await store.dispatch('auth/checkAuth')
      } catch (error) {
        console.error('检查认证状态失败:', error)
      }
    }
    
    // 组件挂载时初始化认证状态
    initAuth()
    
    return {
      isLoggedIn,
      userInfo,
      clients,
      edgeServers,
      handleDropdownCommand,
      handleOpen(key, keyPath) {
        console.log(key, keyPath)
      },
      handleClose(key, keyPath) {
        console.log(key, keyPath)
      }
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
  background-color: var(--bg-primary);
}

/* ===== Header ===== */
.header {
  height: 52px;
  min-height: 52px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  position: relative;
  z-index: 10;
  border-bottom: 1px solid var(--border-color);
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary-color);
}

/* ===== Header Left ===== */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.logo-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.header-brand {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.header-subtitle {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-tertiary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ===== Header Right ===== */
.header-right {
  display: flex;
  align-items: center;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  background: linear-gradient(135deg, var(--primary-light), var(--primary-color)) !important;
  color: #fff !important;
  font-weight: 600;
  font-size: 14px;
}

.user-name {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success-color);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}

.status-text {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

/* ===== Main Layout ===== */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background-color: var(--bg-secondary);
  overflow-y: auto;
  border-right: 1px solid var(--border-color);
}

.content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  background-color: var(--bg-primary);
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 220px;
  min-height: 400px;
  background-color: transparent !important;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .sidebar { width: 200px; }
  .el-menu-vertical-demo:not(.el-menu--collapse) { width: 200px; }
  .content { padding: var(--spacing-md); }
  .header {
    height: 48px;
    min-height: 48px;
    padding: 0 var(--spacing-md);
  }
  .header-brand { font-size: 13px; }
  .header-subtitle { display: none; }
  .header-logo { width: 28px; height: 28px; }
}
</style>