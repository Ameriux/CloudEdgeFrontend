<template>
  <div class="workbench-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>EdgeServer - 工作台 1</span>
          <el-button type="primary" size="small" @click="createNewWorkbench">新建工作台</el-button>
        </div>
      </template>

      <div class="command-input">
        <el-input
          v-model="command"
          placeholder="请输入指令"
          style="width: 80%"
        ></el-input>
        <el-button type="primary" @click="executeCommand">执行</el-button>
      </div>

      <div class="metrics-display">
        <h3>数据展示（上传）</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic
              v-model:value="encryptionDelay"
              title="加密延迟"
              suffix="ms"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="encryptedSize"
              title="加密后数据大小"
              suffix="KB"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="reductionTime"
              title="数据冗余缩减时间"
              suffix="ms"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="reducedSize"
              title="冗余缩减后数据大小"
              suffix="KB"
            />
          </el-col>
        </el-row>

        <h3 style="margin-top: 20px;">数据展示（下载）</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic
              v-model:value="decryptionDelay"
              title="解密延迟"
              suffix="ms"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="cloudReadTime"
              title="从云端读取时间"
              suffix="ms"
            />
          </el-col>
        </el-row>
      </div>

      <div class="container-form">
        <h3>Container 数据</h3>
        <el-table :data="containerData" style="width: 100%">
          <el-table-column prop="name" label="名称" width="180"></el-table-column>
          <el-table-column prop="size" label="大小 (MB)" width="180"></el-table-column>
          <el-table-column prop="createTime" label="生成时间"></el-table-column>
        </el-table>
      </div>

      <div class="file-recipe-form">
        <h3>File Recipe 数据</h3>
        <el-table :data="fileRecipeData" style="width: 100%">
          <el-table-column prop="name" label="名称" width="180"></el-table-column>
          <el-table-column prop="size" label="大小 (KB)" width="180"></el-table-column>
          <el-table-column prop="createTime" label="生成时间"></el-table-column>
        </el-table>
      </div>

      <div class="log-output">
        <h3>日志输出</h3>
        <el-input
          type="textarea"
          :rows="15"
          v-model="logOutput"
          readonly
          placeholder="指令执行日志将显示在这里"
        ></el-input>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { ElStatistic } from 'element-plus'

export default defineComponent({
  name: 'EdgeWorkbench1',
  setup() {
    const command = ref('')
    const logOutput = ref('')

    // Container 和 File Recipe 数据
    const containerData = ref([])
    const fileRecipeData = ref([])

    // 生成模拟数据
    const generateMockData = () => {
      // 生成 Container 数据
      containerData.value = [
        {
          name: 'container1',
          size: Math.floor(Math.random() * 100) + 50,
          createTime: new Date().toLocaleString()
        },
        {
          name: 'container2',
          size: Math.floor(Math.random() * 100) + 50,
          createTime: new Date().toLocaleString()
        }
      ]

      // 生成 File Recipe 数据
      fileRecipeData.value = [
        {
          name: 'recipe1',
          size: Math.floor(Math.random() * 100) + 10,
          createTime: new Date().toLocaleString()
        },
        {
          name: 'recipe2',
          size: Math.floor(Math.random() * 100) + 10,
          createTime: new Date().toLocaleString()
        },
        {
          name: 'recipe3',
          size: Math.floor(Math.random() * 100) + 10,
          createTime: new Date().toLocaleString()
        }
      ]
    }

    // 数据指标定义
    const encryptionDelay = ref(0)
    const encryptedSize = ref(0)
    const reductionTime = ref(0)
    const reducedSize = ref(0)
    const decryptionDelay = ref(0)
    const cloudReadTime = ref(0)

    // 保持数据为0
    const updateMetrics = () => {
      encryptionDelay.value = 0
      encryptedSize.value = 0
      reductionTime.value = 0
      reducedSize.value = 0
      decryptionDelay.value = 0
      cloudReadTime.value = 0
    }

    // 定时更新数据
    onMounted(() => {
      updateMetrics() // 初始更新
      generateMockData() // 生成初始模拟数据

      const interval = setInterval(() => {
        updateMetrics()
        generateMockData()
      }, 5000)

      // 清理函数
      return () => clearInterval(interval)
    })

    const executeCommand = () => {
      if (!command.value.trim()) {
        logOutput.value += '请输入指令\n'
        return
      }

      // 这里预留后端接口位置
      logOutput.value += `执行指令: ${command.value}\n`

      // 模拟指令执行
      setTimeout(() => {
        logOutput.value += `指令执行完成，结果: 成功\n`
      }, 1000)
    }

    const createNewWorkbench = () => {
      // 这里预留后端接口位置
      logOutput.value += '已创建新的工作台\n'
      // 实际应用中可以打开一个新的标签页或弹窗
      alert('新建工作台功能将在实际应用中实现')
    }

    return {
      command,
      logOutput,
      executeCommand,
      createNewWorkbench,
      encryptionDelay,
      encryptedSize,
      reductionTime,
      reducedSize,
      decryptionDelay,
      cloudReadTime,
      containerData,
      fileRecipeData
    }
  }
})
</script>

<style scoped>
.workbench-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.command-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.container-form,
.file-recipe-form {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
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