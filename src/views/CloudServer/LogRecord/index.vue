<template>
  <div class="log-record-container">
    <div class="page-header">
      <h2>日志记录</h2>
      <el-button type="primary" @click="fetchCloudLogData">刷新日志</el-button>
    </div>
    
    <el-tree
      :data="logTreeData"
      :props="defaultProps"
      @node-click="handleNodeClick"
      :expand-on-click-node="false"
      class="log-tree"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span v-if="!data.isLogEntry">
            {{ data.label }}
            <span v-if="data.count && data.count > 0" class="count-badge">
              ({{ data.count }})
            </span>
          </span>
          <span v-else class="log-entry">
            <span class="log-time">{{ data.time }}</span>
            <span class="log-source">{{ data.source }}</span>
            <span class="log-content">{{ data.content }}</span>
          </span>
        </span>
      </template>
    </el-tree>
    
    <div v-if="loading" class="loading-overlay">
      <el-loading-spinner></el-loading-spinner>
      <p>正在加载日志数据...</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'LogRecord',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const rawLogData = ref('')
    
    // 树形结构配置
    const defaultProps = {
      children: 'children',
      label: 'label'
    }
    
    // 日志树数据
    const logTreeData = computed(() => {
      return [
        {
          label: 'Cloud 端日志数据',
          children: [
            {
              label: '明文日志数据',
              children: formatCloudLogByDate()
            },
            {
              label: '密文日志数据',
              children: []
            }
          ]
        },
        {
          label: 'EdgeServer 端密文日志数据',
          children: [
            {
              label: 'EdgeServer node2 数据',
              children: []
            },
            {
              label: 'EdgeServer node3 数据',
              children: []
            }
          ]
        }
      ]
    })
    
    // 根据日期格式化Cloud日志
    const formatCloudLogByDate = () => {
      if (!rawLogData.value) return []
      
      const logLines = rawLogData.value.split('\n').filter(line => line.trim())
      const logsByDate = {}
      
      logLines.forEach(line => {
        // 解析日志行格式：日期 时间 <来源>: 内容
        const match = line.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+<([^>]+)>:\s+(.*)$/)
        if (match) {
          const [, date, time, source, content] = match
          
          if (!logsByDate[date]) {
            logsByDate[date] = []
          }
          
          logsByDate[date].push({
            time,
            source,
            content,
            isLogEntry: true
          })
        }
      })
      
      // 转换为树形结构
      return Object.keys(logsByDate)
        .sort((a, b) => new Date(b) - new Date(a)) // 按日期降序
        .map(date => ({
          label: `${date} 日志数据`,
          count: logsByDate[date].length,
          children: logsByDate[date]
        }))
    }
    
    // 处理节点点击
    const handleNodeClick = (data, node) => {
      if (data.isLogEntry) {
        // 如果是日志条目，可以添加展开详情等操作
        console.log('日志详情:', data)
      } else if (node.isLeaf) {
        // 如果是叶子节点但不是日志条目，可能需要加载数据
        console.log('加载节点数据:', data.label)
      }
    }
    
    // 获取Cloud端日志数据
    const fetchCloudLogData = () => {
      console.log('正在获取CloudServer日志...')
      loading.value = true
      
      return fetch('/api-internal/cloud/log')
        .then(response => {
          if (!response.ok) {
            throw new Error(`CloudServer日志接口响应错误: ${response.status}`)
          }
          return response.text().then(text => {
            console.log('CloudServer日志API原始响应:', text)
            try {
              return JSON.parse(text)
            } catch (e) {
              return text
            }
          })
        })
        .then(data => {
          // 解析日志数据
          if (typeof data === 'object' && data !== null && data.cloud_log) {
            rawLogData.value = data.cloud_log
            console.log('CloudServer日志获取成功(cloud_log字段)')
          } else if (typeof data === 'string') {
            rawLogData.value = data
            console.log('CloudServer日志获取成功(文本格式)')
          } else {
            console.log('获取到的CloudServer日志格式不匹配')
          }
          
          // 将日志内容保存到store中
          store.commit('cloudServer/UPDATE_FULL_LOG_CONTENT', rawLogData.value)
        })
        .catch(error => {
          console.error('获取CloudServer日志失败:', error)
          rawLogData.value = `获取CloudServer日志失败: ${error.message}`
        })
        .finally(() => {
          loading.value = false
        })
    }
    
    // 预留获取EdgeServer端日志数据的接口
    const fetchEdgeServerLogData = (nodeId) => {
      console.log(`预留的获取EdgeServer ${nodeId} 日志数据接口`)
      // 实际实现时应该从Edge端获取数据
    }
    
    // 预留获取Cloud端密文日志数据的接口
    const fetchCloudEncryptedLogData = () => {
      console.log('预留的获取Cloud端密文日志数据接口')
      // 实际实现时应该从后端获取密文日志数据
    }
    
    // 组件挂载时获取日志数据
    onMounted(() => {
      fetchCloudLogData()
    })
    
    return {
      logTreeData,
      defaultProps,
      loading,
      handleNodeClick,
      fetchCloudLogData,
      fetchEdgeServerLogData,
      fetchCloudEncryptedLogData
    }
  }
}
</script>

<style scoped>
.log-record-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.log-tree {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
  overflow-y: auto;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.count-badge {
  color: #606266;
  font-size: 12px;
  margin-left: 5px;
}

.log-entry {
  display: block;
  padding: 8px 0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

.log-time {
  color: #909399;
  margin-right: 10px;
  min-width: 80px;
  display: inline-block;
}

.log-source {
  color: #409eff;
  margin-right: 10px;
  min-width: 100px;
  display: inline-block;
}

.log-content {
  color: #303133;
}

.loading-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading-overlay p {
  margin-top: 10px;
  color: #606266;
}
</style>