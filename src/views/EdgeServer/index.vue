<template>
  <div class="edge-server-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>EdgeServer</span>
          <el-button type="primary" size="small" @click="navigateToWorkbench">工作台 1</el-button>
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
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'EdgeServer',
  setup() {
    const router = useRouter()
    const command = ref('')
    const logOutput = ref('')

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

    const navigateToWorkbench = () => {
      router.push('/edgeserver/workbench1')
    }

    return {
      command,
      logOutput,
      executeCommand,
      navigateToWorkbench
    }
  }
})
</script>

<style scoped>
.edge-server-container {
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

.log-output {
  margin-top: 20px;
}
</style>