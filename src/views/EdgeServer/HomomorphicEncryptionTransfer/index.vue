<template>
  <div class="homomorphic-encryption-container">
    <h1>同态加密-加密传输</h1>
    
    <div class="encryption-section">
      <h2>同态加密传输 <span class="implementation-note">通过采用<span class="highlight-library">SEAL</span>库和<span class="highlight-library">Pyfhel</span>库实现</span></h2>
      
      <div class="form-group">
        <label>选择同态加密算子：</label>
        <select v-model="operation" class="form-control" @change="(e) => updateParams('operation', e.target.value)">
          <option value="add">add（加法）</option>
          <option value="mul">mul（乘法）</option>
          <option value="sub">sub（减法）</option>
        </select>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="p1">请输入整数序列 p1：</label>
          <input 
            id="p1" 
            type="text" 
            v-model="p1" 
            placeholder="请输入整数序列，例如：4,5,456,6" 
            class="form-control"
            @input="(e) => updateParams('p1', e.target.value)"
            :class="{ 'input-focus': isP1Focused }"
            @focus="isP1Focused = true"
            @blur="isP1Focused = false"
          />
        </div>
        
        <div class="form-group">
          <label for="p2">请输入整数序列 p2：</label>
          <input 
            id="p2" 
            type="text" 
            v-model="p2" 
            placeholder="请与p1个数保持一致，例如：4,34,5,5" 
            class="form-control"
            @input="(e) => updateParams('p2', e.target.value)"
            :class="{ 'input-focus': isP2Focused }"
            @focus="isP2Focused = true"
            @blur="isP2Focused = false"
          />
        </div>
      </div>
      
      <button @click="performHomomorphicEncryption" class="btn-primary" :disabled="loading">
        {{ loading ? '处理中...' : '进行同态加密' }}
      </button>
      
      <!-- 整数序列密文展示框 -->
      <div class="result-section" v-if="integerSequenceCiphertexts">
        <h3>整数序列密文</h3>
        <div class="ciphertext-container">
          <div class="ciphertext-box">
            <div class="ciphertext-header">p1 密文</div>
            <pre class="ciphertext-content">{{ integerSequenceCiphertexts?.p1?.content_base64 || '' }}</pre>
            <div class="ciphertext-footer">长度: {{ integerSequenceCiphertexts?.p1?.content_length || 0 }}</div>
          </div>
          
          <div class="ciphertext-box">
            <div class="ciphertext-header">p2 密文</div>
            <pre class="ciphertext-content">{{ integerSequenceCiphertexts?.p2?.content_base64 || '' }}</pre>
            <div class="ciphertext-footer">长度: {{ integerSequenceCiphertexts?.p2?.content_length || 0 }}</div>
          </div>
        </div>
      </div>
      
      <!-- Cloud返回的密文结果展示框 -->
      <div class="result-section" v-if="cloudCiphertextResult">
        <h3>Cloud 返回的密文结果</h3>
        <div class="cloud-result-box">
          <pre class="ciphertext-content">{{ cloudCiphertextResult?.content_base64 || '' }}</pre>
          <div class="ciphertext-footer">长度: {{ cloudCiphertextResult?.content_length || 0 }}</div>
        </div>
      </div>
      
      <!-- 解密后结果展示框 -->
      <div class="result-section" v-if="decryptedResult">
        <h3>解密后结果</h3>
        <div class="decrypted-result-box">
          <div class="result-label">运算类型: {{ operation === 'add' ? '加法' : operation === 'mul' ? '乘法' : '减法' }}</div>
          <div class="result-array">[ {{ decryptedResult && Array.isArray(decryptedResult) ? decryptedResult.join(', ') : '' }} ]</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'HomomorphicEncryptionTransfer',
  data() {
    return {
      isP1Focused: false,
      isP2Focused: false,
      p1: '',
      p2: '',
      operation: 'add',
      encryptionScheme: 'bfv'
    }
  },
  computed: {
    ...mapState('homomorphicEncryption', ['loading']),
    ...mapGetters('homomorphicEncryption', ['integerSequenceCiphertexts', 'cloudCiphertextResult', 'decryptedResult'])
  },
  mounted() {
    // 从Vuex恢复状态
    const params = this.$store.state.homomorphicEncryption.encryptionParams;
    if (params) {
      this.p1 = params.p1 || '';
      this.p2 = params.p2 || '';
      this.operation = params.operation || 'add';
      this.encryptionScheme = params.encryptionScheme || 'bfv';
    }
  },
  watch: {
    // 监听Vuex状态变化并同步到本地
    '$store.state.homomorphicEncryption.encryptionParams.p1'(newVal) {
      if (newVal !== this.p1) {
        this.p1 = newVal || '';
      }
    },
    '$store.state.homomorphicEncryption.encryptionParams.p2'(newVal) {
      if (newVal !== this.p2) {
        this.p2 = newVal || '';
      }
    },
    '$store.state.homomorphicEncryption.encryptionParams.operation'(newVal) {
      if (newVal !== this.operation) {
        this.operation = newVal || 'add';
      }
    },
    '$store.state.homomorphicEncryption.encryptionParams.encryptionScheme'(newVal) {
      if (newVal !== this.encryptionScheme) {
        this.encryptionScheme = newVal || 'bfv';
      }
    }
  },
  methods: {
    // 映射Vuex actions
    ...mapActions('homomorphicEncryption', ['updateEncryptionParams', 'saveEncryptionResult', 'setLoading']),
    
    // 更新参数到Vuex
    updateParams(key, value) {
      this.$store.dispatch('homomorphicEncryption/updateEncryptionParams', {
        [key]: value
      });
    },
    
    // 执行同态加密
    performHomomorphicEncryption() {
      // 验证输入
      if (!this.validateInputs()) {
        return;
      }
      
      // 设置加载状态
      this.setLoading(true);
      
      // 发送请求到后端进行同态加密
      fetch('/api-internal/homo/enc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheme: this.encryptionScheme,
          operation: this.operation,
          p1: this.p1,
          p2: this.p2
        })
      })
      .then(response => response.json())
      .then(data => {
        // 验证响应格式
        if (data && data.result && Array.isArray(data.result)) {
          // 保存结果到Vuex
          this.saveEncryptionResult(data);
          this.$message({
            message: '同态加密成功',
            type: 'success'
          });
        } else {
          throw new Error('同态加密结果格式异常');
        }
      })
      .catch(error => {
        console.error('Error performing homomorphic encryption:', error);
        this.$message({
          message: '同态加密失败: ' + error.message,
          type: 'error'
        });
      })
      .finally(() => {
        // 设置加载状态为false
        this.setLoading(false);
      });
    },
    
    // 验证输入
    validateInputs() {
      // 检查p1和p2是否为空
      if (!this.p1 || !this.p2) {
        this.$message({
          message: '请输入完整的整数序列',
          type: 'warning'
        });
        return false;
      }
      
      // 检查p1和p2是否为逗号分隔的数字
      const p1Numbers = this.p1.split(',').map(num => num.trim()).filter(num => num !== '');
      const p2Numbers = this.p2.split(',').map(num => num.trim()).filter(num => num !== '');
      
      // 检查是否所有元素都是数字
      const allNumbers = [...p1Numbers, ...p2Numbers].every(num => !isNaN(num) && isFinite(num));
      if (!allNumbers) {
        this.$message({
          message: '请输入有效的整数序列，仅包含数字和逗号',
          type: 'warning'
        });
        return false;
      }
      
      // 检查p1和p2的长度是否一致
      if (p1Numbers.length !== p2Numbers.length) {
        this.$message({
          message: 'p1和p2的整数序列长度必须一致',
          type: 'warning'
        });
        return false;
      }
      
      return true;
    }
  }
}
</script>

<style scoped>
.homomorphic-encryption-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.encryption-section {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-bottom: 30px;
  text-align: center;
  font-size: 28px;
  color: #1f2937;
}

h2 {
  margin-top: 0;
  color: #333;
  font-size: 22px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e5e7eb;
}

h3 {
  color: #606266;
  margin-bottom: 15px;
  font-size: 18px;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.implementation-note {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
  font-weight: normal;
  display: inline-block;
}

.highlight-library {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.form-row .form-group {
  flex: 1;
  min-width: 300px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  transition: all 0.3s;
  background-color: #fafafa;
}

.form-control:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
  background-color: #ffffff;
}

.input-focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.btn-primary {
  background-color: #1890ff;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.btn-primary:hover:not(:disabled) {
  background-color: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.btn-primary:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.result-section {
  margin-top: 30px;
  margin-bottom: 30px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ciphertext-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.ciphertext-box,
.cloud-result-box,
.decrypted-result-box {
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 15px;
  flex: 1;
  min-width: 400px;
  transition: all 0.3s ease;
}

.ciphertext-box:hover,
.cloud-result-box:hover,
.decrypted-result-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.ciphertext-header,
.result-label {
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.ciphertext-content {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.ciphertext-footer {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.decrypted-result-box {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 1px solid #90caf9;
  text-align: center;
  box-shadow: 0 4px 12px rgba(144, 202, 249, 0.3);
}

.result-label {
  font-size: 16px;
  color: #1565c0;
  margin-bottom: 15px;
}

.result-array {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 24px;
  font-weight: bold;
  color: #0d47a1;
  background: white;
  padding: 20px;
  border-radius: 6px;
  border: 2px solid #64b5f6;
  display: inline-block;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  
  .ciphertext-container {
    flex-direction: column;
  }
  
  .ciphertext-box {
    min-width: 100%;
  }
  
  .result-array {
    font-size: 18px;
    padding: 15px;
  }
}
</style>