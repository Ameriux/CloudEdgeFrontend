<template>
  <div class="federated-learning-container">
    <h2>联邦学习</h2>
    
    <div class="description">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>联邦学习简介</span>
          </div>
        </template>
        <div class="card-content">
          <p>联邦学习是一种分布式机器学习框架，它允许在保护数据隐私的前提下进行模型训练。</p>
          <p>在本系统中，您可以使用以下功能：</p>
          <el-divider></el-divider>
          <el-button-group>
            <el-button type="primary" @click="$router.push('/cloudserver/federated-learning/model-training')">
              模型训练&投毒防御
            </el-button>
            <el-button type="primary" @click="$router.push('/cloudserver/federated-learning/gradient-leakage')">
              梯度泄露防御
            </el-button>
          </el-button-group>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
// 主页面逻辑可以在这里扩展
</script>

<style scoped>
.federated-learning-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.federated-learning-container h2 {
  margin-bottom: 30px;
  color: #303133;
  font-size: 24px;
}

.description {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  padding: 10px 0;
  line-height: 1.8;
}

.card-content p {
  margin-bottom: 15px;
  color: #606266;
}

.el-button-group {
  margin-top: 10px;
}
</style>