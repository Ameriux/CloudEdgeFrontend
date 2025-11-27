<template>
  <div class="edge-workspace-container">
    <EdgeServerWorkbench 
      :server-id="serverId" 
      :server-name="serverName"
    />
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import EdgeServerWorkbench from '@/components/EdgeServerWorkbench.vue'

export default defineComponent({
  name: 'EdgeWorkspace',
  components: {
    EdgeServerWorkbench
  },
  setup() {
    const route = useRoute()
    const store = useStore()
    
    // 从路由参数获取serverId
    const serverId = computed(() => route.params.serverId)
    
    // 根据serverId获取服务器名称
    const serverName = computed(() => {
      const server = store.getters['edgeServer/getServerById'](serverId.value)
      return server ? server.deviceName : `未知设备(${serverId.value})`
    })
    
    return {
      serverId,
      serverName
    }
  }
})
</script>

<style scoped>
.edge-workspace-container {
  width: 100%;
  height: 100%;
}
</style>