export default {
  namespaced: true,
  state: {
    // 当前选中的EdgeServer
    currentServer: null,
    // EdgeServer设备列表
    servers: [
      {
        id: '1',
        deviceName: 'EdgeServer-node2',
        ipAddress: '192.168.104.8',
        backupNodes: []
      },
      {
        id: '2',
        deviceName: 'EdgeServer-node3',
        ipAddress: '192.168.104.4',
        backupNodes: []
      },
      {
        id: '3',
        deviceName: 'EdgeServer-node4',
        ipAddress: '192.168.104.5',
        backupNodes: []
      }
    ],
    // 增量同步记录
    incrementalSyncRecords: {}, // 格式: { deviceId: { 'FeatureSync': [record1, record2], 'Rsync': [record1, record2] } }
    // 设备视图模式映射
    deviceViewModes: {}, // 存储格式: { deviceId: 'viewMode' }
    // 上传数据
    totalEncryptionDelay: 0,  // 累计加密延迟
    lastEncryptionDelay: 0,   // 上次上传的加密延迟（差值）
    totalMetaEncryptionDelay: 0,  // 累计元数据加密延迟
    metaEncryptionDelay: 0,   // 上次上传的元数据加密延迟（差值）
    totalEncryptedSize: 0,    // 累计加密数据大小
    encryptedSize: 0,         // 上次上传的加密数据大小（差值）
    totalReductionTime: 0,    // 累计数据缩减时间
    reductionTime: 0,         // 上次上传的数据缩减时间（差值）
    totalReducedSize: 0,      // 累计缩减后数据大小
    reducedSize: 0,           // 上次上传的缩减后数据大小（差值）
    totalUniqueDataSize: 0,   // 累计去重后数据大小
    uniqueDataSize: 0,        // 上次上传的去重后数据大小（差值）
    dedupSize: 0,             // 上次上传的去重数据量（差值）
    hasUploadEvent: false,    // 是否有上传事件发生
    // 下载数据
    totalDecryptionDelay: 0,  // 累计解密延迟
    lastDecryptionDelay: 0,   // 上次下载的解密延迟（差值）
    totalMetaDecryptionDelay: 0,  // 累计元数据解密延迟
    metaDecryptionDelay: 0,   // 上次下载的元数据解密延迟（差值）
    cloudReadTime: 0,
    // 容器数据
    containerData: [],
    previousContainerData: [],
    // 文件配方数据
    fileRecipeData: [],
    previousFileRecipeData: [],
    // 恢复文件数据
    recoveryFiles: []
  },
  mutations: {
    // 设置上传事件状态
    SET_UPLOAD_EVENT_STATUS(state, data) {
      state.hasUploadEvent = data.hasUploadEvent;
    },
    // 更新上传数据
    UPDATE_UPLOAD_DATA(state, data) {
      // 检查是否所有数据都为0（代表没有发生上传事件）
      const allZero = data.encryptionDelay === 0 && 
                     data.metaEncryptionDelay === 0 && 
                     data.logicalDataSize === 0 && 
                     data.compressedTime === 0 && 
                     data.compressedSize === 0 && 
                     data.uniqueDataSize === 0;
      
      // 如果所有数据都为0，则不更新数据
      if (allZero) {
        return;
      }
      
      // 计算并更新加密延迟差值
      const currentTotal = data.encryptionDelay || 0;
      const deltaEncryptionDelay = currentTotal - state.totalEncryptionDelay;
      
      state.totalEncryptionDelay = currentTotal;
      
      // 将加密延迟转换为 ms/MiB (1 ms = 1000 us, 1 MiB = 1024*1024 Byte)
      if (deltaEncryptionDelay > 0 && deltaEncryptedSize > 0) {
        // 延迟时间(us) -> ms，文件大小(Byte) -> MiB
        state.lastEncryptionDelay = (deltaEncryptionDelay / 1000) / (deltaEncryptedSize / (1024 * 1024));
      } else {
        state.lastEncryptionDelay = 0;
      }
      
      // 计算并更新元数据加密延迟差值
      const currentMetaTotal = data.metaEncryptionDelay || 0;
      const deltaMetaEncryptionDelay = currentMetaTotal - state.totalMetaEncryptionDelay;
      
      state.totalMetaEncryptionDelay = currentMetaTotal;
      state.metaEncryptionDelay = deltaMetaEncryptionDelay > 0 ? deltaMetaEncryptionDelay : 0;
      
      // 计算并更新加密数据大小差值
      const currentEncryptedTotal = data.logicalDataSize || 0;
      const deltaEncryptedSize = currentEncryptedTotal - state.totalEncryptedSize;
      
      state.totalEncryptedSize = currentEncryptedTotal;
      state.encryptedSize = deltaEncryptedSize > 0 ? deltaEncryptedSize : 0;
      
      // 计算并更新数据缩减时间差值
      const currentReductionTotal = data.compressedTime || 0;
      const deltaReductionTime = currentReductionTotal - state.totalReductionTime;
      
      state.totalReductionTime = currentReductionTotal;
      state.reductionTime = deltaReductionTime > 0 ? deltaReductionTime : 0;
      
      // 计算并更新缩减后数据大小差值
      const currentReducedTotal = data.compressedSize || 0;
      const deltaReducedSize = currentReducedTotal - state.totalReducedSize;
      
      state.totalReducedSize = currentReducedTotal;
      state.reducedSize = deltaReducedSize > 0 ? deltaReducedSize : 0;
      
      // 计算并更新去重后数据大小差值
      const currentUniqueDataSize = data.uniqueDataSize || 0; // 本次接口获取的去重后数据大小
      const deltaUniqueDataSize = currentUniqueDataSize - state.totalUniqueDataSize; // 本次上传的去重后数据大小

      state.totalUniqueDataSize = currentUniqueDataSize;
      state.uniqueDataSize = deltaUniqueDataSize > 0 ? deltaUniqueDataSize : 0;
      
      // 更新去重数据量（差值）
      // 去重数据量应该是本次逻辑数据大小减去本次去重后数据大小
      state.dedupSize = deltaEncryptedSize - deltaUniqueDataSize || 0;
    },
    // 保存当前数据作为上次数据
    SAVE_PREVIOUS_DATA(state) {
      state.previousContainerData = [...state.containerData];
      state.previousFileRecipeData = [...state.fileRecipeData];
    },
    // 恢复到上次数据
    RESTORE_PREVIOUS_DATA(state) {
      state.containerData = [...state.previousContainerData];
      state.fileRecipeData = [...state.previousFileRecipeData];
    },
    // 清除加密延迟
    CLEAR_ENCRYPTION_DELAY(state) {
      state.totalEncryptionDelay = 0;
      state.lastEncryptionDelay = 0;
      state.totalMetaEncryptionDelay = 0;
      state.metaEncryptionDelay = 0;
      state.totalEncryptedSize = 0;
      state.encryptedSize = 0;
      state.totalReductionTime = 0;
      state.reductionTime = 0;
      state.totalReducedSize = 0;
      state.reducedSize = 0;
      state.totalUniqueDataSize = 0;
      state.uniqueDataSize = 0;
      state.dedupSize = 0;
    },
    // 清除解密延迟
    CLEAR_DECRYPTION_DELAY(state) {
      state.totalDecryptionDelay = 0;
      state.lastDecryptionDelay = 0;
      state.totalMetaDecryptionDelay = 0;
      state.metaDecryptionDelay = 0;
      state.cloudReadTime = 0;
    },
    // 更新下载数据
    UPDATE_DOWNLOAD_DATA(state, data) {
      // 检查是否所有数据都为0（代表没有发生下载事件）
      const allZero = data.decryptionDelay === 0 && 
                     data.metaDecryptionDelay === 0 && 
                     data.cloudReadTime === 0;
      
      // 如果所有数据都为0，则不更新数据
      if (allZero) {
        return;
      }
      
      // 计算并更新解密延迟差值
      const currentTotal = data.decryptionDelay || 0;
      const deltaDecryptionDelay = currentTotal - state.totalDecryptionDelay;
      
      state.totalDecryptionDelay = currentTotal;
      
      // 将解密延迟转换为 ms/MiB (1 ms = 1000 us, 1 MiB = 1024*1024 Byte)
      // 解密时没有直接的文件大小差值，使用加密时的文件大小差值
      if (deltaDecryptionDelay > 0 && state.encryptedSize > 0) {
        // 延迟时间(us) -> ms，文件大小(Byte) -> MiB
        state.lastDecryptionDelay = (deltaDecryptionDelay / 1000) / (state.encryptedSize / (1024 * 1024));
      } else {
        state.lastDecryptionDelay = 0;
      }
      
      // 计算并更新元数据解密延迟差值
      const currentMetaTotal = data.metaDecryptionDelay || 0;
      const deltaMetaDecryptionDelay = currentMetaTotal - state.totalMetaDecryptionDelay;
      
      state.totalMetaDecryptionDelay = currentMetaTotal;
      state.metaDecryptionDelay = deltaMetaDecryptionDelay > 0 ? deltaMetaDecryptionDelay : 0;
      
      // 更新从云端读取时间
      state.cloudReadTime = data.cloudReadTime || 0;
    },
    // 更新容器数据
    UPDATE_CONTAINER_DATA(state, data) {
      state.containerData = data || [];
    },
    // 更新文件配方数据
    UPDATE_FILE_RECIPE_DATA(state, data) {
      state.fileRecipeData = data || [];
    },
    // 设置恢复文件数据
    SET_RECOVERY_FILES(state, files) {
      state.recoveryFiles = files || [];
    },
    // 设置上传事件状态
    SET_UPLOAD_EVENT_STATUS(state, data) {
      state.hasUploadEvent = data.hasUploadEvent;
    },
    
    // 添加增量同步记录
    ADD_INCREMENTAL_SYNC_RECORD(state, { deviceId, syncType, record }) {
      if (!state.incrementalSyncRecords[deviceId]) {
        state.incrementalSyncRecords[deviceId] = {
          'FeatureSync': [],
          'Rsync': []
        };
      }
      
      // 保持最多2条记录，新记录在前面
      const records = state.incrementalSyncRecords[deviceId][syncType];
      records.unshift(record);
      if (records.length > 2) {
        records.pop();
      }
    },
    
    // 清空指定设备的增量同步记录
    CLEAR_INCREMENTAL_SYNC_RECORDS(state, deviceId) {
      if (state.incrementalSyncRecords[deviceId]) {
        state.incrementalSyncRecords[deviceId] = {
          'FeatureSync': [],
          'Rsync': []
        };
      }
    },
    
    // EdgeServer设备管理
    // 添加EdgeServer
    ADD_SERVER(state, server) {
      state.servers.push(server);
    },
    
    // 设置设备视图模式
    SET_DEVICE_VIEW_MODE(state, { deviceId, viewMode }) {
      state.deviceViewModes[deviceId] = viewMode;
    },
    
    // 获取设备视图模式（带默认值）
    GET_DEVICE_VIEW_MODE(state, deviceId) {
      return state.deviceViewModes[deviceId] || '基础数据展示';
    },
    
    // 更新EdgeServer
    UPDATE_SERVER(state, { id, updates }) {
      const index = state.servers.findIndex(server => server.id === id);
      if (index !== -1) {
        state.servers[index] = { ...state.servers[index], ...updates };
      }
    },
    
    // 删除EdgeServer
    DELETE_SERVER(state, id) {
      state.servers = state.servers.filter(server => server.id !== id);
    },
    
    // 设置服务器状态
    SET_SERVER_STATUS(state, { id, status }) {
      const server = state.servers.find(s => s.id === id);
      if (server) {
        server.status = status;
      }
    },
    
    // 批量更新服务器状态
    BATCH_UPDATE_SERVER_STATUS(state, statusList) {
      statusList.forEach(({ id, status }) => {
        const server = state.servers.find(s => s.id === id);
        if (server) {
          server.status = status;
        }
      });
    },
    
    // 设置当前选中的EdgeServer
    SET_CURRENT_SERVER(state, server) {
      state.currentServer = server;
    },
    
    // 添加备份节点到指定服务器
    ADD_BACKUP_NODE(state, { serverId, backupNode }) {
      const server = state.servers.find(s => s.id === serverId)
      if (server) {
        // 检查是否已存在相同设备名称和备份方式的节点
        const existingIndex = server.backupNodes.findIndex(
          node => node.deviceName === backupNode.deviceName && node.backupMethod === backupNode.backupMethod
        )
        
        if (existingIndex === -1) {
          server.backupNodes.push(backupNode)
        }
      }
    },
    
    // 从指定服务器移除备份节点
    REMOVE_BACKUP_NODE(state, { serverId, nodeName }) {
      const server = state.servers.find(s => s.id === serverId)
      if (server) {
        server.backupNodes = server.backupNodes.filter(
          node => node.deviceName !== nodeName
        )
      }
    },
    
    // 更新指定服务器的备份节点
    UPDATE_BACKUP_NODE(state, { serverId, nodeName, updates }) {
      const server = state.servers.find(s => s.id === serverId)
      if (server) {
        const nodeIndex = server.backupNodes.findIndex(
          node => node.deviceName === nodeName
        )
        if (nodeIndex !== -1) {
          server.backupNodes[nodeIndex] = {
            ...server.backupNodes[nodeIndex],
            ...updates
          }
        }
      }
    }
  },
  actions: {
    // 更新所有数据
    updateAllData({ commit }, data) {
      if (data.uploadData) {
        commit('UPDATE_UPLOAD_DATA', data.uploadData);
      }
      if (data.downloadData) {
        commit('UPDATE_DOWNLOAD_DATA', data.downloadData);
      }
      if (data.containerData) {
        commit('UPDATE_CONTAINER_DATA', data.containerData);
      }
      if (data.fileRecipeData) {
        commit('UPDATE_FILE_RECIPE_DATA', data.fileRecipeData);
      }
    },
    // 保存当前数据作为上次数据
    savePreviousData({ commit }) {
      commit('SAVE_PREVIOUS_DATA');
    },
    // 恢复到上次数据
    restorePreviousData({ commit }) {
      commit('RESTORE_PREVIOUS_DATA');
    },
    
    // EdgeServer设备管理操作
    // 添加EdgeServer
    addServer({ commit }, server) {
      commit('ADD_SERVER', server);
    },
    
    // 更新EdgeServer
    updateServer({ commit }, payload) {
      commit('UPDATE_SERVER', payload);
    },
    
    // 删除EdgeServer
    deleteServer({ commit }, id) {
      commit('DELETE_SERVER', id);
    },
    
    // 设置服务器状态
    setServerStatus({ commit }, payload) {
      commit('SET_SERVER_STATUS', payload);
    },
    
    // 批量更新服务器状态
    batchUpdateServerStatus({ commit }, statusList) {
      commit('BATCH_UPDATE_SERVER_STATUS', statusList);
    },
    
    // 添加备份节点
    addBackupNode({ commit }, { serverId, backupNode }) {
      commit('ADD_BACKUP_NODE', { serverId, backupNode });
    },
    
    // 移除备份节点
    removeBackupNode({ commit }, { serverId, nodeName }) {
      commit('REMOVE_BACKUP_NODE', { serverId, nodeName });
    },
    
    // 更新指定服务器的备份节点
    updateBackupNode({ commit }, { serverId, nodeName, updates }) {
      commit('UPDATE_BACKUP_NODE', { serverId, nodeName, updates });
    },
    
    // 添加增量同步记录
    addIncrementalSyncRecord({ commit }, payload) {
      commit('ADD_INCREMENTAL_SYNC_RECORD', payload);
    },
    
    // 清空增量同步记录
    clearIncrementalSyncRecords({ commit }, deviceId) {
      commit('CLEAR_INCREMENTAL_SYNC_RECORDS', deviceId);
    }
  },
  getters: {
    // 获取所有EdgeServer
    getAllServers: state => state.servers,
    
    // 根据ID获取EdgeServer
    getServerById: state => id => state.servers.find(server => server.id === id),
    
    // 获取所有数据
    getAllData: state => ({
      uploadData: {
          totalEncryptionDelay: state.totalEncryptionDelay,
          lastEncryptionDelay: state.lastEncryptionDelay,
          totalMetaEncryptionDelay: state.totalMetaEncryptionDelay,
          metaEncryptionDelay: state.metaEncryptionDelay,
          totalEncryptedSize: state.totalEncryptedSize,
          encryptedSize: state.encryptedSize,
          totalReductionTime: state.totalReductionTime,
          reductionTime: state.reductionTime,
          totalReducedSize: state.totalReducedSize,
          reducedSize: state.reducedSize,
          totalUniqueDataSize: state.totalUniqueDataSize,
          dedupSize: state.dedupSize
        },
      downloadData: {
        totalDecryptionDelay: state.totalDecryptionDelay,
        lastDecryptionDelay: state.lastDecryptionDelay,
        totalMetaDecryptionDelay: state.totalMetaDecryptionDelay,
        metaDecryptionDelay: state.metaDecryptionDelay,
        cloudReadTime: state.cloudReadTime
      },
      containerData: state.containerData,
      fileRecipeData: state.fileRecipeData
    }),
    
    // 获取设备的视图模式
    getDeviceViewMode: state => deviceId => state.deviceViewModes[deviceId] || '基础数据展示',
    
    // 获取当前选中的EdgeServer
    getCurrentServer: state => state.currentServer
  }
}