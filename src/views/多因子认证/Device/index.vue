<template>
  <div class="mfa-user-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><h2>用户管理</h2></span>
          <el-button type="primary" @click="addUserDialogVisible = true" style="white-space: nowrap;"><el-icon><Plus /></el-icon>添加用户</el-button>

          <!-- 添加用户对话框 -->
          <el-dialog title="添加用户" v-model="addUserDialogVisible" width="500">
            <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px" class="demo-ruleForm" label-position="top">
              <el-form-item label="Email" :label-width="formLabelWidth">
                <el-input v-model="addForm.email" autocomplete="off"></el-input>
              </el-form-item>
              <el-form-item label="设备ID" :label-width="formLabelWidth">
                <el-input v-model="addForm.deviceId" autocomplete="off"></el-input>
              </el-form-item>
              <el-form-item label="密码" :label-width="formLabelWidth">
                <el-input v-model="addForm.password" autocomplete="off"></el-input>
              </el-form-item>
              <el-form-item label="确认密码" :label-width="formLabelWidth">
                <el-input v-model="addForm.confirmPassword" autocomplete="off"></el-input>
              </el-form-item>
              <div>
                <el-checkbox v-model="addChecked1" label="设为超级用户" size="large" />
                <el-checkbox v-model="addChecked2" label="激活" size="large" />
              </div>
            </el-form>
             <template #footer>
              <div class="dialog-footer">
                <el-button type="primary" @click="handleConfirmAddUser">
                  确认
                </el-button>
                <el-button @click="handleCancelAddUser">取消</el-button>
              </div>
            </template>
          </el-dialog>
          
          <!-- 编辑用户对话框 -->
          <el-dialog title="编辑信息" v-model="editUserDialogVisible" width="500">
            <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px" class="demo-ruleForm" label-position="top">
              <el-form-item label="Email" :label-width="formLabelWidth">
                <el-input v-model="editForm.email" autocomplete="off"></el-input>
              </el-form-item>
              <el-form-item label="设备ID" :label-width="formLabelWidth">
                <el-input v-model="editForm.deviceId" autocomplete="off"></el-input>
              </el-form-item>
              <div>
                <el-checkbox v-model="editChecked1" label="设为超级用户" size="large" />
                <el-checkbox v-model="editChecked2" label="激活" size="large" />
              </div>
            </el-form>
             <template #footer>
              <div class="dialog-footer">
                <el-button type="primary" @click="handleConfirmEditUser">
                  确认
                </el-button>
                <el-button @click="handleCancelEditUser">取消</el-button>
              </div>
            </template>
          </el-dialog>
          
          <!-- 注册因素对话框 -->
          <el-dialog title="因素注册" v-model="registerFactorDialogVisible" width="500px">
            <div class="register-factor-dialog">
              <div class="form-item">
                <label class="form-label">请输入导出的因素</label>
                <el-input
                  v-model="factorContent"
                  type="textarea"
                  :rows="12"
                  placeholder="请输入JSON格式的因素内容"
                  class="factor-input"
                />
              </div>
              <div class="example-tip">
                <p class="tip-title">示例输入：</p>
                <pre class="example-content">{{ factorExample }}</pre>
              </div>
            </div>
            <template #footer>
              <div class="dialog-footer">
                <el-button type="primary" @click="handleConfirmRegisterFactor">
                  确认
                </el-button>
                <el-button @click="handleCancelRegisterFactor">取消</el-button>
              </div>
            </template>
          </el-dialog>
        </div>
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
                <el-popover
                  placement="top"
                  title="操作"
                  width="150"
                  trigger="click"
                  :visible-arrow="false"
                >
                  <template #reference>
                    <div class="operation-icon">
                      <el-icon :size="20"><Operation /></el-icon>
                    </div>
                  </template>
                  <div class="operation-list">
                    <!-- 普通用户显示操作 -->
                    <template v-if="!isCurrentUser(scope.row)">
                      <div class="operation-item" style="color: red;" @click="handleDelete(scope.row)">
                        <el-icon :size="16"><Delete /></el-icon>
                        <span>删除用户</span>
                      </div>
                      <div class="operation-item" @click="handleRegisterFactor(scope.row)">
                        <el-icon :size="16"><CircleCheck /></el-icon>
                        <span>注册因素</span>
                      </div>
                      <div class="operation-item" @click="handleEditUser(scope.row)">
                        <el-icon :size="16"><Edit /></el-icon>
                        <span>编辑信息</span>
                      </div>
                    </template>
                    <template v-else>
                      <div class="operation-item" @click="handleRegisterFactor(scope.row)">
                        <el-icon :size="16"><CircleCheck /></el-icon>
                        <span>注册因素</span>
                      </div>
                      <div class="operation-item" @click="handleEditUser(scope.row)">
                        <el-icon :size="16"><Edit /></el-icon>
                        <span>编辑信息</span>
                      </div>
                    </template>
                  </div>
                </el-popover>
              </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

  <script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElForm, ElMessageBox } from 'element-plus';
import { Operation, Delete, CircleCheck, Plus, Edit } from '@element-plus/icons-vue';
import request from '../../../api/request'; // 导入请求拦截器
import { useStore } from 'vuex';

const store = useStore();

// 从store获取当前登录用户信息
const currentUserInfo = computed(() => store.state.auth.userInfo);

// 在组件挂载时检查权限并获取用户列表
onMounted(() => {
  // 检查是否为超级用户
  if (!currentUserInfo.value?.is_superuser) {
    ElMessage.error('您没有权限访问此页面');
    // 重定向到用户信息页面
    setTimeout(() => {
      window.location.href = '/mfa/userInfo';
    }, 1000);
    return;
  }
  fetchUsers();
});

// 调用API获取用户列表，根据用户权限决定获取方式
async function fetchUsers() {
  try {
    if (currentUserInfo.value && currentUserInfo.value.is_superuser) {
      // 超级用户可以获取所有用户信息
      const response = await request.get('/api/v1/users/');
      
      // 根据实际API返回格式解析数据，正确的格式是{ data: [...], count: number }
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
      ElMessage.success(`成功获取用户列表，共 ${users.length} 个用户`);
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
        ElMessage.success('成功获取用户信息');
      }
    }
  } catch (error) {
    // 如果是普通用户，可能没有权限获取所有用户，这时候也尝试获取自己的信息
    if (!currentUserInfo.value?.is_superuser) {
      try {
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
          ElMessage.success('成功获取用户信息');
          return;
        }
      } catch (meError) {
        console.error('获取当前用户信息失败:', meError);
      }
    }
    
    ElMessage.error(`获取用户列表失败: ${error.message}`);
    console.error('Error fetching users:', error);
  }
}

// 判断是否为当前登录用户
const isCurrentUser = (user) => {
  return currentUserInfo.value && currentUserInfo.value.id === user.id;
};

// 控制对话框显示/隐藏
const addUserDialogVisible = ref(false);
const editUserDialogVisible = ref(false);
const editingUserId = ref(null); // 当前正在编辑的用户ID

// 添加用户表单数据
const addForm = reactive({
  email: '',
  deviceId: '',
  password: '',
  confirmPassword: ''
});

// 编辑用户表单数据
const editForm = reactive({
  email: '',
  deviceId: ''
});

// 表单引用
const addFormRef = ref(null);
const editFormRef = ref(null);

// 添加用户表单验证规则
const addRules = {
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
        } else if (value !== addForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 编辑用户表单验证规则
const editRules = {
  email: [
    { required: true, message: '请输入Email', trigger: 'blur' },
    { type: 'email', message: '请输入有效的Email地址', trigger: 'blur' }
  ],
  deviceId: [
    { required: true, message: '请输入设备ID', trigger: 'blur' }
  ]
};

// 表单标签宽度
const formLabelWidth = '120px';

// 添加用户复选框状态
const addChecked1 = ref(false);
const addChecked2 = ref(false);

// 编辑用户复选框状态
const editChecked1 = ref(false);
const editChecked2 = ref(false);

// 用户列表数据
const userList = ref([]);

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

// 判断是否可以显示详情按钮
const canShowDetails = (status) => {
  return ['已注册', 'token可用', 'token过期', '未认证'].includes(status);
};

// 判断是否可以显示认证按钮
const canShowAuthButton = (status) => {
  return ['未认证', 'token过期'].includes(status);
};

// 编辑用户功能已删除

// 用户登录功能已删除

// 控制注册因素对话框显示/隐藏
const registerFactorDialogVisible = ref(false);
const currentFactorUser = ref(null);
const factorContent = ref('');
const factorExample = `{
  "email": "test2@qq.com",
  "password": "testtest",
  "client_id": "2",
  "client_secret": "34e652f36934b386acb1453d27ab241d",
  "factors": [
    {
      "type": "device_firmware",
      "content": "{\"algorithm\":\"SHA256\",\"hash\":\"fdc8ccdba5e55f635890a598f1071d750f7972e7cacff3eeaa5134ac73ad0fd2\",\"items\":[{\"content\":\"2\",\"name\":\"CPUCores\"},{\"content\":\"GenuineIntel\",\"name\":\"CPUID\"},{\"content\":\"ebef0c17d7bc4c61912349848b9f1c60\\n\",\"name\":\"SystemID\"},{\"content\":\"ubuntu\",\"name\":\"MachineName\"}],\"key\":\"2\"}"
    },
    {
      "type": "puf_mac",
      "content": "{\"C0\":\"b383eeb04ad8b3f3d3f12ae705f5bbaf\",\"T\":\"418808e0ab132719de68b9a707aa16ab636fb99126a5cbb8900b67e7ca964b82\",\"puf\":\"268a2af085210317dd4c41e8a3e247cf\"}"
    }
  ]
}`;

// 处理注册因素按钮点击
const handleRegisterFactor = (row) => {
  // 保存当前操作的用户
  currentFactorUser.value = row;
  // 重置输入框
  factorContent.value = '';
  // 显示对话框
  registerFactorDialogVisible.value = true;
};

// 处理确认注册因素
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
    const response = await request.post('/api/v1/mfa/register', factorData);
    
    // 关闭对话框
    registerFactorDialogVisible.value = false;
    
    // 显示成功消息
    // 适配不同的响应格式
    let successMessage = '因素注册成功';
    if (response && response.data) {
      if (response.data.msg) {
        successMessage = response.data.msg;
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
    ElMessage.error(`因素注册失败: ${error.message || '未知错误'}`);
    console.error('因素注册失败:', error);
  }
};

// 处理取消注册因素
const handleCancelRegisterFactor = () => {
  // 关闭对话框
  registerFactorDialogVisible.value = false;
};

// 处理删除按钮点击
const handleDelete = async (row) => {
  try {
    // 显示确认对话框
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除用户 ${row.email} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );

    if (confirmResult) {
      // 调用删除用户API
      await request.delete(`/api/v1/users/${row.id}`);
      
      // 从本地用户列表中移除
      const index = userList.value.findIndex(item => item.id === row.id);
      if (index !== -1) {
        userList.value.splice(index, 1);
      }
      
      ElMessage.success(`用户 ${row.email} 删除成功`);
      
      // 刷新用户列表以确保数据一致性
      fetchUsers();
    }
  } catch (error) {
    // 如果是用户取消操作，不显示错误消息
    if (error !== 'cancel') {
      ElMessage.error(`删除用户失败: ${error.message || '未知错误'}`);
      console.error('删除用户失败:', error);
    }
  }
};

// 处理添加用户按钮点击
const handleAddUser = () => {
  // 重置表单
  if (addFormRef.value) {
    addFormRef.value.resetFields();
  }
  
  // 重置表单数据
  addForm.email = '';
  addForm.deviceId = '';
  addForm.password = '';
  addForm.confirmPassword = '';
  addChecked1.value = false;
  addChecked2.value = true;
  
  // 打开添加用户对话框
  addUserDialogVisible.value = true;
};

// 处理编辑用户按钮点击
const handleEditUser = async (row) => {
  try {
    // 保存当前编辑的用户ID
    editingUserId.value = row.id;
    
    console.log('开始获取用户信息，用户ID:', row.id);
    
    // 调用API获取用户详细信息
    const response = await request.get(`/api/v1/users/${row.id}`);
    
    // 详细记录响应内容到控制台
    console.log('API响应:', response);
    
    // 检查响应是否存在
    if (!response) {
      throw new Error('获取到的用户数据为空');
    }
    
    // 根据API响应格式，response本身就是用户数据对象
    const userData = response;
    
    // 填充编辑表单数据
    editForm.email = userData.email || '';
    editForm.deviceId = userData.id || ''; // 使用id字段填充设备ID
    editChecked1.value = userData.is_superuser || false;
    editChecked2.value = userData.is_active || false;
    
    // 打开编辑对话框
    editUserDialogVisible.value = true;
  } catch (error) {
    ElMessage.error(`获取用户信息失败: ${error.message || '未知错误'}`);
    console.error('获取用户信息失败:', error);
    console.error('错误详情:', error.stack);
  }
};

// 处理确认添加用户
const handleConfirmAddUser = async () => {
  try {
    // 验证表单
    if (addFormRef.value) {
      await addFormRef.value.validate();
    }
    
    // 准备请求数据
    const requestData = {
      email: addForm.email,
      client_id: addForm.deviceId,
      password: addForm.password,
      is_superuser: addChecked1.value,
      is_active: addChecked2.value
    };
    
    // 添加用户 - 使用POST方法创建新用户
    const response = await request.post('/api/v1/users/', requestData);
    ElMessage.success('用户添加成功');
    
    // 关闭对话框
    addUserDialogVisible.value = false;
    
    // 重置表单
    if (addFormRef.value) {
      addFormRef.value.resetFields();
    }
    
    // 刷新用户列表
    fetchUsers();
  } catch (error) {
    ElMessage.error(`添加用户失败: ${error.message || '未知错误'}`);
    console.error('添加用户失败:', error);
  }
};

// 处理确认编辑用户
const handleConfirmEditUser = async () => {
  try {
    // 验证表单
    if (editFormRef.value) {
      await editFormRef.value.validate();
    }
    
    // 准备请求数据
    const requestData = {
      email: editForm.email,
      deviceId: editForm.deviceId,
      is_superuser: editChecked1.value,
      is_active: editChecked2.value
    };
    
    // 编辑用户 - 使用PATCH方法更新用户信息
    const response = await request.patch(`/api/v1/users/${editingUserId.value}`, requestData);
    ElMessage.success('用户信息更新成功');
    
    // 关闭对话框
    editUserDialogVisible.value = false;
    
    // 重置表单
    if (editFormRef.value) {
      editFormRef.value.resetFields();
    }
    
    // 重置编辑状态
    editingUserId.value = null;
    
    // 刷新用户列表
    fetchUsers();
  } catch (error) {
    ElMessage.error(`更新用户失败: ${error.message || '未知错误'}`);
    console.error('更新用户失败:', error);
  }
};

// 处理取消添加用户
const handleCancelAddUser = () => {
  // 关闭对话框
  addUserDialogVisible.value = false;
  
  // 重置表单
  if (addFormRef.value) {
    addFormRef.value.resetFields();
  }
};

// 处理取消编辑用户
const handleCancelEditUser = () => {
  // 关闭对话框
  editUserDialogVisible.value = false;
  
  // 重置表单
  if (editFormRef.value) {
    editFormRef.value.resetFields();
  }
  
  // 重置编辑状态
  editingUserId.value = null;
};
</script>

<style scoped>
.mfa-user-container {
  padding: 20px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.el-card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-buttons {
  display: flex;
  gap: 5px;
}

.operation-icon {
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.operation-icon:hover {
  background-color: #f0f0f0;
}

.operation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.operation-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.operation-item:hover {
  background-color: #f5f5f5;
}

/* 注册因素对话框样式 */
.register-factor-dialog {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.factor-input {
  width: 100%;
  font-family: monospace;
  font-size: 14px;
}

.example-tip {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.tip-title {
  margin: 0 0 8px 0;
  font-weight: 500;
  font-size: 14px;
}

.example-content {
  margin: 0;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>