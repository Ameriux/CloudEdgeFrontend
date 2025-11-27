<template>
  <div class="workbench-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>CloudServer - 工作台 1</span>
          <el-button type="primary" size="small" @click="createNewWorkbench">新建工作台</el-button>
        </div>
      </template>

      <div class="command-input">
        <el-input
          v-model="command"
          placeholder="请输入指令"
          style="width: 80%"
        ></el-input>
        <el-button type="primary" @click="executeCommand">执行</el-button>
      </div>

      <div style="margin: 10px 0;">
        <el-button type="success" size="small" @click="fetchAllData">更新数据</el-button>
      </div>

      <div class="metrics-display">
        <h3>数据展示（数据存储）</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic
              v-model:value="inputDataSize"
              title="传入数据大小"
              suffix="B"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="redundancyReductionTime"
              title="冗余数据缩减时间"
              suffix="ms"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="actualStorageSize"
              title="实际存储数据大小"
              suffix="B"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="backupSyncDelay"
              title="单边缘备份同步延迟"
              suffix="ms"
            />
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="6">
            <el-statistic
              v-model:value="dedupSize"
              title="去重数据量"
              suffix="B"
            />
          </el-col>
        </el-row>
      </div>

      <div class="container-form">
        <h3>Container 数据</h3>
        <el-table :data="containerData" style="width: 100%">
          <el-table-column prop="name" label="名称" min-width="150"></el-table-column>
          <el-table-column prop="size" label="大小 (B)" min-width="120"></el-table-column>
          <el-table-column prop="lastModified" label="修改时间"></el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="text" @click="openContentModal(scope.row)">打开内容</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="file-recipe-form">
        <h3>File Recipe 数据</h3>
        <el-table :data="fileRecipeData" style="width: 100%">
          <el-table-column prop="name" label="名称" min-width="150"></el-table-column>
          <el-table-column prop="size" label="大小 (B)" min-width="120"></el-table-column>
          <el-table-column prop="lastModified" label="修改时间"></el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="text" @click="openContentModal(scope.row)">打开内容</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="log-output">
        <h3>日志输出</h3>
        <el-input
          ref="logTextareaRef"
          type="textarea"
          :rows="15"
          v-model="logOutput"
          readonly
          placeholder="指令执行日志将显示在这里"
        ></el-input>
        <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
          <el-button type="primary" size="small" @click="detectLog">日志检测</el-button>
        </div>
      </div>

      <div class="log-detect-output" v-if="showLogDetect">
        <h3>日志检测结果</h3>
        <el-input
          ref="logDetectTextareaRef"
          type="textarea"
          :rows="10"
          v-model="logDetectOutput"
          readonly
          placeholder="日志检测结果将显示在这里"
        ></el-input>
      </div>
    </el-card>

    <!-- 内容展示弹窗 -->
    <el-dialog
      :title="contentModalTitle"
      v-model="contentModalVisible"
      width="70%"
      center
    >
      <div class="content-modal-body">
        <el-input
          v-model="contentModalContent"
          type="textarea"
          placeholder="内容加载中..."
          :rows="20"
          readonly
          style="font-family: monospace; font-size: 14px;"
        ></el-input>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, nextTick, watch, computed } from 'vue'
import { ElStatistic } from 'element-plus'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'CloudWorkbench1',
  setup() {
    const store = useStore()
    const command = ref('')
    const logOutput = ref('')
    const logDetectOutput = ref('')
    const showLogDetect = ref(false)
    
    // 添加日志输入框的引用
    const logTextareaRef = ref(null)
    const logDetectTextareaRef = ref(null)
    
    // 从store获取数据
    const containerData = computed(() => store.getters['cloudServer/getAllData'].containerData)
    const fileRecipeData = computed(() => store.getters['cloudServer/getAllData'].fileRecipeData)
    const inputDataSize = computed(() => store.getters['cloudServer/getAllData'].inputDataSize)
    const redundancyReductionTime = computed(() => store.getters['cloudServer/getAllData'].redundancyReductionTime)  // dedup_time
    const actualStorageSize = computed(() => store.getters['cloudServer/getAllData'].actualStorageSize)  // store_data_size
    const backupSyncDelay = computed(() => store.getters['cloudServer/getAllData'].backupSyncDelay)  // migration_time
    const dedupSize = computed(() => store.getters['cloudServer/getAllData'].dedupSize)
    const timeUnit = computed(() => store.getters['cloudServer/getAllData'].timeUnit)
    const sizeUnit = computed(() => store.getters['cloudServer/getAllData'].sizeUnit)
    const fullLogContent = computed(() => store.getters['cloudServer/getAllData'].fullLogContent)

    const incrementalSyncTraffic = ref(0)
    const incrementalSyncTime = ref(0)
    
    // 取消自动生成数据
    const generateMockData = () => {
      // 不生成任何模拟数据
    }

    // 保持数据为0
    const updateMetrics = () => {
      incrementalSyncTraffic.value = 0
      incrementalSyncTime.value = 0
    }

    // 从/migration/info接口获取数据
    const fetchMigrationInfo = () => {
      console.log('正在获取迁移信息...')
      return fetch('/api-internal/migration/info')
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            // 打印完整响应数据以便调试
            console.log('迁移信息响应数据:', data)
            
            // 将数据提交到store
            store.commit('cloudServer/UPDATE_MIGRATION_DATA', data)

            console.log('获取迁移信息成功')
          } else {
            console.log(`获取迁移信息失败: ${data.message || '未知错误'}`)
          }
          return data
        })
        .catch(error => {
          console.error(`获取迁移信息出错: ${error.message}`)
          return Promise.reject(error)
        })
    }

    // 调用容器信息接口
    const fetchContainerInfo = () => {
      console.log('正在获取容器信息...')
      return fetch('/api-internal/cloud/container/info')
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            // 打印完整响应数据以便调试
            console.log('容器信息原始响应数据:', data)
            
            // 接口返回的数据在data.files中
            const containerInfo = (data.files || []).map(item => {
              // 调试每个item的结构
              console.log('容器项数据:', item)
              console.log('last_modified存在性:', item.last_modified !== undefined)
              
              // 优先使用last_modified，如果不存在则使用create_time作为备选
              const timeField = item.last_modified || item.create_time;
              
              return {
                name: item.name || '未知名称',
                size: item.size || 0, // 直接使用原始大小
                lastModified: timeField ? new Date(timeField).toLocaleString() : '未知时间',
                content: item.content || '' // 保留content字段，用于弹窗显示
              }
            })
            // 将数据提交到store
            store.commit('cloudServer/UPDATE_CONTAINER_DATA', containerInfo)
            console.log(`获取容器信息成功，共${containerInfo.length}条记录`)
            return containerInfo
          } else {
            console.log(`获取容器信息失败: ${data.message || '未知错误'}`)
            return Promise.reject(new Error(`获取容器信息失败: ${data.message || '未知错误'}`))
          }
        })
        .catch(error => {
          console.error(`获取容器信息出错: ${error.message}`)
          return Promise.reject(error)
        })
    }

    // 调用文件配方信息接口
    const fetchFileRecipeInfo = () => {
      console.log('正在获取文件配方信息...')
      return fetch('/api-internal/cloud/file/recipe/info')
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            // 打印完整响应数据以便调试
            console.log('文件配方原始响应数据:', data)
            
            // 接口返回的数据在data.files中
            const fileRecipeInfo = (data.files || []).map(item => {
              // 调试每个item的结构
              console.log('文件配方项数据:', item)
              console.log('last_modified存在性:', item.last_modified !== undefined)
              
              // 优先使用last_modified，如果不存在则使用create_time作为备选
              const timeField = item.last_modified || item.create_time;
              
              return {
                name: item.name || '未知名称',
                size: item.size || 0, // 直接使用原始大小
                lastModified: timeField ? new Date(timeField).toLocaleString() : '未知时间',
                content: item.content || '' // 保留content字段，用于弹窗显示
              }
            })
            // 将数据提交到store
            store.commit('cloudServer/UPDATE_FILE_RECIPE_DATA', fileRecipeInfo)
            console.log(`获取文件配方信息成功，共${fileRecipeInfo.length}条记录`)
            return fileRecipeInfo
          } else {
            console.log(`获取文件配方信息失败: ${data.message || '未知错误'}`)
            return Promise.reject(new Error(`获取文件配方信息失败: ${data.message || '未知错误'}`))
          }
        })
        .catch(error => {
          console.error(`获取文件配方信息出错: ${error.message}`)
          return Promise.reject(error)
        })
    }

    // 更新所有数据
    const fetchAllData = () => {
      console.log('开始更新所有数据...')
      
      // 先保存当前日志内容
      const currentLogContent = logOutput.value;
      
      // 先获取最新日志内容
      fetchCloudLog().then(() => {
        const newLogContent = logOutput.value;
        
        // 检查日志是否发生变化
        const logContentChanged = currentLogContent !== newLogContent;
        
        if (logContentChanged) {
          // 只有当日志发生变化时，才调用数据接口获取最新数据
          console.log('日志发生变化，开始获取最新数据...');
          
          // 并行调用所有接口
          Promise.all([
            fetchMigrationInfo(),
            fetchContainerInfo(),
            fetchFileRecipeInfo()
          ])
            .then(results => {
              console.log('所有接口数据获取完成');
              
              // 更新上次日志内容
              store.commit('cloudServer/UPDATE_LAST_LOG_CONTENT', newLogContent);
              
              // 输出每个接口的返回值到控制台
              console.log('\n===== 接口返回值 =====');
              console.log('1. 迁移信息接口返回值:', results[0]);
              console.log('2. 容器信息接口返回值:', results[1]);
              console.log('3. 文件配方信息接口返回值:', results[2]);
              console.log('======================');
              
              // 额外添加数据更新日志到控制台
              console.log('\n===== 数据更新状态 =====');
              console.log('传入数据大小:', inputDataSize.value, 'B');
              console.log('冗余数据缩减时间:', redundancyReductionTime.value, 'ms');
              console.log('实际存储数据大小:', actualStorageSize.value, 'KB');
              console.log('单边缘备份同步延迟:', backupSyncDelay.value, 'ms');
              console.log('去重数据量:', dedupSize.value, 'KB');
              console.log('容器数据数量:', containerData.value.length, '条');
              console.log('文件配方数据数量:', fileRecipeData.value.length, '条');
              console.log('========================');
            })
            .catch(error => {
              console.error('部分接口数据获取失败');
              console.error('错误详情:', error.message);
            });
        } else {
          // 如果日志没有发生变化，检查是否所有本次数据都为0
          const allCurrentDataZero = store.getters['cloudServer/allCurrentDataZero'];
          
          // 检查是否是首次加载或上次日志内容为空
          const isFirstLoad = !currentLogContent || currentLogContent === '';
          
          if (allCurrentDataZero && !isFirstLoad) {
            // 只有不是首次加载且所有本次数据都为0时，才弹出提示
            console.log('没有发生新的迁移！');
            alert('没有发生新的迁移！');
          }
          return;
        }
      })
      .catch(error => {
        console.error('日志获取失败');
        console.error('错误详情:', error.message);
      })
    }

    // 从/cloud/log接口获取CloudServer日志
    const fetchCloudLog = () => {
      console.log('正在获取CloudServer日志...');
      // 保存当前日志内容以便比较
      const oldLogContent = logOutput.value;
      // 清空日志输出框，只显示当前获取的CloudServer日志
      logOutput.value = '';
      
      return fetch('/api-internal/cloud/log')
        .then(response => {
          if (!response.ok) {
            throw new Error(`CloudServer日志接口响应错误: ${response.status}`);
          }
          // 打印原始响应文本到控制台以便调试
          return response.text().then(text => {
            console.log('CloudServer日志API原始响应:', text);
            // 尝试解析为JSON
            try {
              return JSON.parse(text);
            } catch (e) {
              // 非JSON格式，直接返回文本
              return text;
            }
          });
        })
        .then(data => {
          // 优先检查是否有cloud_log字段
          if (typeof data === 'object' && data !== null && data.cloud_log) {
            if (typeof data.cloud_log === 'string') {
              // 处理字符串格式的日志
              logOutput.value = data.cloud_log.replace(/\\n/g, '\n');
            } else if (Array.isArray(data.cloud_log)) {
              // 处理数组格式的日志
              logOutput.value = data.cloud_log.join('\n');
            } else if (typeof data.cloud_log === 'object') {
              // 处理对象格式的日志
              logOutput.value = JSON.stringify(data.cloud_log, null, 2).replace(/\\n/g, '\n');
            }
            console.log('CloudServer日志获取成功(cloud_log字段)');
          } else if (Array.isArray(data)) {
            // 处理数组格式的日志
            logOutput.value = data.join('\n');
            console.log('CloudServer日志获取成功(数组格式)');
          } else if (typeof data === 'string') {
            // 处理纯文本格式的日志
            logOutput.value = data.replace(/\\n/g, '\n');
            console.log('CloudServer日志获取成功(非JSON格式)');
          } else if (typeof data === 'object' && data !== null) {
            // 处理其他对象格式的日志
            logOutput.value = JSON.stringify(data, null, 2).replace(/\\n/g, '\n');
            console.log('CloudServer日志获取成功(JSON对象)');
          } else {
            logOutput.value = '获取到的CloudServer日志格式不匹配';
            console.log('获取到的CloudServer日志格式不匹配');
          }
          
          // 将日志内容保存到store中
          store.commit('cloudServer/UPDATE_FULL_LOG_CONTENT', logOutput.value);
        })
        .catch(error => {
          logOutput.value = `获取CloudServer日志失败: ${error.message}`;
          console.error('获取CloudServer日志失败:', error);
        });
    }

    // 组件挂载时初始化
    onMounted(() => {
      updateMetrics() // 初始更新
      // 从store获取保存的完整日志内容
      if (fullLogContent.value) {
        logOutput.value = fullLogContent.value;
      }
      // 不生成初始模拟数据
      // 不自动获取初始日志，只有在用户点击更新数据按钮时才获取日志
    })

    // 日志检测功能
    const detectLog = () => {
      console.log('开始日志检测...');
      // 显示检测结果输出框
      showLogDetect.value = true;
      // 清空之前的检测结果
      logDetectOutput.value = '正在进行日志检测，请稍候...';
      
      // 获取当前日志内容
      const currentLog = logOutput.value;
      
      if (!currentLog || currentLog.trim() === '') {
        logDetectOutput.value = '当前没有可检测的日志内容，请先获取日志。';
        return;
      }
      
      // 调用日志检测接口
      fetch('/api-internal/log/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          log: currentLog,
          type: 'cloud'
        })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`日志检测接口响应错误: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('日志检测结果:', data);
          // 格式化检测结果以便显示
          if (data.summary) {
            // 如果有summary字段，优先显示summary
            logDetectOutput.value = data.summary + '\n\n' + (data.details || '');
          } else if (typeof data === 'object') {
            // 显示整个对象
            logDetectOutput.value = JSON.stringify(data, null, 2).replace(/\\n/g, '\n');
          } else {
            // 显示字符串结果
            logDetectOutput.value = String(data);
          }
        })
        .catch(error => {
          console.error('日志检测失败:', error);
          logDetectOutput.value = `日志检测失败: ${error.message}`;
        });
    }

    const executeCommand = () => {
      if (!command.value.trim()) {
        console.log('请输入指令')
        return
      }

      // 这里预留后端接口位置
      console.log(`执行指令: ${command.value}`)

      // 模拟指令执行
      setTimeout(() => {
        console.log(`指令执行完成，结果: 成功`);
        // 执行命令后获取最新日志
        fetchCloudLog();
      }, 1000)
    }

    const createNewWorkbench = () => {
      // 这里预留后端接口位置
      console.log('已创建新的工作台');
      // 实际应用中可以打开一个新的标签页或弹窗
      alert('新建工作台功能将在实际应用中实现')
    }

    // 滚动到文本框底部的辅助函数
    const scrollToBottom = (textareaRef) => {
      if (textareaRef.value) {
        const textarea = textareaRef.value.$el.querySelector('textarea')
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight
        }
      }
    }
    
    // 监听日志输出变化，自动滚动到底部
    const unwatchLog = watch(logOutput, () => {
      nextTick(() => {
        scrollToBottom(logTextareaRef)
      })
    })
    
    // 监听日志检测结果变化，自动滚动到底部
    const unwatchLogDetect = watch(logDetectOutput, () => {
      nextTick(() => {
        scrollToBottom(logDetectTextareaRef)
      })
    })
    
    // 内容展示弹窗相关状态
    const contentModalVisible = ref(false);
    const contentModalTitle = ref('');
    const contentModalContent = ref('');

    // 打开内容弹窗
    const openContentModal = (item, type) => {
      contentModalTitle.value = item.name;
      // 从接口响应的content字段获取内容
      contentModalContent.value = item.content || '暂无内容数据';
      contentModalVisible.value = true;
    }

    return {
      command,
      logOutput,
      logDetectOutput,
      showLogDetect,
      executeCommand,
      createNewWorkbench,
      fetchAllData,
      detectLog,
      dedupSize,
      inputDataSize,
      redundancyReductionTime,
      actualStorageSize,
      backupSyncDelay,
      incrementalSyncTraffic,
      incrementalSyncTime,
      containerData,
      fileRecipeData,
      logTextareaRef,
      logDetectTextareaRef,
      contentModalVisible,
      contentModalTitle,
      contentModalContent,
      openContentModal
    }
  }
})
</script>

<style scoped>
.workbench-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.command-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.container-form,
.file-recipe-form {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.log-output {
  margin-top: 20px;
  }

  .log-detect-output {
    margin-top: 20px;
  }

  .metrics-display {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.el-statistic {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>