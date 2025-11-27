<template>
  <div class="email-alert-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><h2>邮件告警测试</h2></span>
        </div>
      </template>

      <div class="email-test-section">
        <!-- 接口信息展示 -->
        <div class="email-info">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="管理员邮箱">
              240922173@qq.com
            </el-descriptions-item>
            <el-descriptions-item label="客户端邮箱">
              amireuxjoe@163.com
            </el-descriptions-item>
            <el-descriptions-item label="客户端ID">
              999
            </el-descriptions-item>
            <el-descriptions-item label="IP变动信息">
              <div>旧IP: 10.184.118.9</div>
              <div>新IP: 171.218.31.8</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 按钮区域 -->
        <div class="button-container">
          <el-button 
            type="warning" 
            size="large" 
            :loading="sendingToManager" 
            @click="sendEmailToManager"
            :disabled="sendingToManager || sendingToClient"
            style="margin-right: 20px;"
          >
            发送邮件告警至管理员
          </el-button>
          <el-button 
            type="primary" 
            size="large" 
            :loading="sendingToClient" 
            @click="sendEmailToClient"
            :disabled="sendingToManager || sendingToClient"
          >
            发送冻结警告邮件至客户端
          </el-button>
        </div>

        <!-- 结果显示区域 -->
        <div v-if="resultVisible" class="result-section" :class="resultType">
          <div class="result-content">{{ resultMessage }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../../api/request'; // 导入请求拦截器

// 发送状态
const sendingToManager = ref(false);
const sendingToClient = ref(false);

// 结果显示
const resultVisible = ref(false);
const resultType = ref(''); // success, warning, error
const resultMessage = ref('');

// 发送邮件告警至管理员
async function sendEmailToManager() {
  try {
    // 设置发送状态
    sendingToManager.value = true;
    resultVisible.value = false;
    
    // 准备参数
    const params = {
      email_to: '240922173@qq.com',
      client_id: '999',
      old_ip: '10.184.118.9',
      new_ip: '171.218.31.8'
    };
    
    // 调用API发送邮件告警至管理员
    const response = await request.post('/api/v1/utils/client-ip-change/', null, {
      params: params
    });
    
    // 显示成功结果
    resultType.value = 'success';
    resultMessage.value = `邮件告警已成功发送至管理员！`;
    ElMessage.success(resultMessage.value);
    
    console.log('发送管理员邮件成功:', response);
  } catch (error) {
    // 显示错误结果
    resultType.value = 'error';
    resultMessage.value = `发送管理员邮件失败: ${error.message || '未知错误'}`;
    ElMessage.error(resultMessage.value);
    console.error('发送管理员邮件失败:', error);
  } finally {
    // 重置发送状态并显示结果
    sendingToManager.value = false;
    resultVisible.value = true;
  }
}

// 发送冻结警告邮件至客户端
async function sendEmailToClient() {
  try {
    // 设置发送状态
    sendingToClient.value = true;
    resultVisible.value = false;
    
    // 准备参数
    const params = {
      email_to: 'amireuxjoe@163.com'
    };
    
    // 调用API发送冻结警告邮件至客户端
    const response = await request.post('/api/v1/utils/email-to-client/', null, {
      params: params
    });
    
    // 显示成功结果
    resultType.value = 'success';
    resultMessage.value = `冻结警告邮件已成功发送至客户端！`;
    ElMessage.success(resultMessage.value);
    
    console.log('发送客户端邮件成功:', response);
  } catch (error) {
    // 显示错误结果
    resultType.value = 'error';
    resultMessage.value = `发送客户端邮件失败: ${error.message || '未知错误'}`;
    ElMessage.error(resultMessage.value);
    console.error('发送客户端邮件失败:', error);
  } finally {
    // 重置发送状态并显示结果
    sendingToClient.value = false;
    resultVisible.value = true;
  }
}
</script>

<style scoped>
.email-alert-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.email-test-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 20px 0;
}

.email-info {
  background-color: #fafafa;
  padding: 10px;
  border-radius: 8px;
}

.button-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  gap: 20px;
}

.result-section {
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.result-section.success {
  background-color: #f0f9eb;
  border: 1px solid #c2e7b0;
  color: #67c23a;
}

.result-section.warning {
  background-color: #fdf6ec;
  border: 1px solid #fcd59e;
  color: #e6a23c;
}

.result-section.error {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  color: #f56c6c;
}

.result-content {
  font-size: 14px;
  line-height: 1.5;
}
</style>