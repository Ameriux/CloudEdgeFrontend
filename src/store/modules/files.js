export default {
  namespaced: true,
  state: {
    uploadedFiles: [], // 存储已上传的文件列表
    // 客户端特定的数据存储，确保切换客户端时数据不丢失
    clientData: {
      // 上传相关数据，按客户端ID组织
      upload: {},
      // 下载相关数据，按客户端ID组织
      download: {}
    },
    previousTotalDataSize: 0 // 存储上一次的总下载大小（不分客户端）
  },
  mutations: {
    // 添加上传的文件
    ADD_UPLOADED_FILE(state, file) {
      // 检查文件是否已存在
      const existingFileIndex = state.uploadedFiles.findIndex(f => f.hash === file.hash)
      if (existingFileIndex === -1) {
        state.uploadedFiles.push(file)
      } else {
        // 如果文件已存在，更新信息
        state.uploadedFiles[existingFileIndex] = file
      }
    },
    // 移除上传的文件
    REMOVE_UPLOADED_FILE(state, fileHash) {
      state.uploadedFiles = state.uploadedFiles.filter(file => file.hash !== fileHash)
    },
    // 清空上传的文件
    CLEAR_UPLOADED_FILES(state) {
      state.uploadedFiles = []
    },
    // 初始化客户端上传数据
    INIT_CLIENT_UPLOAD_DATA(state, clientId) {
      if (!state.clientData.upload[clientId]) {
        state.clientData.upload[clientId] = {
          chunkSize: 0,
          chunkProcessingTime: 0,
          dataSendDelay: 0,
          uploadDataSize: 0,
          singleFileData: [],
          logOutput: ''
        }
      }
    },
    // 初始化客户端下载数据
    INIT_CLIENT_DOWNLOAD_DATA(state, clientId) {
      if (!state.clientData.download[clientId]) {
        state.clientData.download[clientId] = {
          dataWriteDelay: 0,
          downloadDataSize: 0,
          singleFileData: [],
          logOutput: ''
        }
      }
    },
    // 更新客户端上传数据
    UPDATE_CLIENT_UPLOAD_DATA(state, { clientId, data }) {
      if (!state.clientData.upload[clientId]) {
        state.clientData.upload[clientId] = {}
      }
      state.clientData.upload[clientId] = { ...state.clientData.upload[clientId], ...data }
    },
    // 更新客户端下载数据
    UPDATE_CLIENT_DOWNLOAD_DATA(state, { clientId, data }) {
      if (!state.clientData.download[clientId]) {
        state.clientData.download[clientId] = {}
      }
      state.clientData.download[clientId] = { ...state.clientData.download[clientId], ...data }
    },
    // 添加日志到客户端上传数据
    APPEND_CLIENT_UPLOAD_LOG(state, { clientId, logMessage }) {
      if (!state.clientData.upload[clientId]) {
        state.clientData.upload[clientId] = { logOutput: '' }
      }
      state.clientData.upload[clientId].logOutput += logMessage
    },
    // 添加日志到客户端下载数据
    APPEND_CLIENT_DOWNLOAD_LOG(state, { clientId, logMessage }) {
      if (!state.clientData.download[clientId]) {
        state.clientData.download[clientId] = { logOutput: '' }
      }
      state.clientData.download[clientId].logOutput += logMessage
    },
    // 更新上一次总下载大小
    UPDATE_PREVIOUS_TOTAL_DATA_SIZE(state, totalDataSize) {
      state.previousTotalDataSize = totalDataSize
    }
  },
  actions: {
    // 添加上传的文件
    addUploadedFile({
      commit
    }, file) {
      commit('ADD_UPLOADED_FILE', file)
    },
    // 移除上传的文件
    removeUploadedFile({
      commit
    }, fileHash) {
      commit('REMOVE_UPLOADED_FILE', fileHash)
    },
    // 清空上传的文件
    clearUploadedFiles({
      commit
    }) {
      commit('CLEAR_UPLOADED_FILES')
    },
    // 初始化客户端上传数据
    initClientUploadData({
      commit
    }, clientId) {
      commit('INIT_CLIENT_UPLOAD_DATA', clientId)
    },
    // 初始化客户端下载数据
    initClientDownloadData({
      commit
    }, clientId) {
      commit('INIT_CLIENT_DOWNLOAD_DATA', clientId)
    },
    // 更新客户端上传数据
    updateClientUploadData({
      commit
    }, { clientId, data }) {
      commit('UPDATE_CLIENT_UPLOAD_DATA', { clientId, data })
    },
    // 更新客户端下载数据
    updateClientDownloadData({
      commit
    }, { clientId, data }) {
      commit('UPDATE_CLIENT_DOWNLOAD_DATA', { clientId, data })
    },
    // 添加日志到客户端上传数据
    appendClientUploadLog({
      commit
    }, { clientId, logMessage }) {
      commit('APPEND_CLIENT_UPLOAD_LOG', { clientId, logMessage })
    },
    // 添加日志到客户端下载数据
    appendClientDownloadLog({ commit }, { clientId, logMessage }) {
      commit('APPEND_CLIENT_DOWNLOAD_LOG', { clientId, logMessage })
    },
    // 更新上一次总下载大小
    updatePreviousTotalDataSize({ commit }, totalDataSize) {
      commit('UPDATE_PREVIOUS_TOTAL_DATA_SIZE', totalDataSize)
    }
  },
  getters: {
    // 获取所有上传的文件
    getAllUploadedFiles: state => state.uploadedFiles,
    // 根据哈希值获取文件
    getFileByHash: state => hash => state.uploadedFiles.find(file => file.hash === hash),
    // 根据客户端ID获取文件列表
    getFilesByClientId: state => clientId => state.uploadedFiles.filter(file => file.clientId === clientId),
    // 获取客户端上传数据
    getClientUploadData: state => clientId => {
      if (!state.clientData.upload[clientId]) {
        return {
          chunkSize: 0,
          chunkProcessingTime: 0,
          dataSendDelay: 0,
          uploadDataSize: 0,
          singleFileData: [],
          logOutput: ''
        }
      }
      return state.clientData.upload[clientId]
    },
    // 获取客户端下载数据
    getClientDownloadData: state => clientId => {
      if (!state.clientData.download[clientId]) {
        return {
          dataWriteDelay: 0,
          downloadDataSize: 0,
          singleFileData: [],
          logOutput: ''
        }
      }
      return state.clientData.download[clientId]
    },
    // 获取上一次的总下载大小
    getPreviousTotalDataSize: state => state.previousTotalDataSize
  }
}