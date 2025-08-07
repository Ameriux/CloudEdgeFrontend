import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import Overview from '../views/Overview/index.vue'
import DEBEClient from '../views/DEBEClient/index.vue'
import Upload from '../views/DEBEClient/Upload/index.vue'
import Download from '../views/DEBEClient/Download/index.vue'
import Log from '../views/DEBEClient/Log/index.vue'
import EdgeServer from '../views/EdgeServer/index.vue'
import EdgeWorkbench1 from '../views/EdgeServer/Workbench1/index.vue'
import CloudServer from '../views/CloudServer/index.vue'
import CloudWorkbench1 from '../views/CloudServer/Workbench1/index.vue'

const routes = [
  {
    path: '/',
    name: 'overview',
    component: Overview
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
    path: '/debeclient/download',
    name: 'download',
    component: Download
  },
  {
    path: '/debeclient/log',
    name: 'log',
    component: Log
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
    path: '/cloudserver',
    name: 'cloudserver',
    component: CloudServer
  },
  {
    path: '/cloudserver/workbench1',
    name: 'cloud-workbench1',
    component: CloudWorkbench1
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router