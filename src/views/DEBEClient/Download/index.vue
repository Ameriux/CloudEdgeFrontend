<template>
  <div class="download-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件下载</span>
          <el-button type="primary" size="small" @click="createNewWorkspace">新建工作区</el-button>
        </div>
      </template>

      <div class="download-action">
        <el-button type="primary" size="medium" @click="selectDownloadFile">选择下载文件</el-button>
      </div>

      <div class="file-preview">
        <h3>下载文件列表</h3>
        <el-table :data="downloadFiles" style="width: 100%">
          <el-table-column prop="id" label="序号" width="80"></el-table-column>
          <el-table-column prop="hash" label="哈希值"></el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="downloadFile(scope.row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="metrics-display">
        <h3>数据展示</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic
              v-model:value="dataWriteDelay"
              title="数据写入延迟"
              suffix="ms"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="downloadDataSize"
              title="下载数据大小"
              suffix="KB"
            />
          </el-col>
        </el-row>
      </div>

      <div class="log-output">
        <h3>日志输出</h3>
        <el-input
          type="textarea"
          :rows="10"
          v-model="logOutput"
          readonly
          placeholder="下载日志将显示在这里"
        ></el-input>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { ElStatistic } from 'element-plus'

export default defineComponent({
  name: 'Download',
  setup() {
    const downloadFiles = ref([])
    const logOutput = ref('')
    let fileIdCounter = 1

    // 指标数据
    const dataWriteDelay = ref(0)
    const downloadDataSize = ref(0)

    // 模拟指标数据更新
    const updateMetrics = () => {
      // 随机生成一些合理的指标值
      dataWriteDelay.value = Math.floor(Math.random() * 100) + 10; // 10-109 ms
      downloadDataSize.value = Math.floor(Math.random() * 1000) + 500; // 500-1499 KB
    }

    // 组件挂载时初始化指标数据
    onMounted(() => {
      updateMetrics();
      // 每5秒更新一次指标数据
      setInterval(updateMetrics, 5000);
    })

    const selectDownloadFile = () => {
      // 这里预留后端接口位置，实际应用中应该打开文件选择对话框
      // 模拟选择文件
      const randomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      downloadFiles.value.push({
        id: fileIdCounter++,
        hash: randomHash
      })

      logOutput.value += `已选择文件，哈希值: ${randomHash}\n`
    }

    const downloadFile = (file) => {
      // 这里预留后端接口位置
      logOutput.value += `开始下载文件，哈希值: ${file.hash}\n`

      // 模拟下载进度
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        logOutput.value += `下载进度: ${progress}%\n`

        if (progress >= 100) {
          clearInterval(interval)
          logOutput.value += '下载完成\n'
        }
      }, 500)
    }

    const createNewWorkspace = () => {
      // 这里预留后端接口位置
      logOutput.value += '已创建新的工作区\n'
      // 实际应用中可以打开一个新的标签页或弹窗
      alert('新建工作区功能将在实际应用中实现')
    }

    return {
      downloadFiles,
      logOutput,
      selectDownloadFile,
      downloadFile,
      createNewWorkspace,
      dataWriteDelay,
      downloadDataSize
    }
  }
})
</script>

<style scoped>
.download-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.download-action {
  margin-bottom: 20px;
  text-align: center;
}

.file-preview {
  margin-bottom: 20px;
}

.log-output {
  margin-top: 20px;
}

.metrics-display {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.el-statistic {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>