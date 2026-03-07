// 请求拦截器，用于自动添加认证令牌和处理响应错误
import axios from 'axios'
import store from '../store'
import router from '../router'
import { formatError, logError } from '../utils/errorFormatter'

// 创建axios实例
const request = axios.create({
  baseURL: '/api-external', // 设置基础URL
  timeout: 10000, // 设置超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：在发送请求前添加认证令牌
request.interceptors.request.use(
  config => {
    // 从localStorage获取令牌
    const token = localStorage.getItem('access_token')
    
    // 如果有令牌，则添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 对于登录请求，添加更详细的日志
    if (config.url === '/api/v1/login/access-token') {
      console.log('登录请求完整配置:', config)
      console.log('登录请求数据:', config.data)
      console.log('请求头:', config.headers)
      console.log('请求方法:', config.method)
    }
    
    // 对于用户信息请求，添加详细日志
    if (config.url === '/api/v1/users/me') {
      console.log('用户信息请求配置:', config)
      console.log('用户信息请求头:', config.headers)
      console.log('Authorization头:', config.headers.Authorization)
      console.log('token是否存在:', !!token)
      console.log('token长度:', token?.length || 0)
    }
    
    return config
  },
  error => {
    // 请求错误处理
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：处理响应错误，特别是401未授权错误
request.interceptors.response.use(
  // 响应成功处理
  response => {
    // 直接返回响应数据
    return response.data
  },
  // 响应错误处理
  error => {
    // 处理网络错误
    if (!error.response) {
      console.error('网络错误，请检查网络连接:', error)
      return Promise.reject(new Error('网络错误，请检查网络连接'))
    }
    
    // 处理401未授权错误
    if (error.response.status === 401) {
      // 清除存储的令牌和用户信息
      store.dispatch('auth/logout')
      
      // 记录当前路径，登录后重定向
      const currentPath = router.currentRoute.value.fullPath
      if (currentPath !== '/mfa/login') {
        router.push({ path: '/mfa/login', query: { redirect: currentPath } })
      }
      
      // 显示未授权提示
      return Promise.reject(new Error('未授权，请重新登录'))
    }
    
    // 记录错误并直接拒绝Promise，保留原始错误对象
    logError('API请求错误', error)
    return Promise.reject(error)
  }
)

// 创建API网关的axios实例
export const apiGateway = axios.create({
  baseURL: '/api-gateway', // 使用代理路径，避免跨域问题
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// API网关请求拦截器（如果需要身份验证，可以在这里添加）
apiGateway.interceptors.request.use(
  config => {
    // 可以在这里添加认证令牌
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// API网关响应拦截器
apiGateway.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    logError('API Gateway请求错误', error)
    return Promise.reject(error)
  }
)

export default request