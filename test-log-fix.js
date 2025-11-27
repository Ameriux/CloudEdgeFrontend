// 测试日志写入修复效果的脚本
import axios from 'axios';
import fs from 'fs';

// 创建带时间戳的测试日志内容
const timestamp = new Date().toISOString();
const testLog = '[' + timestamp + '] 测试IP异常变动: 客户端IP从 192.168.1.1 变更为 192.168.1.100 (测试修复后的日志写入)';

async function testLogWrite() {
  try {
    console.log('测试日志写入...');
    console.log('发送的日志内容:', testLog);
    
    const response = await axios.post('http://localhost:4000/api/utils/write-log', {
      content: testLog + '\n'
    });
    
    console.log('API响应:', response.data);
    console.log('\n测试成功！请检查IP.log文件，确认日志是否作为一行写入。');
    
    // 读取并显示文件内容以验证
    const logPath = '/home/cluster/ZZX/CloudEdgeFrontend/src/IP.log';
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n');
      console.log(`\nIP.log文件行数: ${lines.length}`);
      console.log('最后几行内容:');
      lines.slice(-5).forEach((line, index) => {
        console.log(`[${lines.length - 5 + index}] ${line}`);
      });
    }
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testLogWrite();