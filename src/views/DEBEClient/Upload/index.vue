<template>
  <div class="upload-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文件上传</span>
          <el-button type="primary" size="small" @click="createNewWorkspace">新建工作区</el-button>
        </div>
      </template>

      <div class="upload-area">
        <el-upload
          class="upload-demo"
          action="#"
          :on-change="handleFileChange"
          :auto-upload="false"
          :file-list="fileList"
        >
          <el-button type="primary"><el-icon><Plus /></el-icon>选择文件</el-button>
        </el-upload>
      </div>

      <div class="algorithm-selection">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密钥哈希算法">
              <el-select v-model="hashAlgorithm" placeholder="请选择算法">
                <el-option label="SHA_1" value="sha_1"></el-option>
                <el-option label="SHA_256" value="sha_256"></el-option>
                <el-option label="MD5" value="md5"></el-option>
                <el-option label="SM3" value="sm3"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件加解密算法">
              <el-select v-model="encryptionAlgorithm" placeholder="请选择算法">
                <el-option label="AES_128_CFB" value="aes_128_cfb"></el-option>
                <el-option label="AES_128_GCM" value="aes_128_gcm"></el-option>
                <el-option label="AES_256_CFB" value="aes_256_cfb"></el-option>
                <el-oprion label="AES_256_GCM" value="aes_256_gcm"></el-oprion>
                <el-option label="SM4" value="sm4"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密钥交换算法">
              <el-select v-model="asymmetricEncryptionAlgorithm" placeholder="请选择算法">
                <el-option label="椭圆曲线加密算法" value="ecc"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label=" 安全传输算法">
              <el-select v-model="otherAlgorithm" placeholder="请选择算法">
                <el-option label="连接安全算法" value="connection_security"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="file-preview">
        <h3>文件预览列表</h3>
        <el-table :data="previewFiles" style="width: 100%">
          <el-table-column prop="id" label="序号" width="80"></el-table-column>
          <el-table-column prop="name" label="文件路径" width="300"></el-table-column>
          <el-table-column prop="hash" label="哈希值"></el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="scope">
              <el-button type="danger" size="small" @click="removeFile(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="upload-action">
        <el-button type="primary" size="medium" @click="uploadFiles">上传文件</el-button>
      </div>

      <div class="metrics-display">
        <h3>数据展示</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic
              v-model:value="chunkSize"
              title="分块大小"
              suffix="KB"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="chunkProcessingTime"
              title="分块处理时间"
              suffix="ms"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="dataSendDelay"
              title="数据发送延迟"
              suffix="ms"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              v-model:value="uploadDataSize"
              title="上传数据大小"
              suffix="MB"
            />
          </el-col>
        </el-row>
      </div>

      <div class="single-file-data">
        <h3>单个文件数据</h3>
        <el-table :data="singleFileData" style="width: 100%" :height="tableHeight">
          <el-table-column prop="id" label="序号" :width="80"></el-table-column>
          <el-table-column prop="fileName" label="文件名" :width="200"></el-table-column>
          <el-table-column prop="chunkSize" label="分块大小(KB)" :width="150"></el-table-column>
          <el-table-column prop="chunkProcessingTime" label="分块处理时间(ms)" :width="180"></el-table-column>
          <el-table-column prop="dataSendDelay" label="数据发送延迟(ms)" :width="180"></el-table-column>
          <el-table-column prop="uploadDataSize" label="上传数据大小(MB)" :width="180"></el-table-column>
        </el-table>
      </div>

      <div class="log-output">
        <h3>日志输出</h3>
        <el-input
          type="textarea"
          :rows="10"
          v-model="logOutput"
          readonly
          placeholder="上传日志将显示在这里"
        ></el-input>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElStatistic } from 'element-plus'

export default defineComponent({
  name: 'Upload',
  setup() {
    const fileList = ref([])
    const previewFiles = ref([])
    const hashAlgorithm = ref('sha_1')
    const encryptionAlgorithm = ref('aes_128_cfb')
    const asymmetricEncryptionAlgorithm = ref('ecc')
    const otherAlgorithm = ref('connection_security')
    const logOutput = ref('')
    let fileIdCounter = 1

    // 指标数据
    const chunkSize = ref(0)
    const chunkProcessingTime = ref(0)
    const dataSendDelay = ref(0)
    const uploadDataSize = ref(0)

    // 模拟指标数据更新
    const updateMetrics = () => {
      // 随机生成一些合理的指标值
      chunkSize.value = Math.floor(Math.random() * 100) + 100; // 100-199 KB
      chunkProcessingTime.value = Math.floor(Math.random() * 200) + 50; // 50-249 ms
      dataSendDelay.value = Math.floor(Math.random() * 100) + 10; // 10-109 ms
      uploadDataSize.value = Math.floor(Math.random() * 1000) / 10; // 0-100 MB
    }

    // 单个文件数据
    const singleFileData = ref([])
    const tableHeight = ref(300)

    // 创建新工作区
    const createNewWorkspace = () => {
      // 这里预留后端接口位置
      logOutput.value += '已创建新的工作区\n'
    }

    // 处理窗口大小变化
    const handleResize = () => {
      // 简单计算表格高度，可根据实际需求调整
      tableHeight.value = window.innerHeight - 600
    }

    // 组件挂载时初始化指标数据
    onMounted(() => {
      updateMetrics();
      // 每5秒更新一次指标数据
      setInterval(updateMetrics, 5000);

      // 初始化表格高度
      handleResize();
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize);

      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });

    const handleFileChange = (file, fileList) => {
      // 生成随机哈希值（实际应用中应该计算真实的哈希值）
      const randomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // 添加到预览列表
      previewFiles.value.push({
        id: fileIdCounter++,
        name: file.name,
        hash: randomHash
      })

      // 记录日志
      logOutput.value += `已选择文件: ${file.name}\n`
    }

    const removeFile = (id) => {
      // 从预览列表中删除文件
      previewFiles.value = previewFiles.value.filter(file => file.id !== id)

      // 记录日志
      logOutput.value += `已删除文件: ${previewFiles.value.find(file => file.id === id)?.name || '未知文件'}\n`
    }

    // 模拟生成单个文件数据
    const generateSingleFileData = () => {
      // 清空表格数据
      singleFileData.value = [];

      // 为每个预览文件生成详细数据
      previewFiles.value.forEach((file, index) => {
        // 随机生成一些合理的指标值
        const fileChunkSize = Math.floor(Math.random() * 100) + 100; // 100-199 KB
        const fileChunkProcessingTime = Math.floor(Math.random() * 200) + 50; // 50-249 ms
        const fileDataSendDelay = Math.floor(Math.random() * 100) + 10; // 10-109 ms
        const fileUploadDataSize = (Math.floor(Math.random() * 1000) / 10).toFixed(1); // 0-100 MB

        // 添加到表格数据
        singleFileData.value.push({
          id: index + 1,
          fileName: file.name,
          chunkSize: fileChunkSize,
          chunkProcessingTime: fileChunkProcessingTime,
          dataSendDelay: fileDataSendDelay,
          uploadDataSize: fileUploadDataSize
        });
      });
    }

    const uploadFiles = () => {
      if (previewFiles.value.length === 0) {
        logOutput.value += '请先选择要上传的文件\n'
        return
      }

      // 这里预留后端接口位置
      logOutput.value += '日志输出将展示在这里\n'
      // 模拟生成单个文件数据
      generateSingleFileData();

      // 模拟上传进度
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        logOutput.value += `上传进度: ${progress}%\n`

        if (progress >= 100) {
          clearInterval(interval)
          logOutput.value += '上传完成\n'
        }
      }, 500)
    }

      // 模拟上传进度
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        logOutput.value += `上传进度: ${progress}%\n`

        if (progress >= 100) {
          clearInterval(interval)
          logOutput.value += '上传完成\n'
        }
      }, 500)

      return {
        fileList,
        previewFiles,
        hashAlgorithm,
        encryptionAlgorithm,
        asymmetricEncryptionAlgorithm,
        otherAlgorithm,
        logOutput,
        handleFileChange,
        removeFile,
        uploadFiles,
        createNewWorkspace,
        chunkSize,
        chunkProcessingTime,
        dataSendDelay,
        uploadDataSize,
        singleFileData,
        tableHeight,
        generateSingleFileData
      }
    }

    
})
</script>

<style scoped>
.upload-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-area {
  margin-bottom: 20px;
  text-align: center;
}

.metrics-display {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.single-file-data {
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

.algorithm-selection {
  margin-bottom: 20px;
}

.file-preview {
  margin-bottom: 20px;
}

.upload-action {
  margin-bottom: 20px;
  text-align: center;
}

.log-output {
  margin-top: 20px;
}
</style>