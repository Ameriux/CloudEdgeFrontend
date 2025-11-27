<template>
  <div class="client-workspace-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ workspaceTitle }}</span>
          <!-- 新增：EdgeServer选择（仅在上传模式显示） -->
          <div v-if="type === 'upload'" class="edge-server-selector">
            <el-select v-model="selectedEdgeServer" placeholder="选择EdgeServer" size="small" style="width: 200px;" @update:model-value="handleEdgeServerChange">
              <el-option v-for="server in edgeServers" :key="server.id" :label="`${server.deviceName} (${server.ipAddress})`" :value="server.ipAddress" />
            </el-select>
          </div>
        </div>
      </template>
      
      <slot></slot>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, computed, ref, provide } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'ClientWorkspace',
  props: {
    clientId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      validator: (value) => ['upload', 'download'].includes(value)
    }
  },
  setup(props) {
    const workspaceTitle = computed(() => {
      return `${props.clientId} - ${props.type === 'upload' ? '文件上传' : '文件下载'}`
    })
    
    // 新增：EdgeServer选择相关
    const selectedEdgeServer = ref('')
    
    // 使用useStore获取Vuex store
    const store = useStore()
    
    // 获取EdgeServer列表
    const edgeServers = computed(() => {
      // 从store获取EdgeServer列表
      if (store && store.state.edgeServer && store.state.edgeServer.servers) {
        return store.state.edgeServer.servers
      }
      // 如果没有store，返回空数组
      return []
    })
    
    // 处理EdgeServer选择变化
    const handleEdgeServerChange = (value) => {
      // 通过provide向子组件提供选择的EdgeServer
      provide('selectedEdgeServer', value)
      
      // 同时更新Vuex store中的状态，确保所有组件都能获取到正确的选择
      if (store && store.commit) {
        // 设置当前选中的EdgeServer
        const selectedServer = edgeServers.value.find(server => server.ipAddress === value)
        if (selectedServer) {
          store.commit('edgeServer/SET_CURRENT_SERVER', selectedServer)
        }
      }
    }
    
    // 初始时提供当前选择的值
    provide('selectedEdgeServer', selectedEdgeServer.value)
    
    // 组件挂载时，尝试从store中获取当前选中的EdgeServer
    if (store && store.state.edgeServer && store.state.edgeServer.currentServer) {
      const currentServer = store.state.edgeServer.currentServer
      selectedEdgeServer.value = currentServer.ipAddress
      provide('selectedEdgeServer', currentServer.ipAddress)
    }
    
    return {
      workspaceTitle,
      selectedEdgeServer,
      edgeServers,
      handleEdgeServerChange
    }
  }
})
</script>

<style scoped>
.client-workspace-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>