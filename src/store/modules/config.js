// 配置管理模块
const state = {
  config: null
};

const mutations = {
  // 设置完整配置
  setConfig(state, config) {
    state.config = config;
  },
  
  // 更新Auth配置
  updateConfigAuth(state, authConfig) {
    if (state.config && state.config.Auth) {
      state.config.Auth = { ...state.config.Auth, ...authConfig };
    }
  }
};

const actions = {
  // 获取配置数据
  async fetchConfig({ commit }) {
    try {
      const { apiGateway } = await import('../../api/request');
      const response = await apiGateway.get('/api/config');
      commit('setConfig', response);
      return response;
    } catch (error) {
      console.error('获取配置失败:', error);
      throw error;
    }
  },
  
  // 更新Auth配置
  async updateAuthConfig({ commit }, authConfig) {
    try {
      const { apiGateway } = await import('../../api/request');
      const response = await apiGateway.post('/api/config', { Auth: authConfig });
      commit('updateConfigAuth', authConfig);
      return response;
    } catch (error) {
      console.error('更新Auth配置失败:', error);
      throw error;
    }
  }
};

const getters = {
  // 获取完整配置
  config: state => state.config,
  
  // 获取Auth配置
  authConfig: state => state.config?.Auth || null
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};