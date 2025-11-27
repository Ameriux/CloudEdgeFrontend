<template>
  <div class="edge-server-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>EdgeServer管理</span>
          <el-button type="primary" @click="handleAddServerClick" style="white-space: nowrap;"><el-icon><Plus /></el-icon>添加EdgeServer</el-button>
        </div>
      </template>

      <!-- 添加/修改EdgeServer对话框 -->
      <el-dialog :title="isEditDialog ? '修改EdgeServer' : '添加EdgeServer'" v-model="dialogVisible" width="500">
        <el-form :model="serverForm" :rules="serverRules" ref="serverFormRef" label-width="100px" class="demo-ruleForm" label-position="top">
          <el-form-item label="设备名" :label-width="formLabelWidth">
            <el-input v-model="serverForm.deviceName" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="IP地址" :label-width="formLabelWidth">
            <el-input v-model="serverForm.ipAddress" autocomplete="off"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="handleSubmit">确认</el-button>
            <el-button @click="handleCancel">取消</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- EdgeServer列表 -->
      <el-table :data="serverList" style="width: 100%">
        <el-table-column label="序号" min-width="80">
          <template #default="scope">
            <span>{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备名" min-width="200"></el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" min-width="150"></el-table-column>

        <el-table-column prop="backupNodes" label="备份节点" min-width="200">
          <template #default="scope">
            <div class="backup-nodes-container">
              <div v-if="scope.row.backupNodes && scope.row.backupNodes.length > 0">
                <span v-for="(node, index) in scope.row.backupNodes" :key="index" class="backup-node-item">
                  {{ typeof node === 'string' ? node : node.deviceName }}
                  <span v-if="typeof node === 'object' && node.backupMethod" class="backup-method-label">
                    ({{ node.backupMethod }})
                  </span>
                </span>
              </div>
              <span v-else class="no-backup-nodes">无</span>
              <div class="backup-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="openAddBackupNodeDialog(scope.row)"
                >
                  添加
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="navigateToWorkbench(scope.row)" 
                style="margin-bottom: 5px; width: 60px; padding: 0;"
              >
                工作区
              </el-button>
              <el-dropdown @command="(command) => handleActionCommand(command, scope.row)">
                <el-button type="default" size="small">
                  更多操作
                  <el-icon class="el-icon--right">
                    <ArrowDown />
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="editBackupNodes">编辑备份节点</el-dropdown-item>
                    <el-dropdown-item command="editServer">修改</el-dropdown-item>
                    <el-dropdown-item command="deleteServer" type="danger">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加备份节点对话框 -->
      <el-dialog
        title="添加备份节点"
        v-model="backupNodeDialogVisible"
        width="500px"
        center
      >
        <div class="dialog-content">
          <div style="margin-bottom: 20px;">
            <span>当前设备：</span>
            <el-input v-model="currentServerInfo" disabled></el-input>
          </div>
          <div style="margin-bottom: 20px;">
            <span>选择备份节点：</span>
            <el-select v-model="selectedBackupNode" placeholder="请选择节点">
              <el-option
                v-for="node in availableBackupNodes"
                :key="node.id"
                :label="node.deviceName"
                :value="node.deviceName"
              ></el-option>
            </el-select>
          </div>
          <div style="margin-bottom: 20px;">
            <span>选择备份方式：</span>
            <el-select v-model="selectedBackupMethod" placeholder="请选择备份方式">
                <el-option label="FeatureSync" value="FeatureSync"></el-option>
                <el-option label="Rsync" value="Rsync"></el-option>
                <el-option label="FeatureSync&Rsync" value="FeatureSync&Rsync"></el-option>
              </el-select>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="backupNodeDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="addBackupNode">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 编辑备份节点对话框 -->
      <el-dialog
        title="编辑备份节点"
        v-model="editBackupNodesDialogVisible"
        width="600px"
        center
      >
        <div class="dialog-content">
          <div style="margin-bottom: 20px;">
            <span>当前设备：</span>
            <el-input v-model="currentServerInfo" disabled></el-input>
          </div>
          <div v-if="editingServer.backupNodes && editingServer.backupNodes.length > 0">
            <h4 style="margin-bottom: 10px;">现有备份节点：</h4>
            <el-table :data="editingServer.backupNodes" style="width: 100%">
              <el-table-column prop="deviceName" label="节点名称" min-width="150">
                <template #default="scope">
                  {{ typeof scope.row === 'string' ? scope.row : scope.row.deviceName }}
                </template>
              </el-table-column>
              <el-table-column prop="backupMethod" label="备份方式" min-width="120">
                <template #default="scope">
                  <el-select 
                    v-model="scope.row.backupMethod" 
                    placeholder="请选择备份方式"
                    style="width: 160px"
                  >
                    <el-option label="FeatureSync" value="FeatureSync"></el-option>
                    <el-option label="Rsync" value="Rsync"></el-option>
                    <el-option label="FeatureSync&Rsync" value="FeatureSync&Rsync"></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="80" fixed="right">
                <template #default="scope">
                  <el-button 
                    type="danger" 
                    text 
                    size="small"
                    @click="removeBackupNodeFromEdit(typeof scope.row === 'string' ? scope.row : scope.row.deviceName)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else style="margin-bottom: 20px; color: #909399;">
            暂无备份节点
          </div>
          <div style="margin-top: 20px; display: flex; justify-content: space-between;">
            <el-button @click="addMoreBackupNode">添加更多备份节点</el-button>
            <el-button type="primary" @click="saveBackupNodesChanges">保存修改</el-button>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'EdgeServer',
  components: {
    Plus,
    ArrowDown
  },
  setup() {
      const router = useRouter()
      const store = useStore()
      
      // 从Vuex获取EdgeServer列表数据
      const serverList = computed(() => {
        return store.getters['edgeServer/getAllServers'] || []
      })

      // 控制对话框显示/隐藏
      const dialogVisible = ref(false)
      const isEditDialog = ref(false)
      const editingServerId = ref(null)

      // 表单数据
      const serverForm = reactive({
        deviceName: '',
        ipAddress: ''
      })

      // 表单引用
      const serverFormRef = ref(null)

      // 表单标签宽度
      const formLabelWidth = '120px'

      // 表单验证规则
      const serverRules = {
        deviceName: [
          { required: true, message: '请输入设备名', trigger: 'blur' },
          { min: 2, max: 20, message: '设备名长度在 2 到 20 个字符之间', trigger: 'blur' }
        ],
        ipAddress: [
          { required: true, message: '请输入IP地址', trigger: 'blur' },
          {
            pattern: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
            message: '请输入有效的IP地址',
            trigger: 'blur'
          }
        ]
      }

      // 备份节点相关
      const backupNodeDialogVisible = ref(false)
      const editBackupNodesDialogVisible = ref(false)
      const selectedBackupNode = ref('')
      const selectedBackupMethod = ref('')
      const currentServerInfo = ref('')
      const editingServer = reactive({
        id: '',
        deviceName: '',
        backupNodes: []
      })

      // 获取可用的备份节点
      const availableBackupNodes = computed(() => {
        if (!editingServer.id) return []
        const currentNodeNames = editingServer.backupNodes.map(node => 
          typeof node === 'string' ? node : node.deviceName
        )
        return store.state.edgeServer.servers.filter(server => 
          server.id !== editingServer.id && 
          !currentNodeNames.includes(server.deviceName)
        )
      })

      // 根据状态获取标签类型
      const getStatusTagType = (status) => {
        switch (status) {
          case '在线':
            return 'success'
          case '离线':
            return 'danger'
          default:
            return 'default'
        }
      }

      // 根据状态获取标签效果
      const getStatusTagEffect = (status) => {
        return 'light'
      }

      // 导航到工作区
      const navigateToWorkbench = (server) => {
        // 生成对应设备的工作台，并按二级目录结构组织
        router.push(`/edgeserver/workspace/${server.id}`)
      }

      // 处理添加服务器点击
      const handleAddServerClick = () => {
        isEditDialog.value = false
        editingServerId.value = null
        resetServerForm()
        dialogVisible.value = true
      }

      // 处理编辑服务器
      const handleEditServer = (server) => {
        isEditDialog.value = true
        editingServerId.value = server.id
        serverForm.deviceName = server.deviceName
        serverForm.ipAddress = server.ipAddress
        dialogVisible.value = true
      }

      // 处理删除服务器
      const handleDeleteServer = (server) => {
        ElMessageBox.confirm(
          `确定要删除服务器 ${server.deviceName} 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          // 调用Vuex action删除服务器
          store.dispatch('edgeServer/deleteServer', server.id)
          ElMessage.success('EdgeServer删除成功')
        }).catch(() => {
          // 用户取消删除
        })
      }

      // 处理表单提交
      const handleSubmit = async () => {
        try {
          // 验证表单
          if (serverFormRef.value) {
            const valid = await new Promise((resolve) => {
              serverFormRef.value.validate((valid) => {
                resolve(valid)
              })
            })
            
            if (!valid) {
              return
            }
          }
          
          if (isEditDialog.value && editingServerId.value) {
            // 修改服务器
            store.dispatch('edgeServer/updateServer', {
              id: editingServerId.value,
              updates: {
                deviceName: serverForm.deviceName,
                ipAddress: serverForm.ipAddress
              }
            })
            ElMessage.success('EdgeServer修改成功')
          } else {
            // 添加服务器
            const serverData = {
              id: Date.now().toString(),
              deviceName: serverForm.deviceName,
              ipAddress: serverForm.ipAddress,
              status: '离线',
              backupNodes: []
            }
            store.dispatch('edgeServer/addServer', serverData)
            ElMessage.success(`EdgeServer ${serverForm.deviceName} 添加成功`)
          }
          
          // 关闭对话框
          dialogVisible.value = false
          
          // 重置表单
          resetServerForm()
          
        } catch (error) {
          ElMessage.error('操作失败，请重试')
          console.error('操作失败:', error)
        }
      }

      // 处理取消
      const handleCancel = () => {
        dialogVisible.value = false
        resetServerForm()
      }

      // 重置表单
      const resetServerForm = () => {
        serverForm.deviceName = ''
        serverForm.ipAddress = ''
        if (serverFormRef.value) {
          serverFormRef.value.resetFields()
        }
      }

      // 打开添加备份节点对话框
      const openAddBackupNodeDialog = (server) => {
        // 确保backupNodes是数组
        const backupNodes = Array.isArray(server.backupNodes) ? server.backupNodes : []
        // 转换字符串数组为对象数组以兼容显示
        const formattedBackupNodes = backupNodes.map(node => 
          typeof node === 'string' ? { deviceName: node, backupMethod: 'FeatureSync' } : node
        )
        
        Object.assign(editingServer, { ...server, backupNodes: formattedBackupNodes })
        currentServerInfo.value = server.deviceName
        selectedBackupNode.value = ''
        selectedBackupMethod.value = 'FeatureSync'
        backupNodeDialogVisible.value = true
      }

      // 添加备份节点
      const addBackupNode = () => {
        if (!selectedBackupNode.value) {
          ElMessage.warning('请选择要添加的备份节点')
          return
        }
        
        const backupNode = {
          deviceName: selectedBackupNode.value,
          backupMethod: selectedBackupMethod.value
        }
        
        // 调用Vuex action添加备份节点
        store.dispatch('edgeServer/addBackupNode', {
          serverId: editingServer.id,
          backupNode
        })
        
        ElMessage.success('备份节点添加成功')
        backupNodeDialogVisible.value = false
      }

      // 编辑备份节点
      const editBackupNodes = (server) => {
        // 确保backupNodes是数组
        const backupNodes = Array.isArray(server.backupNodes) ? server.backupNodes : []
        // 转换字符串数组为对象数组以兼容编辑
        const formattedBackupNodes = backupNodes.map(node => 
          typeof node === 'string' ? { deviceName: node, backupMethod: 'FeatureSync' } : node
        )
        
        Object.assign(editingServer, { ...server, backupNodes: formattedBackupNodes })
        currentServerInfo.value = server.deviceName
        editBackupNodesDialogVisible.value = true
      }

      // 添加更多备份节点（在编辑对话框中）
      const addMoreBackupNode = () => {
        editBackupNodesDialogVisible.value = false
        setTimeout(() => {
          backupNodeDialogVisible.value = true
        }, 300)
      }

      // 从编辑列表中移除备份节点
      const removeBackupNodeFromEdit = (nodeName) => {
        ElMessageBox.confirm('确定要删除该备份节点吗？', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          store.dispatch('edgeServer/removeBackupNode', {
            serverId: editingServer.id,
            nodeName
          })
          ElMessage.success('删除成功')
          // 更新本地编辑状态
          editingServer.backupNodes = editingServer.backupNodes.filter(
            node => (typeof node === 'string' ? node : node.deviceName) !== nodeName
          )
        }).catch(() => {
          // 取消删除
        })
      }

      // 保存备份节点修改
      const saveBackupNodesChanges = () => {
        // 遍历所有修改的备份节点并更新
        editingServer.backupNodes.forEach(node => {
          if (typeof node === 'object') {
            store.dispatch('edgeServer/updateBackupNode', {
              serverId: editingServer.id,
              nodeName: node.deviceName,
              updates: { backupMethod: node.backupMethod }
            })
          }
        })
        
        ElMessage.success('备份节点修改保存成功')
        editBackupNodesDialogVisible.value = false
      }

      // 处理操作命令
      const handleActionCommand = (command, server) => {
        switch (command) {
          case 'editBackupNodes':
            editBackupNodes(server)
            break
          case 'editServer':
            handleEditServer(server)
            break
          case 'deleteServer':
            handleDeleteServer(server)
            break
        }
      }
      
      // 组件挂载时的初始化
      onMounted(() => {
        // 这里可以添加初始数据加载逻辑
      })

      return {
        serverList,
        dialogVisible,
        isEditDialog,
        serverForm,
        serverRules,
        formLabelWidth,
        serverFormRef,
        
        // 备份节点相关
        backupNodeDialogVisible,
        editBackupNodesDialogVisible,
        selectedBackupNode,
        selectedBackupMethod,
        currentServerInfo,
        editingServer,
        availableBackupNodes,

        navigateToWorkbench,
        handleAddServerClick,
        handleEditServer,
        handleDeleteServer,
        handleSubmit,
        handleCancel,
        
        // 备份节点相关方法
        openAddBackupNodeDialog,
        addBackupNode,
        editBackupNodes,
        addMoreBackupNode,
        removeBackupNodeFromEdit,
        saveBackupNodesChanges,
        handleActionCommand
      }
    }
})
</script>

<style scoped>
.edge-server-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.backup-nodes-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-node-item {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  padding: 3px 10px;
  margin-right: 8px;
  margin-bottom: 4px;
  color: #1890ff;
  font-size: 13px;
  display: inline-block;
}

.backup-method-label {
  color: #67c23a;
  font-size: 12px;
  margin-left: 4px;
}

.no-backup-nodes {
  color: #909399;
  margin-bottom: 8px;
}

.backup-actions {
  display: flex;
  gap: 5px;
}

.table-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dialog-content {
  padding: 10px 0;
}

.dialog-content > div {
  margin-bottom: 15px;
}

.dialog-content span {
  display: inline-block;
  width: 100px;
  text-align: right;
  margin-right: 10px;
}

.dialog-content .el-select,
.dialog-content .el-input {
  width: 300px;
}
</style>