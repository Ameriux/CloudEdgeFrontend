import { createStore } from 'vuex'
import files from './modules/files'
import edgeServer from './modules/edgeServer'
import auth from './modules/auth' // 导入认证模块
import clients from './modules/clients' // 导入客户端管理模块
import config from './modules/config' // 导入配置管理模块
import cloudServer from './modules/cloudServer' // 导入云服务器模块

export default createStore({
  modules: {
    files,
    edgeServer,
    auth, // 添加认证模块
    clients, // 添加客户端管理模块
    config, // 添加配置管理模块
    cloudServer // 添加云服务器模块
  }
})