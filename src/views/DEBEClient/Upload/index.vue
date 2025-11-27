<template>
  <ClientWorkspace :clientId="currentClientId" type="upload">
    <!-- 原有的文件上传内容将放在这里 -->

    <div class="upload-area" style="width: 100%;">
      <!-- 新增：选择文件按钮 -->
      <div style="display: flex; justify-content: center; margin-bottom: 10px;">
        <el-button type="primary" @click="openFileDialog">选择文件</el-button>
      </div>

      <el-form-item label="文件路径" label-width="80px" style="width: 100%;">
        <div style="display: flex; width: 100%;">
          <el-input v-model="filePath" placeholder="请输入文件路径" style="flex: 1; margin-right: 5px;"></el-input>
          <el-button type="primary" @click="addFilePath" style="white-space: nowrap;"><el-icon>
              <Plus />
            </el-icon>添加文件</el-button>
        </div>
      </el-form-item>
    </div>

    <!-- 新增：文件选择对话框 -->
    <el-dialog v-model="dialogVisible" title="选择文件" width="50%" :before-close="closeFileDialog">
      <div style="height: 400px; overflow-y: auto;">
        <el-tree :data="fileTreeData"
          :props="{ label: 'label', value: 'value', children: 'children', disabled: 'disabled' }" node-key="value"
          show-checkbox="true" check-strictly="true" default-expand-all :expand-on-click-node="true"
          :filter-node-method="(value, data) => data.label.includes(value)" @check-change="handleCheckChange"
          ref="treeRef" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeFileDialog">取消</el-button>
          <el-button type="primary" @click="confirmFileSelection">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- EdgeServer选择已移至header部分 -->

    <div class="algorithm-selection">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="密钥哈希算法">
            <el-select v-model="hashAlgorithm" placeholder="请选择算法">
              <el-option label="无" value="none"></el-option>
              <el-option label="SHA_1" value="SHA_1"></el-option>
              <el-option label="SHA_256" value="SHA_256"></el-option>
              <el-option label="MD5" value="MD5"></el-option>
              <el-option label="SM3" value="SM3"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文件加解密算法">
            <el-select v-model="encryptionAlgorithm" placeholder="请选择算法">
              <el-option label="无" value="none"></el-option>
              <el-option label="AES_128_CFB" value="AES_128_CFB"></el-option>
              <el-option label="AES_128_GCM" value="AES_128_GCM"></el-option>
              <el-option label="AES_256_CFB" value="AES_256_CFB"></el-option>
              <el-option label="AES_256_GCM" value="AES_256_GCM"></el-option>
              <el-option label="SM4" value="SM4"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="密钥交换算法">
            <el-select v-model="asymmetricEncryptionAlgorithm" placeholder="请选择算法">
              <el-option label="无" value="none"></el-option>
              <el-option label="椭圆曲线加密算法" value="ecc"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label=" 安全传输算法">
            <el-select v-model="otherAlgorithm" placeholder="请选择算法">
              <el-option label="无" value="none"></el-option>
              <el-option label="连接安全算法" value="connection_security"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <div class="file-preview">
      <h3>文件预览列表</h3>
      <el-table :data="previewFiles" style="width: 100%">
        <el-table-column prop="id" label="序号" min-width="80"></el-table-column>
        <el-table-column prop="name" label="文件路径" min-width="200"></el-table-column>

        <el-table-column label="操作" min-width="100" fixed="right">
          <template #default="scope">
            <el-button type="danger" size="small" @click="removeFile(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="upload-action">
      <el-button type="primary" size="medium" @click="uploadFiles" :loading="isUploading" :disabled="isUploading">{{
        isUploading ? '正在上传' : '上传文件' }}</el-button>
    </div>

    <div class="metrics-display">
      <h3>数据展示</h3>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic v-model:value="chunkSize" title="分块大小" suffix="B" />
        </el-col>
        <el-col :span="6">
          <el-statistic v-model:value="chunkProcessingTime" title="分块处理时间" suffix="ms" />
        </el-col>
        <el-col :span="6">
          <el-statistic v-model:value="dataSendDelay" title="数据发送延迟" suffix="ms" />
        </el-col>
        <el-col :span="6">
          <el-statistic v-model:value="uploadDataSize" title="上传数据大小" suffix="B" />
        </el-col>
      </el-row>
    </div>

    <div class="single-file-data">
      <h3>单个文件数据</h3>
      <el-table :data="singleFileData" style="width: 100%" :height="tableHeight">
        <el-table-column prop="id" label="序号" min-width="80"></el-table-column>
        <el-table-column prop="hash" label="哈希值" min-width="180"></el-table-column>
        <el-table-column prop="chunkSize" label="分块大小(B)" min-width="120"></el-table-column>
        <el-table-column prop="chunkProcessingTime" label="分块处理时间(ms)" min-width="150"></el-table-column>
        <el-table-column prop="dataSendDelay" label="数据发送延迟(ms)" min-width="150"></el-table-column>
        <el-table-column prop="uploadDataSize" label="上传数据大小(B)" min-width="150"></el-table-column>
      </el-table>
    </div>

    <div class="log-output">
      <h3>日志输出</h3>
      <el-input type="textarea" :rows="10" v-model="logOutput" readonly placeholder="上传日志将显示在这里"></el-input>
    </div>
  </ClientWorkspace>
</template>

<script setup>
import { ref, onMounted, computed, watch, inject } from 'vue'
import { Plus, Folder } from '@element-plus/icons-vue'
import { ElStatistic, ElMessageBox, ElDialog, ElTree, ElMessage } from 'element-plus'
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
const fileIdCounter = ref(0)



// 响应式数据
const previewFiles = ref([])
const filePath = ref('')
const dialogVisible = ref(false)
const fileTreeData = ref([])
const selectedFile = ref('')
const hashAlgorithm = ref('SHA_256')
const encryptionAlgorithm = ref('AES_256_GCM')
const asymmetricEncryptionAlgorithm = ref('ecc')
const otherAlgorithm = ref('connection_security')
const isUploading = ref(false)
const uploadedFilePaths = ref([])
const tableHeight = ref('300px')
// 使用ref来存储选择的EdgeServer
const selectedEdgeServer = ref('')

// 从Vuex获取EdgeServer数据
const getSelectedEdgeServerFromStore = () => {
  // 尝试从store中获取当前选中的EdgeServer
  const currentServer = store.state.edgeServer.currentServer
  if (currentServer && currentServer.ipAddress) {
    return currentServer.ipAddress
  }
  return ''
}

// 获取当前客户端ID，可以从props或路由参数中获取
const currentClientId = computed(() => {
  return props.clientId || route.params.clientId || '默认客户端'
})

// 从Vuex获取客户端数据
const clientUploadData = computed(() =>
  store.getters['files/getClientUploadData'](currentClientId.value) || {}
)

// 计算属性，映射到Vuex中的数据
const logOutput = computed(() => clientUploadData.value.logOutput || '')
const chunkSize = computed(() => clientUploadData.value.chunkSize || 0)
const chunkProcessingTime = computed(() => clientUploadData.value.chunkProcessingTime || 0)
const dataSendDelay = computed(() => clientUploadData.value.dataSendDelay || 0)
const uploadDataSize = computed(() => clientUploadData.value.uploadDataSize || 0)
const singleFileData = computed(() => clientUploadData.value.singleFileData || [])

// 更新客户端数据的方法
const updateClientData = (data) => {
  store.dispatch('files/updateClientUploadData', {
    clientId: currentClientId.value,
    data: data
  })
}

// 追加日志的方法
const appendLog = (message) => {
  store.dispatch('files/appendClientUploadLog', {
    clientId: currentClientId.value,
    logMessage: message
  })
}

// 监听store中的currentServer变化，实时更新selectedEdgeServer
watch(
  () => store.state.edgeServer.currentServer,
  (newServer) => {
    if (newServer && newServer.ipAddress) {
      selectedEdgeServer.value = newServer.ipAddress
      appendLog(`EdgeServer选择已更新: ${newServer.ipAddress} (${newServer.deviceName})\n`)
    }
  },
  { immediate: true } // 立即执行一次，确保初始值正确
)


// 直接使用原始数据，不进行格式化
const formatUploadDataSize = (value) => {
  return value;
}

// 新增：打开文件选择对话框
const openFileDialog = () => {
  fetchFileList()
  dialogVisible.value = true
}

// 新增：关闭文件选择对话框
const closeFileDialog = () => {
  dialogVisible.value = false
  selectedFile.value = ''
}

// 新增：获取文件列表
const fetchFileList = async () => {
  try {
    appendLog('正在获取文件列表...\n')
    const response = await fetch('/api-internal/upload/file/list')
    const data = await response.json()

    if (data.status === 'success') {
      appendLog('获取文件列表成功\n')
      // 构建树形数据结构
      fileTreeData.value = buildTreeData(data)
    } else {
      appendLog(`获取文件列表失败: ${data.message || '未知错误'}\n`)
      // 使用模拟数据
      fileTreeData.value = [
        {
          label: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin',
          value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin',
          children: [
            { label: 'output1.bin', value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin/output1.bin', disabled: false },
            { label: 'output2.bin', value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin/output2.bin', disabled: false },
            { label: 'test.txt', value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin/test.txt', disabled: false }
          ],
          disabled: true
        }
      ]
    }
  } catch (error) {
    appendLog(`获取文件列表出错: ${error.message}\n`)
    // 使用模拟数据
    fileTreeData.value = [
      {
        label: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin',
        value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin',
        children: [
          { label: 'output1.bin', value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin/output1.bin', disabled: false },
          { label: 'output2.bin', value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin/output2.bin', disabled: false },
          { label: 'test.txt', value: '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin/test.txt', disabled: false }
        ],
        disabled: true
      }
    ]
  }
}

// 新增：构建树形数据
const buildTreeData = (data) => {
  // 根据用户提供的示例，假设数据结构如Terminal#2-3所示
  const treeData = []

  if (data.container_path) {
    // 确保根目录路径不包含末尾的点号
    const cleanContainerPath = data.container_path.replace(/\.\/$/, '').replace(/\.$/, '')

    const rootNode = {
      label: cleanContainerPath,
      value: cleanContainerPath,
      children: [],
      disabled: true // 禁用根目录的选择框
    }

    if (data.files && Array.isArray(data.files)) {
      data.files.forEach(file => {
        // 确保构建的文件路径没有多余的斜杠
        const fileSeparator = cleanContainerPath.endsWith('/') ? '' : '/'
        rootNode.children.push({
          label: file.name,
          value: `${cleanContainerPath}${fileSeparator}${file.name}`,
          disabled: false // 允许选择文件节点
        })
      })
    }

    treeData.push(rootNode)
  }

  return treeData
}

// 新增：树形控件引用
const treeRef = ref(null)

// 新增：处理节点点击事件（用于高亮当前节点）
const handleNodeClick = (data) => {
  // 点击事件可以保持空实现，因为我们主要使用check事件
}

// 新增：处理文件选择（复选框变化事件）
const handleCheckChange = (data, checked) => {
  if (checked) {
    // 获取当前所有选中的节点
    const checkedNodes = treeRef.value ? treeRef.value.getCheckedNodes() : []

    // 如果已经选中了一个节点，取消之前的选择
    if (checkedNodes.length > 1) {
      // 取消所有选中状态
      treeRef.value.setCheckedKeys([])
      // 重新选中当前节点
      treeRef.value.setChecked(data.value, true)
      // 提示用户只能选择一个文件
      ElMessageBox.alert('只能选择一个文件', '提示', { type: 'info' })
    }

    selectedFile.value = data.value
  } else {
    selectedFile.value = ''
  }
}

// 新增：自定义渲染内容，隐藏目录的复选框
const renderContent = ({ node, data }) => {
  if (data.children && data.children.length > 0) {
    // 对于目录节点，直接返回标签文本
    return node.label
  } else {
    // 对于文件节点，返回标签文本
    return node.label
  }
}

// 新增：确认文件选择
const confirmFileSelection = () => {
  if (selectedFile.value) {
    // 添加到预览列表
    const newFile = {
      id: fileIdCounter.value++,
      name: selectedFile.value,
      hash: ''
    }
    previewFiles.value.push(newFile)

    appendLog(`已添加文件: ${selectedFile.value}\n`)
    dialogVisible.value = false
    selectedFile.value = ''
  } else {
    ElMessageBox.alert('请选择一个文件', '提示', { type: 'warning' })
  }
}

// 监听客户端ID变化，重新获取客户端信息和初始化数据
watch(
  () => currentClientId.value,
  (newClientId, oldClientId) => {
    if (newClientId !== oldClientId) {
      // 初始化新客户端数据
      store.dispatch('files/initClientUploadData', newClientId)

      // 如果有新客户端ID，打印日志
      if (newClientId && newClientId !== '默认客户端') {
        appendLog(`切换到新客户端: ${newClientId}\n`)
      }

      // 清空预览文件列表
      previewFiles.value = []
      fileIdCounter.value = 0

      // 重新获取客户端信息和文件列表
      fetchClientInfo()
      fetchFileList()
    }
  }
)

// 监听父组件中选择的EdgeServer变化（修改为直接访问Vuex中的状态）
watch(
  () => store.state.edgeServer.currentServer,
  (newServer) => {
    if (newServer && newServer.ipAddress) {
      selectedEdgeServer.value = newServer.ipAddress
      appendLog(`已选择EdgeServer: ${newServer.ipAddress}\n`)
    }
  },
  { immediate: true, deep: true }
)

// 组件挂载时，也从store初始化selectedEdgeServer
onMounted(() => {
  // 先尝试从store获取
  const serverFromStore = getSelectedEdgeServerFromStore()
  if (serverFromStore) {
    selectedEdgeServer.value = serverFromStore
    appendLog(`初始化EdgeServer: ${serverFromStore}\n`)
  }
  
  // 其他初始化代码保持不变
  // 初始化客户端数据
  store.dispatch('files/initClientUploadData', currentClientId.value);

  // 如果有客户端ID，打印日志
  if (currentClientId.value && currentClientId.value !== '默认客户端') {
    appendLog(`当前工作区: ${currentClientId.value}\n`);
  }

  // 初始化表格高度
  handleResize();
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
  // 获取客户端信息和文件列表
  fetchClientInfo();
  fetchFileList();

  // 清理函数
  return () => {
    window.removeEventListener('resize', handleResize);
  };
})

// 处理窗口大小变化
const handleResize = () => {
  // 简单计算表格高度，可根据实际需求调整
  tableHeight.value = window.innerHeight - 600
}

// 添加文件路径到预览列表
const addFilePath = () => {
  if (!filePath.value.trim()) {
    appendLog('请输入有效的文件路径\n')
    return
  }

  // 添加到预览列表
  const newFile = {
    id: fileIdCounter++,
    name: filePath.value,
    hash: '' // 实际应用中应该计算真实的哈希值
  }
  previewFiles.value.push(newFile)

  appendLog(`已添加文件: ${filePath.value}\n`)
  filePath.value = '' // 清空输入框
}

// 从接口获取客户端信息（不再需要完整列表）
const fetchClientInfo = async () => {
  try {
    const response = await fetch('/api-internal/client/id');
    const data = await response.json();

    console.log('客户端信息接口返回数据:', data);

    // 这里可以根据需要处理客户端信息
    if (data && data.client_id) {
      appendLog(`获取客户端信息成功: ${data.client_id}\n`);
    }
  } catch (error) {
    console.error('获取客户端信息失败:', error);
    appendLog(`获取客户端信息失败: ${error.message}\n`);
  }
}

// 组件挂载时初始化 - 已移至修改后的onMounted函数中

const handleFileChange = (file, fileList) => {
  // 添加到预览列表
  previewFiles.value.push({
    id: fileIdCounter++,
    name: file.name,
    hash: '' // 实际应用中应该计算真实的哈希值
  })

  // 记录日志
  appendLog(`已选择文件: ${file.name}\n`)
}

const removeFile = (id) => {
  // 保存要删除的文件名
  const fileToRemove = previewFiles.value.find(file => file.id === id);
  // 从预览列表中删除文件
  previewFiles.value = previewFiles.value.filter(file => file.id !== id)

  // 记录日志
  appendLog(`已删除文件: ${fileToRemove?.name || '未知文件'}\n`)
}

const uploadFiles = () => {
  if (previewFiles.value.length === 0) {
    ElMessageBox.alert('没有添加文件路径，请添加后上传！', '提示', { type: 'error' })
    appendLog('没有添加文件路径，请添加后上传！\n')
    return
  }

  // 检查是否选择了EdgeServer，增加备选检查
  if (!selectedEdgeServer.value) {
    // 尝试从store获取
    const serverFromStore = getSelectedEdgeServerFromStore()
    if (serverFromStore) {
      selectedEdgeServer.value = serverFromStore
      appendLog(`自动选择EdgeServer: ${serverFromStore}\n`)
    } else {
      ElMessageBox.alert('请选择要上传到的EdgeServer！', '提示', { type: 'error' })
      appendLog('请选择要上传到的EdgeServer！\n')
      return
    }
  }

  // 显示确认对话框
  ElMessageBox.confirm(
    '确认上传以下文件？\n' + previewFiles.value.map(file => file.name).join('\n'),
    '上传确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 调用上传接口
    appendLog('开始上传文件...\n')
    isUploading.value = true
    uploadToServer();
  }).catch(() => {
    appendLog('已取消上传\n')
  })
}


// 上传到服务器
const uploadToServer = () => {
  // 检查文件数量
  const fileCount = previewFiles.value.length;
  let apiEndpoint = '/api-internal/upload';
  let uploadData = {};

  // 保存上传的文件路径
  uploadedFilePaths.value = previewFiles.value.map(file => file.name);

  // 根据文件数量准备不同的上传数据
  if (fileCount === 1) {
    // 单个文件上传
    apiEndpoint = '/api-internal/upload';
    uploadData = {
      inputFile: previewFiles.value[0].name,
      ECC: asymmetricEncryptionAlgorithm.value === 'ecc'
    };
  } else {
    // 多个文件上传
    uploadData = {
      inputFiles: previewFiles.value.map(file => file.name),
      ECC: asymmetricEncryptionAlgorithm.value === 'ecc'
    };
  }

  // 只有当算法不是'none'时才添加相应字段
  if (hashAlgorithm.value !== 'none') {
    uploadData.HASH_TYPE = hashAlgorithm.value;
  }

  if (encryptionAlgorithm.value !== 'none') {
    uploadData.CIPHER_TYPE = encryptionAlgorithm.value;
  }

  // 添加选择的EdgeServer IP地址（从父组件header中获取）
  uploadData.edgeServerIp = selectedEdgeServer.value;
  appendLog(`选择的EdgeServer: ${selectedEdgeServer.value || '未选择'}\n`);

  // 调试日志：打印上传数据
  appendLog('上传数据: ' + JSON.stringify(uploadData) + '\n');
  appendLog('使用API端点: ' + apiEndpoint + '\n');

  // 调用上传接口
  fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(uploadData)
  })
    .then(response => response.json())
    .then(data => {
      isUploading.value = false
      console.log('文件上传接口响应:', data);
      if (data.status === 'success') {
        const operationTime = new Date().toLocaleString()
        appendLog(`[${operationTime}] 客户端: ${currentClientId.value}\n`)
        appendLog(`[${operationTime}] 操作类型: 文件上传\n`)
        appendLog(`[${operationTime}] 操作状态: 成功\n`)
        appendLog(`[${operationTime}] 上传成功\n`)
        
        // 上传成功后直接调用同步接口
        if (selectedEdgeServer.value) {
          appendLog(`[${operationTime}] 开始执行增量同步...\n`);
          console.log('准备直接调用同步接口，EdgeServer:', selectedEdgeServer.value);
          
          // 检查store状态，添加详细日志
          console.log('store state检查:', {
            edgeServerExists: !!store.state.edgeServer,
            serversExists: store.state.edgeServer ? Array.isArray(store.state.edgeServer.servers) : false,
            serversCount: store.state.edgeServer && Array.isArray(store.state.edgeServer.servers) ? store.state.edgeServer.servers.length : 0
          });
          
          // 获取当前EdgeServer的备份配置，添加错误处理
          let sourceServer = null;
          try {
            if (store.state.edgeServer && Array.isArray(store.state.edgeServer.servers)) {
              // 尝试通过IP地址精确匹配
              sourceServer = store.state.edgeServer.servers.find(
                server => server.ipAddress === selectedEdgeServer.value
              );
              
              // 如果精确匹配失败，尝试模糊匹配或使用其他字段
              if (!sourceServer) {
                console.log('精确匹配失败，尝试其他匹配方式');
                // 尝试使用id匹配或其他可能的字段
                sourceServer = store.state.edgeServer.servers.find(
                  server => server.id === selectedEdgeServer.value || 
                           server.deviceName === selectedEdgeServer.value
                );
              }
              console.log('找到的sourceServer:', sourceServer);
            }
          } catch (e) {
            console.error('获取备份配置出错:', e);
          }
          
          // 无论是否找到sourceServer，都尝试执行同步操作
          try {
            // 首先检查是否有备份节点配置
            if (sourceServer && sourceServer.backupNodes && Array.isArray(sourceServer.backupNodes)) {
              appendLog(`检测到${sourceServer.backupNodes.length}个备份节点配置\n`);
              
              if (sourceServer.backupNodes.length > 0) {
                // 分类备份节点并调用对应接口
                console.log('所有备份节点:', sourceServer.backupNodes);
                // 添加详细日志，检查每个节点的具体结构
                sourceServer.backupNodes.forEach((node, index) => {
                  console.log(`备份节点${index}:`, node);
                  console.log(`备份节点${index}的backupMethod类型:`, typeof node.backupMethod);
                  console.log(`备份节点${index}的backupMethod值:`, node.backupMethod);
                  // 手动检查FeatureSync&Rsync匹配
                  const isFeatureSync = node.backupMethod === 'FeatureSync' || node.backupMethod === 'FeatureSync&Rsync';
                  const isRsync = node.backupMethod === 'Rsync' || node.backupMethod === 'FeatureSync&Rsync';
                  console.log(`备份节点${index}是否匹配FeatureSync:`, isFeatureSync);
                  console.log(`备份节点${index}是否匹配Rsync:`, isRsync);
                });
              // 使用更灵活的匹配方式，确保大小写不敏感且能处理可能的空格
              const featureSyncNodes = sourceServer.backupNodes.filter(node => {
                const method = (node.backupMethod || '').toString().trim();
                return method.includes('FeatureSync');
              });
              const rsyncNodes = sourceServer.backupNodes.filter(node => {
                const method = (node.backupMethod || '').toString().trim();
                return method.includes('Rsync');
              });
              
              console.log('FeatureSync节点:', featureSyncNodes);
              console.log('Rsync节点:', rsyncNodes);
              console.log('找到备份节点数量:', { featureSyncCount: featureSyncNodes.length, rsyncCount: rsyncNodes.length });
              
              // 获取所有EdgeServer设备列表，用于查找对应deviceName的IP地址
              const allEdgeServers = store.state.edgeServer.servers || [];
              console.log('所有EdgeServer设备:', allEdgeServers);
              appendLog(`找到${featureSyncNodes.length}个FeatureSync节点和${rsyncNodes.length}个Rsync节点\n`);
              
              // 从deviceName查找对应的IP地址
              const getIpByDeviceName = (deviceName) => {
                const server = allEdgeServers.find(s => s.deviceName === deviceName);
                return server ? server.ipAddress : null;
              };
              // 调用FeatureSync接口
              featureSyncNodes.forEach(targetNode => {
                // 从deviceName查找对应的IP地址
                const targetIp = getIpByDeviceName(targetNode.deviceName);
                console.log(`为设备 ${targetNode.deviceName} 查找IP地址: ${targetIp}`);
                appendLog(`准备对${targetNode.deviceName}(${targetIp})执行${targetNode.backupMethod}同步\n`);
                
                if (targetIp) {
                  appendLog(`执行FeatureSync增量同步: ${selectedEdgeServer.value} -> ${targetIp}\n`);
                  console.log('调用Fsyn接口:', { source: selectedEdgeServer.value, target: targetIp, inc: false });
                  
                  fetch('/api-internal/edge/Fsyn', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      source: selectedEdgeServer.value,
                      target: targetIp,
                      inc: false
                    })
                  }).then(res => res.json())
                    .then(syncData => {
                      console.log('Fsyn接口响应:', syncData);
                      appendLog(`Fsyn接口响应: ${JSON.stringify(syncData)}\n`);
                      
                      // 保存同步记录
                      if (syncData.status === 'success' && sourceServer) {
                        try {
                          // 构建同步记录
                          const syncRecord = {
                            timestamp: new Date().toISOString(),
                            source: selectedEdgeServer.value,
                            target: targetIp,
                            traffic: syncData.total_sent_size,
                            trafficUnit: syncData.size_unit,
                            time: syncData.total_syn_time,
                            timeUnit: syncData.time_unit,
                            syncedFiles: syncData.syn_file || []
                          };
                          
                          // 调用store action保存同步记录
                          store.dispatch('edgeServer/addIncrementalSyncRecord', {
                            deviceId: sourceServer.id,
                            syncType: 'FeatureSync',
                            record: syncRecord
                          });
                          
                          // 更新上传事件状态
                          store.commit('edgeServer/SET_UPLOAD_EVENT_STATUS', { hasUploadEvent: true });
                          
                          console.log('Fsyn同步记录保存成功');
                          // 添加用户友好的提示
                          ElMessage.success(`FeatureSync备份成功：从${selectedEdgeServer.value}同步到${targetIp}，耗时${syncData.total_syn_time}${syncData.time_unit}`);
                        } catch (recordError) {
                          console.error('保存Fsyn同步记录失败:', recordError);
                          appendLog(`保存Fsyn同步记录失败: ${recordError.message}\n`);
                          ElMessage.warning('备份记录保存失败，但同步已完成');
                        }
                      } else if (syncData.status !== 'success') {
                        // 同步失败时的提示
                        ElMessage.error(`FeatureSync备份失败: ${syncData.message || '未知错误'}`);
                      }
                    })
                    .catch(err => {
                      console.error('Fsyn接口调用失败:', err);
                      appendLog(`Fsyn接口调用失败: ${err.message}\n`);
                      // 添加用户友好的错误提示
                      ElMessage.error('FeatureSync备份接口调用失败，请稍后重试');
                    });
                }
              });
              
              // 调用Rsync接口
              rsyncNodes.forEach(targetNode => {
                // 从deviceName查找对应的IP地址
                const targetIp = getIpByDeviceName(targetNode.deviceName);
                console.log(`为设备 ${targetNode.deviceName} 查找IP地址: ${targetIp}`);
                appendLog(`准备对${targetNode.deviceName}(${targetIp})执行${targetNode.backupMethod}同步\n`);
                
                if (targetIp) {
                  appendLog(`执行Rsync增量同步: ${selectedEdgeServer.value} -> ${targetIp}\n`);
                  console.log('调用Rsyn接口:', { source: selectedEdgeServer.value, target: targetIp, inc: false });
                  
                  fetch('/api-internal/edge/Rsyn', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      source: selectedEdgeServer.value,
                      target: targetIp,
                      inc: false
                    })
                  }).then(res => res.json())
                    .then(syncData => {
                      console.log('Rsyn接口响应:', syncData);
                      appendLog(`Rsyn接口响应: ${JSON.stringify(syncData)}\n`);
                      
                      // 保存同步记录
                      if (syncData.status === 'success' && sourceServer) {
                        try {
                          // 构建同步记录
                          const syncRecord = {
                            timestamp: new Date().toISOString(),
                            source: selectedEdgeServer.value,
                            target: targetIp,
                            traffic: syncData.total_sent_size,
                            trafficUnit: syncData.size_unit,
                            time: syncData.total_syn_time,
                            timeUnit: syncData.time_unit,
                            syncedFiles: syncData.syn_file || []
                          };
                          
                          // 调用store action保存同步记录
                          store.dispatch('edgeServer/addIncrementalSyncRecord', {
                            deviceId: sourceServer.id,
                            syncType: 'Rsync',
                            record: syncRecord
                          });
                          
                          // 更新上传事件状态
                          store.commit('edgeServer/SET_UPLOAD_EVENT_STATUS', { hasUploadEvent: true });
                          
                          console.log('Rsyn同步记录保存成功');
                          // 添加用户友好的提示
                          ElMessage.success(`Rsync备份成功：从${selectedEdgeServer.value}同步到${targetIp}，耗时${syncData.total_syn_time}${syncData.time_unit}`);
                        } catch (recordError) {
                          console.error('保存Rsyn同步记录失败:', recordError);
                          appendLog(`保存Rsyn同步记录失败: ${recordError.message}\n`);
                          ElMessage.warning('备份记录保存失败，但同步已完成');
                        }
                      } else if (syncData.status !== 'success') {
                        // 同步失败时的提示
                        ElMessage.error(`Rsync备份失败: ${syncData.message || '未知错误'}`);
                      }
                    })
                    .catch(err => {
                      console.error('Rsyn接口调用失败:', err);
                      appendLog(`Rsyn接口调用失败: ${err.message}\n`);
                      // 添加用户友好的错误提示
                      ElMessage.error('Rsync备份接口调用失败，请稍后重试');
                    });
                }
              });
  }
        } else {
              // 如果没有配置备份节点，使用默认同步（同步到自身）
              appendLog(`未找到备份配置，执行默认同步\n`);
              
              // 默认FeatureSync同步
              fetch('/api-internal/edge/Fsyn', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  source: selectedEdgeServer.value,
                  target: selectedEdgeServer.value,
                  inc: false
                })
              }).then(res => res.json())
                .then(syncData => {
                  console.log('默认Fsyn接口响应:', syncData);
                  appendLog(`默认Fsyn接口响应: ${JSON.stringify(syncData)}\n`);
                  
                  // 保存同步记录
                  if (syncData.status === 'success') {
                    try {
                      // 构建同步记录
                      const syncRecord = {
                        timestamp: new Date().toISOString(),
                        source: selectedEdgeServer.value,
                        target: selectedEdgeServer.value,
                        traffic: syncData.total_sent_size,
                        trafficUnit: syncData.size_unit,
                        time: syncData.total_syn_time,
                        timeUnit: syncData.time_unit,
                        syncedFiles: syncData.syn_file || []
                      };
                      
                      // 调用store action保存同步记录
                      store.dispatch('edgeServer/addIncrementalSyncRecord', {
                        deviceId: sourceServer ? sourceServer.id : 0,
                        syncType: 'FeatureSync',
                        record: syncRecord
                      });
                      
                      // 更新上传事件状态
                      store.commit('edgeServer/SET_UPLOAD_EVENT_STATUS', { hasUploadEvent: true });
                      
                      console.log('默认Fsyn同步记录保存成功');
                    } catch (recordError) {
                      console.error('保存默认Fsyn同步记录失败:', recordError);
                      appendLog(`保存默认Fsyn同步记录失败: ${recordError.message}\n`);
                    }
                  }
                })
                .catch(err => {
                  console.error('默认Fsyn接口调用失败:', err);
                  appendLog(`默认Fsyn接口调用失败: ${err.message}\n`);
                });
              
              // 默认Rsync同步
              fetch('/api-internal/edge/Rsyn', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  source: selectedEdgeServer.value,
                  target: selectedEdgeServer.value,
                  inc: false
                })
              }).then(res => res.json())
                .then(syncData => {
                  console.log('默认Rsyn接口响应:', syncData);
                  appendLog(`默认Rsyn接口响应: ${JSON.stringify(syncData)}\n`);
                  
                  // 保存同步记录
                  if (syncData.status === 'success') {
                    try {
                      // 构建同步记录
                      const syncRecord = {
                        timestamp: new Date().toISOString(),
                        source: selectedEdgeServer.value,
                        target: selectedEdgeServer.value,
                        traffic: syncData.total_sent_size,
                        trafficUnit: syncData.size_unit,
                        time: syncData.total_syn_time,
                        timeUnit: syncData.time_unit,
                        syncedFiles: syncData.syn_file || []
                      };
                      
                      // 调用store action保存同步记录
                      store.dispatch('edgeServer/addIncrementalSyncRecord', {
                        deviceId: sourceServer ? sourceServer.id : 0,
                        syncType: 'Rsync',
                        record: syncRecord
                      });
                      
                      // 更新上传事件状态
                      store.commit('edgeServer/SET_UPLOAD_EVENT_STATUS', { hasUploadEvent: true });
                      
                      console.log('默认Rsyn同步记录保存成功');
                    } catch (recordError) {
                      console.error('保存默认Rsyn同步记录失败:', recordError);
                      appendLog(`保存默认Rsyn同步记录失败: ${recordError.message}\n`);
                    }
                  }
                })
                .catch(err => {
                  console.error('默认Rsyn接口调用失败:', err);
                  appendLog(`默认Rsyn接口调用失败: ${err.message}\n`);
                });
            }
          } catch (syncError) {
            console.error('同步操作出错:', syncError);
            appendLog(`同步操作出错: ${syncError.message}\n`);
            
            // 即使出错也尝试执行默认同步
            console.log('尝试执行默认同步到自身');
            appendLog('尝试执行默认同步到自身\n');
            
            // 默认FeatureSync同步
            fetch('/api-internal/edge/Fsyn', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                source: selectedEdgeServer.value,
                target: selectedEdgeServer.value,
                inc: false
              })
            }).then(res => res.json())
              .then(syncData => {
                console.log('默认Fsyn接口响应:', syncData);
                appendLog(`默认Fsyn接口响应: ${JSON.stringify(syncData)}\n`);
              })
              .catch(err => {
                console.error('默认Fsyn接口调用失败:', err);
                appendLog(`默认Fsyn接口调用失败: ${err.message}\n`);
              });
              
              // 默认Rsync同步
              fetch('/api-internal/edge/Rsyn', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  source: selectedEdgeServer.value,
                  target: selectedEdgeServer.value,
                  inc: false
                })
              }).then(res => res.json())
                .then(syncData => {
                  console.log('默认Rsyn接口响应:', syncData);
                  appendLog(`默认Rsyn接口响应: ${JSON.stringify(syncData)}\n`);
                })
                .catch(err => {
                  console.error('默认Rsyn接口调用失败:', err);
                  appendLog(`默认Rsyn接口调用失败: ${err.message}\n`);
                });
          }
        }
        
        // 显示成功提示
        const fileCount = previewFiles.value.length;
        ElMessageBox.alert(`成功上传${fileCount}个文件`, '提示', { type: 'success' });
        // 清空上传列表
        previewFiles.value = [];
        // 存储到Vuex历史记录（暂时注释，模块可能不存在）
        // store.dispatch('history/addOperationRecord', {
        //   clientName: currentClientId.value,
        //   operationType: '文件上传',
        //   operationStatus: '成功',
        //   operationTime: operationTime
        // })
        appendLog(`[${operationTime}] 历史记录保存功能暂未实现\n`);
        // 上传成功后获取相关数据
        fetchUploadInfo();
      } else {
        const operationTime = new Date().toLocaleString();
        appendLog(`[${operationTime}] 客户端: ${currentClientId.value}\n`);
        appendLog(`[${operationTime}] 操作类型: 文件上传\n`);
        appendLog(`[${operationTime}] 操作状态: 失败\n`);
        appendLog(`[${operationTime}] 上传失败: ${data.message || '未知错误'}\n`);
        ElMessageBox.alert(`上传失败: ${data.message || '未知错误'}`, '提示', { type: 'error' });
        // 存储到Vuex历史记录（暂时注释，模块可能不存在）
        // store.dispatch('history/addOperationRecord', {
        //   clientName: currentClientId.value,
        //   operationType: '文件上传',
        //   operationStatus: '失败',
        //   operationTime: operationTime,
        //   errorMessage: data.message || '未知错误'
        // });
        appendLog(`[${operationTime}] 历史记录保存功能暂未实现\n`);
      }
    })
    .catch(error => {
      isUploading.value = false;
      const operationTime = new Date().toLocaleString();
      appendLog(`[${operationTime}] 客户端: ${currentClientId.value}\n`);
      appendLog(`[${operationTime}] 操作类型: 文件上传\n`);
      appendLog(`[${operationTime}] 操作状态: 出错\n`);
      appendLog(`[${operationTime}] 上传出错: ${error.message}\n`);
      ElMessageBox.alert(`上传出错: ${error.message}`, '提示', { type: 'error' });
      // 存储到Vuex历史记录（暂时注释，模块可能不存在）
      // store.dispatch('history/addOperationRecord', {
      //   clientName: currentClientId.value,
      //   operationType: '文件上传',
      //   operationStatus: '出错',
      //   operationTime: operationTime,
      //   errorMessage: error.message
      // })
      appendLog(`[${operationTime}] 历史记录保存功能暂未实现\n`)
    })
}

// store已在顶部声明，此处无需重复

// 执行增量同步
const performIncrementalSync = async (sourceIp) => {
  try {
    // 添加调试日志，确认函数被调用
    appendLog(`开始执行增量同步函数，源IP: ${sourceIp}\n`);
    console.log('增量同步函数被调用，源IP:', sourceIp);
    
    // 先执行核心的同步操作，确保即使UI有问题也能完成同步
    const syncResult = await executeSyncOperations(sourceIp);
    
    // 无论同步结果如何，都尝试关闭提示框
    try {
      // 向用户显示正在进行备份的提示（在同步完成后显示，避免UI阻塞问题）
      ElMessageBox.alert(
        syncResult ? '文件上传成功，备份同步已完成！' : '文件上传成功，但备份同步遇到问题',
        '备份状态',
        {
          type: syncResult ? 'success' : 'warning',
          duration: 3000, // 3秒后自动关闭
          showClose: true,
          showConfirmButton: true
        }
      );
    } catch (alertError) {
      appendLog(`显示提示框时出错: ${alertError.message}\n`);
      console.error('显示提示框时出错:', alertError);
    }
    
    return syncResult;
  } catch (error) {
    console.error('增量同步函数执行失败:', error);
    appendLog(`增量同步函数执行失败: ${error.message}\n`);
    
    // 尝试显示错误提示
    try {
      ElMessageBox.alert(
        `备份同步失败: ${error.message}`,
        '备份失败',
        {
          type: 'error',
          showClose: true,
          showConfirmButton: true
        }
      );
    } catch (alertError) {
      appendLog(`显示错误提示框时出错: ${alertError.message}\n`);
      console.error('显示错误提示框时出错:', alertError);
    }
    
    return false;
  }
};

// 执行核心同步操作（分离UI和业务逻辑）
const executeSyncOperations = async (sourceIp) => {
  try {
    // 获取当前EdgeServer的备份配置
    const sourceServer = store.state.edgeServer.servers.find(
      server => server.ipAddress === sourceIp
    );
    
    // 即使没有配置backupNodes，也执行基本的同步（根据用户需求）
    if (!sourceServer || !sourceServer.backupNodes || sourceServer.backupNodes.length === 0) {
      appendLog(`未找到EdgeServer ${sourceIp} 的备份配置，执行默认备份同步\n`);
      
      // 执行默认的FeatureSync同步（同步到自身作为备份）
      appendLog(`执行默认FeatureSync增量同步\n`);
      await callSyncAPI('/api-internal/edge/Fsyn', sourceIp, sourceIp);
      
      // 执行默认的Rsync同步（同步到自身作为备份）
      appendLog(`执行默认Rsync增量同步\n`);
      await callSyncAPI('/api-internal/edge/Rsyn', sourceIp, sourceIp);
    } else {
      // 分类备份节点（注意：这里应该使用backupMethod而不是backupType）
      const featureSyncNodes = sourceServer.backupNodes.filter(node => node.backupMethod === 'FeatureSync' || node.backupMethod === 'FeatureSync&Rsync');
      const rsyncNodes = sourceServer.backupNodes.filter(node => node.backupMethod === 'Rsync' || node.backupMethod === 'FeatureSync&Rsync');
      
      // 执行FeatureSync同步
      for (const targetNode of featureSyncNodes) {
        appendLog(`执行FeatureSync增量同步: ${sourceIp} -> ${targetNode.ipAddress}\n`);
        await callSyncAPI('/api-internal/edge/Fsyn', sourceIp, targetNode.ipAddress);
      }
      
      // 执行Rsync同步
      for (const targetNode of rsyncNodes) {
        appendLog(`执行Rsync增量同步: ${sourceIp} -> ${targetNode.ipAddress}\n`);
        await callSyncAPI('/api-internal/edge/Rsyn', sourceIp, targetNode.ipAddress);
      }
    }
    
    appendLog(`核心同步操作完成\n`);
    console.log('核心同步操作完成');
    return true;
  } catch (error) {
    console.error('核心同步操作失败:', error);
    appendLog(`核心同步操作失败: ${error.message}\n`);
    throw error;
  } finally {
    // 清理工作
    try {
      const messageBoxWrapper = document.querySelector('.el-message-box__wrapper');
      if (messageBoxWrapper && messageBoxWrapper.parentNode) {
        messageBoxWrapper.parentNode.removeChild(messageBoxWrapper);
      }
      appendLog(`提示框已清理\n`);
      console.log('提示框已清理');
    } catch (cleanupError) {
      console.error('清理提示框时出错:', cleanupError);
      appendLog(`清理提示框时出错: ${cleanupError.message}\n`);
    }
  }
};

// 调用同步API
const callSyncAPI = async (apiEndpoint, sourceIp, targetIp) => {
  try {
    // 添加详细调试日志
    appendLog(`准备调用同步API: ${apiEndpoint}\n`);
    appendLog(`同步参数: source=${sourceIp}, target=${targetIp}, inc=true\n`);
    console.log('准备调用同步API:', apiEndpoint);
    console.log('同步参数:', { source: sourceIp, target: targetIp, inc: false });
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: sourceIp,
        target: targetIp,
        inc: false
      })
    });
    
    // 添加响应状态调试日志
    appendLog(`API响应状态: ${response.status}\n`);
    appendLog(`API响应状态文本: ${response.statusText}\n`);
    console.log('API响应状态:', response.status);
    console.log('API响应状态文本:', response.statusText);
    
    const data = await response.json();
    // 添加响应数据调试日志
    appendLog(`API响应数据: ${JSON.stringify(data)}\n`);
    console.log('API响应数据:', data);
    
    if (data.status === 'success') {
      appendLog(`同步成功: ${apiEndpoint}\n`);
      appendLog(`同步流量: ${data.total_sent_size} ${data.size_unit}\n`);
      appendLog(`同步时间: ${data.total_syn_time} ${data.time_unit}\n`);
      
      // 更新store中的同步记录
      await updateSyncRecord(sourceIp, targetIp, apiEndpoint.includes('Fsyn') ? 'FeatureSync' : 'Rsync', data);
    } else {
      appendLog(`同步失败: ${data.message || '未知错误'}\n`);
    }
    
    return data;
  } catch (error) {
    console.error(`调用${apiEndpoint}失败:`, error);
    throw error;
  }
};

// 更新同步记录到store
const updateSyncRecord = async (sourceIp, targetIp, syncType, syncData) => {
  // 添加调试日志
  appendLog(`开始更新同步记录，源IP: ${sourceIp}, 目标IP: ${targetIp}, 同步类型: ${syncType}\n`);
  console.log('更新同步记录:', { sourceIp, targetIp, syncType, syncData });
  
  // 获取源EdgeServer的ID
  const sourceServer = store.state.edgeServer.servers.find(
    server => server.ipAddress === sourceIp
  );
  
  if (!sourceServer) {
    console.error('未找到对应的源EdgeServer');
    return;
  }
  
  // 构建同步记录
  const syncRecord = {
    timestamp: new Date().toISOString(),
    source: sourceIp,
    target: targetIp,
    traffic: syncData.total_sent_size,
    trafficUnit: syncData.size_unit,
    time: syncData.total_syn_time,
    timeUnit: syncData.time_unit,
    syncedFiles: syncData.syn_file || []
  };
  
  // 添加调试日志
  appendLog(`准备调用store action保存同步记录，服务器ID: ${sourceServer.id}\n`);
  console.log('准备保存同步记录到store:', { serverId: sourceServer.id, syncType, record: syncRecord });
  
  // 调用store action保存同步记录
  try {
    await store.dispatch('edgeServer/addIncrementalSyncRecord', {
      serverId: sourceServer.id,
      syncType: syncType,
      record: syncRecord
    });
    appendLog(`同步记录保存成功\n`);
    console.log('同步记录保存成功');
  } catch (error) {
    appendLog(`同步记录保存失败: ${error.message}\n`);
    console.error('同步记录保存失败:', error);
  }
  
  // 触发上传事件状态更新，以便工作区界面能感知到同步事件
  try {
    store.commit('edgeServer/SET_UPLOAD_EVENT_STATUS', { hasUploadEvent: true });
    appendLog(`上传事件状态更新成功\n`);
    console.log('上传事件状态更新成功');
  } catch (error) {
    appendLog(`上传事件状态更新失败: ${error.message}\n`);
    console.error('上传事件状态更新失败:', error);
  }
};


// 获取上传信息
const fetchUploadInfo = () => {
  // 调用/upload/file/info接口
  fetch('/api-internal/upload/file/info')
    .then(response => response.json())
    .then(data => {
      console.log('获取上传信息接口响应:', data);
      if (data.status === 'success') {
        appendLog('获取上传数据成功\n')

        // 处理单个文件数据 - 只显示最新上传的文件
        const latestFile = data.history.length > 0 ? data.history[data.history.length - 1] : null;

        let newSingleFileData = [];
        let file = null;

        if (latestFile) {
          // 优先使用本地保存的文件路径，如果不存在则使用服务器返回的路径
          const filePath = uploadedFilePaths.value.length > 0 ? uploadedFilePaths.value[0] : (latestFile.file_path || '未知文件');
          file = {
            id: 1,
            filePath: filePath,
            fileName: filePath.split('/').pop(), // 提取文件名
            hash: latestFile.file_hash || '未知哈希',
            chunkSize: latestFile.chunk_average_size || 0, // 原始B单位数据
            chunkProcessingTime: latestFile.chunk_process_time * 1000 || 0,
            dataSendDelay: latestFile.data_send_time * 1000 || 0,
            uploadDataSize: latestFile.data_size || 0, // 原始B单位数据
            uploadTime: new Date().toISOString(), // 添加上传时间
            clientId: currentClientId.value // 添加客户端ID
          };
          // 将文件存储到Vuex
          store.dispatch('files/addUploadedFile', file);
          newSingleFileData.push(file);
          appendLog(`已添加文件到下载列表: ${filePath}\n`);
        } else if (uploadedFilePaths.value.length > 0) {
          // 如果服务器没有返回数据，但有本地保存的文件路径
          const filePath = uploadedFilePaths.value[0];
          file = {
            id: 1,
            filePath: filePath,
            fileName: filePath.split('/').pop(),
            hash: '未知哈希',
            chunkSize: 0,
            chunkProcessingTime: 0,
            dataSendDelay: 0,
            uploadDataSize: 0,
            uploadTime: new Date().toISOString(),
            clientId: currentClientId.value
          };
          // 将文件存储到Vuex
          store.dispatch('files/addUploadedFile', file);
          newSingleFileData.push(file);
          appendLog(`已添加文件到下载列表: ${filePath}\n`);
        } else {
          appendLog('没有找到最新上传的文件数据\n');
        }

        // 在一个调用中同时更新所有数据到Vuex，确保使用相同的数据源
        updateClientData({
          chunkSize: file ? file.chunkSize : (latestFile ? latestFile.chunk_average_size || 0 : 0),
          chunkProcessingTime: file ? file.chunkProcessingTime : (latestFile ? latestFile.chunk_process_time * 1000 || 0 : 0),
          dataSendDelay: data.statistics.avg_data_send_time * 1000 || 0,
          uploadDataSize: file ? file.uploadDataSize : (latestFile ? latestFile.data_size || 0 : 0),
          singleFileData: newSingleFileData
        })
      } else {
        appendLog(`获取上传数据失败: ${data.message || '未知错误'}\n`)
      }
    })
    .catch(error => {
      appendLog(`获取上传数据出错: ${error.message}\n`)
    })
}

</script>

<style scoped>
.upload-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-area .el-form-item {
  margin-bottom: 0;
  width: 100%;
}

.metrics-display {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.single-file-data {
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

.algorithm-selection {
  margin-bottom: 20px;
}

.file-preview {
  margin-bottom: 20px;
}

.upload-action {
  margin-bottom: 20px;
  text-align: center;
}

.log-output {
  margin-top: 20px;
}
</style>