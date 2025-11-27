import { formatError, logError } from '@/utils/errorFormatter'
import request from '@/api/request'

// 认证模块，管理用户登录状态和认证信息

const state = {
  isLoggedIn: !!localStorage.getItem('access_token'),
  userInfo: JSON.parse(localStorage.getItem('user_info')) || null
}

const mutations = {
  SET_LOGGED_IN(state, value) {
    state.isLoggedIn = value
  },
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo
    if (userInfo) {
      localStorage.setItem('user_info', JSON.stringify(userInfo))
    } else {
      localStorage.removeItem('user_info')
    }
  }
}

const actions = {
  // 登录操作
  async login({ commit }, { username, password }) {
    try {
      // 调用登录API获取令牌（使用用户指定的接口，结合request.js中的baseURL配置）
      // 打印原始参数值
        console.log('原始登录参数值: username=', username, 'password=', password)
        
        // 使用URLSearchParams格式发送请求（测试已确认此格式能够成功登录）
        const formData = new URLSearchParams()
        formData.append('grant_type', 'password')
        formData.append('username', username || '')
        formData.append('password', password || '')
        formData.append('scope', '')
        
        console.log('URLSearchParams格式的请求数据:', formData.toString())
        
        // 设置正确的Content-Type头
        const config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
        
        // 发送登录请求
        const data = await request.post('/api/v1/login/access-token', formData, config)
      console.log('登录请求成功，返回数据:', data)
      
      if (data.access_token) {
        // 存储令牌
        localStorage.setItem('access_token', data.access_token)
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token)
        }
        commit('SET_LOGGED_IN', true)
        
        // 验证令牌是否正确存储
        console.log('localStorage中的令牌:', localStorage.getItem('access_token'))
        console.log('令牌长度:', localStorage.getItem('access_token')?.length || 0)
        
        // 尝试获取用户信息
        try {
          console.log('准备请求用户信息，当前token状态:', !!localStorage.getItem('access_token'))
          const userInfo = await request.get('/api/v1/users/me')
          console.log('服务器返回的用户信息数据:', userInfo)
          console.log('用户信息数据类型:', typeof userInfo)
          console.log('用户信息是否为空:', userInfo === null || userInfo === undefined)
          commit('SET_USER_INFO', userInfo)
          return userInfo
        } catch (error) {
          // 使用错误格式化工具格式化错误信息
          const errorMessage = formatError(error)
          
          // 使用安全的日志打印函数记录错误
          logError('获取用户信息失败，但登录成功', error)
          
          console.warn(errorMessage)
        }
        
        return { username } // 至少返回用户名
      }
      
      throw new Error('登录失败: 未获取到访问令牌')
    } catch (error) {
      // 记录详细的错误信息以便调试
      console.error('登录请求失败详细信息:', error)
      console.error('请求错误响应数据:', error.response?.data)
      console.error('请求错误状态码:', error.response?.status)
      
      // 使用错误格式化工具记录错误
      logError('登录过程出错', error)
      throw error
    }
  },
  
  // 登出操作
  logout({ commit }) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    commit('SET_LOGGED_IN', false)
    commit('SET_USER_INFO', null)
  },
  
  // 检查认证状态
  async checkAuth({ commit }) {
    // 从localStorage获取令牌
    const token = localStorage.getItem('access_token')
    
    console.log('检查认证状态时的令牌:', token)
    console.log('令牌长度:', token?.length || 0)
    
    if (token) {
      try {
        // 验证令牌有效性
        const userInfo = await request.get('/api/v1/users/me')
        commit('SET_LOGGED_IN', true)
        commit('SET_USER_INFO', userInfo)
        return userInfo
      } catch (error) {
        console.error('验证令牌有效性出错:', error)
        localStorage.removeItem('access_token')
        commit('SET_LOGGED_IN', false)
        commit('SET_USER_INFO', null)
      }
    } else {
      commit('SET_LOGGED_IN', false)
    }
    
    return null
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}