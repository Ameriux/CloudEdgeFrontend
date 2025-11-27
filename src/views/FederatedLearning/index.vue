<template>
  <div class="federated-learning-container">
    <h2>联邦学习</h2>
    
    <div class="operation-area">
      <el-button 
        type="primary" 
        size="large"
        @click="startTraining"
        :loading="isTraining"
        :disabled="isTraining"
      >
        训练模型
      </el-button>
    </div>
    
    <div class="progress-area">
      <el-card class="progress-card">
        <template #header>
          <div class="card-header">
            <span>训练进度</span>
          </div>
        </template>
        
        <div class="progress-content">
          <el-empty v-if="!trainingStatus && !trainingError" description="尚未开始训练" />
          
          <div v-else-if="trainingError" class="error-message">
            <el-alert
              :title="trainingError"
              type="error"
              show-icon
              :closable="true"
              @close="clearError"
            />
          </div>
          
          <div v-else class="status-info">
            <pre class="status-output">{{ formatStatusOutput(trainingStatus) }}</pre>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const isTraining = ref(false)
const trainingStatus = ref(null)
const trainingError = ref(null)
const statusPollingInterval = ref(null)

// 开始训练模型
const startTraining = async () => {
  isTraining.value = true
  trainingStatus.value = null
  trainingError.value = null
  
  try {
    ElMessage.info('开始训练模型...')
    
    // 调用训练模型接口
    const responsePromise = fetch('/api-internal/train/model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
    
    // 只要请求发送成功，立即开始轮询训练状态
    startStatusPolling()
    
    // 处理训练接口的响应结果
    const response = await responsePromise
    const result = await response.json()
    
    if (result.status === 'success') {
      ElMessage.success('训练任务已成功启动')
    } else {
      ElMessage.warning(`训练任务启动状态: ${result.message || '未知'}`)
    }
  } catch (error) {
    ElMessage.error(`训练请求异常: ${error.message}`)
    trainingError.value = error.message
    // 即使出现错误，也继续轮询状态，因为训练可能已经在后台开始
  }
}

// 轮询训练状态
const startStatusPolling = () => {
  // 清除可能存在的旧轮询
  if (statusPollingInterval.value) {
    clearInterval(statusPollingInterval.value)
  }
  
  // 立即获取一次状态
  fetchTrainingStatus()
  
  // 设置轮询，每3秒获取一次状态
  statusPollingInterval.value = setInterval(() => {
    fetchTrainingStatus()
  }, 3000)
}

// 获取训练状态
const fetchTrainingStatus = async () => {
  try {
    const response = await fetch('/api-internal/training/status')
    const statusData = await response.json()
    
    trainingStatus.value = statusData
    
    // 如果训练已完成（根据实际接口返回判断）
    if (statusData && statusData.isCompleted) {
      ElMessage.success('训练完成！')
      stopStatusPolling()
      isTraining.value = false
    }
  } catch (error) {
    console.error('获取训练状态失败:', error)
    // 不显示错误，只在控制台记录，避免影响用户体验
  }
}

// 停止轮询
const stopStatusPolling = () => {
  if (statusPollingInterval.value) {
    clearInterval(statusPollingInterval.value)
    statusPollingInterval.value = null
  }
}

// 格式化状态输出
const formatStatusOutput = (status) => {
  if (!status) return ''
  
  try {
    // 如果是字符串，直接返回
    if (typeof status === 'string') {
      return status
    }
    // 如果是对象，转换为格式化的JSON字符串
    return JSON.stringify(status, null, 2)
  } catch (e) {
    return String(status)
  }
}

// 清除错误
const clearError = () => {
  trainingError.value = null
}

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopStatusPolling()
})
</script>

<style scoped>
.federated-learning-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.federated-learning-container h2 {
  margin-bottom: 30px;
  color: #303133;
  font-size: 24px;
}

.operation-area {
  margin-bottom: 30px;
}

.progress-area {
  width: 100%;
}

.progress-card {
  min-height: 300px;
}

.progress-content {
  min-height: 250px;
  display: flex;
  flex-direction: column;
}

.status-info {
  flex: 1;
  overflow: auto;
}

.status-output {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 500px;
  overflow: auto;
}

.error-message {
  margin-top: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>