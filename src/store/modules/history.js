export default {
  namespaced: true,
  state: {
    operationHistory: [] // 存储操作历史记录
  },
  mutations: {
    // 添加操作历史记录
    ADD_OPERATION_HISTORY(state, record) {
      // 限制历史记录的数量，例如保留最近100条
      if (state.operationHistory.length >= 100) {
        state.operationHistory.shift(); // 移除最早的记录
      }
      state.operationHistory.push(record);
    },
    // 清空操作历史记录
    CLEAR_OPERATION_HISTORY(state) {
      state.operationHistory = [];
    }
  },
  actions: {
    // 添加操作记录的action
    addOperationRecord({ commit }, record) {
      // 确保记录包含必要的字段
      const completeRecord = {
        clientName: record.clientName || 'unknown',
        operationType: record.operationType || 'unknown',
        operationStatus: record.operationStatus || 'unknown',
        operationTime: record.operationTime || new Date().toLocaleString(),
        ...record
      };
      commit('ADD_OPERATION_HISTORY', completeRecord);
    },
    // 清空操作记录的action
    clearOperationHistory({ commit }) {
      commit('CLEAR_OPERATION_HISTORY');
    }
  },
  getters: {
    // 获取所有操作历史记录
    getAllOperationHistory: state => state.operationHistory,
    // 获取指定客户端的操作历史记录
    getOperationHistoryByClient: (state) => (clientName) => {
      return state.operationHistory.filter(record => record.clientName === clientName);
    },
    // 获取指定操作类型的历史记录
    getOperationHistoryByType: (state) => (operationType) => {
      return state.operationHistory.filter(record => record.operationType === operationType);
    }
  }
};