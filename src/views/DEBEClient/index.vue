<template>
  <div class="client-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>客户端列表</span>
          <el-button type="primary" size="small" @click="createNewClient">新建客户端</el-button>
        </div>
      </template>

      <el-table :data="clients" style="width: 100%">
        <el-table-column prop="id" label="序号" min-width="100"></el-table-column>
        <el-table-column prop="name" label="客户端ID" min-width="100"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="80"></el-table-column>
        <el-table-column label="操作" min-width="100" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="enterWorkspace(scope.row)">进入工作区</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'DEBEClientList',
  setup() {
    const router = useRouter()
    const store = useStore()
    const clients = ref([])

    // 创建新客户端
    const createNewClient = () => {
      // 使用相对路径解决CORS跨域问题
      fetch('/api-internal/run/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data && data.status === 'success' && data.all_client_ids && data.all_client_ids.length > 0) {
            // 直接使用接口返回的all_client_ids数组更新客户端列表
            const clientList = data.all_client_ids.map((clientId, index) => ({
              id: index + 1,
              name: clientId.toString(),
              status: 'running',
              sessionKey: ''
            }))
            
            // 更新本地ref和全局store
            clients.value = clientList
            store.dispatch('clients/setClients', clientList)
            
            ElMessage.success('客户端创建成功')
            // 生成对应的上传和下载界面
            generateClientWorkspaces(data.all_client_ids[data.all_client_ids.length - 1])
          } else {
            throw new Error('创建客户端失败: ' + (data.message || '未知错误'))
          }
        })
        .catch(error => {
          console.error('创建客户端失败:', error)
          ElMessage.error('创建客户端失败，请重试')
        })
    }

    // 进入工作区
    const enterWorkspace = (client) => {
      // 跳转到对应客户端的上传界面
      router.push(`/debeclient/upload/${client.name}`)
    }

    // 获取客户端列表（页面加载时使用）
    const fetchClientList = () => {
      // 先从store获取客户端列表
      const storedClients = store.getters['clients/getAllClients']
      
      if (storedClients && storedClients.length > 0) {
        // 如果store中有数据，使用store的数据
        clients.value = storedClients
      } else {
        // 最开始列表为空，不设置默认客户端
        clients.value = []
      }
    }

    // 生成客户端工作区
    const generateClientWorkspaces = (clientId) => {
      console.log(`为客户端 ${clientId} 生成工作区`)
      // 通过URL参数的方式实现客户端工作区隔离
      // 不需要物理创建新的文件，而是通过组件动态显示对应客户端的工作区
      // 上传和下载界面已通过路由配置支持客户端ID参数
    }

    onMounted(() => {
      fetchClientList()
    })

    return {
      clients,
      createNewClient,
      enterWorkspace,
      fetchClientList
    }
  }
})
</script>

<style scoped>
.client-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>