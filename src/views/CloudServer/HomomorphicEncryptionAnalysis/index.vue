<template>
  <div class="homomorphic-encryption-container">
    <h1>同态加密-密文数据分析</h1>
    
    <div class="analysis-section">
      <div class="section-header">
        <h2>密文数据分析 <span class="implementation-note">通过采用<span class="highlight-library">SEAL</span>库和<span class="highlight-library">Pyfhel</span>库实现</span></h2>
      </div>
      
      <div class="database-list-section">
        <div class="list-header">
          <h3>密文数据库列表</h3>
          <div class="total-records" v-if="databaseData && databaseData.total_records !== undefined">
            总记录数: {{ databaseData.total_records }}
          </div>
        </div>
        
        <div class="database-table-container">
          <div class="loading-state" v-if="databaseLoading">
            加载中...
          </div>
          
          <div class="empty-state" v-else-if="databaseLoading === false && (!databaseData || !databaseData.view_records || databaseData.view_records.length === 0)">
            暂无数据或加载失败
          </div>
          
          <div v-else-if="databaseData && databaseData.view_records && databaseData.view_records.length > 0">
            <div class="info-hint" style="padding: 10px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; margin-bottom: 10px;">
              为了方便展示，当前仅显示前5条记录（共{{ databaseData.total_records }}条）
            </div>
            <div class="scroll-hint">← 可左右滑动查看更多列 →</div>
            <div class="table-wrapper" style="overflow-x: auto; width: 100%;">
              <table class="database-table" style="min-width: 1200px; width: 100%;">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Edge ID</th>
                    <th>Disk Speed Per</th>
                    <th>CPU</th>
                    <th>GPU</th>
                    <th>Pass Failed</th>
                    <th>Authorization</th>
                    <th>Transgression Number</th>
                    <th>Up Traffic</th>
                    <th>Down Traffic</th>
                    <th>SVM Cipher</th>
                    <th>AES Text</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in paginatedRecords" :key="record.id">
                    <td>{{ record.id }}</td>
                    <td>{{ record.user_id }}</td>
                    <td v-html="formatFieldValue(record.disk_speed_per, 'disk_speed_per')"></td>
                    <td v-html="formatFieldValue(record.cpu, 'cpu')"></td>
                    <td v-html="formatFieldValue(record.gpu, 'gpu')"></td>
                    <td v-html="formatFieldValue(record.pass_failed, 'pass_failed')"></td>
                    <td v-html="formatFieldValue(record.authorization, 'authorization')"></td>
                    <td v-html="formatFieldValue(record.transgression_number, 'transgression_number')"></td>
                    <td v-html="formatFieldValue(record.up_traffic, 'up_traffic')"></td>
                    <td v-html="formatFieldValue(record.down_traffic, 'down_traffic')"></td>
                    <td v-html="formatFieldValue(record.svm_cipher, 'svm_cipher')"></td>
                    <td v-html="formatFieldValue(record.AES_text, 'AES_text')"></td>
                    <td>{{ formatDateTime(record.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="pagination">
              <button 
                class="page-btn" 
                @click="goToPage(currentPage - 1)" 
                :disabled="currentPage <= 1"
                aria-label="上一页"
              >
                上一页
              </button>
              <span class="page-info">
                第 {{ currentPage }} / {{ totalPages }} 页，共 {{ databaseData.total_records }} 条记录
              </span>
              <button 
                class="page-btn" 
                @click="goToPage(currentPage + 1)" 
                :disabled="currentPage >= totalPages"
                aria-label="下一页"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-overlay" v-if="showCipherModal" @click="handleCloseCipherModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ currentCipherData.fieldName }} - 密文详情</h3>
            <button class="modal-close" @click="handleCloseCipherModal">×</button>
          </div>
          <div class="modal-body">
            <div class="cipher-info">
              <div class="info-item">
                <span class="info-label">字段名称:</span>
                <span class="info-value">{{ currentCipherData.fieldName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">字段大小:</span>
                <span class="info-value">{{ currentCipherData.fieldSize }}</span>
              </div>
            </div>
            <div class="cipher-content">
              <h4>密文内容:</h4>
              <pre class="cipher-text">{{ currentCipherData.fieldValue }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" @click="handleCloseCipherModal">关闭</button>
          </div>
        </div>
      </div>
      
      <div class="analysis-form-container">
        <div class="analysis-inputs">
          <div class="form-group">
            <label>Edge ID：</label>
            <select v-model="userId" class="form-control" @change="updateUserId">
              <option value="" disabled>请选择Edge ID</option>
              <option v-for="id in userIds" :key="id" :value="id">{{ id }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>密文数据分析算法：</label>
            <select :value="analysisOperation" class="form-control" @change="updateAnalysisOperation">
              <option value="flow">流量统计算法</option>
              <option value="transgressions">越权次数统计算法</option>
              <option value="pass">登录失败统计算法</option>
              <option value="load">负载分析算法</option>
              <option value="predict">异常检测算法</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>日志条数：</label>
            <div class="log-id-input-container">
              <input 
                type="number" 
                v-model.number="logId" 
                min="1" 
                :max="maxLogId || 21" 
                class="form-control log-id-input"
                @input="handleLogIdInput"
                @focus="showLogIdDropdown = true"
                @blur="hideLogIdDropdown"
              />
              <div class="log-id-dropdown" v-if="showLogIdDropdown">
                <div 
                  v-for="n in (maxLogId || 21)" 
                  :key="n" 
                  class="log-id-option"
                  @mousedown="handleSelectLogId(n)"
                >
                  {{ n }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button @click="handleDataAnalysis" class="btn-primary" :disabled="analysisLoading">
          <span v-if="!analysisLoading">进行分析</span>
          <span v-else class="loading-spinner">
            <span class="spinner"></span>
            分析中...
          </span>
        </button>
        
        <div class="result-section" v-if="analysisResult">
          <h3>分析结果：</h3>
          <pre class="result-box">{{ formatResult(analysisResult) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'HomomorphicEncryptionAnalysis',
  data() {
    return {
      showLogIdDropdown: false // 下拉菜单状态保留在本地
    };
  },
  
  computed: {
    ...mapGetters('homomorphicEncryption', [
      'databaseData',
      'databaseLoading',
      'currentPage',
      'userIds',
      'userId',
      'analysisOperation',
      'logId',
      'maxLogId',
      'analysisResult',
      'analysisLoading',
      'cipherLoading',
      'showCipherModal',
      'currentCipherData',
      'totalPages',
      'paginatedRecords'
    ])
  },
  
  mounted() {
    this.fetchDatabaseData();
  },
  methods: {
    ...mapActions('homomorphicEncryption', [
      'fetchDatabaseData',
      'setUserId',
      'setAnalysisOperation',
      'setLogId',
      'showCipherModal',
      'closeCipherModal',
      'setCurrentPage',
      'performDataAnalysis'
    ]),
    
    validateLogId(logId) {
      const maxLimit = this.maxLogId || 21;
      if (logId < 1) {
        this.$message.warning('日志条数不能少于1');
        return 1;
      } else if (logId > maxLimit) {
        this.$message.warning(`日志条数不能超过${maxLimit}`);
        return maxLimit;
      }
      return logId;
    },
    
    hideLogIdDropdown() {
      setTimeout(() => {
        this.showLogIdDropdown = false;
      }, 200);
    },
    
    // 处理日志ID输入
    handleLogIdInput(event) {
      const validatedLogId = this.validateLogId(event.target.value);
      this.setLogId(validatedLogId);
    },
    
    // 处理选择日志ID
    handleSelectLogId(value) {
      this.setLogId(value);
      this.showLogIdDropdown = false;
    },
    
    // 更新用户ID
    updateUserId(event) {
      this.setUserId(event.target.value);
    },
    
    // 更新分析操作
    updateAnalysisOperation(event) {
      this.setAnalysisOperation(event.target.value);
    },
    
    // 处理密文查看按钮点击
    handleViewCipherText(fieldName, fieldValue, fieldSize, loadingKey) {
      // 设置加载状态
      this.$store.commit('homomorphicEncryption/SET_CIPHER_LOADING', { key: loadingKey, loading: true });
      
      // 模拟延迟以展示加载状态
      setTimeout(() => {
        this.showCipherModal({
          fieldName,
          fieldValue,
          fieldSize
        });
        // 清除加载状态
        this.$store.commit('homomorphicEncryption/SET_CIPHER_LOADING', { key: loadingKey, loading: false });
      }, 300);
    },
    
    // 处理关闭密文模态框
    handleCloseCipherModal() {
      this.closeCipherModal();
    },
    
    // 处理分页
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.setCurrentPage(page);
        // 重新绑定密文按钮事件
        this.$nextTick(() => {
          this.bindCipherButtons();
        });
      }
    },
    
    // 绑定密文查看按钮事件
    bindCipherButtons() {
      setTimeout(() => {
        const buttons = document.querySelectorAll('.view-cipher-btn');
        buttons.forEach(button => {
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          newButton.onclick = (event) => {
            event.stopPropagation();
            const loadingKey = newButton.dataset.loadingKey;
            const fieldName = newButton.dataset.fieldname;
            const fieldValue = newButton.dataset.fieldvalue;
            const fieldSize = newButton.dataset.fieldsize;
            
            this.handleViewCipherText(fieldName, fieldValue, fieldSize, loadingKey);
          };
        });
      }, 100);
    },
    
    formatFieldValue(field, fieldName) {
      if (!field && field !== 0 && field !== false) return '-';
      
      const cipherFields = ['disk_speed_per', 'cpu', 'gpu', 'pass_failed', 'authorization', 'transgression_number', 'up_traffic', 'down_traffic', 'svm_cipher', 'AES_text'];
      const isCiphertext = cipherFields.includes(fieldName) && typeof field === 'string';
      
      if (isCiphertext) {
        const size = this.formatFieldSize(field);
        const displayText = field.length > 20 ? `${field.substring(0, 20)}...` : field;
        // 使用随机ID作为加载状态的标识
        const loadingKey = `${fieldName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const isLoading = this.cipherLoading[loadingKey];
        return `<span class="cipher-field">
          <span class="cipher-preview">${displayText}</span>
          <button class="view-cipher-btn" 
                  data-fieldname="${fieldName.replace(/'/g, "\\'")}" 
                  data-fieldvalue="${field.replace(/'/g, "\\'")}" 
                  data-fieldsize="${size}"
                  data-loading-key="${loadingKey}"
                  disabled="${isLoading}"
                  style="margin-left: 8px; padding: 4px 8px; font-size: 12px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: ${isLoading ? 'not-allowed' : 'pointer'}; opacity: ${isLoading ? '0.8' : '1'};">
            ${isLoading ? '<span class="spinner-small"></span> 加载中...' : '查看内容'}
          </button>
          <span class="cipher-size" style="margin-left: 5px; font-size: 12px; color: #999;">(${size})</span>
        </span>`;
      } else {
        return field;
      }
    },
    
    formatFieldSize(field) {
      if (!field) return '0 bytes';
      
      const sizeMatch = field.match(/\((\d+) bytes\)/);
      if (sizeMatch && sizeMatch[1]) {
        return `${sizeMatch[1]} bytes`;
      }
      
      return `${field.length} bytes`;
    },
    
    formatDateTime(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }
        
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        console.error('日期格式化错误:', error);
        return dateString;
      }
    },
    
    formatResult(result) {
      return JSON.stringify(result, null, 2);
    },
    
    // 处理数据分析
    handleDataAnalysis() {
      if (!this.userId) {
        this.$message.warning('请先选择Edge ID');
        return;
      }
      
      console.log('正在执行密文数据分析...');
      
      // 调用Vuex action执行分析
      this.performDataAnalysis({
        userId: this.userId,
        operation: this.analysisOperation,
        logId: this.logId
      }).then(data => {
        if (data && data.status === 'success') {
          this.$message.success('密文数据分析成功');
        } else {
          this.$message.error('密文数据分析失败：' + (data?.message || '未知错误'));
        }
      }).catch(error => {
        this.$message.error('密文数据分析失败：' + error.message);
      });
    }
  }
};
</script>

<style scoped>
.homomorphic-encryption-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

h1, h2, h3 {
  color: #333;
  margin-bottom: 20px;
}

h1 {
  margin-bottom: 30px;
}

h2 {
  color: #555;
  display: flex;
  align-items: center;
}

.implementation-note {
  font-size: 16px;
  font-weight: normal;
  color: #666;
  margin-left: 10px;
  display: inline-block;
}

.highlight-library {
  color: #333;
  font-weight: 600;
  font-size: 16px;
  padding: 0 2px;
}

h3 {
  color: #606266;
  margin-bottom: 10px;
}

.analysis-section {
  background: #ffffff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.user-id {
  font-weight: bold;
  color: #1890ff;
}

.database-list-section {
  margin-bottom: 30px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  margin-bottom: 0;
  color: #606266;
  font-size: 18px;
}

.total-records {
  font-weight: bold;
  color: #1890ff;
  font-size: 14px;
}

.database-table-container {
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #409eff;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.info-hint {
  padding: 10px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  margin-bottom: 10px;
}

.scroll-hint {
  text-align: center;
  padding: 6px;
  font-size: 12px;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px 4px 0 0;
  border: 1px solid #ebeef5;
  border-bottom: none;
  animation: fadeInOut 3s infinite alternate;
}

@keyframes fadeInOut {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.table-wrapper {
  overflow-x: auto;
  white-space: nowrap;
  border-radius: 0 0 4px 4px;
  border: 1px solid #ebeef5;
  border-top: none;
  background: white;
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc #f5f7fa;
}

.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.database-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.database-table th,
.database-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  min-width: 120px;
}

.database-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  position: sticky;
  top: 0;
  z-index: 10;
}

.database-table tr:hover {
  background-color: #f5f7fa;
}

.cipher-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
}

.cipher-preview {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #606266;
}

.view-cipher-btn {
  padding: 2px 8px;
  font-size: 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.view-cipher-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.view-cipher-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
  opacity: 0.8;
}

.spinner-small {
  width: 10px;
  height: 10px;
  border: 1px solid transparent;
  border-top: 1px solid currentColor;
  border-right: 1px solid currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.cipher-size {
  font-size: 12px;
  color: #909399;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.page-btn {
  padding: 6px 12px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.page-btn:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
}

.page-info {
  color: #606266;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 6px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #303133;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.modal-close:hover {
  background-color: #f5f7fa;
  color: #606266;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.cipher-info {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: bold;
  color: #606266;
  width: 100px;
}

.info-value {
  color: #303133;
}

.cipher-content h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.cipher-text {
  background: #f8f8f8;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

.analysis-form-container {
  margin: 20px 0;
}

.analysis-inputs {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.analysis-inputs .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #409eff;
}

.log-id-input-container {
  position: relative;
  width: 100%;
}

.log-id-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.log-id-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.log-id-option:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  background-color: #c0c4cc;
  cursor: not-allowed;
  opacity: 0.8;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.result-section {
  margin-top: 20px;
  width: 100%;
}

.result-box {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>