import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import Overview from '../views/Overview/index.vue'
import MFAAuth from '../views/多因子认证/Auth/index.vue'
import MFADevice from '../views/多因子认证/Device/index.vue'
import Login from '../views/多因子认证/Login/index.vue'
import UserInfo from '../views/多因子认证/UserInfo/index.vue'
import Items from '../views/多因子认证/Items/index.vue'
import IPTest from '../views/多因子认证/test-IP/index.vue'
import EmailAlert from '../views/多因子认证/EmailAlert/index.vue'
import ErrorLog from '../views/多因子认证/ErrorLog/index.vue'
import DEBEClient from '../views/DEBEClient/index.vue'
import Upload from '../views/DEBEClient/Upload/index.vue'
import Download from '../views/DEBEClient/Download/index.vue'
import EdgeServer from '../views/EdgeServer/index.vue'
import EdgeWorkbench1 from '../views/EdgeServer/Workbench1/index.vue'
import EdgeWorkspace from '../views/EdgeServer/Workspace/index.vue'
import HomomorphicEncryptionTransfer from '../views/EdgeServer/HomomorphicEncryptionTransfer/index.vue'
import CloudServer from '../views/CloudServer/index.vue'
import CloudWorkbench1 from '../views/CloudServer/Workbench1/index.vue'
import CloudLogRecord from '../views/CloudServer/LogRecord/index.vue'
import HomomorphicEncryptionAnalysis from '../views/CloudServer/HomomorphicEncryptionAnalysis/index.vue'
import FederatedLearning from '../views/FederatedLearning/index.vue'
// import HomomorphicEncryption from '../views/同态加密/index.vue'

const routes = [
  {
    path: '/',
    name: 'overview',
    component: Overview
  },
  {
    path: '/mfa',
    name: 'mfa',
    redirect: '/mfa/auth'
  },
  {
    path: '/mfa/auth',
    name: 'mfa-auth',
    component: MFAAuth
  },
  {
    path: '/mfa/device',
    name: 'mfa-device',
    component: MFADevice,
    meta: {
      requiresAuth: true,
      requiresAdmin: true // 需要管理员权限
    }
  },
  {
    path: '/mfa/login',
    name: 'login',
    component: Login
  },
  {    
    path: '/mfa/userInfo',
    name: 'userInfo',
    component: UserInfo,
    meta: {
      requiresAuth: true // 需要认证才能访问
    }
  },
  {
      path: '/mfa/Items',
      name: 'items',
      component: Items,
      meta: {
        requiresAuth: true // 需要认证才能访问
      }
    },
    {
      path: '/mfa/ip-test',
      name: 'ipTest',
      component: IPTest,
      meta: {
        requiresAuth: true // 需要认证才能访问
      }
    },
    {
      path: '/mfa/email-alert',
    name: 'emailAlert',
    component: EmailAlert,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/mfa/ErrorLog',
    name: 'errorLog',
    component: ErrorLog,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/debeclient',
    name: 'debeclient',
    component: DEBEClient
  },
  {    
    path: '/debeclient/upload',
    name: 'upload',
    component: Upload
  },
  {    
    path: '/debeclient/upload/:clientId',
    name: 'client-upload',
    component: Upload,
    props: true
  },
  {    
    path: '/debeclient/download',
    name: 'download',
    component: Download
  },
  {    
    path: '/debeclient/download/:clientId',
    name: 'client-download',
    component: Download,
    props: true
  },
  {
    path: '/edgeserver',
    name: 'edgeserver',
    component: EdgeServer
  },
  {
    path: '/edgeserver/workbench1',
    name: 'edge-workbench1',
    component: EdgeWorkbench1
  },
  {
    path: '/edgeserver/workspace/:serverId',
    name: 'edge-workspace',
    component: EdgeWorkspace,
    props: true
  },
  {
    path: '/cloudserver',
    name: 'cloudserver',
    component: CloudServer
  },
  {
    path: '/cloudserver/workbench1',
    name: 'cloud-workbench1',
    component: CloudWorkbench1
  },
  {
    path: '/cloudserver/logs',
    name: 'cloud-log-record',
    component: CloudLogRecord
  },
  {
    path: '/federated-learning',
    name: 'federated-learning',
    component: FederatedLearning
  },
  {
    path: '/edgeserver/homomorphic-encryption-transfer',
    name: 'edge-homomorphic-encryption-transfer',
    component: HomomorphicEncryptionTransfer
  },
  {
    path: '/cloudserver/homomorphic-encryption-analysis',
    name: 'cloud-homomorphic-encryption-analysis',
    component: HomomorphicEncryptionAnalysis
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：检查用户认证状态和权限
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  const requiresAuth = to.meta?.requiresAuth || false
  const requiresAdmin = to.meta?.requiresAdmin || false
  
  // 检查用户是否已登录
  const isLoggedIn = !!localStorage.getItem('access_token')
  
  // 尝试获取用户信息判断是否为管理员
  let isSuperUser = false
  try {
    const userInfoStr = localStorage.getItem('user_info')
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      isSuperUser = userInfo.is_superuser || false
    }
  } catch (error) {
    console.error('解析用户信息失败:', error)
  }
  
  if (requiresAuth && !isLoggedIn) {
    // 需要认证但未登录，重定向到登录页
    next({ path: '/mfa/login', query: { redirect: to.fullPath } })
  } else if (requiresAdmin && !isSuperUser) {
    // 需要管理员权限但不是管理员
    next({ path: '/mfa/userInfo' })
  } else if (to.path === '/mfa/login' && isLoggedIn) {
    // 已登录但访问登录页，重定向到用户信息页
    next('/mfa/userInfo')
  } else {
    // 其他情况，正常访问
    next()
  }
})

export default router