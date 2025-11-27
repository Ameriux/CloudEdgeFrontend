import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// 将exec转换为Promise形式
const execPromise = promisify(exec);

// 创建Express应用
const app = express();
const PORT = 4000;

// 配置中间件
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger配置选项
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EdgeServer-Client API Gateway',
      version: '1.0.0',
      description: 'API Gateway for managing EdgeServer-Client configuration and operations'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ]
  },
  apis: ['index.js']
};

// 初始化Swagger文档
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// 提供Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 文件路径常量
const EDGE_SERVER_BIN_PATH = '/home/cluster/ZZX/EdgeServer-Client/bin';
const CONFIG_JSON_PATH = path.join(EDGE_SERVER_BIN_PATH, 'config.json');
const REGISTER_JSON_PATH = path.join(EDGE_SERVER_BIN_PATH, 'register.json');
const IP_LOG_PATH = '/home/cluster/ZZX/CloudEdgeFrontend/src/IP.log';

// 排除的文件列表（不可下载的文件）
const EXCLUDED_FILES = [
  'client-log',
  'compressSYN',
  'config.json',
  'DEBEClient',
  'EdgeServer',
  'register.json',
  'servercert.pem'
];

/**
 * @openapi
 * /api/config:
 *   get:
 *     summary: 获取EdgeServer-Client的配置文件
 *     description: 获取/EdgeServer-Client/bin/config.json的内容
 *     responses:
 *       200:
 *         description: 成功获取配置文件
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 */
app.get('/api/config', async (req, res) => {
  try {
    const configContent = await fs.readFile(CONFIG_JSON_PATH, 'utf8');
    const config = JSON.parse(configContent);
    res.json(config);
  } catch (error) {
    console.error('Error reading config.json:', error);
    res.status(500).json({ error: 'Failed to read config.json' });
  }
});

/**
 * @openapi
 * /api/config:
 *   post:
 *     summary: 更新EdgeServer-Client的配置文件
 *     description: 支持两种更改方式：1. 全量修改（完整的config.json格式） 2. 只修改Auth项（只包含Auth对象）
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: 完整的配置文件格式
 *               - type: object
 *                 properties:
 *                   Auth: 
 *                     type: object
 *                     description: 仅更新Auth部分配置
 *     responses:
 *       200:
 *         description: 成功更新配置文件
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 */
app.post('/api/config', async (req, res) => {
  try {
    const requestBody = req.body;
    
    // 检查参数是否为空
    if (!requestBody || Object.keys(requestBody).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }
    
    let config;
    
    // 判断是否是只修改Auth项的请求格式
    if (Object.keys(requestBody).length === 1 && requestBody.hasOwnProperty('Auth')) {
      // 只更新Auth部分
      const currentConfigContent = await fs.readFile(CONFIG_JSON_PATH, 'utf8');
      config = JSON.parse(currentConfigContent);
      config.Auth = { ...config.Auth, ...requestBody.Auth };
    } else {
      // 全量修改，使用完整的配置格式
      config = requestBody;
    }
    
    // 写入配置文件，确保使用4个空格缩进，与示例文件保持一致
    const formattedJson = JSON.stringify(config, null, 4);
    console.log('Writing formatted JSON to config.json with 4 spaces indentation');
    await fs.writeFile(CONFIG_JSON_PATH, formattedJson, 'utf8');
    res.json({ message: 'Config updated successfully' });
  } catch (error) {
    console.error('Error updating config.json:', error);
    res.status(500).json({ error: 'Failed to update config.json' });
  }
});

/**
 * @openapi
 * /api/register:
 *   get:
 *     summary: 获取EdgeServer-Client的注册配置文件
 *     description: 获取/EdgeServer-Client/bin/register.json的内容
 *     responses:
 *       200:
 *         description: 成功获取注册配置文件
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 */
app.get('/api/register', async (req, res) => {
  try {
    // 检查文件是否存在
    try {
      await fs.access(REGISTER_JSON_PATH);
      // 文件存在，读取内容
      const registerContent = await fs.readFile(REGISTER_JSON_PATH, 'utf8');
      const register = JSON.parse(registerContent);
      res.json(register);
    } catch (accessError) {
      // 文件不存在，返回友好的错误信息
      console.log('Register.json file does not exist. Please run DEBEClient -r first.');
      res.status(200).json({
        status: 'not_registered',
        message: 'Register.json file does not exist. Please run registration first.',
        action_required: 'Execute DEBEClient -r via POST /api/debeclient/register endpoint'
      });
    }
  } catch (error) {
    console.error('Error processing register.json request:', error);
    res.status(500).json({ 
      error: 'Failed to process register request',
      details: error.message 
    });
  }
});

/**
 * @openapi
 * /api/debeclient/register:
 *   post:
 *     summary: 执行DEBEClient注册命令
 *     description: 在/EdgeServer-Client/bin目录下执行 ./DEBEClient -r 指令
 *     responses:
 *       200:
 *         description: 成功执行命令
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 output: 
 *                   type: string
 *       500:
 *         description: 命令执行失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *                 stderr: 
 *                   type: string
 */
app.post('/api/debeclient/register', async (req, res) => {
  try {
    console.log(`[API] Executing DEBEClient -r in directory: ${EDGE_SERVER_BIN_PATH}`);
    
    // 确保目录存在
    try {
      await fs.access(EDGE_SERVER_BIN_PATH);
      console.log(`[API] Directory exists: ${EDGE_SERVER_BIN_PATH}`);
    } catch (dirError) {
      throw new Error(`Directory does not exist: ${EDGE_SERVER_BIN_PATH}`);
    }
    
    // 确保DEBEClient文件存在且可执行
    const debeClientPath = path.join(EDGE_SERVER_BIN_PATH, 'DEBEClient');
    try {
      await fs.access(debeClientPath, fs.constants.X_OK);
      console.log(`[API] DEBEClient exists and is executable: ${debeClientPath}`);
    } catch (exeError) {
      throw new Error(`DEBEClient not found or not executable: ${debeClientPath}`);
    }
    
    // 执行DEBEClient -r命令
    const { stdout, stderr } = await execPromise('./DEBEClient -r', { 
      cwd: EDGE_SERVER_BIN_PATH,
      timeout: 30000 // 30秒超时
    });
    
    console.log(`[API] DEBEClient -r execution completed`);
    console.log(`[API] Stdout: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
    
    if (stderr) {
      console.error(`[API] DEBEClient -r stderr: ${stderr.substring(0, 200)}${stderr.length > 200 ? '...' : ''}`);
    }
    
    // 检查是否创建了register.json或更新了config.json
    let registerFileCreated = false;
    let configFileUpdated = false;
    
    try {
      await fs.access(REGISTER_JSON_PATH);
      registerFileCreated = true;
      console.log(`[API] register.json was created`);
    } catch (e) {
      console.log(`[API] register.json was not created (this might be expected behavior)`);
    }
    
    try {
      await fs.access(CONFIG_JSON_PATH);
      configFileUpdated = true;
      console.log(`[API] config.json exists`);
    } catch (e) {
      console.error(`[API] config.json not found`);
    }
    
    // 返回详细的执行结果
    res.json({
      success: true,
      output: stdout || stderr,
      metadata: {
        register_file_created: registerFileCreated,
        config_file_exists: configFileUpdated,
        execution_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[API] Error executing DEBEClient -r:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute DEBEClient -r',
      details: error.message,
      stderr: error.stderr || null
    });
  }
});

/**
 * @openapi
 * /api/debeclient/upload:
 *   post:
 *     summary: 执行DEBEClient上传命令
 *     description: 在/EdgeServer-Client/bin目录下执行 ./DEBEClient -t u -i {文件路径}指令
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filePath: 
 *                 type: string
 *                 required: true
 *                 description: 要上传的文件路径
 *     responses:
 *       200:
 *         description: 成功执行命令
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 output: 
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *       500:
 *         description: 命令执行失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *                 stderr: 
 *                   type: string
 */
app.post('/api/debeclient/upload', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }
    
    // 确保文件路径是相对于bin目录的路径，并以./开头
    let relativeFilePath = filePath;
    if (!relativeFilePath.startsWith('./')) {
      // 如果没有以./开头，添加./前缀
      relativeFilePath = `./${relativeFilePath}`;
    }
    
    // 构建完整路径用于检查文件是否存在
    const absoluteFilePath = path.join(EDGE_SERVER_BIN_PATH, filePath);
    
    // 检查文件是否存在
    try {
      await fs.access(absoluteFilePath);
    } catch {
      return res.status(400).json({ error: `File not found: ${filePath}` });
    }
    
    // 使用相对路径执行命令
    const command = `./DEBEClient -t u -i ${relativeFilePath}`;
    console.log(`Executing command: ${command} in directory: ${EDGE_SERVER_BIN_PATH}`);
    
    // 执行命令并捕获输出（包括终端日志）
    let terminalOutput = '';
    
    // 使用更底层的方式执行命令，捕获所有输出流
    const { stdout, stderr } = await execPromise(command, {
      cwd: EDGE_SERVER_BIN_PATH,
      // 合并stdout和stderr以便捕获所有终端输出
      shell: true,
      env: { ...process.env }
    });
    
    // 合并标准输出和错误输出
    terminalOutput = (stdout || '') + (stderr || '');
    
    if (stderr) {
      console.error('DEBEClient upload stderr:', stderr);
    }
    
    // 返回终端日志输出
    res.json({ 
      output: terminalOutput,
      command: command,
      directory: EDGE_SERVER_BIN_PATH
    });
  } catch (error) {
    console.error('Error executing DEBEClient upload:', error);
    res.status(500).json({
      error: 'Failed to execute DEBEClient upload',
      stderr: error.stderr || error.message
    });
  }
});

/**
 * @openapi
 * /api/downloadable-files:
 *   get:
 *     summary: 获取可下载的文件列表
 *     description: 获取/EdgeServer-Client/bin目录下可以下载的文件，排除系统文件和配置文件
 *     responses:
 *       200:
 *         description: 成功获取可下载文件列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files: 
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: 
 *                         type: string
 *                       size: 
 *                         type: integer
 *                       mtime: 
 *                         type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 */
app.get('/api/downloadable-files', async (req, res) => {
  try {
    const files = await fs.readdir(EDGE_SERVER_BIN_PATH, { withFileTypes: true });
    
    const downloadableFiles = [];
    for (const file of files) {
      // 排除目录和系统文件
      if (file.isDirectory() || EXCLUDED_FILES.includes(file.name)) {
        continue;
      }
      
      // 获取文件信息
      const filePath = path.join(EDGE_SERVER_BIN_PATH, file.name);
      const stats = await fs.stat(filePath);
      
      downloadableFiles.push({
        name: file.name,
        size: stats.size,
        mtime: stats.mtime.toISOString()
      });
    }
    
    res.json({ files: downloadableFiles });
  } catch (error) {
    console.error('Error getting downloadable files:', error);
    res.status(500).json({ error: 'Failed to get downloadable files' });
  }
});

/**
 * @openapi
 * /api/download/{fileName}:
 *   get:
 *     summary: 下载文件
 *     description: 下载/EdgeServer-Client/bin目录下的文件
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: 要下载的文件名
 *     responses:
 *       200:
 *         description: 成功下载文件
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 文件不允许下载
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *       404:
 *         description: 文件不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 */
app.get('/api/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // 检查文件是否在排除列表中
    if (EXCLUDED_FILES.includes(fileName)) {
      return res.status(400).json({ error: 'File not allowed for download' });
    }
    
    const filePath = path.join(EDGE_SERVER_BIN_PATH, fileName);
    
    // 检查文件是否存在
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // 检查是否是目录
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot download a directory' });
    }
    
    // 下载文件
    res.download(filePath, fileName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

/**
 * @openapi
 * /api/edge-server-files:
 *   get:
 *     summary: 获取EdgeServer bin目录下的文件信息
 *     description: 获取/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin目录下的文件名和大小
 *     responses:
 *       200:
 *         description: 成功获取文件列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       mtime:
 *                         type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.get('/api/edge-server-files', async (req, res) => {
  try {
    const EDGE_SERVER_PROTOTYPE_PATH = '/home/cluster/CloudEdgePrototype-zwj_v2/EdgeServer/bin';
    
    // 检查目录是否存在
    try {
      await fs.access(EDGE_SERVER_PROTOTYPE_PATH);
    } catch {
      return res.status(500).json({ error: 'EdgeServer bin directory not found' });
    }
    
    const files = await fs.readdir(EDGE_SERVER_PROTOTYPE_PATH, { withFileTypes: true });
    
    const fileList = [];
    for (const file of files) {
      // 只处理文件，排除目录
      if (file.isDirectory()) {
        continue;
      }
      
      // 获取文件信息
      const filePath = path.join(EDGE_SERVER_PROTOTYPE_PATH, file.name);
      const stats = await fs.stat(filePath);
      
      fileList.push({
        name: file.name,
        size: stats.size,
        mtime: stats.mtime.toISOString()
      });
    }
    
    res.json({ files: fileList });
  } catch (error) {
    console.error('Error getting EdgeServer files:', error);
    res.status(500).json({ error: 'Failed to get EdgeServer files' });
  }
});

/**
 * @openapi
 * /api/exec-cmd:
 *   post:
 *     summary: 在服务器端执行命令
 *     description: 在服务器端执行shell命令（如curl）并返回结果
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               command:
 *                 type: string
 *                 description: 要执行的shell命令
 *     responses:
 *       200:
 *         description: 命令执行成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 output:
 *                   type: string
 *                   description: 命令的标准输出
 *                 error:
 *                   type: string
 *                   description: 命令的错误输出（如果有）
 *       400:
 *         description: 无效的请求参数
 *       500:
 *         description: 命令执行失败
 */
app.post('/api/exec-cmd', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    // 安全检查：只允许执行curl命令
    if (!command.toLowerCase().startsWith('curl')) {
      return res.status(400).json({ error: 'Only curl commands are allowed for security reasons' });
    }
    
    console.log(`Executing command: ${command}`);
    
    // 执行命令，设置超时时间为10秒
    const { stdout, stderr } = await execPromise(command, { timeout: 10000 });
    
    // 记录curl命令的详细输出日志
    console.log(`Curl command executed`);
    console.log(`Stdout length: ${stdout ? stdout.length : 0} characters`);
    console.log(`Stdout content preview: ${stdout ? stdout.substring(0, 100) : 'empty'}`);
    if (stderr) {
      console.log(`Stderr content: ${stderr}`);
    }
    
    res.json({
      output: stdout,
      error: stderr || null,
      command: command,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({
      error: error.message || 'Failed to execute command',
      details: error.stderr || null
    });
  }
});

/**
 * @openapi
 * /api/edge-server/logs:
 *   get:
 *     summary: 获取EdgeServer日志
 *     description: 通过服务器端curl获取EdgeServer日志的专用端点
 *     responses:
 *       200:
 *         description: 成功获取日志
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: string
 *                 count:
 *                   type: integer
 *                 raw:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 note:
 *                   type: string
 *       500:
 *         description: 获取日志失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 logs:
 *                   type: array
 *                 timestamp:
 *                   type: string
 */
// 获取EdgeServer日志的端点 - 处理嵌套JSON结构
app.get('/api/edge-server/logs', async (req, res) => {
  try {
    console.log('[API] 获取EdgeServer日志请求收到');
    
    // 执行curl命令获取日志
    const { stdout, stderr } = await execPromise('curl -s http://192.168.104.4:5000/api/v1/logs', {
      timeout: 10000 // 10秒超时
    });
    
    console.log(`[API] curl执行成功，输出长度: ${stdout.length} 字符`);
    console.log(`[API] curl输出预览: ${stdout.substring(0, 100)}${stdout.length > 100 ? '...' : ''}`);
    
    let logs = [];
    let rawData = stdout;
    let nestedData = null;
    
    try {
      // 解析外层JSON
      const outerResponse = JSON.parse(stdout);
      console.log(`[API] 成功解析外层JSON，包含字段: ${Object.keys(outerResponse).join(', ')}`);
      
      // 检查是否有output字段
      if (outerResponse.output) {
        rawData = outerResponse.output;
        console.log(`[API] 发现output字段，长度: ${outerResponse.output.length}字符`);
        
        // 解析内层output字段的JSON
        nestedData = JSON.parse(outerResponse.output);
        console.log(`[API] 成功解析内层JSON，包含字段: ${Object.keys(nestedData).join(', ')}`);
        
        // 提取logs数组
        if (Array.isArray(nestedData.logs)) {
          logs = nestedData.logs;
          console.log(`[API] 从内层JSON提取到${nestedData.logs.length}条日志`);
        } else {
          console.log('[API] 内层JSON没有logs数组或格式不正确');
          // 作为备选方案，将整个output按行分割
          logs = outerResponse.output.split('\n').filter(line => line.trim());
        }
      } else {
        console.log('[API] 外层JSON没有output字段，尝试直接提取logs');
        // 如果没有output字段，尝试直接从外层JSON获取logs
        if (Array.isArray(outerResponse.logs)) {
          logs = outerResponse.logs;
          console.log(`[API] 直接从外层JSON提取到${outerResponse.logs.length}条日志`);
        } else {
          console.log('[API] 外层JSON也没有logs数组，按行分割整个输出');
          // 最后备选方案：按行分割整个输出
          logs = stdout.split('\n').filter(line => line.trim());
        }
      }
    } catch (parseError) {
      console.error('[API] JSON解析失败:', parseError.message);
      console.log('[API] 尝试将输出按行分割作为备选方案');
      // 解析失败时的备选方案：按行分割输出
      logs = stdout.split('\n').filter(line => line.trim());
    }
    
    // 构建响应数据
    const response = {
      success: true,
      logs: logs,
      count: logs.length,
      raw: rawData,  // 保存处理后的原始数据
      timestamp: new Date().toISOString(),
      metadata: {
        originalOutputLength: stdout.length,
        parsedNestedData: nestedData !== null,
        parseMethod: nestedData && Array.isArray(nestedData.logs) ? 'nested_json_logs' : 
                     Array.isArray(logs) && logs.length > 0 ? 'line_split' : 'empty',
        note: '处理嵌套JSON结构，确保正确提取logs数组'
      }
    };
    
    console.log(`[API] 最终返回${logs.length}条日志记录`);
    res.json(response);
  } catch (error) {
    console.error(`[API] 获取EdgeServer日志失败:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      logs: [],
      timestamp: new Date().toISOString(),
      metadata: {
        command: 'curl -s http://192.168.104.4:5000/api/v1/logs',
        errorType: error.name,
        errorStack: error.stack ? error.stack.substring(0, 500) : null
      }
    });
  }
});

// 启动服务器
/**
 * @openapi
 * /api/utils/read-log:
 *   get:
 *     summary: 读取IP.log文件日志内容
 *     description: 读取/home/cluster/ZZX/CloudEdgeFrontend/src/IP.log文件的日志内容
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回的日志行数限制，默认返回所有行
 *       - in: query
 *         name: reverse
 *         schema:
 *           type: boolean
 *         description: 是否按时间倒序返回日志，默认false（按时间正序）
 *     responses:
 *       200:
 *         description: 成功读取日志内容
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs: 
 *                   type: array
 *                   items:
 *                     type: string
 *                 fileSize: 
 *                   type: integer
 *                 totalLines: 
 *                   type: integer
 *       404:
 *         description: 日志文件不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 */

/**
 * @openapi
 * /api/utils/write-log:
 *   post:
 *     summary: 写入日志到IP.log文件
 *     description: 向/home/cluster/ZZX/CloudEdgeFrontend/src/IP.log文件追加日志内容
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 要写入的日志内容
 *                 required: true
 *     responses:
 *       200:
 *         description: 成功写入日志
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: 
 *                   type: string
 */
app.get('/api/utils/read-log', async (req, res) => {
  try {
    const { limit, reverse } = req.query;
    
    // 检查文件是否存在
    try {
      await fs.access(IP_LOG_PATH);
    } catch {
      return res.status(404).json({ error: 'IP.log file does not exist' });
    }
    
    // 获取文件信息
    const stats = await fs.stat(IP_LOG_PATH);
    const fileSize = stats.size;
    
    // 读取日志文件内容
    const logContent = await fs.readFile(IP_LOG_PATH, 'utf8');
    
    // 按行分割日志
    let logs = logContent.split('\n')
      .filter(line => line.trim() !== '') // 过滤空行
      .map(line => line.trim());
    
    const totalLines = logs.length;
    
    // 处理反转顺序
    if (reverse === 'true' || reverse === true) {
      logs = logs.reverse();
    }
    
    // 处理行数限制
    if (limit && !isNaN(parseInt(limit))) {
      logs = logs.slice(0, parseInt(limit));
    }
    
    console.log(`Successfully read logs from ${IP_LOG_PATH}, total lines: ${totalLines}`);
    res.json({
      logs,
      fileSize,
      totalLines
    });
  } catch (error) {
    console.error(`Error reading from IP.log:`, error);
    res.status(500).json({ error: 'Failed to read log', details: error.message });
  }
});

app.post('/api/utils/write-log', async (req, res) => {
  try {
    const { content } = req.body;
    
    // 检查参数是否存在
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }
    
    // 调试：检查接收到的内容
    console.log('接收到的日志内容:', content);
    console.log('内容长度:', content.length);
    console.log('内容前10个字符的ASCII编码:', Array.from(content.slice(0, 10)).map(char => char.charCodeAt(0)));
    
    // 修复：清理内容，移除所有可能导致换行的字符，只保留最后一个换行符
    let cleanedContent = content
      .replace(/\r/g, '') // 移除回车符
      .replace(/\n(?!$)/g, ''); // 移除除了最后一个换行符外的所有换行符
      
    // 确保最后有一个换行符
    if (!cleanedContent.endsWith('\n')) {
      cleanedContent += '\n';
    }
    
    console.log('清理后的内容:', cleanedContent);
    
    // 确保目录存在
    const logDir = path.dirname(IP_LOG_PATH);
    try {
      await fs.access(logDir);
    } catch {
      // 如果目录不存在，创建它
      await fs.mkdir(logDir, { recursive: true });
      console.log(`Created directory: ${logDir}`);
    }
    
    // 使用appendFile确保正确追加到文件末尾
    await fs.appendFile(IP_LOG_PATH, cleanedContent);
    
    console.log(`Successfully wrote log to ${IP_LOG_PATH}`);
    res.json({ message: 'Log written successfully' });
  } catch (error) {
    console.error(`Error writing to IP.log:`, error);
    res.status(500).json({ error: 'Failed to write log', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`EdgeServer-Client API Gateway is running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});