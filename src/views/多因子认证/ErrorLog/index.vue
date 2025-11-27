<template>
  <div class="error-log-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><WarningFilled /></el-icon>
            <h2>IP异常变动记录</h2>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="refreshLogs" :loading="loading">
              <el-icon v-if="!loading"><Refresh /></el-icon>
              <el-icon v-else><Loading /></el-icon>
              刷新日志
            </el-button>
          </div>
        </div>
      </template>

      <!-- 日志展示区域 -->
      <div class="logs-section">
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading"><loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-else-if="logs.length === 0" class="empty-container">
          <el-empty description="暂无日志记录">
            <el-button type="primary" @click="refreshLogs">
              重新加载
            </el-button>
          </el-empty>
        </div>

        <div v-else class="logs-content">
          <!-- 调试信息展示 -->
          <!-- <div class="debug-info" v-if="logs.length > 0">
            <el-alert
              title="当前有 {{ logs.length }} 条日志记录"
              type="info"
              :closable="false"
            >
              <template #default>
                <div>点击下方日志条目查看详细内容</div>
              </template>
            </el-alert>
          </div> -->
          
          <!-- 日志列表 -->
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <div class="log-index">#{{ index + 1 }}</div>
            <div class="log-text">{{ log }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, WarningFilled, Refresh } from '@element-plus/icons-vue';
import { apiGateway } from '../../../api/request';

export default {
  name: 'ErrorLog',
  components: {
    Loading,
    WarningFilled,
    Refresh
  },
  setup() {
    // 状态管理
    const loading = ref(false);
    const logs = ref([]);
    
    // 静态测试数据（用于确保界面展示正常）
    const testLogs = [
      '[2025-11-23T16:25:49.533Z] 用户：test@example.com 发生 IP 重大变动，旧 IP：192.168.1.100；新 IP：10.0.0.5；已通知管理员',
      '[2025-11-22T14:12:33.211Z] 用户：admin@example.com 发生 IP 重大变动，旧 IP：172.16.0.1；新 IP：203.0.113.15；已临时限制访问'
    ];
    
    // 刷新日志 - 从IP.log读取数据
    const refreshLogs = async () => {
      loading.value = true;
      try {
        // 调用API获取IP.log内容
        const response = await apiGateway.get('/api/utils/read-log', {
          params: { reverse: true }
        });
        console.log('API响应:', response);
        
        // 检查response对象本身是否包含logs属性
        let logsData = null;
        if (response && response.logs) {
          console.log('logs直接在response对象中');
          logsData = response.logs;
        } else if (response && response.data && response.data.logs) {
          console.log('logs在response.data中');
          logsData = response.data.logs;
        } else {
          console.log('未找到logs数据');
        }
        
        // 处理获取到的日志数据
        if (logsData) {
          // 无论logs是什么类型，都尝试将其转换为数组格式
          let logArray = logsData;
          
          // 如果不是数组，尝试转换为数组
          if (!Array.isArray(logArray)) {
            console.log('logs不是数组，尝试转换');
            // 尝试将字符串分割成数组，或者直接包装成单元素数组
            if (typeof logArray === 'string') {
              logArray = [logArray];
            } else {
              logArray = [JSON.stringify(logArray)];
            }
          }
          
          console.log('最终日志数组长度:', logArray.length);
          console.log('最终日志数组内容:', logArray);
          
          // 直接将处理后的日志数组赋值给logs.value
          logs.value = logArray;
          ElMessage.success(`成功获取 ${logArray.length} 条日志记录`);
        } else {
          // 如果没有找到有效日志数据
          console.error('API响应中没有找到有效的logs数据');
          logs.value = testLogs;
          ElMessage.warning('API未返回有效日志数据，使用测试数据展示');
        }
      } catch (error) {
        console.error('刷新日志失败:', error);
        // 出错时使用测试数据，确保界面有内容展示
        logs.value = testLogs;
        ElMessage.warning('使用测试数据展示日志');
      } finally {
        loading.value = false;
      }
    };
    
    // 组件挂载时初始化数据
    onMounted(() => {
      refreshLogs();
      
      // 添加键盘快捷键支持
      document.addEventListener('keydown', handleKeydown);
    });
    
    // 键盘快捷键处理
    const handleKeydown = (event) => {
      // Ctrl/Cmd + R 刷新
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        refreshLogs();
      }
    };
    
    return {
      loading,
      logs,
      refreshLogs
    };
  }
};
</script>

<style scoped>
/* 容器样式 */
.error-log-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 主卡片样式 */
.main-card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.main-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #ebeef5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: #f56c6c;
  font-size: 24px;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.log-count-badge {
  margin-left: 10px;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
  gap: 12px;
  color: #909399;
}

.loading-container .el-icon {
  font-size: 28px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 空状态样式 */
.empty-container {
  padding: 80px 0;
}

/* 日志展示区域 */
.logs-section {
  padding: 20px;
}

.logs-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.log-item {
  background-color: #ffffff;
  border-radius: 6px;
  padding: 16px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.log-index {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.debug-info {
  margin-bottom: 20px;
}

.log-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-left-color: #66b1ff;
}

.log-text {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
  font-size: 14px;
  color: #303133;
}

/* 滚动条样式优化 */
.logs-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.logs-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.logs-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.logs-content::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-log-container {
    padding: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 15px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .logs-section {
    padding: 15px;
  }
  
  .logs-content {
    max-height: 500px;
  }
  
  .log-item {
    padding: 12px;
  }
  
  .log-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .card-header h2 {
    font-size: 18px;
  }
  
  .log-item {
    padding: 10px;
  }
  
  .log-text {
    font-size: 12px;
  }
}
</style>