<template>
  <div class="user-info-container">
    <el-card class="user-info-card" shadow="hover">
      <template #header>
        <div class="user-info-header">
          <span>用户信息</span>
        </div>
      </template>
      
      <div v-if="userInfo" class="user-info-content">
        <div class="user-avatar-section">
          <el-avatar :size="100" class="user-avatar">
            {{ userInfo.email?.substring(0, 1).toUpperCase() || 'U' }}
          </el-avatar>
        </div>
        
        <div class="user-details">
          <el-descriptions border :column="{ xs: 1, sm: 1 }">
            <el-descriptions-item label="用户ID">{{ userInfo.id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="user-actions">
          <el-button type="danger" @click="logout">退出登录</el-button>
        </div>
      </div>
      
      <div v-else class="no-user-info">
        <el-empty description="未获取到用户信息"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'UserInfoPage',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    // 从store中获取用户信息
    const userInfo = computed(() => store.state.auth.userInfo)
    
    // 退出登录
    const logout = async () => {
      await store.dispatch('auth/logout')
      router.push('/mfa/login')
    }
    
    return {
      userInfo,
      logout
    }
  }
});
</script>

<style scoped>
.user-info-container {
  padding: 20px;
}

.user-info-card {
  max-width: 600px;
  margin: 0 auto;
  border-radius: 12px;
}

.user-info-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.user-info-content {
  padding: 20px;
}

.user-avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.user-avatar {
  margin-bottom: 15px;
}

.user-details {
  margin-bottom: 30px;
}

.user-actions {
  display: flex;
  justify-content: center;
}

.no-user-info {
  text-align: center;
  padding: 40px 0;
}
</style>