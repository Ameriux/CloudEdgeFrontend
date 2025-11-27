<template>
  <div class="items-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><h2>Items 列表</h2></span>
        </div>
      </template>

      <!-- Items列表 -->
      <el-table
        v-loading="loading"
        :data="itemsList"
        style="width: 100%"
        border
        empty-text="暂无数据"
        empty-text-align="center"
      >
        <el-table-column prop="owner_id" label="拥有者ID" min-width="120"></el-table-column>
        <el-table-column prop="id" label="ID" min-width="80"></el-table-column>
        <el-table-column prop="title" label="标题" min-width="200"></el-table-column>
        <el-table-column prop="content" label="内容" min-width="300">
          <template #default="scope">
            <div class="content-preview">{{ truncateText(scope.row.content, 100) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="scope">
            <div class="description-preview">{{ truncateText(scope.row.description, 50) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
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
                <!-- 所有用户都可以查看内容 -->
                <div class="operation-item" @click="handleViewItem(scope.row)">
                  <el-icon :size="16"><View /></el-icon>
                  <span>查看内容</span>
                </div>
                <!-- 只有超级用户可以删除 -->
                <div v-if="isSuperUser" class="operation-item" style="color: red;" @click="handleDeleteItem(scope.row)">
                  <el-icon :size="16"><Delete /></el-icon>
                  <span>删除</span>
                </div>
                <!-- 只有超级用户可以编辑 -->
                <div v-if="isSuperUser" class="operation-item" @click="handleEditItem(scope.row)">
                  <el-icon :size="16"><Edit /></el-icon>
                  <span>编辑</span>
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>

      <!-- 查看内容对话框 -->
      <el-dialog title="Item 详情" v-model="viewItemDialogVisible" width="600px">
        <div class="item-detail">
          <div class="detail-item">
            <label>标题：</label>
            <span>{{ selectedItem.title }}</span>
          </div>
          <div class="detail-item">
            <label>内容：</label>
            <div class="content-detail">{{ selectedItem.content }}</div>
          </div>
          <div class="detail-item">
            <label>描述：</label>
            <div class="description-detail">{{ selectedItem.description }}</div>
          </div>
          <div class="detail-item">
            <label>ID：</label>
            <span>{{ selectedItem.id }}</span>
          </div>
          <div class="detail-item">
            <label>拥有者ID：</label>
            <span>{{ selectedItem.owner_id }}</span>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="viewItemDialogVisible = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 编辑Item对话框 -->
      <el-dialog title="编辑 Item" v-model="editItemDialogVisible" width="600px">
        <el-form :model="editItemData" label-width="100px" class="edit-form">
          <el-form-item label="标题" prop="title">
            <el-input v-model="editItemData.title" placeholder="请输入标题" maxlength="200"></el-input>
          </el-form-item>
          <el-form-item label="内容" prop="content">
            <el-input 
              v-model="editItemData.content" 
              type="textarea" 
              :rows="8" 
              placeholder="请输入内容"
            ></el-input>
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input 
              v-model="editItemData.description" 
              type="textarea" 
              :rows="4" 
              placeholder="请输入描述"
            ></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="editItemDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveEditItem">保存</el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style scoped>
.edit-form {
  margin-top: 20px;
}
</style>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Operation, Delete, View, Edit } from '@element-plus/icons-vue';
import request from '../../../api/request'; // 导入请求拦截器
import { useStore } from 'vuex';

const store = useStore();

// 从store获取当前登录用户信息
const currentUserInfo = computed(() => store.state.auth.userInfo);
const isSuperUser = computed(() => currentUserInfo.value?.is_superuser);

// 控制对话框显示/隐藏
const viewItemDialogVisible = ref(false);
const editItemDialogVisible = ref(false);

// 选中的Item数据
const selectedItem = reactive({
  id: '',
  owner_id: '',
  title: '',
  content: '',
  description: ''
});

// 编辑用的Item数据
const editItemData = reactive({
  id: '',
  title: '',
  content: '',
  description: ''
});

// 加载状态
const loading = ref(false);
  // Items列表数据
const itemsList = ref([]);

// 在组件挂载时检查权限并获取Items列表
onMounted(async () => {
  // 检查是否已登录
  if (!currentUserInfo.value) {
    ElMessage.error('您尚未登录，请先登录');
    // 可以重定向到登录页面
    return;
  }
  
  // 获取Items列表
  await fetchItems();
});

// 获取Items列表
async function fetchItems() {
  try {
    loading.value = true;
    let response;
    let items = [];
    
    if (isSuperUser.value) {
      // 超级用户获取所有Items
      response = await request.get('/api/v1/items/');
    } else if (currentUserInfo.value) {
      // 普通用户根据用户ID获取自己的Items
      // 使用查询参数owner_id来获取特定用户的Items
      response = await request.get(`/api/v1/items/`, {
        params: {
          owner_id: currentUserInfo.value.id
        }
      });
    } else {
      throw new Error('用户未登录');
    }
    
    // 根据API响应格式解析数据
    if (response && response.data && Array.isArray(response.data)) {
      items = response.data;
    } else if (response && response.data && Array.isArray(response.data.data)) {
      items = response.data.data;
    } else {
      throw new Error('API响应格式不正确');
    }
    
    // 标准化数据格式
    itemsList.value = items.map(item => ({
      id: item.id || '',
      owner_id: item.owner_id || '',
      title: item.title || '无标题',
      content: item.content || '',
      description: item.description || ''
    }));
    
    // 只在数据量大时显示成功消息
    if (itemsList.value.length > 0) {
      ElMessage.success(`成功获取Items列表，共 ${itemsList.value.length} 个项目`);
    }
  } catch (error) {
    itemsList.value = [];
    ElMessage.error(`获取Items列表失败: ${error.message || '未知错误'}`);
    console.error('Error fetching items:', error);
  } finally {
    loading.value = false;
  }
}

// 处理查看Item内容
const handleViewItem = (row) => {
  // 填充选中的Item数据
  selectedItem.id = row.id;
  selectedItem.owner_id = row.owner_id;
  selectedItem.title = row.title;
  selectedItem.content = row.content || '';
  selectedItem.description = row.description || '';
  
  // 打开查看对话框
  viewItemDialogVisible.value = true;
};

// 处理编辑Item
const handleEditItem = (row) => {
  // 填充编辑表单数据
  editItemData.id = row.id;
  editItemData.title = row.title;
  editItemData.content = row.content || '';
  editItemData.description = row.description || '';
  
  // 打开编辑对话框
  editItemDialogVisible.value = true;
};

// 保存编辑的Item
const saveEditItem = async () => {
  try {
    // 显示确认对话框
    const confirmResult = await ElMessageBox.confirm(
      `确定要更新Item "${editItemData.title}" 吗？`,
      '更新确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    );

    if (confirmResult) {
      loading.value = true;
      
      // 调用更新Item API
      const updatedItem = await request.put(`/api/v1/items/${editItemData.id}`, {
        title: editItemData.title,
        content: editItemData.content,
        description: editItemData.description
      });
      
      // 更新本地Items列表
      const index = itemsList.value.findIndex(item => item.id === editItemData.id);
      if (index !== -1) {
        itemsList.value[index] = { ...itemsList.value[index], ...updatedItem };
      }
      
      ElMessage.success('Item更新成功');
      editItemDialogVisible.value = false;
    }
  } catch (error) {
    // 如果是用户取消操作，则不显示错误消息
    if (error.toString() !== 'cancel') {
      ElMessage.error(`更新Item失败: ${error.message || '未知错误'}`);
      console.error('Error updating item:', error);
    }
  } finally {
    loading.value = false;
  }
};

// 处理删除Item
const handleDeleteItem = async (row) => {
  try {
    // 显示确认对话框
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除Item "${row.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );

    if (confirmResult) {
      // 调用删除Item API
      await request.delete(`/api/v1/items/${row.id}`);
      
      // 从本地Items列表中移除
      const index = itemsList.value.findIndex(item => item.id === row.id);
      if (index !== -1) {
        itemsList.value.splice(index, 1);
      }
      
      ElMessage.success('Item删除成功');
    }
  } catch (error) {
    // 如果是用户取消操作，则不显示错误消息
    if (error.toString() !== 'cancel') {
      ElMessage.error(`删除Item失败: ${error.message || '未知错误'}`);
      console.error('Error deleting item:', error);
    }
  }
};

// 文本截断函数
const truncateText = (text, maxLength) => {
  if (!text) return '无';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<style scoped>
.items-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-icon {
  cursor: pointer;
  color: #409eff;
}

.operation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operation-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.operation-item:hover {
  background-color: #f5f7fa;
  transform: translateX(2px);
}

.content-preview, .description-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-detail {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
}

.content-detail, .description-detail {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}
</style>