<template>
  <div class="log-records-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>日志记录</span>
          <el-button type="primary" size="small" @click="refreshLogs">刷新日志</el-button>
        </div>
      </template>

      <div class="tree-container">
        <div class="loading-indicator" v-if="isLoading">
          <el-progress type="circular" :percentage="0" status="info" />
          <span class="loading-text">正在更新日志...</span>
        </div>
        <el-tree
          v-else-if="logTreeData.length > 0"
          :data="logTreeData"
          show-checkbox
          node-key="key"
          :default-expand-all="true"
          :props="defaultProps"
          @check-change="handleCheckChange"
          @node-click="handleNodeClick"
          ref="treeRef"
        >
          <template #default="{ node }">
            <div class="custom-tree-node">
              <span>{{ node.label }}</span>
              <span v-if="node.level === 1" class="node-status">
                {{ node.data.hasLogs ? '有日志' : '暂无数据' }}
              </span>
            </div>
          </template>
        </el-tree>
        <div v-else class="no-data">
          <el-empty description="暂无日志数据"></el-empty>
        </div>
      </div>

      <div class="selected-logs" v-if="selectedLogs.length > 0">
        <div class="selected-logs-header">
          <h3>已选择的日志 ({{ selectedLogs.length }})</h3>
          <el-button type="warning" size="small" @click="clearSelectedLogs">清除选择</el-button>
        </div>
        <el-input
          v-model="selectedLogsText"
          type="textarea"
          :rows="10"
          readonly
          placeholder="已选择的日志将显示在这里"
        ></el-input>
      </div>

      <!-- 同态加密部分 -->
      <div class="homomorphic-encryption">
        <h3>同态加密方案选择：</h3>
        <p class="subtitle">（通过采用SEAL库和Pyfhel库实现）</p>
        <div class="encryption-scheme-selection">
          <el-radio-group v-model="selectedEncryptionScheme" size="small">
            <el-radio-button label="CKKS">CKKS (Cheon-Kim-Kim-Song)</el-radio-button>
            <el-radio-button label="BFV">BFV (Brakerski-Fan-Vercauteren)</el-radio-button>
            <el-radio-button label="BGV">BGV (Brakerski-Gentry-Vaikuntanathan)</el-radio-button>
          </el-radio-group>
        </div>
        <div class="action-button">
          <el-button type="primary" @click="encryptData">进行加密</el-button>
        </div>
        <div class="encrypted-data-section">
          <h4>加密后数据展示</h4>
          <el-input
            v-model="encryptedData"
            type="textarea"
            :rows="8"
            readonly
            placeholder="加密后的数据将显示在这里"
          ></el-input>
        </div>
      </div>

      <!-- 同态算子部分 -->
      <div class="homomorphic-operator">
        <h3>同态算子选择：</h3>
        <div class="operator-selection">
          <el-radio-group v-model="selectedOperator" size="small">
            <el-radio-button label="加法">同态加法</el-radio-button>
            <el-radio-button label="乘法">同态乘法</el-radio-button>
            <el-radio-button label="减法">同态减法</el-radio-button>
          </el-radio-group>
        </div>
        <div class="action-button">
          <el-button type="primary" @click="uploadToCloud">上传至云端</el-button>
        </div>
        <div class="operator-result-section">
          <h4>同态算子结果数据</h4>
          <el-input
            v-model="operatorResult"
            type="textarea"
            :rows="8"
            readonly
            placeholder="同态算子处理后的结果将显示在这里"
          ></el-input>
        </div>
      </div>

      <!-- 密文日志分析部分 -->
      <div class="ciphertext-analysis">
        <h3>密文日志分析</h3>
        <div class="analysis-selection">
          <el-radio-group v-model="selectedAnalysis" size="small">
            <el-radio-button label="流量统计">流量统计</el-radio-button>
            <el-radio-button label="越权次数统计">越权次数统计</el-radio-button>
            <el-radio-button label="登录统计">登录成功/失败统计</el-radio-button>
            <el-radio-button label="负载分析">负载分析</el-radio-button>
            <el-radio-button label="异常检测">异常检测</el-radio-button>
          </el-radio-group>
        </div>
        <div class="action-button">
          <el-button type="primary" @click="analyzeCiphertext">密文分析</el-button>
        </div>
        <div class="analysis-result-section">
          <h4>分析结果展示</h4>
          <el-input
            v-model="analysisResult"
            type="textarea"
            :rows="10"
            readonly
            placeholder="密文日志分析结果将显示在这里"
          ></el-input>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

export default defineComponent({
  name: 'EdgeServerLogRecords',
  setup() {
    const store = useStore()
    const treeRef = ref(null)
    const logTreeData = ref([])
    const selectedLogs = ref([])
    const refreshInterval = ref(null)
    const isLoading = ref(false)
    
    // 同态加密相关状态
    const selectedEncryptionScheme = ref('CKKS')
    const encryptedData = ref('')
    const selectedOperator = ref('加法')
    const operatorResult = ref('')
    
    // 密文日志分析相关状态
    const selectedAnalysis = ref('流量统计')
    const analysisResult = ref('')

    const defaultProps = {
      children: 'children',
      label: 'label'
    }

    const selectedLogsText = computed(() => {
      return selectedLogs.value.join('\n')
    })

    // 获取Edge服务器列表
    const getEdgeServers = () => {
      return store.state.edgeServer.servers || []
    }

    // 处理日志数据，按日期分类
    const processLogData = (rawLogData) => {
      if (!rawLogData || !rawLogData.edge_log) {
        return {}
      }

      const logLines = rawLogData.edge_log.split('\n')
      const logsByDate = {}

      logLines.forEach(line => {
        if (!line.trim()) return
        
        // 提取日期部分 (格式: 2025-11-06 11:50:50)
        const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})/)
        if (dateMatch) {
          const date = dateMatch[1]
          if (!logsByDate[date]) {
            logsByDate[date] = []
          }
          logsByDate[date].push(line)
        }
      })

      return logsByDate
    }

    // 构建树形结构数据
    const buildLogTree = (logsByDate) => {
      console.log('开始构建树形结构，日志数据按日期分组:', Object.keys(logsByDate));
      
      const tree = []
      
      // 定义所有需要展示的服务器节点，可根据实际情况添加节点
      const servers = ['node2', 'node3', 'node4']
      
      servers.forEach(nodeName => {
        const serverKey = `server-${nodeName}`
        const serverNode = {
          key: serverKey,
          label: `EdgeServer ${nodeName} 日志`,
          hasLogs: nodeName === 'node2' && Object.keys(logsByDate).length > 0,
          level: 1,
          children: []
        }
        
        // 目前只有node2有日志
        if (nodeName === 'node2' && Object.keys(logsByDate).length > 0) {
          // 添加日期子节点
          Object.keys(logsByDate).forEach(date => {
            const dateKey = `${serverKey}-date-${date}`
            const dateNode = {
              key: dateKey,
              label: `${date} 日志 (${logsByDate[date].length}条)`,
              level: 2,
              children: []
            }
            console.log(`添加日期节点: ${date}，包含${logsByDate[date].length}条日志`);

            // 添加具体日志节点
            logsByDate[date].forEach((log, logIndex) => {
              const logKey = `${dateKey}-log-${logIndex}`
              const logNode = {
                key: logKey,
                label: log.substring(0, 50) + (log.length > 50 ? '...' : ''),
                level: 3,
                logText: log
              }
              dateNode.children.push(logNode)
            })

            serverNode.children.push(dateNode)
          })
        }
        
        // 添加服务器节点到树中
        tree.push(serverNode)
      })
      
      console.log('树形结构构建完成，总节点数:', tree.length);
      return tree
    }

    // 获取日志数据
    const fetchEdgeLog = async () => {
      if (isLoading.value) return

      isLoading.value = true
      try {
        console.log('开始获取日志数据...');
        const response = await fetch('/api-internal/edge/log')
        if (!response.ok) {
          throw new Error(`获取日志失败: ${response.status}`)
        }

        const text = await response.text()
        console.log('获取到日志原始数据:', text.substring(0, 100) + '...');
        
        let data
        try {
          data = JSON.parse(text)
        } catch (e) {
          data = { edge_log: text }
        }

        // 处理日志数据
        const logsByDate = processLogData(data)
        console.log('处理后的日志数据按日期分组:', Object.keys(logsByDate));
        
        const newTreeData = buildLogTree(logsByDate)

        // 只更新有变化的部分，避免整个界面刷新
        updateLogTreeWithDelta(logTreeData.value, newTreeData)
      } catch (error) {
        console.error('获取日志失败:', error)
        // 不显示错误提示，避免频繁刷新时的提示干扰
      } finally {
        isLoading.value = false
        console.log('日志获取完成');
      }
    }

    // 增量更新日志树，避免整个界面刷新
    const updateLogTreeWithDelta = (oldTree, newTree) => {
      // 直接更新树数据，确保新日志能正确显示
      // 保存当前选中的节点
      const currentCheckedKeys = treeRef.value?.getCheckedKeys() || []
      
      // 总是更新树数据，确保新日志能显示
      logTreeData.value = newTree
      
      // 延迟恢复选中状态，确保DOM已更新
      setTimeout(() => {
        if (treeRef.value && currentCheckedKeys.length > 0) {
          treeRef.value.setCheckedKeys(currentCheckedKeys)
        }
      }, 100)
    }

    // 开始循环获取日志
    const startLogPolling = () => {
      // 立即获取一次
      fetchEdgeLog()
      
      // 设置定时器，缩短轮询时间到3秒
      refreshInterval.value = setInterval(fetchEdgeLog, 3000)
    }

    // 停止循环获取
    const stopLogPolling = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    // 刷新日志
    const refreshLogs = () => {
      fetchEdgeLog()
      ElMessage.success('日志已刷新')
    }

    // 处理选中变化
    const handleCheckChange = (data, checked, indeterminate) => {
      if (data.level === 3 && data.logText) {
        if (checked) {
          selectedLogs.value.push(data.logText)
        } else {
          selectedLogs.value = selectedLogs.value.filter(log => log !== data.logText)
        }
      }
    }

    // 处理节点点击
    const handleNodeClick = (data, node, component) => {
      // 如果是日志节点，自动选中
      if (data.level === 3 && data.logText) {
        component.setChecked(data, !component.isChecked(data), true)
      }
    }

    // 清除选择
    const clearSelectedLogs = () => {
      treeRef.value?.setCheckedKeys([])
      selectedLogs.value = []
      ElMessage.success('已清除所有选择')
    }
    
    // 进行加密
    const encryptData = () => {
      if (selectedLogs.value.length === 0) {
        ElMessage.warning('请先选择需要加密的日志')
        return
      }
      
      // 模拟加密过程
      encryptedData.value = `[${selectedEncryptionScheme.value}] 加密数据示例 - ${new Date().toLocaleString()}\n`
      encryptedData.value += `使用${selectedEncryptionScheme.value}方案加密了${selectedLogs.value.length}条日志记录\n`
      encryptedData.value += '加密结果示例: [密文数据...]'
      
      ElMessage.success('加密完成')
    }
    
    // 上传至云端
    const uploadToCloud = () => {
      if (!encryptedData.value) {
        ElMessage.warning('请先进行加密')
        return
      }
      
      // 模拟上传和处理过程
      operatorResult.value = `[${selectedOperator.value}] 同态计算结果 - ${new Date().toLocaleString()}\n`
      operatorResult.value += `使用${selectedOperator.value}对密文数据进行处理\n`
      operatorResult.value += `基于${selectedEncryptionScheme.value}方案的同态${selectedOperator.value}结果\n`
      operatorResult.value += '计算结果示例: [处理后密文...]'
      
      ElMessage.success('上传至云端并完成同态计算')
    }
    
    // 密文分析
    const analyzeCiphertext = () => {
      if (!encryptedData.value) {
        ElMessage.warning('请先进行加密')
        return
      }
      
      // 模拟密文分析过程
      analysisResult.value = `[${selectedAnalysis}] 密文日志分析结果 - ${new Date().toLocaleString()}\n`
      analysisResult.value += `基于${selectedEncryptionScheme.value}方案的${selectedAnalysis}分析\n\n`
      
      // 根据不同的分析类型显示不同的模拟结果
      if (selectedAnalysis.value === '流量统计') {
        analysisResult.value += '=== 流量统计分析结果 ===\n'
        analysisResult.value += '• 总请求数: 128,456\n'
        analysisResult.value += '• 平均响应时间: 127ms\n'
        analysisResult.value += '• 高峰时段: 14:00-16:00\n'
        analysisResult.value += '• 异常流量检测: 无明显异常'
      } else if (selectedAnalysis.value === '越权次数统计') {
        analysisResult.value += '=== 越权次数统计分析结果 ===\n'
        analysisResult.value += '• 检测到越权尝试: 12次\n'
        analysisResult.value += '• 严重级别: 低\n'
        analysisResult.value += '• 主要来源IP: [密文表示]\n'
        analysisResult.value += '• 建议: 持续监控'
      } else if (selectedAnalysis.value === '登录统计') {
        analysisResult.value += '=== 登录成功/失败统计分析结果 ===\n'
        analysisResult.value += '• 成功登录: 876次\n'
        analysisResult.value += '• 失败登录: 42次\n'
        analysisResult.value += '• 失败率: 4.5%\n'
        analysisResult.value += '• 可疑登录: 3次 (需要进一步验证)'
      } else if (selectedAnalysis.value === '负载分析') {
        analysisResult.value += '=== 负载分析结果 ===\n'
        analysisResult.value += '• CPU平均负载: 28.3%\n'
        analysisResult.value += '• 内存使用峰值: 67.8%\n'
        analysisResult.value += '• 磁盘I/O: 正常\n'
        analysisResult.value += '• 系统资源状态: 健康'
      } else if (selectedAnalysis.value === '异常检测') {
        analysisResult.value += '=== 异常检测分析结果 ===\n'
        analysisResult.value += '• 检测到异常模式: 2个\n'
        analysisResult.value += '• 异常类型: 潜在的数据泄露尝试\n'
        analysisResult.value += '• 建议: 检查相关日志详情\n'
        analysisResult.value += '• 风险评估: 中等'
      }
      
      ElMessage.success('密文日志分析完成')
    }

    // 组件挂载时启动轮询
    onMounted(() => {
      startLogPolling()
    })

    // 组件卸载时停止轮询
    onBeforeUnmount(() => {
      stopLogPolling()
    })

    return {
      logTreeData,
      selectedLogs,
      selectedLogsText,
      defaultProps,
      treeRef,
      refreshLogs,
      handleCheckChange,
      handleNodeClick,
      clearSelectedLogs,
      // 同态加密相关
      selectedEncryptionScheme,
      encryptedData,
      selectedOperator,
      operatorResult,
      encryptData,
      uploadToCloud,
      // 密文日志分析相关
      selectedAnalysis,
      analysisResult,
      analyzeCiphertext
    }
  }
})
</script>

<style scoped>
.log-records-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 20px;
  position: relative;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-text {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.node-status {
  font-size: 12px;
  color: #909399;
}

.no-data {
  padding: 40px 0;
  text-align: center;
}

.selected-logs {
  margin-top: 20px;
}

.selected-logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.selected-logs-header h3 {
  margin: 0;
  font-size: 16px;
}

/* 同态加密部分样式 */
.homomorphic-encryption {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.homomorphic-encryption h3 {
  margin-top: 0;
  margin-bottom: 5px;
  font-size: 16px;
}

.homomorphic-encryption .subtitle {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 12px;
  color: #909399;
}

.encryption-scheme-selection {
  margin-bottom: 15px;
}

.action-button {
  margin-bottom: 20px;
}

.encrypted-data-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
}

/* 同态算子部分样式 */
.homomorphic-operator {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.homomorphic-operator h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.operator-selection {
  margin-bottom: 15px;
}

.operator-result-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
}

/* 密文日志分析部分样式 */
.ciphertext-analysis {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.ciphertext-analysis h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.analysis-selection {
  margin-bottom: 15px;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 10px;
}

.analysis-selection .el-radio-group {
  display: inline-block;
}

.analysis-result-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
}
</style>