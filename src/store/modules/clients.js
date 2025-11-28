export default {
  namespaced: true,
  state: {
    clients: [], // 存储客户端列表数据
    clientEdgeConnections: {} // 格式: { clientId: edgeServerIp }
  },
  mutations: {
    // 设置客户端列表
    SET_CLIENTS(state, clients) {
      state.clients = clients || [];
    },
    // 添加单个客户端
    ADD_CLIENT(state, client) {
      // 检查客户端是否已存在
      const existingIndex = state.clients.findIndex(c => c.name === client.name);
      if (existingIndex === -1) {
        state.clients.push(client);
      }
    },
    // 更新客户端状态
    UPDATE_CLIENT_STATUS(state, { clientId, status }) {
      const client = state.clients.find(c => c.name === clientId);
      if (client) {
        client.status = status;
      }
    },
    // 清空客户端列表
    CLEAR_CLIENTS(state) {
      state.clients = [];
    },
    // 设置客户端与EdgeServer的连接关系
    SET_CLIENT_EDGE_CONNECTION(state, { clientId, edgeServerIp }) {
      state.clientEdgeConnections[clientId] = edgeServerIp;
    },
    // 清除客户端与EdgeServer的连接关系
    CLEAR_CLIENT_EDGE_CONNECTION(state, clientId) {
      delete state.clientEdgeConnections[clientId];
    }
  },
  actions: {
    // 设置客户端列表
    setClients({ commit }, clients) {
      commit('SET_CLIENTS', clients);
    },
    // 添加单个客户端
    addClient({ commit }, client) {
      commit('ADD_CLIENT', client);
    },
    // 更新客户端状态
    updateClientStatus({ commit }, data) {
      commit('UPDATE_CLIENT_STATUS', data);
    },
    // 清空客户端列表
    clearClients({ commit }) {
      commit('CLEAR_CLIENTS');
    },
    // 设置客户端与EdgeServer的连接关系
    setClientEdgeConnection({ commit }, data) {
      commit('SET_CLIENT_EDGE_CONNECTION', data);
    },
    // 清除客户端与EdgeServer的连接关系
    clearClientEdgeConnection({ commit }, clientId) {
      commit('CLEAR_CLIENT_EDGE_CONNECTION', clientId);
    }
  },
  getters: {
    // 获取所有客户端列表
    getAllClients: state => state.clients,
    // 根据客户端ID获取客户端
    getClientById: state => clientId => state.clients.find(client => client.name === clientId),
    // 获取客户端与EdgeServer的连接关系
    getClientEdgeConnections: state => state.clientEdgeConnections,
    // 获取指定客户端连接的EdgeServer IP
    getClientEdgeConnection: state => clientId => state.clientEdgeConnections[clientId] || null
  }
};