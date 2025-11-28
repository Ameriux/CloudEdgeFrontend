// 同态加密模块的状态管理

// 从localStorage加载持久化数据
const loadPersistedState = () => {
  try {
    const persisted = localStorage.getItem('homomorphicEncryptionState');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      return parsed.analysisState || {};
    }
  } catch (error) {
    console.error('加载持久化状态失败:', error);
  }
  return {};
};

const persistedState = loadPersistedState();

const state = {
  // 加密输入参数
  encryptionParams: {
    encryptionScheme: 'CKKS',
    operation: 'add',
    p1: '',
    p2: ''
  },
  // 加密结果
  encryptionResult: null,
  // 加载状态
  loading: false,
  
  // 密文数据分析相关状态
  analysisState: {
    // 数据库数据
    databaseData: null,
    databaseLoading: false,
    currentPage: 1,
    pageSize: 3,
    
    // Edge ID相关
    userIds: [],
    userId: persistedState.userId || '',
    
    // 分析参数和结果
    analysisOperation: persistedState.analysisOperation || 'flow',
    logId: persistedState.logId || 2,
    maxLogId: 21,
    analysisResult: persistedState.analysisResult || null,
    analysisLoading: false,
    
    // 密文查看状态
    cipherLoading: {},
    showCipherModal: false,
    currentCipherData: {
      fieldName: '',
      fieldValue: '',
      fieldSize: ''
    }
  }
};

// 保存状态到localStorage的辅助函数
const saveStateToStorage = (analysisState) => {
  try {
    // 只保存需要持久化的状态
    const stateToSave = {
      userId: analysisState.userId,
      analysisOperation: analysisState.analysisOperation,
      logId: analysisState.logId,
      analysisResult: analysisState.analysisResult
    };
    localStorage.setItem('homomorphicEncryptionState', JSON.stringify({
      analysisState: stateToSave,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('保存状态到localStorage失败:', error);
  }
};

const mutations = {
  // 设置加密参数
  SET_ENCRYPTION_PARAMS(state, params) {
    state.encryptionParams = { ...state.encryptionParams, ...params };
  },
  
  // 设置加密结果
  SET_ENCRYPTION_RESULT(state, result) {
    state.encryptionResult = result;
  },
  
  // 设置加载状态
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  
  // 重置状态
  RESET_STATE(state) {
    state.encryptionParams = {
      encryptionScheme: 'CKKS',
      operation: 'add',
      p1: '',
      p2: ''
    };
    state.encryptionResult = null;
    state.loading = false;
  },
  
  // 密文数据分析相关mutations
  SET_DATABASE_DATA(state, data) {
    state.analysisState.databaseData = data;
    if (data && data.total_records !== undefined) {
      state.analysisState.maxLogId = data.total_records;
    }
    // 设置用户ID列表
    if (data && data.unique_user_ids && Array.isArray(data.unique_user_ids)) {
      state.analysisState.userIds = data.unique_user_ids;
      // 如果用户ID列表不为空且当前未选择用户ID，则默认选择第一个
      if (data.unique_user_ids.length > 0 && !state.analysisState.userId) {
        state.analysisState.userId = data.unique_user_ids[0];
      }
    }
  },
  
  SET_DATABASE_LOADING(state, loading) {
    state.analysisState.databaseLoading = loading;
  },
  
  SET_USER_ID(state, userId) {
    state.analysisState.userId = userId;
  },
  
  SET_ANALYSIS_OPERATION(state, operation) {
    state.analysisState.analysisOperation = operation;
  },
  
  SET_LOG_ID(state, logId) {
    state.analysisState.logId = logId;
  },
 // 设置密文数据分析结果
  SET_ANALYSIS_RESULT(state, result) {
    state.analysisState.analysisResult = result;
    saveStateToStorage(state.analysisState);
  },
  
  // 设置用户ID
  SET_USER_ID(state, userId) {
    state.analysisState.userId = userId;
    saveStateToStorage(state.analysisState);
  },
  
  // 设置分析操作
  SET_ANALYSIS_OPERATION(state, operation) {
    state.analysisState.analysisOperation = operation;
    saveStateToStorage(state.analysisState);
  },
  
  // 设置日志ID
  SET_LOG_ID(state, logId) {
    state.analysisState.logId = logId;
    saveStateToStorage(state.analysisState);
  },
  
  SET_ANALYSIS_LOADING(state, loading) {
    state.analysisState.analysisLoading = loading;
  },
  
  SET_CIPHER_LOADING(state, { key, loading }) {
    Vue.set(state.analysisState.cipherLoading, key, loading);
  },
  
  SET_SHOW_CIPHER_MODAL(state, show) {
    state.analysisState.showCipherModal = show;
  },
  
  SET_CURRENT_CIPHER_DATA(state, data) {
    state.analysisState.currentCipherData = data;
  },
  
  SET_CURRENT_PAGE(state, page) {
    state.analysisState.currentPage = page;
  },
  
  RESET_ANALYSIS_STATE(state) {
    state.analysisState = {
      databaseData: null,
      databaseLoading: false,
      currentPage: 1,
      pageSize: 3,
      userIds: [],
      userId: '',
      analysisOperation: 'flow',
      logId: 2,
      maxLogId: 21,
      analysisResult: null,
      analysisLoading: false,
      cipherLoading: {},
      showCipherModal: false,
      currentCipherData: {
        fieldName: '',
        fieldValue: '',
        fieldSize: ''
      }
    };
  }
};

const actions = {
  // 更新加密参数
  updateEncryptionParams({ commit }, params) {
    commit('SET_ENCRYPTION_PARAMS', params);
  },
  
  // 保存加密结果
  saveEncryptionResult({ commit }, result) {
    commit('SET_ENCRYPTION_RESULT', result);
  },
  
  // 设置加载状态
  setLoading({ commit }, loading) {
    commit('SET_LOADING', loading);
  },
  
  // 重置状态
  resetState({ commit }) {
    commit('RESET_STATE');
  },
  
  // 密文数据分析相关actions
  fetchDatabaseData({ commit }) {
    commit('SET_DATABASE_LOADING', true);
    
    return fetch('/api-internal/homo/database', {
      method: 'GET'
    })
      .then(response => response.json())
      .then(data => {
        // 打印API响应数据到控制台
        console.log('API响应数据 - /api-internal/homo/database:', data);
        if (data && data.total_records !== undefined) {
          commit('SET_DATABASE_DATA', data);
        }
        return data;
      })
      .catch(error => {
        console.error('获取密文数据库数据出错:', error);
        throw error;
      })
      .finally(() => {
        commit('SET_DATABASE_LOADING', false);
      });
  },
  
  setUserId({ commit }, userId) {
    commit('SET_USER_ID', userId);
  },
  
  setAnalysisOperation({ commit }, operation) {
    commit('SET_ANALYSIS_OPERATION', operation);
  },
  
  setLogId({ commit }, logId) {
    commit('SET_LOG_ID', logId);
  },
  
  setAnalysisResult({ commit }, result) {
    commit('SET_ANALYSIS_RESULT', result);
  },
  
  setAnalysisLoading({ commit }, loading) {
    commit('SET_ANALYSIS_LOADING', loading);
  },
  
  setCipherLoading({ commit }, { key, loading }) {
    commit('SET_CIPHER_LOADING', { key, loading });
  },
  
  showCipherModal({ commit }, data) {
    commit('SET_CURRENT_CIPHER_DATA', data);
    commit('SET_SHOW_CIPHER_MODAL', true);
  },
  
  closeCipherModal({ commit }) {
    commit('SET_SHOW_CIPHER_MODAL', false);
  },
  
  setCurrentPage({ commit }, page) {
    commit('SET_CURRENT_PAGE', page);
  },
  
  // 执行密文数据分析并将结果直接记录到Vuex
  performDataAnalysis({ commit, state }, { userId, operation, logId }) {
    commit('SET_ANALYSIS_LOADING', true);
    
    const url = `/api-internal/homo/analysis?user_id=${userId}&operation=${operation}&log_id=${logId}`;
    
    return fetch(url, {
      method: 'GET'
    })
      .then(response => response.json())
      .then(data => {
        console.log('密文数据分析响应:', data);
        // 无论成功或失败，都将结果记录到Vuex中
        commit('SET_ANALYSIS_RESULT', data);
        
        // 如果状态不是成功，抛出错误供组件处理
        if (data && data.status !== 'success') {
          throw new Error(data?.message || '分析失败');
        }
        
        return data;
      })
      .catch(error => {
        console.error('密文数据分析错误:', error);
        // 即使出错，也确保加载状态重置
        commit('SET_ANALYSIS_LOADING', false);
        throw error;
      })
      .finally(() => {
        // 确保无论成功失败都重置加载状态
        commit('SET_ANALYSIS_LOADING', false);
      });
  },
  
  resetAnalysisState({ commit }) {
    commit('RESET_ANALYSIS_STATE');
  }
};

const getters = {
  // 获取加密参数
  getEncryptionParams: state => state.encryptionParams,
  
  // 获取加密结果
  getEncryptionResult: state => state.encryptionResult,
  
  // 获取加载状态
  isLoading: state => state.loading,
  
  // 获取整数序列密文（p1和p2）
  integerSequenceCiphertexts: state => {
    if (!state.encryptionResult || !state.encryptionResult.cipher_files) {
      return null;
    }
    return {
      p1: state.encryptionResult.cipher_files.p1,
      p2: state.encryptionResult.cipher_files.p2
    };
  },
  
  // 获取Cloud返回的密文结果
  cloudCiphertextResult: state => {
    if (!state.encryptionResult || !state.encryptionResult.cipher_files || !state.encryptionResult.cipher_files.result) {
      return null;
    }
    return state.encryptionResult.cipher_files.result;
  },
  
  // 获取解密后结果
  decryptedResult: state => {
    if (!state.encryptionResult || !Array.isArray(state.encryptionResult.result)) {
      return null;
    }
    return state.encryptionResult.result;
  },
  
  // 密文数据分析相关getters
  databaseData: state => state.analysisState.databaseData,
  databaseLoading: state => state.analysisState.databaseLoading,
  currentPage: state => state.analysisState.currentPage,
  pageSize: state => state.analysisState.pageSize,
  userIds: state => state.analysisState.userIds,
  userId: state => state.analysisState.userId,
  analysisOperation: state => state.analysisState.analysisOperation,
  logId: state => state.analysisState.logId,
  maxLogId: state => state.analysisState.maxLogId,
  analysisResult: state => state.analysisState.analysisResult,
  analysisLoading: state => state.analysisState.analysisLoading,
  cipherLoading: state => state.analysisState.cipherLoading,
  showCipherModal: state => state.analysisState.showCipherModal,
  currentCipherData: state => state.analysisState.currentCipherData,
  
  // 计算分页相关
  totalPages: state => {
    if (!state.analysisState.databaseData || !state.analysisState.databaseData.view_records) return 1;
    return Math.ceil(state.analysisState.databaseData.view_records.length / state.analysisState.pageSize);
  },
  
  paginatedRecords: state => {
    if (!state.analysisState.databaseData || !state.analysisState.databaseData.view_records) return [];
    
    const start = (state.analysisState.currentPage - 1) * state.analysisState.pageSize;
    const end = start + state.analysisState.pageSize;
    return state.analysisState.databaseData.view_records.slice(start, end);
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};