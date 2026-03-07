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
          <el-sub-menu index="edgeserver">
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
                :index="`3-3-${server.id}`"
                @click="$router.push(`/edgeserver/workspace/${server.id}`)"
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

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 var(--spacing-lg);
}

.user-avatar-container {
  position: relative;
}

.avatar-wrapper {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.header {
  height: 64px;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xl);
  font-weight: 600;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border-color);
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-light), var(--success-color));
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.logo-container {
  width: 40px;
  height: 40px;
  background-color: var(--primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  font-size: 24px;
  box-shadow: var(--shadow-sm);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background-color: var(--bg-tertiary);
  box-shadow: var(--shadow-sm);
  overflow-y: auto;
  border-right: 1px solid var(--border-color);
  transition: all var(--transition-base);
}

.content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  background-color: var(--bg-primary);
  transition: all var(--transition-base);
}

/* 页面过渡动画 */
.router-view {
  transition: all var(--transition-base);
}

/* 自定义ElementUI样式 */
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 240px;
  min-height: 400px;
  background-color: transparent !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
  
  .el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
  }
  
  .content {
    padding: var(--spacing-md);
  }
  
  .header {
    font-size: var(--font-lg);
  }
}
</style>