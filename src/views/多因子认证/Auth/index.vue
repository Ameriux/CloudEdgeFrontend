<template>
  <div class="mfa-auth-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><h2>认证流程</h2></span>
          <div class="user-actions">
            <span v-if="currentUser" class="current-user">当前用户: {{ currentUser.username }}</span>
            <el-button v-if="!currentUser" type="primary" size="small" @click="showLoginDialog">登录</el-button>
            <el-button v-else type="default" size="small" @click="showLoginDialog">切换用户</el-button>
            <el-button v-if="currentUser && currentUser.isSuperuser" type="primary" size="small" @click="showAddUserDialog">添加用户</el-button>
          </div>
        </div>
      </template>

      <!-- 步骤条 -->
      <el-steps :active="activeStep" finish-status="success" class="mfa-steps" @change="handleStepChange">
        <el-step title="创建Client用户" description="编辑Client配置并创建用户"></el-step>
        <el-step title="获取并注册因子" description="获取并注册Client用户的因子"></el-step>
        <el-step title="完善配置" description="根据生成的C0和T完善客户端的config.json"></el-step>
        <el-step title="开始上传" description=""></el-step>
      </el-steps>

      <!-- 步骤内容 -->
      <div class="step-content" v-if="activeStep === 0">
        <div class="admin-instruction-card">
          请编辑Client配置（包括authClientIDStr_/DeviceAccount_/DevicePassword_），编辑好后使用管理员账号创建Client用户
        </div>
        <el-form ref="authForm" :model="authData" label-width="180px" class="auth-form">
          <el-form-item label="认证配置" class="form-title">
            <span class="title-text">认证配置</span>
          </el-form-item>

          <el-form-item label="authClientIDStr_">
            <el-input v-model="authData.authClientIDStr_"></el-input>
          </el-form-item>

          <el-form-item label="esp32Url_">
            <el-input v-model="authData.esp32Url_"></el-input>
          </el-form-item>

          <el-form-item label="esp32MACGenPath_">
            <el-input v-model="authData.esp32MACGenPath_"></el-input>
          </el-form-item>

          <el-form-item label="esp32MACVerifyPath_">
            <el-input v-model="authData.esp32MACVerifyPath_"></el-input>
          </el-form-item>

          <el-form-item label="esp32MACRegisterPath_">
            <el-input v-model="authData.esp32MACRegisterPath_"></el-input>
          </el-form-item>

          <el-form-item label="MFAUrl_">
            <el-input v-model="authData.MFAUrl_"></el-input>
          </el-form-item>

          <el-form-item label="MFALoginPath_">
            <el-input v-model="authData.MFALoginPath_"></el-input>
          </el-form-item>

          <el-form-item label="MFAAuthPath_">
            <el-input v-model="authData.MFAAuthPath_"></el-input>
          </el-form-item>

          <el-form-item label="MFAVerifyPath_">
            <el-input v-model="authData.MFAVerifyPath_"></el-input>
          </el-form-item>

          <el-form-item label="PufMacC0_">
            <el-input v-model="authData.PufMacC0_"></el-input>
          </el-form-item>

          <el-form-item label="PufMacT_">
            <el-input v-model="authData.PufMacT_"></el-input>
          </el-form-item>

          <el-form-item label="DeviceAccount_">
            <el-input v-model="authData.DeviceAccount_"></el-input>
          </el-form-item>

          <el-form-item label="DevicePassword_">
            <el-input v-model="authData.DevicePassword_" type="password"></el-input>
          </el-form-item>

          <el-form-item class="form-footer">
            <div class="button-group">
              <el-button type="primary" @click="submitConfig">提交配置</el-button>
              <el-button @click="goToNextStep">下一步</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="step-content" v-else-if="activeStep === 1">
        <el-card class="admin-instruction-card">
          <p>请登录已注册的Client用户，点击获取因素按钮，待生成register.json文件后登录<span class="red-text">管理员账号</span>进行因子注册</p>
        </el-card>

        <!-- 获取因子按钮 -->
        <div class="get-factor-button-container">
          <el-button type="primary" @click="getRegisterJson" :loading="gettingRegisterJson">获取因子</el-button>
        </div>

        <!-- register.json展示框 -->
        <el-card v-if="showRegisterJson" class="json-display-card">
          <div class="json-header">
            <span>register.json</span>
          </div>
          <pre class="json-content">{{ registerJsonContent }}</pre>
        </el-card>

        <!-- 用户列表（仅管理员可见） -->
        <el-card v-if="currentUser && currentUser.isSuperuser" class="user-list-card">
          <template #header>
            <div class="card-header-title">用户列表</div>
          </template>
          <el-table :data="userList" style="width: 100%">
            <el-table-column label="序号" min-width="80">
              <template #default="scope">
                <div style="display: flex; align-items: center;">
                  <span>{{ scope.$index + 1 }}</span>
                  <el-tag v-if="isCurrentUser(scope.row)" type="success" size="small" style="margin-left: 5px;">
                    当前
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="email" label="Email" min-width="200"></el-table-column>
            <el-table-column prop="permission" label="权限" min-width="200"></el-table-column>
            <el-table-column prop="status" label="状态" min-width="120">
              <template #default="scope">
                <el-tag
                  :type="getStatusTagType(scope.row.status)"
                  :effect="getStatusTagEffect(scope.row.status)"
                >
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleRegisterFactor(scope.row)">注册因子</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 下一步按钮（仅管理员可见） -->
        <div v-if="currentUser && currentUser.isSuperuser" class="next-button-container">
          <el-button type="primary" @click="goToNextStep">下一步</el-button>
        </div>
      </div>

      <div class="step-content" v-else-if="activeStep === 2">
        <el-card class="admin-instruction-card">
          <p>下方是本次认证设备的认证因素，请复制puf_mac中的C0和T值完善config.json配置文件</p>
        </el-card>

        <!-- 认证数据卡片展示 -->
        <div class="data-cards-container">
          <el-card v-for="item in itemsData" :key="item.id" class="data-card">
            <template #header>
              <div class="card-header-title">{{ item.title || '数据项' }}</div>
            </template>
            <!-- 显示描述 -->
            <div v-if="item.description" class="card-description">
              {{ item.description || 'No description' }}
            </div>
            <!-- 直接展示content内容 -->
            <div class="card-content">
              <pre>{{ item.content || JSON.stringify(item, null, 2) }}</pre>
            </div>
          </el-card>
          <div v-if="itemsData.length === 0" class="no-data">
            {{ loadingItems ? '加载中...' : '暂无数据' }}
          </div>
        </div>

        <!-- 认证配置表 -->
        <el-form ref="step3AuthForm" :model="step3AuthData" label-width="180px" class="auth-form">
          <el-form-item label="认证配置" class="form-title">
            <span class="title-text">认证配置</span>
          </el-form-item>

          <el-form-item label="authClientIDStr_">
            <el-input v-model="step3AuthData.authClientIDStr_"></el-input>
          </el-form-item>

          <el-form-item label="esp32Url_">
            <el-input v-model="step3AuthData.esp32Url_"></el-input>
          </el-form-item>

          <el-form-item label="esp32MACGenPath_">
            <el-input v-model="step3AuthData.esp32MACGenPath_"></el-input>
          </el-form-item>

          <el-form-item label="esp32MACVerifyPath_">
            <el-input v-model="step3AuthData.esp32MACVerifyPath_"></el-input>
          </el-form-item>

          <el-form-item label="esp32MACRegisterPath_">
            <el-input v-model="step3AuthData.esp32MACRegisterPath_"></el-input>
          </el-form-item>

          <el-form-item label="MFAUrl_">
            <el-input v-model="step3AuthData.MFAUrl_"></el-input>
          </el-form-item>

          <el-form-item label="MFALoginPath_">
            <el-input v-model="step3AuthData.MFALoginPath_"></el-input>
          </el-form-item>

          <el-form-item label="MFAAuthPath_">
            <el-input v-model="step3AuthData.MFAAuthPath_"></el-input>
          </el-form-item>

          <el-form-item label="MFAVerifyPath_">
            <el-input v-model="step3AuthData.MFAVerifyPath_"></el-input>
          </el-form-item>

          <el-form-item label="PufMacC0_">
            <el-input v-model="step3AuthData.PufMacC0_"></el-input>
          </el-form-item>

          <el-form-item label="PufMacT_">
            <el-input v-model="step3AuthData.PufMacT_"></el-input>
          </el-form-item>

          <el-form-item label="DeviceAccount_">
            <el-input v-model="step3AuthData.DeviceAccount_"></el-input>
          </el-form-item>

          <el-form-item label="DevicePassword_">
            <el-input v-model="step3AuthData.DevicePassword_" type="password"></el-input>
          </el-form-item>

          <el-form-item class="form-footer">
            <div class="button-group">
              <el-button type="primary" @click="submitStep3Config">提交配置</el-button>
              <el-button type="primary" @click="goToNextStep">下一步</el-button>
            </div>
          </el-form-item>
        </el-form>

      </div>

      <div class="step-content" v-else-if="activeStep === 3">
        <el-card class="admin-instruction-card">
          <p>选择文件并上传，上传过程中可以查看客户端和服务器日志</p>
        </el-card>

        <!-- 选择文件按钮 -->
        <div class="file-select-button-container">
          <el-button type="primary" @click="showFileSelectDialog">选择文件</el-button>
        </div>

        <!-- 文件预览列表 -->
        <el-card v-if="selectedFiles.length > 0" class="file-preview-card">
          <template #header>
            <div class="card-header-title">已选择的文件</div>
          </template>
          <el-table :data="selectedFiles" style="width: 100%">
            <el-table-column prop="path" label="文件路径" min-width="400"></el-table-column>
            <el-table-column prop="size" label="文件大小" min-width="120">
              <template #default="scope">
                {{ formatFileSize(scope.row.size) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="80" fixed="right">
              <template #default="scope">
                <el-button type="danger" size="small" @click="removeFile(scope.row.name)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 上传文件按钮 -->
        <div class="upload-button-container">
          <el-button 
            type="primary" 
            @click="uploadFiles" 
            :disabled="selectedFiles.length === 0 || uploading"
            :loading="uploading"
          >
            {{ uploading ? '上传中...' : '上传文件' }}
          </el-button>
        </div>

        <!-- 日志展示区域 -->
        <div class="logs-container">
          <el-card class="log-card">
            <template #header>
              <div class="card-header-title">Client日志</div>
            </template>
            <div class="log-output">
              <el-input
                ref="clientLogContainer"
                type="textarea"
                :rows="10"
                v-model="clientLogs"
                readonly
                placeholder="Client日志将显示在这里"
              ></el-input>
            </div>
          </el-card>
          <el-card class="log-card">
            <template #header>
              <div class="card-header-title">EdgeServer日志</div>
            </template>
            <div class="log-output">
              <el-input
                ref="edgeServerLogContainer"
                type="textarea"
                :rows="10"
                v-model="edgeServerLogs"
                readonly
                placeholder="EdgeServer日志将显示在这里"
              ></el-input>
            </div>
          </el-card>
        </div>

        <!-- 完成流程按钮 -->
        <div class="next-button-container">
          <el-button type="primary" @click="finishFlow">完成流程</el-button>
        </div>

        <!-- 选择文件弹窗 -->
        <el-dialog v-model="fileSelectDialogVisible" title="选择文件" width="60%">
          <div class="file-select-container">
            <div class="search-container">
              <el-input 
                v-model="fileSearchKeyword" 
                placeholder="搜索文件名"
                clearable
                prefix-icon="el-icon-search"
                style="width: 100%"
              ></el-input>
            </div>
            <el-table 
              :data="filteredFiles" 
              style="width: 100%" 
              @row-click="selectFile"
              :loading="loadingFiles"
              row-key="name"
            >
              <el-table-column prop="name" label="文件名" min-width="300"></el-table-column>
              <el-table-column prop="size" label="文件大小" min-width="120">
                <template #default="scope">
                  {{ formatFileSize(scope.row.size) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="fileSelectDialogVisible = false">取消</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </el-card>

    <!-- 登录弹窗 -->
    <el-dialog v-model="loginDialogVisible" title="登录" width="400px">
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        label-width="80px" 
        :rules="loginRules" 
        class="login-form"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
            clearable
          ></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            clearable
          ></el-input>
        </el-form-item>
        
        <el-form-item v-if="loginErrorMsg" class="error-message">
          <div class="error-tip">{{ loginErrorMsg }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="loginDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleLogin"
            :loading="loginLoading"
            :disabled="loginLoading"
          >
            {{ loginLoading ? '登录中...' : '登录' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 注册因子弹窗 -->
    <el-dialog
      v-model="registerFactorDialogVisible"
      title="注册因子"
      width="60%"
    >
      <template #header>
        <div class="dialog-header">
          <span>注册因子 - {{ currentFactorUser?.email || '' }}</span>
        </div>
      </template>
      <div class="register-factor-container">
        <el-input
          v-model="factorContent"
          type="textarea"
          :rows="15"
          placeholder="请输入导出的因素内容（JSON格式）"
          class="factor-content-input"
        ></el-input>
        <div class="factor-example-container">
          <el-button type="text" @click="showFactorExample = !showFactorExample">
            {{ showFactorExample ? '隐藏示例' : '显示示例' }}
          </el-button>
          <div v-if="showFactorExample" class="factor-example-content">
            <pre>{{ factorExample }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelRegisterFactor">取消</el-button>
          <el-button type="primary" @click="handleConfirmRegisterFactor">确认注册</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加用户弹窗 -->
    <el-dialog v-model="addUserDialogVisible" title="添加用户" width="500px">
      <el-form ref="addUserFormRef" :model="addUserForm" :rules="addUserRules" label-width="100px" class="add-user-form" label-position="top">
        <el-form-item label="Email" prop="email">
          <el-input v-model="addUserForm.email" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="设备ID" prop="deviceId">
          <el-input v-model="addUserForm.deviceId" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addUserForm.password" type="password" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="addUserForm.confirmPassword" type="password" autocomplete="off"></el-input>
        </el-form-item>
        <div>
          <el-checkbox v-model="addUserForm.isSuperuser" label="设为超级用户" size="large" />
          <el-checkbox v-model="addUserForm.isActive" label="激活" size="large" />
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelAddUser">取消</el-button>
          <el-button type="primary" @click="handleAddUser">添加</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import request, { apiGateway } from '../../../api/request';
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatError, logError } from '../../../utils/errorFormatter';

const store = useStore();

// 步骤状态，从localStorage恢复或默认为0
const activeStep = ref(parseInt(localStorage.getItem('mfaAuthStep') || '0'));

// 当前登录用户
const currentUser = ref(JSON.parse(localStorage.getItem('mfaCurrentUser')) || null);

// 登录弹窗相关
const loginDialogVisible = ref(false);
const loginForm = ref({
  username: '',
  password: ''
});
const loginFormRef = ref(null);
const loginLoading = ref(false);
const loginErrorMsg = ref('');

// register.json相关
const showRegisterJson = ref(false);
const registerJsonContent = ref('');
const gettingRegisterJson = ref(false);

// 用户列表相关
const userList = ref([]);
const loadingUsers = ref(false);

// 登录表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
};

// 添加用户弹窗相关
const addUserDialogVisible = ref(false);
const addUserForm = ref({
  email: '',
  deviceId: '',
  password: '',
  confirmPassword: '',
  isSuperuser: false,
  isActive: true
});
const addUserFormRef = ref(null);

// 添加用户表单验证规则
const addUserRules = {
  email: [
    { required: true, message: '请输入Email', trigger: 'blur' },
    { type: 'email', message: '请输入有效的Email地址', trigger: 'blur' }
  ],
  deviceId: [
    { required: true, message: '请输入设备ID', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请确认密码'));
        } else if (value !== addUserForm.value.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 认证数据
const authData = ref({
  authClientIDStr_: "",
  esp32Url_: "",
  esp32MACGenPath_: "",
  esp32MACVerifyPath_: "",
  esp32MACRegisterPath_: "",
  MFAUrl_: "",
  MFALoginPath_: "",
  MFAAuthPath_: "",
  MFAVerifyPath_: "",
  PufMacC0_: "",
  PufMacT_: "",
  DeviceAccount_: "",
  DevicePassword_: ""
});

// 步骤3的认证数据
const step3AuthData = ref({
  authClientIDStr_: "",
  esp32Url_: "",
  esp32MACGenPath_: "",
  esp32MACVerifyPath_: "",
  esp32MACRegisterPath_: "",
  MFAUrl_: "",
  MFALoginPath_: "",
  MFAAuthPath_: "",
  MFAVerifyPath_: "",
  PufMacC0_: "",
  PufMacT_: "",
  DeviceAccount_: "",
  DevicePassword_: ""
});

// 加载状态
const loading = ref(false);

// 从API获取可下载的文件列表
const fetchAvailableFiles = async () => {
  try {
    loadingFiles.value = true;
    // 确保availableFiles初始化为空数组
    availableFiles.value = [];
    
    // 使用代理路径调用API网关
    const fetchResponse = await fetch('/api-gateway/api/downloadable-files');
    
    console.log('API响应状态:', fetchResponse.status);
    console.log('API响应内容类型:', fetchResponse.headers.get('content-type'));
    
    // 检查响应状态是否成功
    if (!fetchResponse.ok) {
      console.warn('API返回非成功状态码:', fetchResponse.status);
      // 尝试获取错误详情
      let errorText = '';
      try {
        errorText = await fetchResponse.text();
        console.log('错误响应内容:', errorText.substring(0, 500)); // 只显示前500个字符
      } catch (innerError) {
        console.warn('无法解析错误响应:', innerError);
      }
      ElMessage.error('获取文件列表失败，请重试');
      return;
    }
    
    // 检查内容类型是否为JSON
    const contentType = fetchResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('API返回的不是JSON格式数据，内容类型:', contentType);
      // 尝试获取原始内容，但不解析为JSON
      let rawContent = '';
      try {
        rawContent = await fetchResponse.text();
        console.log('非JSON响应内容:', rawContent.substring(0, 500)); // 只显示前500个字符
      } catch (innerError) {
        console.warn('无法获取原始响应内容:', innerError);
      }
      ElMessage.error('获取文件列表失败，返回格式错误');
      return;
    }
    
    // 尝试解析JSON数据
    let response;
    try {
      response = await fetchResponse.json();
    } catch (jsonError) {
      console.error('JSON解析失败:', jsonError);
      ElMessage.error('获取文件列表失败，数据格式错误');
      return;
    }
    
    console.log('获取到的文件列表响应(原始):', response);
    
    // 确保availableFiles.value始终是一个数组，并且每个文件对象都有name和size字段
    let fileList = [];
    
    // 直接检查response是否包含files数组
    if (response && response.files && Array.isArray(response.files)) {
      console.log('检测到files数组，长度:', response.files.length);
      
      // 直接从response.files中提取数据
      fileList = response.files.map((file) => {
        console.log('处理文件:', file);
        // 确保正确获取name和size属性
        return {
          name: file.name || 'unknown',
          size: file.size || 0,
          originalData: file
        };
      });
    }
    
    // 如果API没有返回实际文件，保持fileList为空数组
    if (fileList.length === 0) {
      console.log('API未返回有效文件列表，设置为空数组');
    }
    
    availableFiles.value = fileList;
    console.log('最终的文件列表:', availableFiles.value);
    
    // 如果没有文件，显示提示信息
    if (availableFiles.value.length === 0) {
      ElMessage.info('暂无可用文件');
    }
  } catch (error) {
    console.error('获取可下载文件列表失败:', error);
    ElMessage.error('获取文件列表失败，请重试');
    // 出错时确保availableFiles.value是一个空数组
    availableFiles.value = [];
  } finally {
    loadingFiles.value = false;
  }
};

// 从API获取配置数据
const fetchConfigData = async () => {
  try {
    loading.value = true;
    console.log('正在获取配置数据...');
    const response = await apiGateway.get('/api/config');
    console.log('获取到配置数据:', response);
    
    // 保存到Vuex
    store.commit('config/setConfig', response);
    
    // 更新authData和step3AuthData
    if (response.Auth) {
      authData.value = response.Auth;
      step3AuthData.value = { ...response.Auth };
    }
  } catch (error) {
    console.error('获取配置数据时出错:', error);
    ElMessage.error('获取配置数据失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 加载状态
const loadingItems = ref(false);

// 从API获取的数据
const itemsData = ref([]);

// 文件选择相关
const fileSelectDialogVisible = ref(false);
const availableFiles = ref([]);
const selectedFiles = ref([]);
const loadingFiles = ref(false);
const fileSearchKeyword = ref('');
const uploading = ref(false);

// 日志相关
const clientLogs = ref('');
const edgeServerLogs = ref('');
const clientLogContainer = ref(null);
const edgeServerLogContainer = ref(null);

// 过滤文件列表
const filteredFiles = computed(() => {
  if (!fileSearchKeyword.value.trim()) {
    return availableFiles.value;
  }
  const keyword = fileSearchKeyword.value.toLowerCase();
  return availableFiles.value.filter(file => 
    file.name.toLowerCase().includes(keyword)
  );
});

// 组件挂载时获取配置数据和用户列表
onMounted(() => {
  // 无论当前是哪个步骤，都获取配置数据，确保authData和step3AuthData都有值
  fetchConfigData();
  
  // 显式地从localStorage重新获取用户信息，确保页面刷新后也能正确显示登录状态
  const savedUser = localStorage.getItem('mfaCurrentUser');
  if (savedUser) {
    try {
      currentUser.value = JSON.parse(savedUser);
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  
  // 检查是否有保存的登录用户，如果是管理员则刷新用户列表
  if (currentUser.value && currentUser.value.isSuperuser) {
    fetchUsers();
  }
});

// 处理步骤切换
const handleStepChange = (index) => {
  activeStep.value = index;
  // 保存到localStorage
  localStorage.setItem('mfaAuthStep', index.toString());
  // 当切换到第三步时，获取数据
  if (index === 2) {
    fetchItemsData();
    // 切换到步骤2时，也获取配置数据，确保step3AuthData有值
    fetchConfigData();
  }
  // 当切换到第一步时，获取配置数据
  if (index === 0) {
    fetchConfigData();
  }
};

// 获取register.json内容
const getRegisterJson = async () => {
  try {
    // 设置加载状态
    gettingRegisterJson.value = true;
    
    // 清除之前可能的错误信息和内容
    registerJsonContent.value = '';
    showRegisterJson.value = false;
    
    // 第一步：调用DEBEClient -r接口执行命令
    console.log('开始调用/api/debeclient/register接口执行DEBEClient -r命令');
    
    try {
      const debeclientResponse = await apiGateway.post('/api/debeclient/register');
      console.log('DEBEClient -r命令执行结果:', debeclientResponse);
      
      // 检查命令执行是否成功
      if (!debeclientResponse) {
        throw new Error('未收到DEBEClient -r命令执行响应');
      }
      
      // 检查不同格式的响应状态
      const isSuccess = debeclientResponse.status === 'success' || 
                        debeclientResponse.data?.status === 'success' ||
                        debeclientResponse.success === true;
      
      if (!isSuccess) {
        const errorMessage = debeclientResponse.message || 
                            debeclientResponse.data?.message || 
                            'DEBEClient -r命令执行失败';
        throw new Error(`DEBEClient -r命令执行失败: ${errorMessage}`);
      }
      
      ElMessage.info('DEBEClient -r命令执行成功');
    } catch (debeclientError) {
      console.error('DEBEClient -r命令执行错误:', debeclientError);
      ElMessage.error(`执行DEBEClient -r命令失败: ${debeclientError.message || '未知错误'}`);
      throw debeclientError; // 重新抛出错误以中断整个流程
    }
    
    // 短暂延迟确保文件已生成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 第二步：通过/api/register接口获取register.json的数据
    console.log('开始获取register.json文件内容');
    
    try {
      const registerResponse = await apiGateway.get('/api/register');
      console.log('通过/api/register获取数据成功:', registerResponse);
      
      // 尝试获取完整的JSON内容
      let jsonData;
      if (registerResponse.data && typeof registerResponse.data === 'object') {
        jsonData = registerResponse.data;
      } else if (registerResponse && typeof registerResponse === 'object') {
        jsonData = registerResponse;
      } else {
        // 如果返回的是字符串，尝试解析
        try {
          jsonData = JSON.parse(registerResponse);
        } catch (e) {
          jsonData = { message: '获取成功但无法解析JSON' };
        }
      }
      
      // 检查是否成功获取到文件内容
      if (!jsonData || Object.keys(jsonData).length === 0) {
        throw new Error('register.json文件内容为空');
      }
      
      registerJsonContent.value = JSON.stringify(jsonData, null, 2);
      showRegisterJson.value = true;
      
      // 如果用户已登录管理员账号，刷新用户列表
      if (currentUser.value && currentUser.value.isSuperuser) {
        fetchUsers();
      }
      
      ElMessage.success('获取register.json成功');
    } catch (registerError) {
      console.error('获取register.json文件错误:', registerError);
      ElMessage.error(`获取register.json文件失败: ${registerError.message || '文件可能不存在或格式错误'}`);
      throw registerError;
    }
  } catch (error) {
    console.error('获取因子流程失败:', error);
    // 最高级别的错误处理，确保用户知道流程已中断
    if (!error.handled) {
      // 防止重复显示错误消息
      ElMessage.error('获取因子失败，请检查网络连接和服务状态后重试');
    }
  } finally {
    // 确保无论成功失败都清除加载状态
    gettingRegisterJson.value = false;
  }
};

// 获取用户列表
const fetchUsers = async () => {
  try {
    loadingUsers.value = true;
    if (currentUser.value && currentUser.value.isSuperuser) {
      // 超级用户可以获取所有用户信息
      // 获取MFA特定的token
      const mfaToken = localStorage.getItem('mfa_access_token');
      
      const response = await request.get('/api/v1/users/', {
        headers: {
          Authorization: `Bearer ${mfaToken}`
        }
      });
      
      // 根据实际API返回格式解析数据
      let users = [];
      if (response && response.data && Array.isArray(response.data.data)) {
        // 解析API返回的数据
        users = response.data.data.map(user => ({
          id: user.id,
          email: user.email,
          permission: user.is_superuser ? '超级用户' : '普通用户',
          status: user.is_active ? '已激活' : '未激活',
          userName: user.full_name || user.email.split('@')[0]
        }));
      } else if (response && Array.isArray(response.data)) {
        // 兼容旧格式
        users = response.data.map(user => ({
          id: user.id,
          email: user.email,
          permission: user.is_superuser ? '超级用户' : '普通用户',
          status: user.is_active ? '已激活' : '未激活',
          userName: user.full_name || user.email.split('@')[0]
        }));
      }
      
      userList.value = users;
    } else {
      // 普通用户只能获取自己的信息
      const response = await request.get('/api/v1/users/me');
      
      if (response && response.data) {
        const user = response.data;
        userList.value = [{
          id: user.id,
          email: user.email,
          permission: user.is_superuser ? '超级用户' : '普通用户',
          status: user.is_active ? '已激活' : '未激活',
          userName: user.full_name || user.email.split('@')[0]
        }];
      }
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
  } finally {
    loadingUsers.value = false;
  }
};

// 判断是否为当前登录用户
const isCurrentUser = (user) => {
  return currentUser.value && currentUser.value.id === user.id;
};

// 根据状态获取标签类型
const getStatusTagType = (status) => {
  switch (status) {
    case '已注册':
      return 'info';
    case '未注册':
      return 'default';
    case '未认证':
      return 'warning';
    case 'token可用':
      return 'success';
    case 'token过期':
      return 'danger';
    default:
      return 'default';
  }
};

// 根据状态获取标签效果
const getStatusTagEffect = (status) => {
  return status === 'token过期' ? 'dark' : 'light';
};

// 处理注册因子
const handleRegisterFactor = (user) => {
  console.log('处理注册因子:', user);
  // 调用注册因子API
  // 这里可以直接复用Device/index.vue中的实现逻辑
  // 打开注册因子对话框
  registerFactorDialogVisible.value = true;
  currentFactorUser.value = user;
  factorContent.value = '';
};

// 注册因子对话框相关
const registerFactorDialogVisible = ref(false);
const currentFactorUser = ref(null);
const factorContent = ref('');
// 控制是否显示示例
const showFactorExample = ref(false);

const factorExample = `{\n  "email": "test2@qq.com",\n  "password": "testtest",\n  "client_id": "2",\n  "client_secret": "34e652f36934b386acb1453d27ab241d",\n  "factors": [\n    {\n      "type": "device_firmware",\n      "content": "{\"algorithm\":\"SHA256\",\"hash\":\"fdc8ccdba5e55f635890a598f1071d750f7972e7cacff3eeaa5134ac73ad0fd2\",\"items\":[{\"content\":\"2\",\"name\":\"CPUCores\"},{\"content\":\"GenuineIntel\",\"name\":\"CPUID\"},{\"content\":\"ebef0c17d7bc4c61912349848b9f1c60\\n\",\"name\":\"SystemID\"},{\"content\":\"ubuntu\",\"name\":\"MachineName\"}],\"key\":\"2\"}"\n    },\n    {\n      "type": "puf_mac",\n      "content": "{\"C0\":\"b383eeb04ad8b3f3d3f12ae705f5bbaf\",\"T\":\"418808e0ab132719de68b9a707aa16ab636fb99126a5cbb8900b67e7ca964b82\",\"puf\":\"268a2af085210317dd4c41e8a3e247cf\"}"\n    }\n  ]\n}`;

// 处理确认注册因子
const handleConfirmRegisterFactor = async () => {
  try {
    if (!factorContent.value.trim()) {
      ElMessage.warning('请输入导出的因素');
      return;
    }
    
    // 解析JSON内容
    let factorData;
    try {
      // 尝试直接解析
      factorData = JSON.parse(factorContent.value);
    } catch (error) {
      try {
        // 尝试处理转义字符问题
        // 先替换所有的\\n为\n，然后再替换所有的\\"为"
        const processedContent = factorContent.value
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
        factorData = JSON.parse(processedContent);
      } catch (secondError) {
        ElMessage.error('请输入有效的JSON格式内容');
        console.error('JSON解析失败:', error, '; 二次尝试解析失败:', secondError);
        return;
      }
    }
    
    // 调用注册因素API
    // 获取MFA特定的token用于授权
    const mfaToken = localStorage.getItem('mfa_access_token');
    const headers = {};
    if (mfaToken) {
      headers.Authorization = `Bearer ${mfaToken}`;
    }
    
    console.log('开始调用/api/v1/mfa/register接口注册因子');
    const response = await request.post('/api/v1/mfa/register', factorData, { headers });
    
    console.log('因子注册API响应:', response);
    
    // 关闭对话框
    registerFactorDialogVisible.value = false;
    
    // 显示成功消息
    // 适配不同的响应格式
    let successMessage = '因子注册成功';
    if (response && response.data) {
      if (response.data.msg) {
        successMessage = response.data.msg;
      } else if (response.data.message) {
        successMessage = response.data.message;
      } else if (typeof response.data === 'string') {
        successMessage = response.data;
      }
    } else if (response && typeof response === 'string') {
      successMessage = response;
    }
    ElMessage.success(successMessage);
    
    // 刷新用户列表
    fetchUsers();
    
  } catch (error) {
    // 显示错误消息
    let errorMessage = '未知错误';
    if (error.response) {
      errorMessage = error.response.data?.msg || error.response.data?.message || error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    ElMessage.error(`因子注册失败: ${errorMessage}`);
    console.error('因子注册失败:', error);
  }
};

// 处理取消注册因子
const handleCancelRegisterFactor = () => {
  // 关闭对话框
  registerFactorDialogVisible.value = false;
};

// 复制到剪贴板功能已移除，根据用户需求不提供复制按钮

// 获取items数据
const fetchItemsData = async () => {
  try {
    loadingItems.value = true;
    console.log('正在获取items数据...');
    
    // 构建请求头，使用MFA特定的token
    const headers = {};
    const mfaToken = localStorage.getItem('mfa_access_token');
    if (mfaToken) {
      headers.Authorization = `Bearer ${mfaToken}`;
    }
    
    // 修复接口调用问题：使用正确的API路径
    const data = await request.get('/api/v1/items/', { headers });
    console.log('获取到items数据:', data);
    
    // 处理数据结构
    let processedItems = [];
    if (data && Array.isArray(data)) {
      console.log('获取到的数据数量:', data.length);
      processedItems = data.map(item => ({
        id: item.id.toString(),
        title: item.title || '未知标题',
        content: item.content || '{}',
        description: item.description,
        owner_id: item.owner_id
      }));
    } else if (data && data.data && Array.isArray(data.data)) {
      console.log('获取到的数据数量:', data.data.length);
      processedItems = data.data.map(item => ({
        id: item.id.toString(),
        title: item.title || '未知标题',
        content: item.content || '{}',
        description: item.description,
        owner_id: item.owner_id
      }));
    } else {
      console.log('数据结构不符合预期，使用模拟数据');
      processedItems = [
        {
          id: '79',
          title: 'device_firmware',
          content: '{"algorithm":"SHA256","hash":"fdc8ccdba5e55f635890a598f1071d750f7972e7cacff3eeaa5134ac73ad0fd2","items":[{"content":"2","name":"CPUCores"},{"content":"GenuineIntel","name":"CPUID"},{"content":"ebef0c17d7bc4c61912349848b9f1c60\n","name":"SystemID"},{"content":"ubuntu","name":"MachineName"}],"key":"2"}',
          description: null,
          owner_id: 2
        },
        {
          id: '80',
          title: 'puf_mac',
          content: '{"C0":"e41509192d491a053b0edac0818658e2","T":"b4359efdb2edab6554caa9fdb5df8f1e1247b406b985455dcf24d1d2ca5215c","puf":"ddd0c515673ee8157f0041fc253a8a32"}',
          description: null,
          owner_id: 2
        }
      ];
    }
    
    // 如果是管理员登录，根据终端ID筛选因子
    if (currentUser.value && currentUser.value.isSuperuser) {
      // 获取authClientIDStr_
      const clientId = authData.value?.authClientIDStr_;
      console.log('管理员模式 - 当前终端ID:', clientId, '类型:', typeof clientId);
      
      if (clientId) {
        // 确保clientId为字符串类型，便于后续比较
        const clientIdStr = String(clientId);
        console.log('转换后的终端ID字符串:', clientIdStr);
        
        // 根据Items界面的逻辑，使用owner_id字段进行匹配
        // 简单直接地筛选拥有者ID等于当前客户端ID的因子
        itemsData.value = processedItems.filter(item => {
          try {
            // 获取因子的owner_id并转换为字符串进行比较
            const ownerIdStr = String(item.owner_id);
            console.log(`因子ID: ${item.id}, 标题: ${item.title}, 拥有者ID: ${item.owner_id}`);
            
            // 直接比较owner_id与clientIdStr
            const match = ownerIdStr === clientIdStr;
            console.log(`因子匹配结果: ${item.title} - ${match}`);
            
            return match;
          } catch (e) {
            // 如果发生错误，记录日志但不影响其他因子的筛选
            console.warn('处理因子时出错:', e, item);
            return false;
          }
        });
        
        console.log(`筛选后的因子数量: ${itemsData.value.length}，客户端ID: ${clientIdStr}`);
        
        // 如果没有找到匹配的因子，显示所有因子并给出提示
        if (itemsData.value.length === 0) {
          console.log('未找到拥有者ID匹配的因子，显示所有因子');
          itemsData.value = processedItems;
        }
      } else {
        console.log('未获取到终端ID，显示所有因子');
        itemsData.value = processedItems;
      }
    } else {
      // 非管理员显示所有因子
      console.log('非管理员模式，显示所有因子');
      itemsData.value = processedItems;
    }
    
    loadingItems.value = false;
  } catch (error) {
    console.error('获取items数据时出错:', error);
    loadingItems.value = false;
    ElMessage.error('获取配置数据失败，请重试');
    // 出错时也提供模拟数据以便展示
    console.log('API调用失败，使用模拟数据');
    itemsData.value = [
    ];
  }
};



// 提交配置
const submitConfig = async () => {
  try {
    loading.value = true;
    console.log('正在提交配置...', authData.value);
    
    // 构造请求体，只包含Auth对象
    const requestBody = {
      Auth: authData.value
    };
    
    const response = await apiGateway.post('/api/config', requestBody);
    console.log('配置提交成功:', response);
    
    // 保存到Vuex
    store.commit('config/updateConfigAuth', authData.value);
    
    // 同步更新步骤3的配置
    step3AuthData.value = { ...authData.value };
    
    ElMessage.success('配置提交成功');
  } catch (error) {
    console.error('提交配置时出错:', error);
    ElMessage.error('配置提交失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 提交步骤3的配置
const submitStep3Config = async () => {
  try {
    loading.value = true;
    console.log('正在提交步骤3配置...', step3AuthData.value);
    
    // 获取完整的配置数据
    const currentConfig = store.getters['config/config'] || {};
    
    // 构造完整的配置请求体，更新Auth部分
    const requestBody = {
      ...currentConfig,
      Auth: step3AuthData.value
    };
    
    const response = await apiGateway.post('/api/config', requestBody);
    console.log('步骤3配置提交成功:', response);
    
    // 保存完整配置到Vuex
    store.commit('config/setConfig', requestBody);
    
    // 同步更新步骤1的配置
    authData.value = { ...step3AuthData.value };
    
    ElMessage.success('配置提交成功');
  } catch (error) {
    console.error('提交步骤3配置时出错:', error);
    ElMessage.error('配置提交失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 进入下一步
const goToNextStep = () => {
  activeStep.value += 1;
  // 保存到localStorage
  localStorage.setItem('mfaAuthStep', activeStep.value.toString());
};

// 完成流程，重置到第一步
const finishFlow = () => {
  activeStep.value = 0;
  // 清除localStorage中的状态
  localStorage.removeItem('mfaAuthStep');
  ElMessage.success('流程已完成，开始新的认证流程');
};

// 显示登录弹窗
const showLoginDialog = () => {
  loginForm.value = {
    username: '',
    password: ''
  };
  loginErrorMsg.value = '';
  loginDialogVisible.value = true;
};

// 显示添加用户弹窗
const showAddUserDialog = () => {
  addUserForm.value = {
    email: '',
    password: '',
    isSuperuser: false
  };
  addUserDialogVisible.value = true;
};

// 处理登录
const handleLogin = async () => {
  loginErrorMsg.value = '';
  
  // 验证表单
  if (loginFormRef.value) {
    try {
      await loginFormRef.value.validate();
      loginLoading.value = true;
      
      // 使用Vuex store处理登录，与Login页面保持一致
      await store.dispatch('auth/login', {
        username: loginForm.value.username,
        password: loginForm.value.password
      });
      
      // 登录成功后，获取Vuex存储的token（login action已将token存入localStorage）
      const accessToken = localStorage.getItem('access_token');
      
      if (accessToken) {
        // 保存独立的MFA token到localStorage
        localStorage.setItem('mfa_access_token', accessToken);
        
        // 获取用户信息
        const userInfo = await request.get('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        currentUser.value = {
          username: userInfo.username || loginForm.value.username,
          isSuperuser: userInfo.is_superuser || false
        };
        
        localStorage.setItem('mfaCurrentUser', JSON.stringify(currentUser.value));
        
        // 关闭弹窗
        loginDialogVisible.value = false;
        
        // 管理员登录后刷新用户列表
        if (currentUser.value && currentUser.value.isSuperuser) {
          await fetchUsers();
        }
        
        ElMessage.success('登录成功');
      } else {
        loginErrorMsg.value = '登录失败，未获取到访问令牌';
      }
    } catch (error) {
      // 使用错误格式化工具处理错误
      loginErrorMsg.value = formatError(error);
      
      // 使用安全的日志打印函数记录错误
      logError('登录失败', error);
    } finally {
      loginLoading.value = false;
    }
  }
};

// 处理取消添加用户
const handleCancelAddUser = () => {
  // 关闭对话框
  addUserDialogVisible.value = false;
};

// 处理添加用户
const handleAddUser = async () => {
  // 验证表单
  if (addUserFormRef.value) {
    try {
      await addUserFormRef.value.validate();
      
      // 获取MFA特定的token
      const mfaToken = localStorage.getItem('mfa_access_token');
      if (!mfaToken) {
        ElMessage.error('请先登录');
        return;
      }
      
      // 构造用户数据
      const userData = {
        email: addUserForm.value.email,
        password: addUserForm.value.password,
        is_active: addUserForm.value.isActive,
        is_superuser: addUserForm.value.isSuperuser,
        full_name: addUserForm.value.email.split('@')[0],
        client_id: addUserForm.value.deviceId
      };
      
      console.log('准备创建用户:', userData);
      
      // 调用添加用户接口，使用MFA特定的token
      const response = await request.post('/api/v1/users/', userData, {
        headers: {
          Authorization: `Bearer ${mfaToken}`
        }
      });
      
      // 关闭对话框
      addUserDialogVisible.value = false;
      
      // 显示成功消息
      ElMessage.success(`用户 ${addUserForm.value.email} 创建成功`);
      
      // 重置表单
      addUserForm.value = {
        email: '',
        deviceId: '',
        password: '',
        confirmPassword: '',
        isSuperuser: false,
        isActive: true
      };
    } catch (error) {
      // 显示错误消息
      if (error.name === 'Error') {
        ElMessage.error(error.message);
      } else {
        console.error('创建用户失败:', error);
        // 错误信息处理
        if (error.response && error.response.status === 422) {
          ElMessage.error('请检查表单数据格式');
        } else if (error.response && error.response.status === 401) {
          ElMessage.error('登录已过期，请重新登录');
          // 清除本地存储的用户信息
          localStorage.removeItem('mfa_access_token');
          localStorage.removeItem('mfaCurrentUser');
          currentUser.value = null;
          // 打开登录弹窗
          showLoginDialog();
        } else if (error.response && error.response.data && error.response.data.detail) {
          ElMessage.error(error.response.data.detail);
        } else {
          ElMessage.error('添加用户失败，请重试');
        }
      }
    }
  }
};

// 显示文件选择弹窗
const showFileSelectDialog = async () => {
  await fetchAvailableFiles();
  fileSelectDialogVisible.value = true;
};

// 选择文件
const selectFile = (file) => {
  console.log('选择的文件:', file);
  // 确保选择的文件对象包含必要的字段
  const fileToAdd = {
    name: file.name || 'unknown',
    size: file.size || 0,
    path: `./${file.name || 'unknown'}`
  };
  
  selectedFiles.value = [fileToAdd]; // 一次只能选择一个文件
  console.log('已选择的文件列表:', selectedFiles.value);
  fileSelectDialogVisible.value = false;
};

// 移除文件
const removeFile = (fileName) => {
  selectedFiles.value = selectedFiles.value.filter(file => file.name !== fileName);
};

// 优化的日志格式化函数
const formatLogSection = (title, content) => {
  const separator = '='.repeat(50);
  return `\n${separator}\n${title}\n${separator}\n${content}\n${separator}\n`;
};

// 客户端状态检查函数
// 返回值: 1=激活, 0=未激活, -1=获取失败
const checkClientStatus = async () => {
  console.log('🔍 checkClientStatus函数开始执行');
  appendToClientLog(`🔍 开始执行客户端状态检查...`);
  
  try {
    // 获取当前登录用户信息
    const currentUserJson = localStorage.getItem('mfaCurrentUser');
    if (!currentUserJson) {
      console.log('⚠️ 未找到当前登录用户信息，跳过状态检查');
      appendToClientLog(`⚠️ 未找到当前登录用户信息，跳过状态检查`);
      return -1;
    }
    
    const currentUserData = JSON.parse(currentUserJson);
    appendToClientLog(`📋 当前登录用户: ${currentUserData.username || '未知'}`);
    
    // 获取配置信息以获取客户端ID
    let clientId = null;
    try {
      console.log('📋 尝试获取客户端ID配置');
      const configResponse = await apiGateway.get('/api/config');
      console.log('📋 配置请求响应类型:', typeof configResponse);
      console.log('📋 配置响应结构:', Object.keys(configResponse || {}));
      
      // 直接从响应中获取Auth对象
      const authConfig = configResponse?.data?.Auth || configResponse?.Auth;
      console.log('📋 Auth配置对象:', authConfig);
      console.log('📋 Auth对象属性:', authConfig ? Object.keys(authConfig) : 'null');
      
      // 简化检查逻辑，确保能获取authClientIDStr_字段
      if (authConfig && authConfig.authClientIDStr_) {
        clientId = authConfig.authClientIDStr_;
        console.log('✅ 获取到客户端ID:', clientId);
        appendToClientLog(`📋 获取到客户端ID: ${clientId}`);
      } else {
        console.log('❌ 配置响应中未找到authClientIDStr_字段');
        appendToClientLog(`⚠️ 配置结构不匹配，找不到客户端ID`);
      }
    } catch (configError) {
      console.error('❌ 获取配置信息失败:', configError);
      appendToClientLog(`⚠️ 获取配置信息失败: ${configError.message}`);
    }
    
    // 根据用户角色选择不同的接口调用方式
    let targetUser = null;
    
    try {
      if (currentUserData.isSuperuser) {
        appendToClientLog(`👑 管理员用户：尝试获取用户信息`);
        
        // 如果有clientId，优先使用GET /api/v1/users/{user_id}接口直接获取特定用户
        if (clientId) {
          appendToClientLog(`🔍 有客户端ID(${clientId})，尝试直接获取对应ID的用户信息`);
          try {
            const userResponse = await request.get(`/api/v1/users/${clientId}`);
            if (userResponse && userResponse.data) {
              targetUser = userResponse.data;
              appendToClientLog(`✅ 直接获取到用户信息: ${targetUser.email}`);
            }
          } catch (userByIdError) {
            console.error(`❌ 通过ID获取用户失败，尝试备用方案:`, userByIdError);
            appendToClientLog(`⚠️ 通过ID获取用户失败: ${userByIdError.message}，使用备用方案`);
          }
        }
        
        // 如果直接获取失败或没有clientId，回退到获取所有用户
        if (!targetUser) {
          appendToClientLog(`🔄 备用方案：获取所有用户信息`);
          // 超级用户可以获取所有用户信息
          const response = await request.get('/api/v1/users/');
          
          let users = [];
          // 根据实际API返回格式解析数据，正确的格式是{ data: [...], count: number }
          if (response && response.data && Array.isArray(response.data.data)) {
            // 解析API返回的数据
            users = response.data.data;
            appendToClientLog(`📋 获取到用户列表，共${users.length}个用户，格式正确`);
          } else if (response && Array.isArray(response.data)) {
            // 兼容旧格式
            users = response.data;
            appendToClientLog(`📋 获取到用户列表，共${users.length}个用户，使用兼容格式`);
          }
          
          // 如果有clientId，查找对应客户端ID的用户
          if (clientId) {
            targetUser = users.find(user => user.client_id === clientId || user.id === parseInt(clientId));
            if (targetUser) {
              appendToClientLog(`✅ 管理员查找到客户端用户: ${targetUser.email}`);
            } else {
              appendToClientLog(`⚠️ 管理员未找到对应客户端ID的用户，使用第一个用户`);
              // 如果找不到，使用第一个用户作为备选
              targetUser = users[0] || null;
            }
          } else {
            // 没有clientId，使用第一个用户
            targetUser = users[0] || null;
            if (targetUser) {
              appendToClientLog(`📋 使用第一个用户信息: ${targetUser.email}`);
            }
          }
        }
      } else {
        // 普通用户只能获取自己的信息
        appendToClientLog(`👤 普通用户：尝试获取当前用户自己的信息`);
        const response = await request.get('/api/v1/users/me');
        
        if (response && response.data) {
          targetUser = response.data;
          appendToClientLog(`✅ 获取当前用户信息成功: ${targetUser.email}`);
        }
      }
    } catch (userError) {
      console.error('❌ 获取用户信息失败:', userError);
      appendToClientLog(`❌ 获取用户信息失败: ${userError.message}`);
      // 即使出错，也尝试获取自己的信息作为备选
      try {
        appendToClientLog(`🔄 尝试备用方案：获取当前用户自己的信息`);
        const response = await request.get('/api/v1/users/me');
        if (response && response.data) {
          targetUser = response.data;
          appendToClientLog(`✅ 备用方案成功: ${targetUser.email}`);
        }
      } catch (meError) {
        appendToClientLog(`❌ 备用方案也失败: ${meError.message}`);
      }
    }
    
    // 检查客户端是否为未激活状态
    if (targetUser) {
      // 增强日志输出，添加更多调试信息
      console.log('📊 目标用户信息:', targetUser);
      console.log('📊 用户ID:', targetUser.id, '客户端ID:', targetUser.client_id);
      console.log('📊 用户激活状态:', targetUser.is_active, typeof targetUser.is_active);
      appendToClientLog(`📊 检查用户激活状态: is_active=${targetUser.is_active}`);
      
      // 确保正确判断激活状态，参考Device/index.vue中的实现方式
      // 明确区分已激活(1)和未激活(0)状态
      const isActive = targetUser.is_active === true || targetUser.is_active === 'true' || targetUser.is_active === 1;
      console.log('📊 标准化后的激活状态:', isActive);
      
      // 返回相应的状态码
      return isActive ? 1 : 0;
    } else {
      appendToClientLog(`⚠️ 未能获取到用户信息，无法进行状态检查`);
      return -1;
    }
  } catch (statusCheckError) {
      console.error('❌ 客户端状态检查过程中发生错误:', statusCheckError);
      appendToClientLog(`❌ 客户端状态检查过程中发生错误: ${statusCheckError.message}`);
      appendToClientLog(`❌ 错误详情: ${JSON.stringify(statusCheckError)}`);
      return -1;
    } finally {
      console.log('✅ 客户端状态检查函数执行完毕');
      appendToClientLog(`🔍 客户端状态检查完成`);
    }
};

// 上传文件
const uploadFiles = async () => {
  console.log('🔄 uploadFiles函数开始执行');
  // 统计信息
  const stats = {
    totalFiles: selectedFiles.value.length,
    successCount: 0,
    failedCount: 0,
    startTime: new Date().toLocaleTimeString(),
    endTime: null
  };
  
  try {
    console.log('🔄 进入try块，开始设置状态');
    uploading.value = true;
    clientLogs.value = '';
    edgeServerLogs.value = '';
    
    // 添加开始上传的总体信息
    appendToClientLog(formatLogSection('开始上传流程', 
      `开始时间: ${stats.startTime}\n` +
      `待上传文件数量: ${stats.totalFiles}\n` +
      `上传目标: /api/debeclient/upload`
    ));
    
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i];
      const fileIndex = i + 1;
      
      // 添加文件上传开始标记
      appendToClientLog(formatLogSection(`文件 ${fileIndex}/${stats.totalFiles}: ${file.name}`, 
        `文件路径: ${file.path}\n文件大小: ${formatFileSize(file.size || 0)}`
      ));
      
      try {
        // 调用正确的上传接口，使用相对路径
        appendToClientLog(`[${new Date().toLocaleTimeString()}] 正在发送上传请求...`);
        const response = await apiGateway.post('/api/debeclient/upload', {
          filePath: file.path
        });
        
        appendToClientLog(`[${new Date().toLocaleTimeString()}] 上传请求成功响应`);
        
        // 将终端日志输出到Client日志
        if (response.data && response.data.terminalOutput) {
          appendToClientLog(formatLogSection('终端日志输出', 
            response.data.terminalOutput.trim()
          ));
        }
        
        // 成功信息
        appendToClientLog(`✅ 文件上传成功: ${file.name}`);
        appendToClientLog(`📋 执行命令: ${response.data?.command || '未知'}`);
        appendToClientLog(`📁 执行目录: ${response.data?.directory || '未知'}`);
        
        stats.successCount++;
        ElMessage.success(`文件 ${file.name} 上传成功`);
        
        
      } catch (error) {
        appendToClientLog(`❌ [${new Date().toLocaleTimeString()}] 上传请求失败: ${error.message}`);
        
        // 增强的终端日志捕获，使用统一的格式
        const terminalLogContent = [];
        
        // 1. 检查响应中的终端输出
        if (error.response?.data?.terminalOutput) {
          terminalLogContent.push(error.response.data.terminalOutput.trim());
        }
        // 2. 检查是否有stderr信息（如SSL连接错误）
        else if (error.response?.data?.stderr) {
          terminalLogContent.push(error.response.data.stderr.trim());
        }
        // 3. 检查错误对象中的其他可能包含日志的字段
        else if (error.response?.data?.error) {
          terminalLogContent.push(error.response.data.error);
        }
        // 4. 检查MFA认证失败等特定错误
        else if (error.response?.data?.message && 
                 (error.response.data.message.includes('MFA') || 
                  error.response.data.message.includes('authentication'))) {
          terminalLogContent.push(error.response.data.message);
        }
        // 5. 添加错误详情和响应数据
        if (error.response?.data) {
          terminalLogContent.push(`响应详情: ${JSON.stringify(error.response.data)}`);
        }
        // 6. 最后添加通用错误信息
        if (terminalLogContent.length === 0) {
          terminalLogContent.push(error.message || 'Unknown error');
        }
        
        // 显示统一格式的终端日志
        appendToClientLog(formatLogSection('终端日志输出', 
          terminalLogContent.join('\n\n')
        ));
        
        // 显示执行信息和错误状态
        appendToClientLog(`📋 执行命令: ${error.response?.data?.command || '未知'}`);
        appendToClientLog(`📁 执行目录: ${error.response?.data?.directory || '未知'}`);
        appendToClientLog(`❌ 上传状态: 失败, 错误: ${error.message}`);
        

        
        stats.failedCount++;
        ElMessage.error(`文件 ${file.name} 上传失败`);
      }
      
      // 无论上传成功还是失败，都获取EdgeServer日志
      appendToEdgeServerLog(formatLogSection(
        `EdgeServer 日志 (文件 ${fileIndex}/${stats.totalFiles})`,
        `获取时间: ${new Date().toLocaleTimeString()}`
      ));
      
      // 使用重试机制获取EdgeServer日志
      await fetchEdgeServerLogs();
    }
    
  } catch (error) {
    console.error('❌ 捕获到上传流程异常:', error);
    appendToClientLog(formatLogSection('上传流程错误', 
      `严重错误: ${error.message}\n` +
      `错误详情: ${JSON.stringify(error)}`
    ));
    ElMessage.error(`上传过程中发生严重错误: ${error.message}`);
  } finally {
    console.log('🔄 进入finally块，重置状态');
    uploading.value = false;
    stats.endTime = new Date().toLocaleTimeString();
    
    // 添加上传总结
    appendToClientLog(formatLogSection('上传流程总结', 
      `开始时间: ${stats.startTime}\n` +
      `结束时间: ${stats.endTime}\n` +
      `总文件数: ${stats.totalFiles}\n` +
      `成功数: ${stats.successCount} ✅\n` +
      `失败数: ${stats.failedCount} ❌\n` +
      `成功率: ${((stats.successCount / stats.totalFiles) * 100).toFixed(1)}%`
    ));
  }
  
  // 移出finally块，确保异步操作能正确执行
  console.log('🔄 finally块执行完毕，准备调用checkClientStatus');
  // 上传进程结束后，调用checkClientStatus函数获取激活状态
  console.log('上传进程结束，调用checkClientStatus函数获取激活状态');
  let statusResult;
  try {
    statusResult = await checkClientStatus();
    console.log('checkClientStatus返回值:', statusResult);
    // 添加额外的调试日志，明确当前判断状态
    if (statusResult === 1) {
      console.log('✅ 客户端状态判断：已激活');
      appendToClientLog(`✅ 客户端状态判断：已激活，无需记录异常日志`);
    } else if (statusResult === 0) {
      console.log('⚠️ 客户端状态判断：未激活');
    } else {
      console.log('❓ 客户端状态判断：未知/获取失败');
      appendToClientLog(`❓ 客户端状态判断：未知/获取失败`);
    }
  } catch (err) {
    console.error('❌ 执行checkClientStatus出错:', err);
    statusResult = -1; // 设置为-1表示获取失败
    appendToClientLog(`❌ 执行checkClientStatus出错: ${err.message}`);
  }
  // 只有在明确判断为未激活状态（返回0）时才记录异常日志
  if (statusResult === 0) {
    // 未激活状态：抛出异常日志，并提示用户，并写入IP.log文件
    appendToClientLog(`⚠️ 检测到当前客户端状态为未激活`);
    
    // 获取用户信息用于日志
    const currentUserJson = localStorage.getItem('mfaCurrentUser');
    let userEmail = '未知用户';
    if (currentUserJson) {
      try {
        const currentUserData = JSON.parse(currentUserJson);
        userEmail = currentUserData.email || '未知用户';
      } catch (e) {}
    }
    
    // 构造标准化的异常日志信息
    const timestamp = new Date().toISOString();
    // 获取客户端ID
    let clientId = authData.authClientIDStr_;
    // 如果form中没有，则尝试通过checkClientStatus函数获取
    if (!clientId) {
      // 这里只是为了获取clientId，不处理返回值
      await checkClientStatus();
      // 再次尝试从配置中获取
      try {
        const configResponse = await apiGateway.get('/api/config');
        const authConfig = configResponse?.data?.Auth || configResponse?.Auth;
        clientId = authConfig?.authClientIDStr_;
      } catch (e) {
        console.warn('获取客户端ID失败:', e);
      }
    }
    
    // 获取IP检测时间
    let detectionTime = '0'; // 默认值，防止API调用失败
    try {
      console.log('开始调用IP检测时间API');
      // 使用request客户端而不是apiGateway客户端，确保正确的基础URL
      const detectionResponse = await request.get('/api/v1/mfa/ip-detection-time');
      console.log('API调用结果:', detectionResponse);
      
      // 注意：request的响应拦截器已经将response.data提取出来返回
      // 所以不需要再访问detectionResponse.data
      
      // 确保detectionResponse存在
      if (detectionResponse) {
        // 明确检查ip_detection_time_ms的类型和值
        console.log('ip_detection_time_ms值:', detectionResponse.ip_detection_time_ms);
        console.log('ip_detection_time_ms类型:', typeof detectionResponse.ip_detection_time_ms);
        
        // 确保ip_detection_time_ms是有效的数字
        if (typeof detectionResponse.ip_detection_time_ms === 'number') {
          detectionTime = detectionResponse.ip_detection_time_ms.toString();
          console.log('更新后的检测时间:', detectionTime);
        } else if (detectionResponse.ip_detection_time_ms === null) {
          console.warn('ip_detection_time_ms返回null');
        } else {
          console.warn('ip_detection_time_ms不是有效的数字:', detectionResponse.ip_detection_time_ms);
        }
      } else {
        console.warn('API返回空数据');
      }
    } catch (e) {
      console.error('获取IP检测时间失败:', e);
      // 输出详细的错误信息以便调试
      if (e.response) {
        console.error('错误响应状态:', e.response.status);
        console.error('错误响应数据:', e.response.data);
        console.error('错误响应头:', e.response.headers);
      } else if (e.request) {
        console.error('请求未收到响应:', e.request);
      } else {
        console.error('请求配置错误:', e.message);
      }
      console.error('完整错误信息:', JSON.stringify(e, null, 2));
    }
    
    // 使用字符串拼接而非模板字符串，避免可能的格式问题
    const logMessage = '[' + timestamp + '] 检测到当前客户端ID：' + (clientId || '未知ID') + ' 出现IP变动，现已暂时封禁该用户并告知管理员 240922173@qq.com。本次异常检测与威胁预警耗时：' + detectionTime + 'ms（包含异常检测与邮件告警）\n';
    
    appendToClientLog(`📝 准备写入异常日志: ${logMessage}`);
    
    // 调用API写入IP.log文件
    try {
      console.log('尝试通过api-gateway记录日志到IP.log文件');
      
      // 调用api-gateway中的新接口写入IP.log文件
      try {
        // 调用api-gateway中实现的写入日志文件的接口
        // 文件路径在服务器端已固定为：/home/cluster/ZZX/CloudEdgeFrontend/src/IP.log
        await apiGateway.post('/api/utils/write-log', {
          content: logMessage
        });
        console.log('成功通过api-gateway写入IP.log文件');
        appendToClientLog(`✅ 异常日志已写入IP.log文件`);
        ElMessage.success('日志已成功写入IP.log文件');
      } catch (apiError) {
        console.warn('api-gateway接口调用失败:', apiError);
        appendToClientLog(`⚠️ api-gateway接口调用失败: ${apiError.message}`);
        
        // 备用方案：如果api-gateway接口还未实现，暂时降级到控制台日志
        console.log(`[IP.log] ${logMessage}`);
        appendToClientLog(`📝 日志已记录到控制台`);
        ElMessage.info('日志已记录到控制台');
      }
      
    } catch (logError) {
      console.error('日志记录失败:', logError);
      appendToClientLog(`❌ 日志记录失败: ${logError.message}`);
      ElMessage.warning('日志记录失败，但操作继续进行');
    }
    
    // 弹出提示框，显示异常信息
    ElMessageBox.alert(
      logMessage + '\n\n您的账号当前处于未激活状态，请联系管理员',
      '账号状态异常',
      {
        confirmButtonText: '确定',
        type: 'warning'
      }
    );
    
    // 仍然显示错误消息
    ElMessage.error('您的账号当前处于未激活状态，请联系管理员');
  } else if (statusResult === -1) {
    // 获取失败：提醒用户
    ElMessage.warning('获取客户端激活状态失败，请刷新页面重试');
  }
  // 状态为1时不做任何处理

  // 显示总体结果消息
  if (stats.failedCount === 0) {
    ElMessage.success(`所有 ${stats.totalFiles} 个文件上传成功！`);
  } else if (stats.successCount === 0) {
    ElMessage.error(`所有 ${stats.totalFiles} 个文件上传失败，请检查日志获取详细信息`);
  } else {
    ElMessage.warning(`${stats.successCount} 个文件上传成功，${stats.failedCount} 个文件上传失败`);
  }
};

// 提取为单独的函数，避免嵌套过深
const fetchEdgeServerLogs = async () => {
  try {
    appendToEdgeServerLog(`[${new Date().toLocaleTimeString()}] 开始获取EdgeServer日志...`);
    
    // 简化方法：直接使用apiGateway专用端点获取日志
    appendToEdgeServerLog(`[${new Date().toLocaleTimeString()}] 直接调用apiGateway专用端点...`);
    
    try {
      // 直接调用apiGateway的专用端点获取日志，添加缓存控制参数确保获取最新日志
      appendToEdgeServerLog(`[${new Date().toLocaleTimeString()}] 发起API请求...`);
      // 添加时间戳作为查询参数，确保每次都是新请求，避免缓存问题
      const timestamp = new Date().getTime();
      appendToEdgeServerLog(`[${new Date().toLocaleTimeString()}] 添加时间戳参数避免缓存: ${timestamp}`);
      const gatewayResponse = await apiGateway.get(`/api/edge-server/logs?t=${timestamp}`);
      
      appendToEdgeServerLog(`✅ 服务器请求成功，检查响应对象`);
      
      // 显示响应对象的基本信息，这是关键修复！
      if (gatewayResponse) {
        appendToEdgeServerLog(`✅ 响应对象存在，类型: ${typeof gatewayResponse}`);
        appendToEdgeServerLog(`✅ 响应对象的属性: ${Object.keys(gatewayResponse).join(', ')}`);
        
        // 尝试不同的数据访问方式
        let responseData = null;
        if (gatewayResponse.data) {
          responseData = gatewayResponse.data;
          appendToEdgeServerLog(`✅ 成功访问gatewayResponse.data`);
        } else if (typeof gatewayResponse === 'object') {
          responseData = gatewayResponse;
          appendToEdgeServerLog(`✅ 使用gatewayResponse作为数据对象`);
        }
        
        // 显示完整的响应数据
        if (responseData) {
          try {
            const formattedData = JSON.stringify(responseData, null, 2);
            appendToEdgeServerLog(formatLogSection('完整API响应', formattedData));
          } catch (stringifyError) {
            appendToEdgeServerLog(`⚠️ JSON.stringify失败: ${stringifyError.message}`);
            appendToEdgeServerLog(formatLogSection('API响应原始内容', String(responseData)));
          }
          
          // 检查是否有日志数据
            if (responseData.logs && Array.isArray(responseData.logs)) {
              appendToEdgeServerLog(`✅ 发现logs数组，包含 ${responseData.logs.length} 条记录`);
              
              // 过滤并显示非空日志
              const validLogs = responseData.logs.filter(log => log && log.trim());
              if (validLogs.length > 0) {
                appendToEdgeServerLog(`✅ 过滤后有 ${validLogs.length} 条有效日志记录`);
                // 显示日志内容的前几条和后几条，以便快速查看最新内容
                appendToEdgeServerLog(`📊 日志内容预览：`);
                if (validLogs.length > 5) {
                  // 显示前3条作为上下文
                  validLogs.slice(0, 3).forEach((log, i) => {
                    appendToEdgeServerLog(`  ${i + 1}: ${log}`);
                  });
                  appendToEdgeServerLog(`  ... 省略 ${validLogs.length - 6} 条日志 ...`);
                  // 显示后3条（最新的日志）
                  validLogs.slice(-3).forEach((log, i) => {
                    appendToEdgeServerLog(`  ${validLogs.length - 2 + i}: ${log}`);
                  });
                } else {
                  // 如果日志数量较少，全部显示
                  validLogs.forEach((log, i) => {
                    appendToEdgeServerLog(`  ${i + 1}: ${log}`);
                  });
                }
                
                // 生成完整格式的日志并添加到显示
                const formattedLogs = validLogs.map((log, i) => `${i + 1}: ${log}`).join('\n');
                appendToEdgeServerLog(formatLogSection('EdgeServer 日志内容', formattedLogs));
                
                // 检查是否包含最新的错误日志（如认证token失败）
                const errorLogs = validLogs.filter(log => log.includes('recv the auth token fails') || log.toLowerCase().includes('error') || log.toLowerCase().includes('fail'));
                if (errorLogs.length > 0) {
                  // appendToEdgeServerLog(`🚨 检测到错误相关日志，共 ${errorLogs.length} 条：`);
                  errorLogs.forEach(log => {
                    // appendToEdgeServerLog(`  ${log}`);
                  });
                }
              } else {
                appendToEdgeServerLog(`⚠️ logs数组存在但没有有效内容`);
              }
            } else if (responseData.raw) {
              // 尝试从raw字段获取日志
              appendToEdgeServerLog(`🔍 检查raw字段内容:`);
              appendToEdgeServerLog(formatLogSection('raw字段', responseData.raw));
              
              // 尝试解析raw字段中的JSON
              try {
                const parsedRaw = JSON.parse(responseData.raw);
                appendToEdgeServerLog(`✅ 成功解析raw字段为JSON`);
                if (parsedRaw.logs && Array.isArray(parsedRaw.logs)) {
                  appendToEdgeServerLog(`✅ 从解析后的raw中发现logs数组，包含 ${parsedRaw.logs.length} 条记录`);
                  
                  // 过滤并显示非空日志
                  const validLogs = parsedRaw.logs.filter(log => log && log.trim());
                  if (validLogs.length > 0) {
                    appendToEdgeServerLog(`✅ 过滤后有 ${validLogs.length} 条有效日志记录`);
                    // 显示日志预览
                    appendToEdgeServerLog(`📊 日志内容预览：`);
                    if (validLogs.length > 5) {
                      validLogs.slice(0, 3).forEach((log, i) => {
                        appendToEdgeServerLog(`  ${i + 1}: ${log}`);
                      });
                      appendToEdgeServerLog(`  ... 省略 ${validLogs.length - 6} 条日志 ...`);
                      validLogs.slice(-3).forEach((log, i) => {
                        appendToEdgeServerLog(`  ${validLogs.length - 2 + i}: ${log}`);
                      });
                    } else {
                      validLogs.forEach((log, i) => {
                        appendToEdgeServerLog(`  ${i + 1}: ${log}`);
                      });
                    }
                  }
                  
                  const formattedLogs = parsedRaw.logs.map((log, i) => `${i + 1}: ${log}`).join('\n');
                  appendToEdgeServerLog(formatLogSection('EdgeServer 日志内容 (从raw解析)', formattedLogs));
                }
              } catch (parseError) {
                appendToEdgeServerLog(`⚠️ 无法解析raw字段为JSON: ${parseError.message}`);
                // 尝试直接将raw字段作为日志内容处理
                appendToEdgeServerLog(`🔄 尝试直接处理raw字段内容作为日志`);
                const rawLogs = String(responseData.raw).split('\n').filter(line => line.trim());
                if (rawLogs.length > 0) {
                  appendToEdgeServerLog(`✅ 从raw字段提取到 ${rawLogs.length} 行日志`);
                  const formattedLogs = rawLogs.map((log, i) => `${i + 1}: ${log}`).join('\n');
                  appendToEdgeServerLog(formatLogSection('EdgeServer 日志内容 (直接从raw提取)', formattedLogs));
                }
              }
          } else {
            appendToEdgeServerLog(`⚠️ 响应中没有找到logs数组或raw字段`);
            appendToEdgeServerLog(`📋 响应对象的所有字段: ${Object.keys(responseData).join(', ')}`);
          }
        } else {
          appendToEdgeServerLog(`❌ 无法获取有效的响应数据`);
        }
      } else {
        appendToEdgeServerLog(`❌ API返回空响应对象`);
      }
      
      return true;
    } catch (gatewayError) {
      appendToEdgeServerLog(`❌ apiGateway请求失败: ${gatewayError.message}`);
      if (gatewayError.response) {
        appendToEdgeServerLog(`❌ 错误响应状态: ${gatewayError.response.status}`);
        appendToEdgeServerLog(`❌ 错误响应数据: ${JSON.stringify(gatewayError.response.data)}`);
      }
      
      // 备选方案：显示已知的日志内容
      appendToEdgeServerLog(`\n📋 备选方案: 显示预定义的EdgeServer日志`);
      
      const predefinedLogs = [
        
      ];
      
      const formattedLogs = predefinedLogs.map((logLine, index) => {
        return `${index + 1}: ${logLine}`;
      }).join('\n');
      
      appendToEdgeServerLog(formatLogSection('预定义EdgeServer日志', formattedLogs));
      
      return false;
    }
  } catch (error) {
    appendToEdgeServerLog(`❌ 获取日志异常: ${error.message}`);
    appendToEdgeServerLog(`❌ 错误堆栈: ${error.stack}`);
    return false;
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 向客户端日志添加内容
const appendToClientLog = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  clientLogs.value += `[${timestamp}] ${message}\n`;
  // 滚动到底部
  setTimeout(() => {
    if (clientLogContainer.value) {
      const textarea = clientLogContainer.value.$el.querySelector('textarea');
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  }, 100);
};

// 向EdgeServer日志添加内容
const appendToEdgeServerLog = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  edgeServerLogs.value += `[${timestamp}] ${message}\n`;
  // 滚动到底部
  setTimeout(() => {
    if (edgeServerLogContainer.value) {
      const textarea = edgeServerLogContainer.value.$el.querySelector('textarea');
      if (textarea) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  }, 100);
};

// 组件挂载时，如果当前是第三步，获取数据
onMounted(() => {
  if (activeStep.value === 2) {
    fetchItemsData();
  }
});
</script>

<style scoped>
.mfa-auth-container {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header-title {
  font-weight: bold;
  font-size: 16px;
}

.logs-container {
  margin-top: 20px;
  display: flex;
  gap: 20px;
}

.log-card {
  flex: 1;
}

.log-output {
  margin-top: 10px;
}

.log-output .el-textarea {
  width: 100%;
}

.log-output .el-textarea__inner {
  resize: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-user {
  color: #606266;
  font-size: 14px;
  margin-right: 10px;
}

.login-form,
.add-user-form {
  margin-top: 20px;
}

.mfa-steps {
  margin: 30px 0;
}

.step-content {
  margin-top: 20px;
}

.auth-form {
  width: 100%;
}

.form-title {
  font-weight: bold;
  font-size: 16px;
}

.title-text {
  font-weight: bold;
  font-size: 16px;
}

.form-footer {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.empty-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.important-note {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 14px;
}

.red-text {
  color: #e74c3c;
  font-weight: bold;
}

.instruction-card {
  background-color: #e8f4fd;
  border: 1px solid #91d5ff;
  margin-bottom: 10px;
}

.instruction-card p {
  margin: 0;
  padding: 5px 0;
}

.instruction-card code {
  background-color: #f5f5f5;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}

.admin-instruction-card {
  background-color: #e8f4fd;
  border: 1px solid #91d5ff;
  margin-bottom: 20px;
  padding: 15px;
}

.data-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

.data-card {
  flex: 1;
  min-width: 300px;
  max-width: calc(50% - 10px);
  background-color: #ffffff;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  overflow: hidden;
}

.card-header-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.card-description {
  padding: 10px 0;
  color: #666666;
  font-size: 14px;
}

.card-content {
  padding: 10px 0;
}

.card-content pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #333333;
}

.no-data {
  width: 100%;
  text-align: center;
  padding: 40px;
  color: #999999;
  background-color: #fafafa;
  border: 1px dashed #e0e0e0;
  border-radius: 4px;
}

.admin-instruction-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.json-display-card {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
}

.json-header {
  background-color: #f5f5f5;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: bold;
  font-size: 14px;
}

.json-content {
  padding: 15px;
  background-color: #fafafa;
  overflow-x: auto;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.next-button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 数据卡片容器样式 */
.data-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

/* 获取因子按钮容器样式 */
.get-factor-button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

/* 数据卡片样式 */
.data-card {
  flex: 1;
  min-width: 300px;
  max-width: calc(50% - 10px);
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

/* 数据卡片标题样式 */
.card-header-title {
  font-weight: bold;
  font-size: 14px;
}

/* 数据内容样式 */
.data-content {
  padding: 15px;
  background-color: #fafafa;
  overflow-x: auto;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-top: 1px solid #e0e0e0;
}

/* 卡片操作按钮样式 */
.card-actions {
  display: flex;
  justify-content: flex-end;
  padding: 10px 15px;
  border-top: 1px solid #e0e0e0;
}

/* 错误消息样式 */
  .error-message {
    margin-top: -15px;
  }

  .error-tip {
    color: #f56c6c;
    font-size: 14px;
    text-align: center;
  }
  
  /* 注册因子弹窗样式 */
  .register-factor-container {
    padding: 10px 0;
  }
  
  .factor-content-input {
    width: 100%;
  }
  
  .factor-example-container {
    margin-top: 10px;
  }
  
  .factor-example-content {
    margin-top: 10px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .factor-example-content pre {
    margin: 0;
    font-size: 12px;
    white-space: pre-wrap;
  }

  /* 文件上传相关样式 */
  .file-select-button-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  
  .file-preview-card {
    margin-bottom: 20px;
  }
  
  .upload-button-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  
  .logs-container {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .log-card {
    flex: 1;
    min-width: 0;
  }
  
  .log-content {
    max-height: 300px;
    overflow-y: auto;
    background-color: #f8f8f8;
    padding: 15px;
  }
  
  .log-content pre {
    margin: 0;
    font-family: monospace;
    font-size: 13px;
    white-space: pre-wrap;
  }
  
  .file-select-container {
    padding: 10px 0;
  }
  
  .search-container {
    margin-bottom: 15px;
  }

/* 响应式调整 */
@media (max-width: 768px) {
  .data-card {
    max-width: 100%;
  }
}
</style>