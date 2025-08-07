<template>
  <div class="log-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
        </div>
      </template>

      <div class="client-selection">
        <el-form-item label="选择客户端">
          <el-select v-model="selectedClient" placeholder="请选择客户端">
            <el-option label="所有客户端" value="all"></el-option>
            <el-option label="Client1" value="client1"></el-option>
            <el-option label="Client2" value="client2"></el-option>
            <el-option label="Client3" value="client3"></el-option>
          </el-select>
        </el-form-item>
      </div>

      <div class="log-list">
        <h3>日志列表</h3>
        <el-select
          v-model="selectedLog"
          placeholder="请选择日志记录"
          style="width: 100%"
          filterable
          allow-create
          @change="viewLogDetail"
        >
          <el-option
            v-for="log in filteredLogs"
            :key="log.id"
            :label="`[${log.time}] ${log.client}: ${log.action}`"
            :value="log.id"
          ></el-option>
        </el-select>
      </div>

      <div class="log-detail">
        <h3>日志详情</h3>
        <el-input
          type="textarea"
          :rows="15"
          v-model="currentLogDetail"
          readonly
          placeholder="日志详情将显示在这里"
        ></el-input>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  name: 'Log',
  setup() {
    const selectedClient = ref('all')
    const selectedLog = ref('')
    const currentLogDetail = ref('')

    // 模拟日志数据
    const logs = ref([
      {
        id: 1,
        client: 'Client1',
        time: '2023-06-01 10:30:00',
        action: '文件上传',
        detail: '上传文件: document.pdf, 大小: 2.5MB, 哈希值: a1b2c3d4e5, 状态: 成功'
      },
      {
        id: 2,
        client: 'Client2',
        time: '2023-06-01 11:15:00',
        action: '文件下载',
        detail: '下载文件: image.jpg, 哈希值: f6g7h8i9j0, 状态: 成功'
      },
      {
        id: 3,
        client: 'Client1',
        time: '2023-06-01 14:20:00',
        action: '连接断开',
        detail: '客户端连接异常断开，原因: 网络超时'
      },
      {
        id: 4,
        client: 'Client3',
        time: '2023-06-01 16:45:00',
        action: '文件上传',
        detail: '上传文件: video.mp4, 大小: 15.8MB, 哈希值: k1l2m3n4o5, 状态: 失败，原因: 存储空间不足'
      },
      {
        id: 5,
        client: 'Client2',
        time: '2023-06-02 09:10:00',
        action: '连接建立',
        detail: '客户端成功连接到服务器'
      }
    ])

    // 根据选择的客户端筛选日志
    const filteredLogs = computed(() => {
      if (selectedClient.value === 'all') {
        return logs.value
      } else {
        return logs.value.filter(log => log.client.toLowerCase() === selectedClient.value)
      }
    })

    // 查看日志详情
    const viewLogDetail = (logId) => {
      const log = logs.value.find(l => l.id === logId)
      if (log) {
        currentLogDetail.value = `客户端: ${log.client}\n时间: ${log.time}\n操作: ${log.action}\n详情: ${log.detail}`
      }
    }

    return {
      selectedClient,
      selectedLog,
      currentLogDetail,
      logs,
      filteredLogs,
      viewLogDetail
    }
  }
})
</script>

<style scoped>
.log-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.client-selection {
  margin-bottom: 20px;
}

.log-list {
  margin-bottom: 20px;
}

.log-detail {
  margin-top: 20px;
}
</style>