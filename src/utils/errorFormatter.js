/**
 * 错误格式化工具函数
 * 用于将各种类型的错误对象转换为人类可读的错误消息
 */
export const formatError = (error) => {
  try {
    // 检查是否为null或undefined
    if (error === null || error === undefined) {
      return '未知错误'
    }

    // 检查是否为字符串类型错误
    if (typeof error === 'string') {
      return error
    }

    // 检查是否为Error对象
    if (error instanceof Error) {
      // 检查是否是axios包装的错误（通常有config、request和response属性）
      if (error.response) {
        // 从axios错误中提取详细信息
        return extractAxiosErrorInfo(error)
      }
      return error.message || '未知错误'
    }

    // 检查是否有response.data (直接传入的axios响应错误)
    if (error.response?.data) {
      return extractAxiosErrorInfo(error)
    }
    
    // 检查是否有message属性
    if (error.message) {
      return error.message
    }
    
    // 尝试将整个错误对象序列化为JSON
    try {
      const serialized = JSON.stringify(error)
      // 避免返回空对象的序列化结果
      return serialized === '{}' ? `未知对象错误` : serialized
    } catch (e) {
      // 如果所有方法都失败，返回基本的错误类型信息
      return `未知错误类型: ${typeof error}`
    }
  } catch (e) {
    // 最后的容错处理
    console.error('格式化错误时出错:', e)
    return '处理错误信息失败'
  }
}

/**
 * 从axios错误对象中提取详细的错误信息
 */
const extractAxiosErrorInfo = (error) => {
  try {
    const { response } = error
    
    if (!response) {
      return '请求失败: 无法连接到服务器'
    }
    
    const { status, data } = response
    
    // 处理常见的HTTP状态码
    if (status === 401) {
      return '未授权: 请重新登录'
    } else if (status === 403) {
      return '拒绝访问: 您没有权限执行此操作'
    } else if (status === 404) {
      return '请求失败: 未找到指定资源'
    } else if (status === 422) {
      // 特殊处理验证错误
      return extractValidationError(data)
    } else if (status >= 500) {
      return `服务器错误: 状态码 ${status}`
    }
    
    // 处理响应数据
    if (typeof data === 'string') {
      return data
    }
    
    // 尝试从常见的错误字段中获取消息
    if (data.detail) return data.detail
    if (data.message) return data.message
    if (data.error) return data.error
    if (data.msg) return data.msg
    
    // 尝试序列化整个响应对象
    try {
      const serialized = JSON.stringify(data)
      return serialized === '{}' ? `请求失败: 状态码 ${status}` : serialized
    } catch (e) {
      return `请求失败: 状态码 ${status}`
    }
  } catch (e) {
    console.error('提取axios错误信息时出错:', e)
    return '无法解析错误信息'
  }
}

/**
 * 提取验证错误信息
 */
const extractValidationError = (data) => {
  try {
    // 处理常见的验证错误格式
    if (data.detail) {
      // FastAPI风格的验证错误
      if (Array.isArray(data.detail)) {
        return data.detail.map(item => {
          if (typeof item === 'string') return item
          if (item.msg) return `${item.loc?.join('.')}: ${item.msg}`
          return JSON.stringify(item)
        }).join('\n')
      }
      return data.detail
    }
    
    // 处理其他格式的验证错误
    if (data.errors) {
      if (Array.isArray(data.errors)) {
        return data.errors.join('\n')
      } else if (typeof data.errors === 'object') {
        return Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('\n')
      }
    }
    
    // 尝试序列化数据
    return JSON.stringify(data)
  } catch (e) {
    console.error('提取验证错误信息时出错:', e)
    return '验证错误'
  }
}

/**
 * 安全地打印错误日志，确保不会输出[Object, Object]这样的内容
 */
export const logError = (prefix, error) => {
  try {
    console.error(prefix, formatError(error))
    // 为了调试，也打印原始错误对象
    console.error(`${prefix} - 原始错误对象:`, error)
  } catch (e) {
    console.error('打印错误日志时出错:', e)
  }
}