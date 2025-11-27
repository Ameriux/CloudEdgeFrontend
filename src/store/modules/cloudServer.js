const cloudServer = {
  namespaced: true,
  state: {
    // 迁移数据 - 累计值
    totalInputDataSize: 0,          // 累计传入数据大小
    totalRedundancyReductionTime: 0, // 累计冗余数据缩减时间
    totalActualStorageSize: 0,      // 累计实际存储数据大小
    totalBackupSyncDelay: 0,        // 累计单边缘备份同步延迟
    totalDedupSize: 0,              // 累计去重数据量
    // 迁移数据 - 本次差值
    currentInputDataSize: 0,        // 本次传入数据大小
    currentRedundancyReductionTime: 0, // 本次冗余数据缩减时间
    currentActualStorageSize: 0,    // 本次实际存储数据大小
    currentBackupSyncDelay: 0,      // 本次单边缘备份同步延迟
    currentDedupSize: 0,            // 本次去重数据量
    // 容器和文件配方数据
    containerData: [],
    fileRecipeData: [],
    // 日志数据
    lastLogContent: '',             // 上次日志内容，用于比较
    fullLogContent: '',             // 完整日志内容，用于持久化存储
    // 时间和大小单位
    timeUnit: 'ms',
    sizeUnit: 'B'
  },
  mutations: {
    // 更新迁移数据
    UPDATE_MIGRATION_DATA(state, data) {
      // 检查是否所有数据都为0（代表没有发生迁移事件）
      const allZero = data.input_data_size === 0 && 
                     data.dedup_time === 0 && 
                     data.store_data_size === 0 && 
                     data.migration_time === 0 && 
                     data.dedup_size === 0;
      
      // 如果所有数据都为0，则不更新数据
      if (allZero) {
        return;
      }
      
      // 计算并更新传入数据大小差值
      const currentTotal = data.input_data_size || 0;
      const deltaInputDataSize = currentTotal - state.totalInputDataSize;
      
      state.totalInputDataSize = currentTotal;
      state.currentInputDataSize = deltaInputDataSize > 0 ? deltaInputDataSize : 0;
      
      // 计算并更新冗余数据缩减时间差值
      const currentReductionTotal = (data.dedup_time || 0) * 1000; // 转换为ms
      const deltaReductionTime = currentReductionTotal - state.totalRedundancyReductionTime;
      
      state.totalRedundancyReductionTime = currentReductionTotal;
      state.currentRedundancyReductionTime = deltaReductionTime > 0 ? deltaReductionTime : 0;
      
      // 计算并更新实际存储数据大小差值
      const currentActualTotal = data.store_data_size || 0;
      const deltaActualStorageSize = currentActualTotal - state.totalActualStorageSize;
      
      state.totalActualStorageSize = currentActualTotal;
      state.currentActualStorageSize = deltaActualStorageSize > 0 ? deltaActualStorageSize : 0;
      
      // 计算并更新单边缘备份同步延迟差值
      const currentBackupTotal = (data.migration_time || 0) * 1000; // 转换为ms
      const deltaBackupSyncDelay = currentBackupTotal - state.totalBackupSyncDelay;
      
      state.totalBackupSyncDelay = currentBackupTotal;
      state.currentBackupSyncDelay = deltaBackupSyncDelay > 0 ? deltaBackupSyncDelay : 0;
      
      // 计算并更新去重数据量差值
      const currentDedupTotal = data.dedup_size || 0;
      const deltaDedupSize = currentDedupTotal - state.totalDedupSize;
      
      state.totalDedupSize = currentDedupTotal;
      state.currentDedupSize = deltaDedupSize > 0 ? deltaDedupSize : 0;
      
      // 更新单位
      state.timeUnit = data.time_unit || 'ms';
      state.sizeUnit = 'B'; // 固定使用B作为显示单位
    },
    
    // 更新容器数据
    UPDATE_CONTAINER_DATA(state, data) {
      state.containerData = data || [];
    },
    
    // 更新文件配方数据
    UPDATE_FILE_RECIPE_DATA(state, data) {
      state.fileRecipeData = data || [];
    },
    
    // 更新上次日志内容
    UPDATE_LAST_LOG_CONTENT(state, content) {
      state.lastLogContent = content;
    },
    
    // 更新完整日志内容
    UPDATE_FULL_LOG_CONTENT(state, content) {
      state.fullLogContent = content;
    },
    
    // 清除所有数据
    CLEAR_ALL_DATA(state) {
      state.totalInputDataSize = 0;
      state.totalRedundancyReductionTime = 0;
      state.totalActualStorageSize = 0;
      state.totalBackupSyncDelay = 0;
      state.totalDedupSize = 0;
      state.currentInputDataSize = 0;
      state.currentRedundancyReductionTime = 0;
      state.currentActualStorageSize = 0;
      state.currentBackupSyncDelay = 0;
      state.currentDedupSize = 0;
      state.containerData = [];
      state.fileRecipeData = [];
      state.lastLogContent = '';
      state.fullLogContent = '';
    }
  },
  actions: {
    // 更新所有数据
    updateAllData({ commit }, data) {
      if (data.migrationData) {
        commit('UPDATE_MIGRATION_DATA', data.migrationData);
      }
      if (data.containerData) {
        commit('UPDATE_CONTAINER_DATA', data.containerData);
      }
      if (data.fileRecipeData) {
        commit('UPDATE_FILE_RECIPE_DATA', data.fileRecipeData);
      }
      if (data.logContent !== undefined) {
        commit('UPDATE_LAST_LOG_CONTENT', data.logContent);
      }
      if (data.fullLogContent !== undefined) {
        commit('UPDATE_FULL_LOG_CONTENT', data.fullLogContent);
      }
    },
    
    // 清除所有数据
    clearAllData({ commit }) {
      commit('CLEAR_ALL_DATA');
    },
    
    // 检查是否有新的迁移发生
    hasNewMigration({ state }) {
      return state.currentInputDataSize > 0 || 
             state.currentRedundancyReductionTime > 0 || 
             state.currentActualStorageSize > 0 || 
             state.currentBackupSyncDelay > 0 || 
             state.currentDedupSize > 0;
    }
  },
  getters: {
    // 获取所有数据
    getAllData(state) {
      return {
        // 累计值
        totalInputDataSize: state.totalInputDataSize,
        totalRedundancyReductionTime: state.totalRedundancyReductionTime,
        totalActualStorageSize: state.totalActualStorageSize,
        totalBackupSyncDelay: state.totalBackupSyncDelay,
        totalDedupSize: state.totalDedupSize,
        // 本次差值
        inputDataSize: state.currentInputDataSize,
        redundancyReductionTime: state.currentRedundancyReductionTime,
        actualStorageSize: state.currentActualStorageSize,
        backupSyncDelay: state.currentBackupSyncDelay,
        dedupSize: state.currentDedupSize,
        // 其他数据
        containerData: state.containerData,
        fileRecipeData: state.fileRecipeData,
        lastLogContent: state.lastLogContent,
        fullLogContent: state.fullLogContent,
        timeUnit: state.timeUnit,
        sizeUnit: state.sizeUnit
      };
    },
    
    // 检查是否所有本次数据都为0
    allCurrentDataZero(state) {
      return state.currentInputDataSize === 0 && 
             state.currentRedundancyReductionTime === 0 && 
             state.currentActualStorageSize === 0 && 
             state.currentBackupSyncDelay === 0 && 
             state.currentDedupSize === 0;
    }
  }
};

export default cloudServer;