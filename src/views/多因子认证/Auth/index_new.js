// 处理确认注册因子
const handleConfirmRegisterFactor = async () => {
  try {
    if (!factorContent.value.trim()) {
      ElMessage.warning('请输入导出的因素');
      return;
    }
    
    // 解析JSON内容
    let factorData;
    try {
      // 尝试直接解析
      factorData = JSON.parse(factorContent.value);
    } catch (error) {
      try {
        // 尝试处理转义字符问题
        // 先替换所有的\n为\n，然后再替换所有的\"为\" 
        const processedContent = factorContent.value
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
        factorData = JSON.parse(processedContent);
      } catch (secondError) {
        ElMessage.error('请输入有效的JSON格式内容');
        console.error('JSON解析失败:', error, '; 二次尝试解析失败:', secondError);
        return;
      }
    }
    
    // 调用注册因素API
    // 获取MFA特定的token用于授权
    const mfaToken = localStorage.getItem('mfa_access_token');
    const headers = {};
    if (mfaToken) {
      headers.Authorization = `Bearer ${mfaToken}`;
    }
    
    console.log('开始调用/api/v1/mfa/register接口注册因子');
    const response = await request.post('/api/v1/mfa/register', factorData, { headers });
    
    console.log('因子注册API响应:', response);
    
    // 关闭对话框
    registerFactorDialogVisible.value = false;
    
    // 显示成功消息
    // 适配不同的响应格式
    let successMessage = '因子注册成功';
    if (response && response.data) {
      if (response.data.msg) {
        successMessage = response.data.msg;
      } else if (response.data.message) {
        successMessage = response.data.message;
      } else if (typeof response.data === 'string') {
        successMessage = response.data;
      }
    } else if (response && typeof response === 'string') {
      successMessage = response;
    }
    ElMessage.success(successMessage);
    
    // 刷新用户列表
    fetchUsers();
    
  } catch (error) {
    // 显示错误消息
    let errorMessage = '未知错误';
    if (error.response) {
      errorMessage = error.response.data?.msg || error.response.data?.message || error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    ElMessage.error(`因子注册失败: ${errorMessage}`);
    console.error('因子注册失败:', error);
  }
};