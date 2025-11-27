<template>
  <div class="login-container">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="login-header">
          <span>用户登录</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef" 
        :model="loginForm" 
        :rules="rules" 
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
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="login-btn"
            @click="handleLogin"
            :loading="loading"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
        
        <el-form-item v-if="errorMsg" class="error-message">
          <div class="error-tip">{{ errorMsg }}</div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { formatError, logError } from '@/utils/errorFormatter'

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    const formRef = ref(null)
    
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    const loading = ref(false)
    const errorMsg = ref('')
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      errorMsg.value = ''
      
      // 验证表单
      if (formRef.value) {
        try {
          await formRef.value.validate()
          loading.value = true
          
          // 调用登录方法
          await store.dispatch('auth/login', {
            username: loginForm.username,
            password: loginForm.password
          })
          
          // 登录成功，获取重定向路径
          const redirect = route.query.redirect || '/'
          router.push(redirect)
        } catch (error) {
          // 使用错误格式化工具处理错误
          errorMsg.value = formatError(error)
          
          // 使用安全的日志打印函数记录错误
          logError('登录失败', error)
        } finally {
          loading.value = false
        }
      }
    }
    
    return {
      loginForm,
      rules,
      loading,
      errorMsg,
      formRef,
      handleLogin
    }
  }
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
}

.login-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.login-form {
  padding: 0 30px 30px;
}

.login-btn {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.error-message {
  margin-top: -15px;
}

.error-tip {
  color: #f56c6c;
  font-size: 14px;
  text-align: center;
}
</style>