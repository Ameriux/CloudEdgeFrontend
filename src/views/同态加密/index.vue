<template>
  <div class="homomorphic-encryption-container">
    <h1>同态加密</h1>
    
    <div class="encryption-section">
      <h2>同态加密传输</h2>
      
      <div class="form-group">
        <label>选择同态加密方案：（通过采用SEAL库和Pyfhel库实现）</label>
        <select v-model="encryptionScheme" class="form-control">
          <option value="CKKS">CKKS（Cheon-Kim-Kim-Song）</option>
          <option value="BFV">BFV（Brakerski-Fan-Vercauteren）</option>
          <option value="BGV">BGV（Brakerski-Gentry-Vaikuntanathan）</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>选择同态加密算子：</label>
        <select v-model="operation" class="form-control">
          <option value="add">add（加法）</option>
          <option value="mul">mul（乘法）</option>
          <option value="sub">sub（减法）</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="p1">请输入整数序列 p1：</label>
        <input 
          id="p1" 
          type="text" 
          v-model="p1" 
          placeholder="例如： 4,5,456,6" 
          class="form-control"
        />
      </div>
      
      <div class="form-group">
        <label for="p2">请输入整数序列 p2：</label>
        <input 
          id="p2" 
          type="text" 
          v-model="p2" 
          placeholder="请与p1 的个数保持一致，例如：4,34,5,5" 
          class="form-control"
        />
      </div>
      
      <button @click="performHomomorphicEncryption" class="btn-primary">
        进行同态加密
      </button>
      
      <div class="result-section" v-if="result">
        <h3>结果展示：</h3>
        <pre class="result-box">{{ formatResult(result) }}</pre>
      </div>
    </div>
    
    <!-- 第二部分：密文数据分析 -->
    <div class="analysis-section">
      <div class="section-header">
        <h2>密文数据分析</h2>
        <div class="user-id">user_id: 241786</div>
      </div>
      
      <!-- 密文数据库列表 -->
      <div class="database-list-section">
        <div class="list-header">
          <h3>密文数据库列表</h3>
          <div class="total-records" v-if="databaseData && databaseData.total_records !== undefined">
            总记录数: {{ databaseData.total_records }}
          </div>
        </div>
        
        <div class="database-table-container">
          <!-- 加载状态 -->
          <div class="loading-state" v-if="databaseLoading">
            加载中...
          </div>
          <!-- 空状态 -->
          <div class="empty-state" v-else-if="databaseLoading === false && (!databaseData || !databaseData.view_records || databaseData.view_records.length === 0)">
            暂无数据或加载失败
          </div>
          <!-- 表格内容 -->
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
                    <th>User ID</th>
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
                  <tr v-for="record in databaseData.view_records" :key="record.id">
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
            <!-- 分页控件 -->
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
      
      <!-- 密文展示模态框 -->
      <div class="modal-overlay" v-if="showCipherModal" @click="closeCipherModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ currentCipherData.fieldName }} - 密文详情</h3>
            <button class="modal-close" @click="closeCipherModal">×</button>
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
            <button class="btn-primary" @click="closeCipherModal">关闭</button>
          </div>
        </div>
      </div>
      
      <div class="analysis-form-container">
        <div class="analysis-inputs">
          <div class="form-group">
            <label>密文数据分析算法：</label>
            <select v-model="analysisOperation" class="form-control">
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
                @input="validateLogId"
                @focus="showLogIdDropdown = true"
                @blur="hideLogIdDropdown"
              />
              <div class="log-id-dropdown" v-if="showLogIdDropdown">
                <div 
                  v-for="n in (maxLogId || 21)" 
                  :key="n" 
                  class="log-id-option"
                  @mousedown="selectLogId(n)"
                >
                  {{ n }}
                </div>
              </div>
            </div>
          </div>
        </div>
      
      <button @click="performDataAnalysis" class="btn-primary">
        进行分析
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
import request from '@/api/request';

export default {
  name: 'HomomorphicEncryption',
  data() {
    return {
      encryptionScheme: 'CKKS',
      operation: 'add',
      p1: '',
      p2: '',
      result: null,
      loading: false,
      // 密文数据分析相关数据
      analysisOperation: 'flow',
      logId: 2,
      maxLogId: 21, // 最大日志条数，将从API获取
      analysisResult: null,
      analysisLoading: false,
      userId: 241786,
      showLogIdDropdown: false,
      // 密文数据库相关数据
      databaseData: null,
      databaseLoading: false,
      // 密文展示相关数据
      showCipherModal: false,
      currentCipherData: {
        fieldName: '',
        fieldValue: '',
        fieldSize: ''
      },
      // 分页相关数据
      currentPage: 1,
      pageSize: 3 // 每页显示3条记录，在3-5范围内
    };
  },
  
  mounted() {
    // 组件挂载时自动加载数据库数据
    this.fetchDatabaseData();
  },
  methods: {
    performHomomorphicEncryption() {
      // 验证输入
      if (!this.validateInputs()) {
        return;
      }
      
      this.loading = true;
      
      console.log('正在执行同态加密...')
      
      // 使用fetch调用API，与参考代码保持完全一致的调用方式
      fetch('/api-internal/homo/enc', {
        method: 'POST',
        body: JSON.stringify({
          scheme: this.encryptionScheme,
          operation: this.operation,
          p1: this.p1,
          p2: this.p2
        })
      })
        .then(response => response.json())
        .then(data => {
          // 打印完整响应数据以便调试
          console.log('同态加密原始响应数据:', data)
          
          // 修改逻辑：API直接返回结果，不再检查status字段
          if (data && data.result && Array.isArray(data.result)) {
            // API已成功返回结果
            this.result = data;
            this.$message.success('同态加密成功');
          } else {
            // 处理异常情况
            console.log(`同态加密结果格式异常: ${JSON.stringify(data)}`)
            this.$message.error('同态加密结果格式异常，请检查输入');
            return Promise.reject(new Error('同态加密结果格式异常'));
          }
        })
        .catch(error => {
          console.error(`同态加密出错: ${error.message}`);
          this.$message.error('同态加密失败：' + error.message);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    validateInputs() {
      // 验证p1和p2输入
      if (!this.p1 || !this.p2) {
        this.$message.warning('请输入完整的整数序列');
        return false;
      }
      
      // 验证输入格式（简单验证，确保是逗号分隔的数字）
      const p1Numbers = this.p1.split(',').map(num => num.trim()).filter(num => num !== '');
      const p2Numbers = this.p2.split(',').map(num => num.trim()).filter(num => num !== '');
      
      if (p1Numbers.length === 0 || p2Numbers.length === 0) {
        this.$message.warning('请输入有效的整数序列');
        return false;
      }
      
      // 验证所有输入是否为数字
      const isAllNumbers = (arr) => arr.every(num => !isNaN(num) && isFinite(num));
      if (!isAllNumbers(p1Numbers) || !isAllNumbers(p2Numbers)) {
        this.$message.warning('请输入有效的整数序列，仅包含数字和逗号');
        return false;
      }
      
      // 验证两个序列长度是否一致
      if (p1Numbers.length !== p2Numbers.length) {
        this.$message.warning('两个整数序列的个数必须保持一致');
        return false;
      }
      
      return true;
    },
    
    formatResult(result) {
      return JSON.stringify(result, null, 2);
    },
    
    // 验证日志条数输入
    validateLogId() {
      const maxLimit = this.maxLogId || 21;
      if (this.logId < 1) {
        this.$message.warning('日志条数不能少于1');
        this.logId = 1;
      } else if (this.logId > maxLimit) {
        this.$message.warning(`日志条数不能超过${maxLimit}`);
        this.logId = maxLimit;
      }
    },
    
    // 选择日志条数
    selectLogId(value) {
      this.logId = value;
      this.showLogIdDropdown = false;
    },
    
    // 延迟隐藏下拉框（防止点击选项时立即隐藏）
    hideLogIdDropdown() {
      setTimeout(() => {
        this.showLogIdDropdown = false;
      }, 200);
    },
    
    // 获取密文数据库数据
    fetchDatabaseData() {
      this.databaseLoading = true;
      console.log('正在获取密文数据库数据...');
      
      fetch('/api-internal/homo/database', {
        method: 'GET'
      })
        .then(response => response.json())
        .then(data => {
          console.log('密文数据库原始响应数据:', data);
          
          if (data && data.total_records !== undefined) {
            this.databaseData = data;
            // 更新最大日志条数为数据库总记录数
            this.maxLogId = data.total_records;
            console.log('数据库总记录数:', data.total_records);
          } else {
            console.error(`获取密文数据库数据失败: ${JSON.stringify(data)}`);
            this.$message.error('获取密文数据库数据失败');
          }
        })
        .catch(error => {
          console.error(`获取密文数据库数据出错: ${error.message}`);
          this.$message.error('获取密文数据库数据失败：' + error.message);
        })
        .finally(() => {
          this.databaseLoading = false;
          // 数据加载完成后绑定按钮事件，添加延迟确保DOM已更新
          setTimeout(() => {
            this.bindCipherButtons();
          }, 100);
        });
    },
    
    // 绑定密文查看按钮事件
    bindCipherButtons() {
      // 添加延迟确保DOM已更新
      setTimeout(() => {
        const buttons = document.querySelectorAll('.view-cipher-btn');
        console.log('找到的密文按钮数量:', buttons.length);
        buttons.forEach(button => {
          // 移除旧的事件监听器以防止重复绑定
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          newButton.onclick = (event) => {
            event.stopPropagation();
            const fieldName = newButton.dataset.fieldname;
            const fieldValue = newButton.dataset.fieldvalue;
            const fieldSize = newButton.dataset.fieldsize;
            console.log('显示密文:', fieldName);
            this.showCipherText(fieldName, fieldValue, fieldSize);
          };
        });
      }, 100); // 增加延迟确保DOM渲染完成
    },
    
    // 格式化字段值显示
    formatFieldValue(field, fieldName) {
      if (!field && field !== 0 && field !== false) return '-';
      
      // 明确指定哪些字段是密文字段
      const cipherFields = ['disk_speed_per', 'cpu', 'gpu', 'pass_failed', 'authorization', 'transgression_number', 'up_traffic', 'down_traffic', 'svm_cipher', 'AES_text'];
      
      // 判断是否为密文字段
      const isCiphertext = cipherFields.includes(fieldName) && typeof field === 'string';
      
      if (isCiphertext) {
        // 获取字段大小
        const size = this.formatFieldSize(field);
        // 截取部分密文作为显示
        const displayText = field.length > 20 ? `${field.substring(0, 20)}...` : field;
        // 使用标准的DOM事件绑定
        return `<span class="cipher-field">
          <span class="cipher-preview">${displayText}</span>
          <button class="view-cipher-btn" 
                  data-fieldname="${fieldName.replace(/'/g, "\\'")}" 
                  data-fieldvalue="${field.replace(/'/g, "\\'")}" 
                  data-fieldsize="${size}"
                  style="margin-left: 8px; padding: 4px 8px; font-size: 12px; background: #409EFF; color: white; border: none; border-radius: 4px; cursor: pointer;">
            查看内容
          </button>
          <span class="cipher-size" style="margin-left: 5px; font-size: 12px; color: #999;">(${size})</span>
        </span>`;
      } else {
        // 非密文字段直接返回值
        return field;
      }
    },
    
    // 格式化字段大小显示
    formatFieldSize(field) {
      if (!field) return '0 bytes';
      
      // 尝试从字段字符串中提取大小信息，如"...(393329 bytes)"
      const sizeMatch = field.match(/\((\d+) bytes\)/);
      if (sizeMatch && sizeMatch[1]) {
        return `${sizeMatch[1]} bytes`;
      }
      
      // 如果没有找到大小信息，返回字段的实际长度
      return `${field.length} bytes`;
    },
    
    // 显示密文详情
    showCipherText(fieldName, fieldValue, fieldSize) {
      this.currentCipherData = {
        fieldName,
        fieldValue,
        fieldSize
      };
      this.showCipherModal = true;
    },
    
    // 关闭密文详情模态框
    closeCipherModal() {
      this.showCipherModal = false;
    },
    
    // 计算总页数 - 使用pageSize统一管理每页显示数量
    get totalPages() {
      if (!this.databaseData || !this.databaseData.view_records) return 1;
      return Math.ceil(this.databaseData.view_records.length / this.pageSize);
    },
    
    // 计算当前页显示的记录 - 使用pageSize统一管理每页显示数量
    get paginatedRecords() {
      if (!this.databaseData || !this.databaseData.view_records) return [];
      
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      const records = this.databaseData.view_records.slice(start, end);
      
      // 页面变化后重新绑定按钮事件
      setTimeout(() => {
        this.bindCipherButtons();
      }, 0);
      
      return records;
    },
    
    // 跳转到指定页
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        // 分页切换后重新绑定密文按钮事件
        this.bindCipherButtons();
      }
    },
    
    // 格式化日期时间
    formatDateTime(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }
        
        // 格式化为本地日期时间字符串
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
    
    performDataAnalysis() {
      // 确保日志条数在有效范围内
      this.validateLogId();
      
      this.analysisLoading = true;
      console.log('正在执行密文数据分析...');
      
      const url = `/api-internal/homo/analysis?user_id=${this.userId}&operation=${this.analysisOperation}&log_id=${this.logId}`;
      
      fetch(url, {
        method: 'GET'
      })
        .then(response => response.json())
        .then(data => {
          console.log('密文数据分析原始响应数据:', data);
          
          if (data && data.status === 'success') {
            this.analysisResult = data;
            this.$message.success('密文数据分析成功');
          } else {
            console.error(`密文数据分析失败: ${JSON.stringify(data)}`);
            this.$message.error('密文数据分析失败：' + (data?.message || '未知错误'));
            return Promise.reject(new Error('密文数据分析失败'));
          }
        })
        .catch(error => {
          console.error(`密文数据分析出错: ${error.message}`);
          this.$message.error('密文数据分析失败：' + error.message);
        })
        .finally(() => {
          this.analysisLoading = false;
        });
    }
  }
};
</script>

<style scoped>
/* Container styles */
.homomorphic-encryption-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

/* Typography styles */
h1, h2, h3 {
  color: #333;
  margin-bottom: 20px;
}

h1 {
  margin-bottom: 30px;
}

h2 {
  color: #555;
}

h3 {
  color: #606266;
  margin-bottom: 10px;
}

/* Section styles */
.encryption-section,
.analysis-section {
  background: #ffffff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

/* Section header styles */
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

/* Database list section styles */
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

/* 滚动提示 */
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

/* 表格横向滚动容器 */
.table-wrapper {
  overflow-x: auto;
  white-space: nowrap;
  border-radius: 0 0 4px 4px;
  border: 1px solid #ebeef5;
  border-top: none;
  background: white;
  /* 添加滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc #f5f7fa;
}

/* Webkit浏览器滚动条样式 */
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

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #409eff;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

/* 密文字段样式 */
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
}

.view-cipher-btn:hover {
  background-color: #66b1ff;
}

.cipher-size {
  font-size: 12px;
  color: #909399;
}

/* 分页样式 */
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

/* 模态框样式 */
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

/* Form styles */
  .form-group {
    margin-bottom: 20px;
  }

  .form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }

  .form-row .form-group {
    flex: 1;
  }
  
  /* 日志条数组合输入框样式 */
  .log-id-input-container {
    position: relative;
    width: 100%;
  }
  
  .log-id-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
  }
  
  .log-id-input:focus {
    outline: none;
    border-color: #409eff;
  }
  
  /* 下拉菜单样式 */
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
  
  /* 数据分析表单容器样式 */
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
  
  .log-id-option {
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .log-id-option:hover {
    background-color: #f5f7fa;
    color: #409eff;
  }

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #606266;
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

/* Button styles */
.btn-primary {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

/* Result section styles */
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