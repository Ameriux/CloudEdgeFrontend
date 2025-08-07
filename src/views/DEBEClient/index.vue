<template>
  <div class="client-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Client列表</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="clientList" style="width: 100%">
        <el-table-column prop="id" label="序号" min-width="80"></el-table-column>
        <el-table-column prop="name" label="名称" min-width="180"></el-table-column>
        <el-table-column prop="status" label="状态" min-width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'running' ? 'success' : 'danger'"> {{ scope.row.status === 'running' ? '启动' : '未启动' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewClientInfo(scope.row)">查看信息</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'ClientList',
  setup() {
    const clientList = ref([])
    const loading = ref(true)

    onMounted(() => {
      // 模拟从后端获取数据
      setTimeout(() => {
        clientList.value = [
          { id: 1, name: 'Client1', status: 'running' },
          { id: 2, name: 'Client2', status: 'running' },
          { id: 3, name: 'Client3', status: 'stopped' }
        ]
        loading.value = false
      }, 1000)
    })

    const viewClientInfo = (client) => {
      // 这里预留后端接口位置
      console.log('查看客户端信息:', client)
      // 实际应用中可以使用ElementUI的对话框组件展示详细信息
      alert(`客户端名称: ${client.name}\n客户端ID: ${client.id}\n客户端状态: ${client.status === 'running' ? '启动' : '未启动'}`)
    }

    return {
      clientList,
      loading,
      viewClientInfo
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