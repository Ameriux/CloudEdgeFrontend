<template>
  <ClientWorkspace
    :clientId="currentClientId"
    type="download"
  >
    <!-- 操作按钮 -->
    <div class="upload-action">
      <el-button type="primary" @click="openDownloadFileDialog">选择下载文件</el-button>
    </div>
    
    <!-- 单文件数据 -->
    <div class="single-file-data">
      <h3>单个文件数据</h3>
      <el-table :data="singleFileData" style="width: 100%" :height="tableHeight">
        <el-table-column prop="id" label="序号" min-width="80" />
        <el-table-column prop="filePath" label="文件路径" min-width="200" />
        <el-table-column prop="hash" label="文件哈希" width="280" />
        <el-table-column prop="size" label="文件大小(B)" width="120" />
      </el-table>
    </div>
    
    <!-- 指标数据展示 -->
    <div class="metrics-display">
      <h3>数据展示</h3>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-statistic v-model:value="dataWriteDelay" title="数据写入延迟" suffix="ms">
          </el-statistic>
        </el-col>
        <el-col :span="12">
          <el-statistic v-model:value="downloadDataSize" title="下载数据大小" suffix="B">
          </el-statistic>
        </el-col>
      </el-row>
    </div>
    
    <!-- 日志输出 -->
    <div class="log-output">
      <h3>日志输出</h3>
      <el-input
        v-model="logOutput"
        type="textarea"
        :rows="10"
        readonly
        style="font-family: monospace"
      />
    </div>
  </ClientWorkspace>
  
  <!-- 文件选择对话框 -->
  <el-dialog v-model="dialogVisible" title="选择下载文件" width="800px">
    <el-table
      ref="fileTable"
      v-loading="uploadedFiles.length === 0"
      :data="uploadedFiles"
      style="width: 100%"
      @selection-change="selectedFiles = $event"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="filePath" label="文件路径" />
      <el-table-column prop="hash" label="文件哈希" width="280" />
      <el-table-column prop="size" label="文件大小" width="120" />
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelSelection">取消</el-button>
        <el-button type="primary" @click="confirmSelectedFiles">确定</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 确认下载对话框 -->
  <el-dialog v-model="confirmDialogVisible" title="确认下载" width="600px">
    <div v-if="selectedFiles.length > 0">
      <p class="mb-2">您确定要下载以下文件吗？</p>
      <ul class="list-disc pl-5">
        <li v-for="file in selectedFiles" :key="file.filePath">{{ file.filePath }}</li>
      </ul>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDownload">确认下载</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import ClientWorkspace from '../../../components/ClientWorkspace.vue'

const props = defineProps({
  clientId: {
    type: String,
    default: ''
  }
})

const store = useStore()
const route = useRoute()
let fileIdCounter = 1

// 获取当前客户端ID，可以从props或路由参数中获取
const currentClientId = computed(() => {
  return props.clientId || route.params.clientId || '默认客户端'
})

// 从Vuex获取当前客户端的下载数据
const clientDownloadData = computed(() => {
  return store.getters['files/getClientDownloadData'](currentClientId.value) || {}
})

// 更新客户端数据
const updateClientData = (data) => {
  store.dispatch('files/updateClientDownloadData', {
    clientId: currentClientId.value,
    data: data
  })
}

// 追加日志
const appendLog = (message) => {
  const newLog = (clientDownloadData.value.logOutput || '') + message
  updateClientData({ logOutput: newLog })
}

// 初始化客户端数据
const initClientData = () => {
  store.dispatch('files/initClientDownloadData', currentClientId.value)
  appendLog(`已进入客户端 ${currentClientId.value} 的下载工作区\n`)
}

// 响应式数据
const dialogVisible = ref(false)
const selectedFiles = ref([])
const confirmDialogVisible = ref(false)
const uploadedFiles = ref([])
const tableHeight = ref(300)

// 将clientDownloadData中的数据映射为computed属性
const logOutput = computed({
  get: () => clientDownloadData.value.logOutput || '',
  set: (value) => {
    updateClientData({ logOutput: value })
  }
})

const dataWriteDelay = computed({
  get: () => clientDownloadData.value.dataWriteDelay || 0,
  set: (value) => {
    updateClientData({ dataWriteDelay: value })
  }
})

const downloadDataSize = computed({
  get: () => clientDownloadData.value.downloadDataSize || 0,
  set: (value) => {
    updateClientData({ downloadDataSize: value })
  }
})

const singleFileData = computed({
  get: () => clientDownloadData.value.singleFileData || [],
  set: (value) => {
    updateClientData({ singleFileData: value })
  }
})

    // 调试信息，帮助排查问题
    onMounted(() => {
      console.log('props.clientId:', props.clientId)
      console.log('route.params.clientId:', route.params.clientId)
      console.log('currentClientId.value:', currentClientId.value)
      console.log('store clients:', store.getters['clients/getAllClients'])})



    // 从Vuex获取当前客户端上传的文件
    const fetchUploadedFiles = () => {
      uploadedFiles.value = store.getters['files/getFilesByClientId'](currentClientId.value) || []
      appendLog(`获取客户端 ${currentClientId.value} 上传的文件列表，共 ${uploadedFiles.value.length} 个文件\n`)
      // 打印文件详情以便调试
      uploadedFiles.value.forEach(file => {
        appendLog(`文件路径: ${file.filePath || '未知路径'}\n`)
      })
    }

    // 处理窗口大小变化
    const handleResize = () => {
      // 简单计算表格高度，可根据实际需求调整
      tableHeight.value = window.innerHeight - 600
    }

    // 组件挂载时初始化
    onMounted(() => {
      // 初始化客户端数据
      initClientData()
      fetchUploadedFiles()
      // 获取当前客户端信息
      fetchClientInfo()
      
      // 初始化表格高度
      handleResize();
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize);

      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    })

    // 监听客户端ID变化，确保切换客户端时更新数据
    watch(() => currentClientId.value, (newClientId, oldClientId) => {
      if (newClientId && newClientId !== oldClientId) {
        // 初始化新客户端数据
        initClientData()
        
        // 获取新客户端的信息和文件列表
        fetchClientInfo()
        fetchUploadedFiles()
        
        // 重置对话框状态
        dialogVisible.value = false
        selectedFiles.value = []
        confirmDialogVisible.value = false
      }
    })

    // 获取当前客户端信息
    const fetchClientInfo = () => {
      if (currentClientId.value) {
        appendLog(`正在获取客户端 ${currentClientId.value} 的信息...\n`)
        // 这里可以根据需要获取客户端的详细信息
        // 暂时只记录日志
        appendLog(`客户端 ${currentClientId.value} 信息获取成功\n`)
      }
    }

    // 打开下载文件对话框
    const openDownloadFileDialog = () => {
      fetchUploadedFiles()
      selectedFiles.value = []
      dialogVisible.value = true
    }

    // 确认选择的文件
    const confirmSelectedFiles = () => {
      if (selectedFiles.value.length === 0) {
        ElMessageBox.alert('请选择至少一个文件', '提示', { type: 'warning' })
        return
      }
      dialogVisible.value = false
      confirmDialogVisible.value = true
    }

    // 取消选择
    const cancelSelection = () => {
      dialogVisible.value = false
      selectedFiles.value = []
    }

    // 确认下载
    const confirmDownload = () => {
      confirmDialogVisible.value = false
      const operationTime = new Date().toLocaleString()
      
      // 添加到日志输出
      appendLog(`[${operationTime}] 客户端: ${currentClientId.value}\n`)
      appendLog(`[${operationTime}] 操作类型: 文件下载\n`)
      appendLog(`[${operationTime}] 开始下载 ${selectedFiles.value.length} 个文件...\n`)
      selectedFiles.value.forEach(file => {
        appendLog(`[${operationTime}] - ${file.filePath}\n`)
      })

      // 调用/download接口
      const filePaths = selectedFiles.value.map(file => file.filePath)
      fetch('/api-internal/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputFile: filePaths[0] })  // 只传递第一个选中的文件路径，确保是字符串
      })
      .then(response => {
        // 检查响应状态
        appendLog(`[${new Date().toLocaleString()}] 服务器响应状态: ${response.status} ${response.statusText}\n`);
        if (!response.ok) {
          throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }
        // 尝试解析JSON
        return response.text().then(text => {
          try {
            return JSON.parse(text);
          } catch (e) {
            // 处理非JSON响应
            appendLog(`[${new Date().toLocaleString()}] 警告: 服务器返回非JSON响应: ${text.substring(0, 100)}...\n`);
            throw new Error('服务器返回的响应不是有效的JSON格式');
          }
        });
      })
      .then(data => {
        console.log('文件下载请求接口响应:', data);
        const completionTime = new Date().toLocaleString()
        if (data.status === 'success') {
          appendLog(`[${completionTime}] 文件下载请求成功\n`)
          // 调用/download/file/info接口获取文件详情
          fetchDownloadFileInfo(filePaths)
          
          // 存储到Vuex历史记录
          store.dispatch('history/addOperationRecord', {
            clientName: currentClientId.value,
            operationType: '文件下载',
            operationStatus: '成功',
            operationTime: completionTime,
            fileCount: selectedFiles.value.length
          })
        } else {
          appendLog(`[${completionTime}] 文件下载请求失败: ${data.message || '未知错误'}\n`)
          // 显示下载失败提示框
          ElMessageBox.alert(
            `下载失败: ${data.message || '未知错误'}`,
            '下载失败',
            { type: 'error' }
          )
          // 存储到Vuex历史记录
          store.dispatch('history/addOperationRecord', {
            clientName: currentClientId.value,
            operationType: '文件下载',
            operationStatus: '失败',
            operationTime: completionTime,
            fileCount: selectedFiles.value.length,
            errorMessage: data.message || '未知错误'
          })
        }
      })
      .catch(error => {
        const completionTime = new Date().toLocaleString()
        appendLog(`[${completionTime}] 文件下载请求出错: ${error.message}\n`)
        // 显示下载失败提示框
        ElMessageBox.alert(
          `下载失败: ${error.message}`,
          '下载错误',
          { type: 'error' }
        )
        // 存储到Vuex历史记录
        store.dispatch('history/addOperationRecord', {
          clientName: currentClientId.value,
          operationType: '文件下载',
          operationStatus: '错误',
          operationTime: completionTime,
          fileCount: selectedFiles.value.length,
          errorMessage: error.message
        })
      })
    }

    // 获取下载文件信息
    const fetchDownloadFileInfo = (filePaths) => {
      appendLog('正在获取下载文件信息...\n')
      fetch('/api-internal/download/file/info')
        .then(response => {
          if (!response.ok) {
            throw new Error(`获取文件信息失败: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('获取下载文件信息接口响应:', data);
          if (data.status === 'success') {
            // 打印完整响应数据以便调试
            appendLog(`下载文件信息响应数据: ${JSON.stringify(data)}\n`)
            
            // 兼容不同格式的响应数据
            const fileStats = data.statistics || {};
            
            // 获取上一次的总下载大小
            const previousTotalDataSize = store.getters['files/getPreviousTotalDataSize'] || 0;
            
            // 计算本次下载的数据大小（本次总大小减去上次总大小）
            const currentDownloadDataSize = fileStats.total_data_size - previousTotalDataSize;
            
            // 更新上一次总下载大小到Vuex（不分客户端）
            store.dispatch('files/updatePreviousTotalDataSize', fileStats.total_data_size);
            
            // 提升currentFile变量作用域，确保在需要的地方都能访问到
            let currentFile = null;
            if (data.history && data.history.length > 0) {
              currentFile = data.history[data.history.length - 1]
            }
            // 更新指标数据
            updateClientData({
              dataWriteDelay: currentFile ? Math.round(currentFile.data_write_time * 1000) : 0, // 转换为ms，保留4位小数
              downloadDataSize: currentDownloadDataSize // 使用本次下载的实际数据大小
            })

            // 创建只包含当前下载操作文件的fileData
            let fileData = []
            // 直接使用filePaths创建当前下载的文件数据，确保只显示当前操作的文件
            if (filePaths && filePaths.length > 0) {
              // 为当前下载的每个文件创建一个数据条目
              fileData = filePaths.map((filePath, index) => {
                // 尝试从响应中找到匹配的文件哈希（如果有的话）
                let fileHash = '未知哈希'
                let fileSize = (fileStats.total_data_size || 0) // 直接使用原始B单位数据，移除/1024转换
                
                if (currentFile) {
                  fileHash = currentFile.file_hash || '未知哈希'
                  fileSize = currentFile.data_size || 0 // 直接使用原始B单位数据
                }
              
                
                return {
                  id: index + 1,
                  filePath: filePath,
                  hash: fileHash,
                  size: fileSize
                }
              })
            }
            
            // 只更新当前客户端的单文件数据，不混合历史记录
            updateClientData({ singleFileData: fileData })

            appendLog('获取下载文件信息成功\n')
          } else {
            const errorMessage = data.message || '未知错误';
            appendLog(`获取下载文件信息失败: ${errorMessage}\n`)
            // 显示获取文件信息失败提示框
            ElMessageBox.alert(
              `获取文件信息失败: ${errorMessage}`,
              '操作失败',
              { type: 'warning' }
            )
          }
        })
        .catch(error => {
          appendLog(`获取下载文件信息出错: ${error.message}\n`)
          // 显示获取文件信息出错提示框
          ElMessageBox.alert(
            `获取文件信息出错: ${error.message}`,
            '操作错误',
            { type: 'error' }
          )
        })
    }

</script>

<style scoped>
.single-file-data {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
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