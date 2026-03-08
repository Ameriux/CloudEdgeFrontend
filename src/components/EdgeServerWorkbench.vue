<template>
  <div class="workbench-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>EdgeServer - {{ serverName }}</span>
          <div class="custom-style">
            <el-segmented v-model="viewMode" :options="viewOptions" />
          </div>
        </div>
      </template>

      <!-- 基础数据展示视图 -->
      <div v-if="viewMode === '基础数据展示'">

        <div style="margin: 10px 0;">
          <el-button type="success" size="small" @click="fetchUploadData" :loading="isLoading" :disabled="isLoading">更新上传数据</el-button>
          <el-button type="primary" size="small" @click="fetchDownloadData" :loading="isLoading" :disabled="isLoading" style="margin-left: 10px;">更新下载数据</el-button>
        </div>

        <div class="metrics-display">
          <h3>数据展示（上传）</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic
                v-model:value="lastEncryptionDelay"
                title="文件加密延迟"
                suffix="ms/MiB"
                :precision="3"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                v-model:value="encryptedSize"
                title="加密后逻辑数据大小"
                suffix="MB"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                v-model:value="uniqueDataSize"
                title="去重后数据大小"
                suffix="MB"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                v-model:value="dedupSize"
                title="去重数据量"
                suffix="MB"
              />
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="6">
              <el-statistic
                v-model:value="metaEncryptionDelay"
                title="元数据加密延迟"
                suffix="ms"
                :precision="3"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                v-model:value="reductionTime"
                title="数据压缩时间"
                suffix="ms"
              />
            </el-col>
            <el-col :span="6">
              <el-statistic
                v-model:value="reducedSize"
                title="压缩后数据大小"
                suffix="MB"
              />
            </el-col>
          </el-row>

          <h3 style="margin-top: 20px;">数据展示（下载）</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic
                v-model:value="lastDecryptionDelay"
                title="文件解密延迟"
                suffix="ms/MiB"
                :precision="3"
              />

            </el-col>
            <el-col :span="6">
              <el-statistic
                v-model:value="metaDecryptionDelay"
                title="元数据解密延迟"
                suffix="ms"
                :precision="3"
              />
            </el-col>
          </el-row>
        </div>

        <div class="metrics-display">
          <h3>存储开销占比</h3>
          <h4>计算逻辑：(Containers 大小 + Recipes 大小 - 所有已上传文件总大小) / 所有已上传文件总大小</h4>
          <el-statistic
            :value = "storageUsage ? (storageUsage * 100).toFixed(4) : 0"
            title="存储开销占比"
            suffix="%"
          />
        </div>

        <div class="container-form">
          <h3>Container 数据 </h3>
          <el-table :data="containerData" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="150"></el-table-column>
            <el-table-column prop="size" label="大小 (B)" min-width="120"></el-table-column>
            <el-table-column prop="modifyTime" label="修改时间"></el-table-column>
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" @click="openContentModal(scope.row, 'container')">打开内容</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="file-recipe-form">
          <h3>File Recipe 数据 </h3>
          <el-table :data="fileRecipeData" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="150"></el-table-column>
            <el-table-column prop="size" label="大小 (B)" min-width="120"></el-table-column>
            <el-table-column prop="modifyTime" label="修改时间"></el-table-column>
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" @click="openContentModal(scope.row, 'filerecipe')">打开内容</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="log-output">
          <h3>日志输出</h3>
          <el-input
            ref="logTextareaRef"
            type="textarea"
            :rows="15"
            v-model="logOutput"
            readonly
            placeholder="指令执行日志将显示在这里"
          ></el-input>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <el-button type="primary" size="small" @click="detectLog">日志检测</el-button>
          </div>
        </div>

        <div class="log-detect-output" v-if="showLogDetect">
          <h3>日志检测结果</h3>
          <el-input
            ref="logDetectTextareaRef"
            type="textarea"
            :rows="10"
            v-model="logDetectOutput"
            readonly
            placeholder="日志检测结果将显示在这里"
          ></el-input>
        </div>
      </div>

      <!-- 备份同步视图 -->
      <div v-else-if="viewMode === '备份同步'" class="sync-backup-view">
        <!-- 备份节点列表 -->
        <div class="backup-nodes-section">
          <div class="section-header">
            <h3>备份节点列表</h3>
            <el-button type="primary" @click="showAddBackupNodeDialog = true">添加备份节点</el-button>
          </div>
          <el-table :data="currentServerBackupNodes" style="width: 100%">
            <el-table-column prop="name" label="节点名称" min-width="180"></el-table-column>
            <el-table-column prop="ip" label="IP地址" min-width="150"></el-table-column>
            <el-table-column prop="backupMethod" label="备份方式" min-width="120"></el-table-column>
            <el-table-column label="操作" min-width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" text @click="openEditBackupNodeDialog(scope.row)" style="color: white;">编辑</el-button>
                <el-button type="danger" text @click="removeBackupNode(scope.row.name)" style="color: white;">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 增量备份展示板块 -->
        <div class="incremental-backup-section">
          <div class="section-header">
            <h3>增量备份展示</h3>
          </div>
          
          <!-- 增量备份展示区 - 分为左右两部分 -->
          <div style="display: flex; height: 500px; gap: 20px;">
            <!-- 左侧：FeatureSync -->
            <div class="sync-system-container" style="flex: 1;">
              <h3>FeatureSync</h3>
              
              <!-- 增量同步 1 展示框 -->
              <div class="sync-display-box">
                <h4>增量同步 1</h4>
                <div class="sync-content">
                  <!-- 数据展示框 -->
                  <div class="metrics-display">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-statistic
                          :value="(featureSyncRecords[0]?.traffic / 1024 / 1024).toFixed(2) || 0"
                          title="同步流量"
                          :suffix="'MB'"
                        />
                      </el-col>
                      <el-col :span="12">
                        <el-statistic
                          :value="featureSyncRecords[0]?.time || 0"
                          title="同步时间"
                          :suffix="featureSyncRecords[0]?.timeUnit || 's'"
                          :formatter="formatSeconds"
                        />
                      </el-col>
                    </el-row>
                  </div>
               <h4>与 Rsync 相比</h4>
                <!-- 数据展示框 -->
                <div class="metrics-display">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-statistic
                        :value="((rsyncRecords[0]?.traffic - featureSyncRecords[0]?.traffic) / rsyncRecords[0]?.traffic * 100).toFixed(2) || 0"
                        title="同步流量减少"
                        :suffix="'%'"
                      />
                    </el-col>
                    <el-col :span="12">
                      <el-statistic
                        :value="((rsyncRecords[0]?.time - featureSyncRecords[0]?.time) / rsyncRecords[0]?.time * 100).toFixed(2) || 0"
                        title="同步时间减少"
                        :suffix="'%'"
                      />
                    </el-col>
                   </el-row>
                 </div>
                  <div class="sync-status" style="margin-top: 20px; text-align: center;">
                    <p v-if="featureSyncRecords[0]">
                      {{ formatTimestamp(featureSyncRecords[0].timestamp) }} - 同步到 {{ featureSyncRecords[0].target }}
                    </p>
                    <p v-else>等待文件上传后自动同步...</p>
                  </div>
                  <!-- 同步文件列表 -->
                  <div v-if="featureSyncRecords[0]?.syncedFiles && featureSyncRecords[0].syncedFiles.length > 0" class="synced-files-list">
                    <h5 style="margin-top: 10px; margin-bottom: 5px;">同步文件：</h5>
                    <ul style="margin: 0; padding-left: 20px; max-height: 80px; overflow-y: auto;">
                      <li v-for="(file, index) in featureSyncRecords[0].syncedFiles.slice(0, 5)" :key="index" style="font-size: 12px; margin: 2px 0;">
                        {{ file }}
                      </li>
                      <li v-if="featureSyncRecords[0].syncedFiles.length > 5" style="font-size: 12px; color: #999;">
                        ... 等{{ featureSyncRecords[0].syncedFiles.length }}个文件
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- 增量同步 2 展示框 -->
              <div class="sync-display-box">
                <h4>增量同步 2</h4>
                <div class="sync-content">
                  <!-- 数据展示框 -->
                  <div class="metrics-display">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-statistic
                          :value="(featureSyncRecords[1]?.traffic / 1024 / 1024).toFixed(2) || 0"
                          title="同步流量"
                          :suffix="'MB'"
                        />
                      </el-col>
                      <el-col :span="12">
                        <el-statistic
                          :value="featureSyncRecords[1]?.time || 0"
                          title="同步时间"
                          :suffix="featureSyncRecords[1]?.timeUnit || 's'"
                          :formatter="formatSeconds"
                        />
                      </el-col>
                    </el-row>
                  </div>
                  <div class="sync-status" style="margin-top: 20px; text-align: center;">
                    <p v-if="featureSyncRecords[1]">
                      {{ formatTimestamp(featureSyncRecords[1].timestamp) }} - 同步到 {{ featureSyncRecords[1].target }}
                    </p>
                    <p v-else>无历史同步记录</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧：Rsync -->
            <div class="sync-system-container" style="flex: 1;">
              <h3>Rsync</h3>
              
              <!-- 增量同步 1 展示框 -->
              <div class="sync-display-box">
                <h4>增量同步 1</h4>
                <div class="sync-content">
                  <!-- 数据展示框 -->
                  <div class="metrics-display">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-statistic
                          :value="(rsyncRecords[0]?.traffic / 1024 / 1024).toFixed(2) || 0"
                          title="同步流量"
                          :suffix="'MB'"
                        />
                      </el-col>
                      <el-col :span="12">
                        <el-statistic
                          :value="rsyncRecords[0]?.time || 0"
                          title="同步时间"
                          :suffix="rsyncRecords[0]?.timeUnit || 's'"
                          :formatter="formatSeconds"
                        />
                      </el-col>
                    </el-row>
                  </div>
                  <div class="sync-status" style="margin-top: 20px; text-align: center;">
                    <p v-if="rsyncRecords[0]">
                      {{ formatTimestamp(rsyncRecords[0].timestamp) }} - 同步到 {{ rsyncRecords[0].target }}
                    </p>
                    <p v-else>等待文件上传后自动同步...</p>
                  </div>
                  <!-- 同步文件列表 -->
                  <div v-if="rsyncRecords[0]?.syncedFiles && rsyncRecords[0].syncedFiles.length > 0" class="synced-files-list">
                    <h5 style="margin-top: 10px; margin-bottom: 5px;">同步文件：</h5>
                    <ul style="margin: 0; padding-left: 20px; max-height: 80px; overflow-y: auto;">
                      <li v-for="(file, index) in rsyncRecords[0].syncedFiles.slice(0, 5)" :key="index" style="font-size: 12px; margin: 2px 0;">
                        {{ file }}
                      </li>
                      <li v-if="rsyncRecords[0].syncedFiles.length > 5" style="font-size: 12px; color: #999;">
                        ... 等{{ rsyncRecords[0].syncedFiles.length }}个文件
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- 增量同步 2 展示框 -->
              <div class="sync-display-box">
                <h4>增量同步 2</h4>
                <div class="sync-content">
                  <!-- 数据展示框 -->
                  <div class="metrics-display">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-statistic
                          :value="(rsyncRecords[1]?.traffic / 1024 / 1024).toFixed(2) || 0"
                          title="同步流量"
                          :suffix="'MB'"
                        />
                      </el-col>
                      <el-col :span="12">
                        <el-statistic
                          :value="rsyncRecords[1]?.time || 0"
                          title="同步时间"
                          :suffix="rsyncRecords[1]?.timeUnit || 's'"
                          :formatter="formatSeconds"
                        />
                      </el-col>
                    </el-row>
                  </div>
                  <div class="sync-status" style="margin-top: 20px; text-align: center;">
                    <p v-if="rsyncRecords[1]">
                      {{ formatTimestamp(rsyncRecords[1].timestamp) }} - 同步到 {{ rsyncRecords[1].target }}
                    </p>
                    <p v-else>无历史同步记录</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 备份文件展示列表 -->
        <div class="backup-files-section" v-if="backupFileTitle">
          <div class="section-header">
            <h3>{{ backupFileTitle }}</h3>
          </div>
          <el-table v-if="backupFiles.length > 0" :data="backupFiles" style="width: 100%">
            <el-table-column prop="name" label="文件名" min-width="200"></el-table-column>
            <el-table-column prop="hash" label="哈希值" min-width="150"></el-table-column>
            <el-table-column prop="size" label="文件大小 (B)" min-width="120"></el-table-column>
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" @click="openContentModal(scope.row, 'backup')">文件详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="no-data">
            <p>暂无备份文件数据</p>
          </div>
        </div>

        <!-- Container 数据 -->
        <div class="container-form" v-if="shouldDisplayContainersAndRecipes">
          <h3>Container 数据</h3>
          <el-table :data="containerData" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="150"></el-table-column>
            <el-table-column prop="size" label="大小 (B)" min-width="120"></el-table-column>
            <el-table-column prop="modifyTime" label="修改时间"></el-table-column>
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" @click="openContentModal(scope.row, 'container')">打开内容</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- File Recipe 数据 -->
        <div class="file-recipe-form" v-if="shouldDisplayContainersAndRecipes">
          <h3>File Recipe 数据</h3>
          <el-table :data="fileRecipeData" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="150"></el-table-column>
            <el-table-column prop="size" label="大小 (B)" min-width="120"></el-table-column>
            <el-table-column prop="modifyTime" label="修改时间"></el-table-column>
            <el-table-column label="操作" min-width="100" fixed="right">
              <template #default="scope">
                <el-button type="text" @click="openContentModal(scope.row, 'filerecipe')">打开内容</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 备份恢复测试 -->
        <div class="backup-recovery-test">
          <div class="section-header">
            <h3>备份恢复测试</h3>
          </div>
          <div class="recovery-form">
            <!-- 选择从哪个备份节点恢复的下拉框 -->
            <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
              <span>选择备份节点：</span>
              <el-select 
                v-model="selectedRecoveryNode" 
                placeholder="请选择恢复节点" 
                style="flex: 1;"
                @change="fetchRecoveryFiles"
              >
                <el-option
                  v-for="node in availableBackupNodes"
                  :key="node.id"
                  :label="node.deviceName"
                  :value="node.deviceName"
                ></el-option>
              </el-select>
            </div>
            <!-- 选择恢复方式 -->
            <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
              <span>选择恢复方式：</span>
              <el-select 
                v-model="selectedRecoveryMethod" 
                placeholder="请选择恢复方式" 
                style="flex: 1;"
                @change="handleRecoveryMethodChange"
              >
                <el-option label="FeatureSync" value="FeatureSync"></el-option>
                <el-option label="Rsync" value="Rsync"></el-option>
              </el-select>
            </div>
            <!-- 显示会恢复的文件列表 -->
            <div v-if="selectedRecoveryNode && selectedRecoveryMethod && recoveryFileOptions.length > 0" style="margin-bottom: 20px;">
              <div style="margin-bottom: 10px; font-weight: 600;">将恢复的文件列表：</div>
              <el-table :data="recoveryFileOptions" border style="width: 100%;">
                <el-table-column prop="label" label="文件名" width="300"></el-table-column>
                <el-table-column prop="size" label="大小 (Byte)" width="120">
                  <template #default="{ row }">
                    {{ row.size || 0 }}
                  </template>
                </el-table-column>
              </el-table>
              <div style="margin-top: 10px; color: #909399; font-size: 12px;">
                * 注：系统将恢复以上所有文件，不支持选择单个文件
              </div>
            </div>
            
            <!-- 恢复结果展示 -->
            <div class="recovery-result" style="margin-top: 30px; padding: 20px; border: 1px solid #dcdfe6; border-radius: 4px;">
              <h4 style="margin-bottom: 15px; color: #409eff;">恢复结果</h4>
              <div v-if="isRecoveryProcessing" style="text-align: center; padding: 40px; background-color: #f0f9ff; border: 2px solid #bae7ff; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 12px 0 rgba(24, 144, 255, 0.1);">
                <el-icon style="font-size: 32px; margin-bottom: 15px; color: #1890ff;">
                  loading
                </el-icon>
                <div style="font-size: 18px; color: #1890ff; font-weight: 600;">正在恢复文件</div>
                <div style="margin-top: 10px; color: #606266;">正在从备份节点同步数据，请稍候...</div>
              </div>
              <!-- 使用v-show替代默认隐藏，确保数据区域始终存在 -->
              <div v-show="!isRecoveryProcessing" style="">
                <div style="margin-bottom: 20px; display: flex; gap: 30px;">
                  <div>
                    <span style="color: #909399;">恢复文件总大小：</span>
                    <span style="font-weight: 600;">{{ Number(recoveryResult.totalSentSize) || 0 }} Byte</span>
                  </div>
                  <div>
                    <span style="color: #909399;">恢复时间：</span>
                    <span style="font-weight: 600;">{{ Number(recoveryResult.totalSynTime) || 0 }} s</span>
                  </div>
                </div>
                <div>
                  <div style="margin-bottom: 10px; font-weight: 600;">恢复后得到文件：</div>
                  <!-- 添加key属性，当数据变化时强制重新创建表格组件 -->
                  <el-table 
                    :key="tableKey" 
                    :data="recoveryFileList.length > 0 ? recoveryFileList : tableData" 
                    border 
                    style="width: 100%;"
                    row-key="key"
                    ref="recoveryTableRef"
                  >
                    <el-table-column label="序号" type="index" width="80"></el-table-column>
                    <el-table-column prop="filename" label="文件名称"></el-table-column>
                    <el-table-column prop="path" label="文件路径"></el-table-column>
                    <el-table-column prop="size" label="文件大小(B)" width="120">
                      <template #default="{ row }">
                        {{ row.size }}
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120">
                      <template #default="{ row }">
                        <el-button 
                          v-if="row.filename !== '暂无文件数据'" 
                          size="small" 
                          @click="openContentModal(row)"
                        >
                          查看内容
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>
            <!-- 恢复文件按钮 -->
            <div style="display: flex; justify-content: center; margin-bottom: 20px; margin-top: 20px;">
              <el-button 
                type="primary" 
                @click="recoverFile"
                :disabled="!selectedRecoveryNode || !selectedRecoveryMethod || isRecoveryProcessing"
              >
                恢复文件
              </el-button>
            </div>
          </div>
        </div>

        <!-- 添加备份节点弹窗 -->
        <el-dialog
          title="添加备份节点"
          v-model="showAddBackupNodeDialog"
          width="500px"
          center
        >
          <div class="dialog-content">
            <div style="margin-bottom: 20px;">
              <span>选择备份节点：</span>
              <el-select v-model="selectedBackupNode" placeholder="请选择节点">
                <el-option
                  v-for="node in availableBackupNodesForAdding"
                  :key="node.id"
                  :label="node.deviceName"
                  :value="node.deviceName"
                ></el-option>
              </el-select>
            </div>
            <div style="margin-bottom: 20px;">
              <span>选择备份方式：</span>
              <el-select v-model="selectedBackupMethod" placeholder="请选择备份方式">
                <el-option label="FeatureSync" value="FeatureSync"></el-option>
                <el-option label="Rsync" value="Rsync"></el-option>
                <el-option label="FeatureSync&Rsync" value="FeatureSync&Rsync"></el-option>
              </el-select>
            </div>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showAddBackupNodeDialog = false">取消</el-button>
              <el-button type="primary" @click="addBackupNode">确定</el-button>
            </span>
          </template>
        </el-dialog>
        
        <!-- 编辑备份节点弹窗 -->
        <el-dialog
          title="编辑备份节点"
          v-model="showEditBackupNodeDialog"
          width="500px"
          center
        >
          <div class="dialog-content">
            <div style="margin-bottom: 20px;">
              <span>备份节点：</span>
              <el-input v-model="selectedBackupNode" disabled></el-input>
            </div>
            <div style="margin-bottom: 20px;">
              <span>选择备份方式：</span>
              <el-select v-model="selectedBackupMethod" placeholder="请选择备份方式">
                <el-option label="FeatureSync" value="FeatureSync"></el-option>
                <el-option label="Rsync" value="Rsync"></el-option>
                <el-option label="FeatureSync&Rsync" value="FeatureSync&Rsync"></el-option>
              </el-select>
            </div>
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showEditBackupNodeDialog = false">取消</el-button>
              <el-button type="danger" @click="removeBackupNode(editingNode.name)">删除</el-button>
              <el-button type="primary" @click="updateBackupNode">确定</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </el-card>

    <!-- 内容展示弹窗 -->
    <el-dialog
      :title="contentModalTitle"
      v-model="contentModalVisible"
      width="70%"
      center
    >
      <div class="content-modal-body">
        <el-input
          v-model="contentModalContent"
          type="textarea"
          placeholder="内容加载中..."
          :rows="20"
          readonly
          style="font-family: monospace; font-size: 14px;"
        ></el-input>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onUnmounted, computed, watch, nextTick, reactive } from 'vue'
import { ElStatistic, ElMessage, ElLoading, ElTable, ElTableColumn, ElButton, ElDialog, ElSelect, ElOption, ElSplitter, ElSplitterPanel } from 'element-plus'
import { useStore } from 'vuex'
import axios from 'axios'

export default defineComponent({
  name: 'EdgeServerWorkbench',
  props: {
    serverId: {
      type: String,
      required: true
    },
    serverName: {
      type: String,
      required: false,
      default: '工作台'
    }
  },
  setup(props) {
    const command = ref('')
    const logOutput = ref('')
    const logDetectOutput = ref('')
    const showLogDetect = ref(false)
    const viewOptions = ['基础数据展示', '备份同步']
    const store = useStore()
    
    // 从Vuex获取和设置设备视图模式
    const viewMode = computed({
      get() {
        return store.getters['edgeServer/getDeviceViewMode'](props.serverId)
      },
      set(value) {
        store.commit('edgeServer/SET_DEVICE_VIEW_MODE', { 
          deviceId: props.serverId, 
          viewMode: value 
        })
      }
    })
    
    // 添加日志输入框的引用
    const logTextareaRef = ref(null)
    const logDetectTextareaRef = ref(null)
    
    // 备份同步相关变量
    const showAddBackupNodeDialog = ref(false)
    const showEditBackupNodeDialog = ref(false)
    const selectedBackupNode = ref('')
    const selectedBackupMethod = ref('FeatureSync')
    const editingNode = ref(null)
    
    // FeatureSync相关变量
    const selectedFeatureSyncNode = ref('')
    const featureSyncTraffic = ref(0)
    const featureSyncTime = ref(0)
    const selectedFeatureSyncFile = ref('')
    const featureSyncFileList = ref([])
    
    // Rsync相关变量
    const selectedRsyncNode = ref('')
    const rsyncTraffic = ref(0)
    const rsyncTime = ref(0)
    const selectedRsyncFile = ref('')
    const rsyncFileList = ref([])

    // 备份文件相关变量
    const backupFiles = ref([])
    const backupFileTitle = ref('备份文件列表')
    
    // 存储开销相关变量
    const storageUsage = ref()
    const fetchStorageUsage = () => {
      return fetch('/api-internal/meta/data')
        .then(response => {
          if (!response.ok) {
            throw new Error(`存储开销接口响应错误: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('存储开销数据:', data)
          if (data.status === 'success' && data.total.rate) {
            storageUsage.value = data.total.rate
            console.log(`获取到的存储开销值: ${storageUsage.value}`)
            return storageUsage.value
          }
          // 如果没有获取到有效的rate值，使用默认值0
          storageUsage.value = 0
          return storageUsage.value
        })
        .catch(error => {
          console.error('获取存储开销时出错:', error.message)
          storageUsage.value = 0
          return storageUsage.value
        })
    }

    
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // 动态获取备份文件列表
    const fetchBackupFileList = async () => {
      // node2不显示备份文件列表
      if (currentServer.value.ipAddress === '192.168.104.8') {
        backupFiles.value = [];
        backupFileTitle.value = '';
        return;
      }
      
      let apiUrl = '/api-internal/node2/syn/info';
      let params = { ip: '192.168.104.8' };
      let backupTitle = '源 192.168.104.8 的备份文件';

      if (currentServer.value.ipAddress === '192.168.104.4' || currentServer.value.ipAddress === '192.168.104.5') {
        apiUrl = '/api-internal/other/syn/info';
        params = { ip: currentServer.value.ipAddress };
        console.log('currentServer IP:', currentServer.value.ipAddress);
        backupTitle = '源 192.168.104.8 的备份文件';
      }

      try {
        const response = await axios.get(apiUrl, { params });

        if (response.data.status === 'success' && response.data.files) {
          backupFiles.value = response.data.files.map(file => ({
            name: file.name,
            hash: file.hash,
            size: file.size,
            content: file.content || '',
          }));
        } else {
          backupFiles.value = [];
        }
      } catch (error) {
        console.error('获取备份文件列表失败:', error);
        ElMessage.error(`获取备份文件列表失败: ${error.message || '未知错误'}`);
        backupFiles.value = [];
      }

      // 更新备份文件标题
      backupFileTitle.value = backupTitle;
    };
    
    // 获取当前服务器信息
    const currentServer = computed(() => store.getters['edgeServer/getServerById'](props.serverId))
    
    // 获取当前服务器的备份节点列表
    const currentServerBackupNodes = computed(() => {
      if (!currentServer.value) return []
      return currentServer.value.backupNodes.map(node => {
        const server = store.state.edgeServer.servers.find(s => s.deviceName === node.deviceName)
        return {
          name: node.deviceName,
          ip: server?.ipAddress || '未知',
          backupMethod: node.backupMethod || '未知'
        }
      })
    })
    
    // 获取可用的备份节点（用于添加备份节点功能）
    const availableBackupNodesForAdding = computed(() => {
      if (!currentServer.value) return []
      return store.state.edgeServer.servers.filter(server => 
        server.id !== props.serverId
      )
    })
    
    // 获取当前设备的备份节点列表 - 用于同步功能
    const availableBackupNodes = computed(() => {
      if (!currentServer.value) return []
      return currentServer.value.backupNodes.map(node => {
        const server = store.state.edgeServer.servers.find(s => s.deviceName === node.deviceName)
        return server || { deviceName: node.deviceName, id: node.deviceName }
      })
    })
    
    // 获取文件列表
    const fetchFileList = async (syncType) => {
      try {
        // 并行获取三类文件
        const [binFilesResponse, containerResponse, fileRecipeResponse] = await Promise.all([
          fetch('/api-internal/upload/file/list'),
          fetch('/api-internal/container/info'),
          fetch('/api-internal/file/recipe/info')
        ]);
        
        const binFilesData = await binFilesResponse.json();
        const containerData = await containerResponse.json();
        const fileRecipeData = await fileRecipeResponse.json();
        
        console.log('三类文件接口返回数据:', {
          binFilesData,
          containerData,
          fileRecipeData
        });
        
        const allFiles = [];
        
        // 处理bin目录文件
        if (binFilesData.status === 'success') {
          const files = binFilesData.files || [];
          const binFiles = files.map(file => {
            const fileName = typeof file === 'string' ? file : (file.name || '');
            // 用户要求，bin目录文件显示为./output3.bin这种格式
            const relativePath = fileName ? './' + fileName : '';
            return {
              label: relativePath,
              value: relativePath
            }
          });
          allFiles.push(...binFiles);
        }
        
        // 处理Container文件
        if (containerData.status === 'success') {
          // 适配接口可能返回的不同数据结构
          const containers = containerData.containers || containerData.files || [];
          const containerFiles = containers.map(container => {
            const fileName = container.name || '';
            // 用户要求，Container文件显示为./Containers/name格式
            // 例如：./Containers/70a0bc9635a6201e2df6a5b9e8a048b65352a8d8cee547c07f5e2ac4174db382-secureRecipe
            const displayPath = fileName ? `./Containers/${fileName}` : '';
            return {
              label: displayPath,
              value: displayPath
            }
          });
          allFiles.push(...containerFiles);
        }
        
        // 处理FileRecipe文件
        if (fileRecipeData.status === 'success') {
          // 适配接口可能返回的不同数据结构
          const fileRecipes = fileRecipeData.fileRecipes || fileRecipeData.files || [];
          const fileRecipeFiles = fileRecipes.map(recipe => {
            const fileName = recipe.name || '';
            // 用户要求，FileRecipe文件显示为./FileRecipes/name格式
            // 例如：./FileRecipes/70a0bc9635a6201e2df6a5b9e8a048b65352a8d8cee547c07f5e2ac4174db382-secureRecipe
            const displayPath = fileName ? `./FileRecipes/${fileName}` : '';
            return {
              label: displayPath,
              value: displayPath
            }
          });
          allFiles.push(...fileRecipeFiles);
        }
        
        // 如果所有文件列表为空，添加示例文件以便测试
        if (allFiles.length === 0) {
          // 添加示例文件以覆盖三种类型
          allFiles.push({
            label: './output3.bin',
            value: './output3.bin'
          });
          allFiles.push({
            label: './Containers/example-container-id',
            value: './Containers/example-container-id'
          });
          allFiles.push({
            label: './FileRecipes/example-recipe-id',
            value: './FileRecipes/example-recipe-id'
          });
          console.log('文件列表为空，添加示例文件');
        }
        
        console.log('合并后的文件列表:', allFiles);
        
        // 更新对应的文件列表
        if (syncType === 'featureSync') {
          console.log('更新featureSyncFileList:', allFiles);
          featureSyncFileList.value = allFiles
        } else if (syncType === 'rsync') {
          console.log('更新rsyncFileList:', allFiles);
          rsyncFileList.value = allFiles
        }
      } catch (error) {
        console.error('获取文件列表失败:', error)
        ElMessage.error(`获取文件列表失败: ${error.message || '未知错误'}`)
        
        // 按照用户要求，接口调用失败时保持文件列表为空
        if (syncType === 'featureSync') {
          featureSyncFileList.value = []
        } else if (syncType === 'rsync') {
          rsyncFileList.value = []
        }
      }
    }
    
    // 添加备份节点
    const addBackupNode = () => {
      if (!selectedBackupNode.value) {
        ElMessage.warning('请选择要添加的备份节点')
        return
      }
      
      const backupNode = {
        deviceName: selectedBackupNode.value,
        backupMethod: selectedBackupMethod.value
      }
      
      // 调用Vuex action添加备份节点
      store.dispatch('edgeServer/addBackupNode', {
        serverId: props.serverId,
        backupNode
      })
      
      ElMessage.success('备份节点添加成功')
      showAddBackupNodeDialog.value = false
      selectedBackupNode.value = ''
      selectedBackupMethod.value = 'FeatureSync'
    }
    
    // 移除备份节点
    const removeBackupNode = (nodeName) => {
      // 调用Vuex action移除备份节点
      store.dispatch('edgeServer/removeBackupNode', {
        serverId: props.serverId,
        nodeName
      })
      
      ElMessage.success('备份节点移除成功')
    }
    
    // 打开编辑备份节点弹窗
    const openEditBackupNodeDialog = (node) => {
      editingNode.value = { ...node }
      selectedBackupNode.value = node.name
      selectedBackupMethod.value = node.backupMethod
      showEditBackupNodeDialog.value = true
    }
    
    // 更新备份节点
    const updateBackupNode = () => {
      if (!editingNode.value) return
      
      const updates = {
        backupMethod: selectedBackupMethod.value
      }
      
      // 调用Vuex action更新备份节点
      store.dispatch('edgeServer/updateBackupNode', {
        serverId: props.serverId,
        nodeName: editingNode.value.name,
        updates
      })
      
      ElMessage.success('备份节点更新成功')
      showEditBackupNodeDialog.value = false
      editingNode.value = null
      selectedBackupNode.value = ''
      selectedBackupMethod.value = 'FeatureSync'
    }
    
    // 开始FeatureSync同步
    const startFeatureSync = async () => {
      if (!selectedFeatureSyncNode.value) {
        ElMessage.warning('请选择要同步的节点')
        return
      }
      
      // 获取源节点和目标节点的IP地址
      const sourceServer = currentServer.value
      const targetServer = store.state.edgeServer.servers.find(s => s.deviceName === selectedFeatureSyncNode.value)
      
      if (!sourceServer || !targetServer) {
        ElMessage.error('节点信息获取失败')
        return
      }
      
      // 显示加载状态
      const loading = ElLoading.service({
        lock: true,
        text: 'FeatureSync同步中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      
      try {
        // 检查是否选择了文件
        if (!selectedFeatureSyncFile.value) {
          ElMessage.warning('请选择要同步的文件')
          return
        }
        
        // 调用实际的后端接口
        console.log(`开始FeatureSync同步到节点: ${selectedFeatureSyncNode.value}，文件: ${selectedFeatureSyncFile.value}`)
        const response = await axios.post('/api-internal/edge/Fsyn', {
          synFile: selectedFeatureSyncFile.value,
          source: sourceServer.ipAddress,
          target: targetServer.ipAddress
        })
        
        // 处理返回数据
        const data = response.data
        featureSyncTraffic.value = data.sent_size
        featureSyncTime.value = data.syn_time
        
        // 生成备份文件数据
        const newBackupFiles = [
          {
            name: `feature_sync_data_${Date.now()}.dat`,
            sourceNode: selectedFeatureSyncNode.value,
            size: data.sent_size,
            syncTime: new Date().toLocaleString()
          }
        ]
        
        ElMessage.success('FeatureSync同步完成')
        
        // 调用接口更新备份文件列表
        await fetchBackupFileList()
      } catch (error) {
        console.error('FeatureSync同步失败:', error)
        ElMessage.error(`同步失败: ${error.message || '未知错误'}`)
      } finally {
        loading.close()
      }
    }
    
    // 开始Rsync同步
    const startRsync = async () => {
      if (!selectedRsyncNode.value) {
        ElMessage.warning('请选择要同步的节点')
        return
      }
      
      // 获取源节点和目标节点的IP地址
      const sourceServer = currentServer.value
      const targetServer = store.state.edgeServer.servers.find(s => s.deviceName === selectedRsyncNode.value)
      
      if (!sourceServer || !targetServer) {
        ElMessage.error('节点信息获取失败')
        return
      }
      
      // 显示加载状态
      const loading = ElLoading.service({
        lock: true,
        text: 'Rsync同步中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      
      // 检查是否选择了文件
      if (!selectedRsyncFile.value) {
        ElMessage.warning('请选择要同步的文件')
        return
      }
      
      try {
        // 调用实际的后端接口
        console.log(`开始Rsync同步到节点: ${selectedRsyncNode.value}，文件: ${selectedRsyncFile.value}`)
        const response = await axios.post('/api-internal/edge/Rsyn', {
          synFile: selectedRsyncFile.value,
          source: sourceServer.ipAddress,
          target: targetServer.ipAddress
        })
        
        // 处理返回数据
        const data = response.data
        rsyncTraffic.value = data.sent_size
        rsyncTime.value = data.syn_time
        
        // 生成备份文件数据
        const newBackupFiles = [
          {
            name: `rsync_backup_${Date.now()}.tar.gz`,
            sourceNode: selectedRsyncNode.value,
            size: data.sent_size,
            syncTime: new Date().toLocaleString()
          },
          {
            name: `rsync_metadata_${Date.now()}.json`,
            sourceNode: selectedRsyncNode.value,
            size: Math.floor(Math.random() * 50000) + 10000,
            syncTime: new Date().toLocaleString()
          }
        ]
        
        ElMessage.success('Rsync同步完成')
        
        // 调用接口更新备份文件列表
        await fetchBackupFileList()
      } catch (error) {
        console.error('Rsync同步失败:', error)
        ElMessage.error(`同步失败: ${error.message || '未知错误'}`)
      } finally {
        loading.close()
      }
    }

    // 从Vuex获取数据
    const lastEncryptionDelay = computed(() => store.state.edgeServer.lastEncryptionDelay)
    const totalEncryptionDelay = computed(() => store.state.edgeServer.totalEncryptionDelay / 1000)
    const metaEncryptionDelay = computed(() => store.state.edgeServer.metaEncryptionDelay / 1000)
    const encryptedSize = computed(() => store.state.edgeServer.encryptedSize / 1024 / 1024)
    const reductionTime = computed(() => store.state.edgeServer.reductionTime / 1000)
    const reducedSize = computed(() => store.state.edgeServer.reducedSize / 1024 / 1024)
    const dedupSize = computed(() => store.state.edgeServer.dedupSize / 1024 / 1024)
    const uniqueDataSize = computed(() => store.state.edgeServer.uniqueDataSize / 1024 / 1024)
    const lastDecryptionDelay = computed(() => store.state.edgeServer.lastDecryptionDelay)
    const totalDecryptionDelay = computed(() => store.state.edgeServer.totalDecryptionDelay / 1000)
    const metaDecryptionDelay = computed(() => store.state.edgeServer.metaDecryptionDelay / 1000)
    const cloudReadTime = computed(() => store.state.edgeServer.cloudReadTime)
    
    // 过滤函数：排除特定后缀的文件（-enc, .enc, -enc-result）
    const filterExcludedSuffixes = (files) => {
      if (!Array.isArray(files)) return [];
      // 使用正则表达式匹配需要排除的后缀
      const excludedPattern = /(-enc|\.enc|-enc-result|\.tar|\.enc-result)$/;
      return files.filter(file => {
        // 确保file和file.name存在
        if (!file || !file.name) return true;
        // 返回不匹配排除模式的文件
        return !excludedPattern.test(file.name);
      });
    };

    // 修改计算属性，添加过滤逻辑
    const containerData = computed(() => filterExcludedSuffixes(store.state.edgeServer.containerData))
    const fileRecipeData = computed(() => filterExcludedSuffixes(store.state.edgeServer.fileRecipeData))
    const previousContainerData = computed(() => store.state.edgeServer.previousContainerData || [])
    const previousFileRecipeData = computed(() => store.state.edgeServer.previousFileRecipeData || [])
    const hasUploadEvent = computed(() => store.state.edgeServer.hasUploadEvent)

    // 加载状态
    const isLoading = ref(false)

    // 获取加密延迟信息
    const fetchEncryptionInfo = () => {
      console.log(`正在获取${props.serverName}加密延迟信息...`)
      return fetch('/api-internal/encryption/info')
        .then(response => {
          if (!response.ok) {
            throw new Error(`加密延迟接口响应错误: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('加密延迟数据:', data)
          // 提取并转换接口数据为数字类型
          const encryptionDelay = parseInt(data.encrypt_time) || 0
          const metaEncryptionDelay = parseInt(data.meta_encrypt_time) || 0
          const logicalDataSize = parseInt(data.logical_data_size) || 0
          const compressedTime = parseInt(data.comppressed_time) || 0
          const compressedSize = parseInt(data.compressed_size) || 0
          const uniqueDataSize = parseInt(data.unique_data_size) || 0
          
          // 检查是否所有数据都为0
          const allZero = encryptionDelay === 0 && 
                          metaEncryptionDelay === 0 && 
                          logicalDataSize === 0 && 
                          compressedTime === 0 && 
                          compressedSize === 0 && 
                          uniqueDataSize === 0
          
          // 存储allZero状态到store，供其他地方使用
          store.commit('edgeServer/SET_UPLOAD_EVENT_STATUS', { hasUploadEvent: !allZero })
          
          // 更新加密延迟数据
          store.commit('edgeServer/UPDATE_UPLOAD_DATA', {
            encryptionDelay,
            metaEncryptionDelay,
            logicalDataSize,
            compressedTime,
            compressedSize,
            uniqueDataSize
          })
          
          console.log('加密数据更新完成:', {
            encryptionDelay,
            metaEncryptionDelay,
            logicalDataSize,
            compressedTime,
            compressedSize,
            uniqueDataSize,
            allZero
          })
          
          return data
        })
        .catch(error => {
          console.error(`获取加密信息出错: ${error.message}`)
          return Promise.reject(error)
        })
    }

    // 获取解密延迟信息
    const fetchDecryptionInfo = () => {
      console.log(`正在获取${props.serverName}解密延迟信息...`)
      return fetch('/api-internal/decryption/info')
        .then(response => {
          if (!response.ok) {
            throw new Error(`解密延迟接口响应错误: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('解密延迟数据:', data)
          
          // 提取并转换接口数据为数字类型
          const decryptionDelay = parseInt(data.decrypt_time) || 0
          const metaDecryptionDelay = parseInt(data.meta_decrypt_time) || 0
          const cloudReadTime = parseInt(data.read_from_cloud_time) || 0
          
          // 更新解密延迟数据
          store.commit('edgeServer/UPDATE_DOWNLOAD_DATA', {
            decryptionDelay,
            metaDecryptionDelay,
            cloudReadTime
          })
          
          console.log('解密数据更新完成:', {
            decryptionDelay,
            cloudReadTime
          })
          
          return data
        })
        .catch(error => {
          console.error(`获取解密信息出错: ${error.message}`)
          return Promise.reject(error)
        })
    }

    // 调用容器信息接口
    const fetchContainerInfo = () => {
      console.log(`正在获取${props.serverName}容器信息...`)
      return fetch('/api-internal/container/info')
        .then(response => {
          if (!response.ok) {
            throw new Error(`容器信息接口响应错误: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('容器信息数据:', data)
          if (data.status === 'success') {
            // 接口返回的数据在data.files中，而不是data.data
            const containerInfo = (data.files || []).map(item => ({
              name: item.name || '未知名称',
              size: item.size || 0, // 直接使用原始单位B
              modifyTime: item.last_modified ? new Date(item.last_modified).toLocaleString() : '未知时间',
              content: item.content || '' // 保留content字段，用于弹窗显示
            }))
            console.log(`获取容器信息成功，共${containerInfo.length}条记录`)
            // 将数据提交到Vuex store
            store.commit('edgeServer/UPDATE_CONTAINER_DATA', containerInfo)
            return containerInfo
          } else {
            console.log(`获取容器信息失败: ${data.message || '未知错误'}`)
            return Promise.reject(new Error(`获取容器信息失败: ${data.message || '未知错误'}`))
          }
        })
        .catch(error => {
          console.error(`获取容器信息出错: ${error.message}`)
          return Promise.reject(error)
        })
    }

    // 调用文件配方信息接口
    const fetchFileRecipeInfo = () => {
      console.log(`正在获取${props.serverName}文件配方信息...`)
      return fetch('/api-internal/file/recipe/info')
        .then(response => {
          if (!response.ok) {
            throw new Error(`文件配方信息接口响应错误: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('文件配方信息数据:', data)
          if (data.status === 'success') {
            // 接口返回的数据在data.files中，而不是data.data
            const fileRecipeInfo = (data.files || []).map(item => ({
              name: item.name || '未知名称',
              size: item.size || 0, // 直接使用原始单位B
              modifyTime: item.last_modified ? new Date(item.last_modified).toLocaleString() : '未知时间',
              content: item.content || '' // 保留content字段，用于弹窗显示
            }))
            console.log(`获取文件配方信息成功，共${fileRecipeInfo.length}条记录`)
            // 将数据提交到Vuex store
            store.commit('edgeServer/UPDATE_FILE_RECIPE_DATA', fileRecipeInfo)
            return fileRecipeInfo
          } else {
            console.log(`获取文件配方信息失败: ${data.message || '未知错误'}`)
            return Promise.reject(new Error(`获取文件配方信息失败: ${data.message || '未知错误'}`))
          }
        })
        .catch(error => {
          console.error(`获取文件配方信息出错: ${error.message}`)
          return Promise.reject(error)
        })
    }

    // 更新上传数据
    const fetchUploadData = () => {
      console.log(`开始更新${props.serverName}上传数据...`)
      isLoading.value = true

      // 保存当前数据作为"上次数据"
      console.log('保存当前数据作为上次数据...')
      store.dispatch('edgeServer/savePreviousData')
      console.log(`已保存上次容器数据: ${previousContainerData.value.length} 条，上次文件配方数据: ${previousFileRecipeData.value.length} 条`)

      // 显示加载效果
      const loadingInstance = ElLoading.service({
        target: '.workbench-container',
        text: '正在获取数据',
        background: 'rgba(0, 0, 0, 0.1)'
      })

      // 调用上传相关数据接口、公共数据接口和存储开销接口
      Promise.all([
        fetchEncryptionInfo(),
        fetchContainerInfo(),
        fetchFileRecipeInfo(),
        fetchStorageUsage(),
      ])
        .then(results => {
          const containerInfo = results[1];
          const fileRecipeInfo = results[2];

          // 直接使用接口更新后存储在store中的数据
          console.log('上传数据和公共数据获取完成');
          console.log(`新容器数据: ${containerInfo.length} 条，新文件配方数据: ${fileRecipeInfo.length} 条`);
          
          // 检查是否有上传事件
          if (!hasUploadEvent.value) {
            ElMessage({ message: '没有进行上传操作', type: 'warning' })
          } else {
            ElMessage({ message: '上传数据更新成功', type: 'success' })
          }
          
          // 关闭加载效果
          loadingInstance.close()
          isLoading.value = false

          // 获取并更新EdgeServer日志
          fetchEdgeLog();
        })
        .catch(error => {
          console.error('数据获取失败');
          console.error('错误详情:', error.message);
          // 回滚到之前的数据
          store.dispatch('edgeServer/restorePreviousData');
          console.log('已回滚到之前的数据');
          ElMessage({ message: '数据更新失败: ' + error.message, type: 'error' })
          
          // 关闭加载效果
          loadingInstance.close()
          isLoading.value = false
        })
    }

    // 更新下载数据
    const fetchDownloadData = () => {
      console.log(`开始更新${props.serverName}下载数据...`)
      isLoading.value = true

      // 保存当前数据作为"上次数据"
      console.log('保存当前数据作为上次数据...')
      store.dispatch('edgeServer/savePreviousData')
      console.log(`已保存上次容器数据: ${previousContainerData.value.length} 条，上次文件配方数据: ${previousFileRecipeData.value.length} 条`)

      // 显示加载效果
      const loadingInstance = ElLoading.service({
        target: '.workbench-container',
        text: '正在获取数据',
        background: 'rgba(0, 0, 0, 0.1)'
      })

      // 调用下载相关数据接口、公共数据接口和存储开销接口
      Promise.all([
        fetchDecryptionInfo(),
        fetchContainerInfo(),
        fetchFileRecipeInfo(),
        fetchStorageUsage(),
      ])
        .then(results => {
          const containerInfo = results[1];
          const fileRecipeInfo = results[2];

          // 直接使用接口更新后存储在store中的数据
          console.log('下载数据和公共数据获取完成');
          console.log(`新容器数据: ${containerInfo.length} 条，新文件配方数据: ${fileRecipeInfo.length} 条`);
          
          ElMessage({ message: '下载数据更新成功', type: 'success' })
          
          // 关闭加载效果
          loadingInstance.close()
          isLoading.value = false

          // 获取并更新EdgeServer日志
          fetchEdgeLog();
        })
        .catch(error => {
          console.error('数据获取失败');
          console.error('错误详情:', error.message);
          // 回滚到之前的数据
          store.dispatch('edgeServer/restorePreviousData');
          console.log('已回滚到之前的数据');
          ElMessage({ message: '数据更新失败: ' + error.message, type: 'error' })
          
          // 关闭加载效果
          loadingInstance.close()
          isLoading.value = false
        })
    }

    // 同时调用多个接口（保留原函数作为完整更新）
    const fetchAllData = () => {
      console.log(`开始同时获取${props.serverName}多个接口数据...`)
      isLoading.value = true

      // 保存当前数据作为"上次数据"
      console.log('保存当前数据作为上次数据...')
      store.dispatch('edgeServer/savePreviousData')
      console.log(`已保存上次容器数据: ${previousContainerData.value.length} 条，上次文件配方数据: ${previousFileRecipeData.value.length} 条`)

      // 显示加载效果
      const loadingInstance = ElLoading.service({
        target: '.workbench-container',
        text: '正在获取数据',
        background: 'rgba(0, 0, 0, 0.1)'
      })

      // 先并行调用主要数据接口
      Promise.all([
        fetchEncryptionInfo(),
        fetchContainerInfo(),
        fetchFileRecipeInfo(),
        fetchDecryptionInfo()  // 添加解密信息接口调用
      ])
        .then(results => {
          const containerInfo = results[1];
          const fileRecipeInfo = results[2];

          // 直接使用接口更新后存储在store中的数据，不再依赖返回值
          console.log('所有接口数据获取完成');
          console.log(`新容器数据: ${containerInfo.length} 条，新文件配方数据: ${fileRecipeInfo.length} 条`);
          
          // 检查是否有上传事件
          if (!hasUploadEvent.value) {
            ElMessage({ message: '没有进行上传操作', type: 'warning' })
          } else {
            ElMessage({ message: '数据更新成功', type: 'success' })
          }
          
          // 关闭加载效果
          loadingInstance.close()
          isLoading.value = false

          // 额外添加数据更新日志到控制台（直接从store获取数据）
          console.log('\n===== 数据更新状态 =====');
          console.log('加密延迟(本次):', store.state.edgeServer.lastEncryptionDelay, 'ms/MiB');
          console.log('元数据加密延迟(本次):', store.state.edgeServer.metaEncryptionDelay, 'us');
          console.log('加密后数据大小(本次):', store.state.edgeServer.encryptedSize, 'B');
          console.log('数据冗余缩减时间(本次):', store.state.edgeServer.reductionTime, 'us');
          console.log('冗余缩减后数据大小(本次):', store.state.edgeServer.reducedSize, 'B');
          console.log('去重数据量(本次):', store.state.edgeServer.dedupSize, 'B');
          console.log('解密延迟(本次):', store.state.edgeServer.lastDecryptionDelay, 'ms/MiB');
          console.log('元数据解密延迟(本次):', store.state.edgeServer.metaDecryptionDelay, 'us');
          console.log('从云端读取时间:', store.state.edgeServer.cloudReadTime, 'us');
          console.log('容器数据数量:', containerInfo.length, '条');
          console.log('文件配方数据数量:', fileRecipeInfo.length, '条');
          console.log('========================');
          
          // 获取并更新EdgeServer日志
          fetchEdgeLog();
        })
        .catch(error => {
          console.error('部分接口数据获取失败');
          console.error('错误详情:', error.message);
          console.error('错误堆栈:', error.stack || '无');
          // 回滚到之前的数据
          store.dispatch('edgeServer/restorePreviousData');
          console.log('已回滚到之前的数据');
          ElMessage({ message: '数据更新失败: ' + error.message, type: 'error' })
          
          // 关闭加载效果
          loadingInstance.close()
          isLoading.value = false
        })
    }

    // 轮询定时器引用
    const pollTimer = ref(null)

    // 选择要删除的文件
    const selectedDeleteFile = ref('')
    
    // 合并所有可删除的文件列表
    const allAvailableFiles = computed(() => {
      const files = []
      
      // 添加备份文件
      backupFiles.value.forEach(file => {
        files.push({
          label: `备份文件: ${file.name}`,
          value: file.name
        })
      })
      
      // 添加Container文件
      containerData.value.forEach(file => {
        files.push({
          label: `Container: ${file.name}`,
          value: `./Containers/${file.name}`
        })
      })
      
      // 添加FileRecipe文件
      fileRecipeData.value.forEach(file => {
        files.push({
          label: `FileRecipe: ${file.name}`,
          value: `./Recipes/${file.name}`
        })
      })
      
      return files
    })
    
    // 删除选中的文件
    const deleteSelectedFile = async () => {
      if (!selectedDeleteFile.value) {
        ElMessage.warning('请先选择要删除的文件')
        return
      }
      
      try {
        ElMessage.info('正在保存内容并删除文件...')
        
        // 调用删除文件接口
        const response = await axios.post('/api/delete', {
          files: [selectedDeleteFile.value]
        })
        
        if (response.data.status === 'success') {
          ElMessage.success(`文件删除成功: ${response.data.message}`)
          // 清空选择
          selectedDeleteFile.value = ''
          // 重新获取文件列表以更新界面
          fetchBackupFileList().catch(console.error)
          fetchContainerInfo().catch(console.error)
          fetchFileRecipeInfo().catch(console.error)
        } else {
          ElMessage.error(`文件删除失败: ${response.data.message || '未知错误'}`)
        }
      } catch (error) {
        console.error('删除文件出错:', error)
        ElMessage.error(`删除文件时发生错误: ${error.message || '网络错误'}`)
      }
    }
    
    // 组件挂载时预先获取一次文件列表并设置轮询
    onMounted(() => {
      // 预先获取文件列表，确保下拉框有数据显示
      setTimeout(() => {
        fetchFileList('featureSync');
        fetchFileList('rsync');
        fetchStorageUsage();
        // 初始化备份文件列表
        fetchBackupFileList();
        
        // 根据当前服务器IP决定是否获取容器和文件配方数据
        // 只有node2(192.168.104.8)需要获取这些数据
        if (currentServer.value && currentServer.value.ipAddress === '192.168.104.8') {
          // 初始化获取容器和文件配方数据
          fetchContainerInfo().catch(console.error);
          fetchFileRecipeInfo().catch(console.error);
          // 初始化获取存储开销占比
          fetchStorageUsage().catch(console.error);
        }
      }, 100);

      // 设置轮询，每10秒更新数据
      pollTimer.value = setInterval(() => {
        console.log('轮询更新数据...');
        // 根据当前服务器IP决定是否获取容器和文件配方数据
        if (currentServer.value && currentServer.value.ipAddress === '192.168.104.8') {
          console.log('更新Container、Recipe列表和存储开销占比...');
          fetchContainerInfo().catch(console.error);
          fetchFileRecipeInfo().catch(console.error);
          fetchStorageUsage().catch(console.error);
        }
      }, 10000);
    })

    // 组件卸载时清理定时器
    onUnmounted(() => {
      if (pollTimer.value) {
        clearInterval(pollTimer.value);
        console.log('已清理轮询定时器');
        pollTimer.value = null;
      }
    })

    // 清除加密延迟
    const clearEncryptionDelay = () => {
      console.log('清除加密延迟...');
      try {
        store.commit('edgeServer/CLEAR_ENCRYPTION_DELAY');
        console.log('加密延迟已重置为0');
        ElMessage({ message: '加密延迟已成功清除', type: 'success' });
      } catch (error) {
        console.error(`清除加密延迟失败: ${error.message}`);
        ElMessage({ message: '清除加密延迟失败', type: 'error' });
      }
    }

    // 清除解密延迟
    const clearDecryptionDelay = () => {
      console.log('清除解密延迟...');
      try {
        store.commit('edgeServer/CLEAR_DECRYPTION_DELAY');
        console.log('解密延迟已重置为0');
        ElMessage({ message: '解密延迟已成功清除', type: 'success' });
      } catch (error) {
        console.error(`清除解密延迟失败: ${error.message}`);
        ElMessage({ message: '清除解密延迟失败', type: 'error' });
      }
    }

    // 从http://localhost:8080/edge/log接口获取EdgeServer日志
    const fetchEdgeLog = () => {
      console.log(`正在获取${props.serverName}日志...`);
      // 清空日志输出框，只显示当前获取的EdgeServer日志
      logOutput.value = '';
      fetch('/api-internal/edge/log')
        .then(response => {
          if (!response.ok) {
            throw new Error(`EdgeServer日志接口响应错误: ${response.status}`);
          }
          // 打印原始响应文本到控制台以便调试
          return response.text().then(text => {
            console.log('EdgeServer日志API原始响应:', text);
            // 尝试解析为JSON
            try {
              return JSON.parse(text);
            } catch (e) {
              // 非JSON格式，直接返回文本
              return text;
            }
          });
        })
        .then(data => {
          // 优先检查是否有edge_log字段
          if (typeof data === 'object' && data !== null && data.edge_log) {
            if (typeof data.edge_log === 'string') {
              // 处理字符串格式的日志
              logOutput.value = data.edge_log.replace(/\\n/g, '\n');
            } else if (Array.isArray(data.edge_log)) {
              // 处理数组格式的日志
              logOutput.value = data.edge_log.join('\n');
            } else if (typeof data.edge_log === 'object') {
              // 处理对象格式的日志
              logOutput.value = JSON.stringify(data.edge_log, null, 2).replace(/\\n/g, '\n');
            }
            console.log('EdgeServer日志获取成功(edge_log字段)');
          } else if (Array.isArray(data)) {
            // 处理数组格式的日志
            logOutput.value = data.join('\n');
            console.log('EdgeServer日志获取成功(数组格式)');
          } else if (typeof data === 'string') {
            // 处理纯文本格式的日志
            logOutput.value = data.replace(/\\n/g, '\n');
            console.log('EdgeServer日志获取成功(非JSON格式)');
          } else if (typeof data === 'object' && data !== null) {
            // 处理其他对象格式的日志
            logOutput.value = JSON.stringify(data, null, 2).replace(/\\n/g, '\n');
            console.log('EdgeServer日志获取成功(JSON对象)');
          } else {
            logOutput.value = '获取到的EdgeServer日志格式不匹配';
            console.log('获取到的EdgeServer日志格式不匹配');
          }
        })
        .catch(error => {
          logOutput.value = `获取EdgeServer日志失败: ${error.message}`;
          console.error('获取EdgeServer日志失败:', error);
        });
    }

    // 日志检测功能
    const detectLog = () => {
      console.log('开始日志检测...');
      // 显示检测结果输出框
      showLogDetect.value = true;
      // 清空之前的检测结果
      logDetectOutput.value = '正在进行日志检测，请稍候...';
      
      // 获取当前日志内容
      const currentLog = logOutput.value;
      
      if (!currentLog || currentLog.trim() === '') {
        logDetectOutput.value = '当前没有可检测的日志内容，请先获取日志。';
        return;
      }
      
      // 调用日志检测接口
      fetch('/api-internal/log/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          log: currentLog,
          type: 'edge'
        })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`日志检测接口响应错误: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('日志检测结果:', data);
          // 格式化检测结果以便显示
          if (data.summary) {
            // 如果有summary字段，优先显示summary
            logDetectOutput.value = (data.details || '')+ '\n\n' + data.summary;
          } else if (typeof data === 'object') {
            // 显示整个对象
            logDetectOutput.value = JSON.stringify(data, null, 2).replace(/\\n/g, '\n');
          } else {
            // 显示字符串结果
            logDetectOutput.value = String(data);
          }
        })
        .catch(error => {
          console.error('日志检测失败:', error);
          logDetectOutput.value = `日志检测失败: ${error.message}`;
        });
    }

    const executeCommand = () => {
      if (!command.value.trim()) {
        console.log('请输入指令')
        return
      }

      // 这里预留后端接口位置
      console.log(`执行指令: ${command.value}`)

      // 模拟指令执行
      setTimeout(() => {
        console.log(`指令执行完成，结果: 成功`);
        // 执行命令后获取最新日志
        fetchEdgeLog();
      }, 1000)
    }

    const createNewWorkbench = () => {
      // 这里预留后端接口位置
      console.log('已创建新的工作台');
      // 实际应用中可以打开一个新的标签页或弹窗
      alert('新建工作台功能将在实际应用中实现')
    }

    // 格式化秒数，保留2位小数
    const formatSeconds = (value) => {
      return value.toFixed(2)
    }
    
    // 格式化时间戳
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    
    // 获取当前服务器的FeatureSync同步记录
    const featureSyncRecords = computed(() => {
      if (!currentServer.value || !store.state.edgeServer.incrementalSyncRecords) {
        return [];
      }
      const records = store.state.edgeServer.incrementalSyncRecords[currentServer.value.id];
      return records && records['FeatureSync'] ? records['FeatureSync'] : [];
    });
    
    // 获取当前服务器的Rsync同步记录
    const rsyncRecords = computed(() => {
      if (!currentServer.value || !store.state.edgeServer.incrementalSyncRecords) {
        return [];
      }
      const records = store.state.edgeServer.incrementalSyncRecords[currentServer.value.id];
      return records && records['Rsync'] ? records['Rsync'] : [];
    });
    
    // 监听上传事件，自动刷新同步记录
    watch(
      () => store.state.edgeServer.hasUploadEvent,
      (hasEvent) => {
        if (hasEvent && viewMode.value === '备份同步') {
          // 重置上传事件状态
          store.commit('edgeServer/SET_UPLOAD_EVENT_STATUS', { hasUploadEvent: false });
        }
      }
    );
    
    // 首次增量同步相关变量
    const selectedFirstSyncNode = ref('');
    const firstSyncTraffic = ref(0);
    const firstSyncTime = ref(0);
    
    // 非首次增量同步相关变量
    const subsequentSyncTraffic = ref(0);
    const subsequentSyncTime = ref(0);
    const subsequentSyncStatus = ref('等待文件上传后自动同步...');
    
    // 文件选择相关变量
    const dialogVisible = ref(false);
    const treeRef = ref(null);
    const fileTreeData = ref([]);
    const previewFiles = ref([]);
    const isUploading = ref(false);
    
    // 算法相关变量
    const hashAlgorithm = ref('none');
    const encryptionAlgorithm = ref('none');
    const asymmetricEncryptionAlgorithm = ref('none');
    const otherAlgorithm = ref('none');
    
    // 首次增量同步方法
    const startFirstIncrementalSync = async () => {
      if (!selectedFirstSyncNode.value) {
        ElMessage.warning('请选择同步节点');
        return;
      }
      
      // 这里预留后端接口位置
      console.log('开始首次增量同步');
      // 模拟同步过程
      setTimeout(() => {
        firstSyncTraffic.value = Math.floor(Math.random() * 1000000);
        firstSyncTime.value = Math.random() * 10 + 5;
        ElMessage.success('首次增量同步完成');
      }, 2000);
    };
    
    // 文件选择相关方法
    const openFileDialog = () => {
      fetchUploadFileList()
      dialogVisible.value = true
    }

    // 新增：获取文件列表
// 构建树形数据
const buildTreeData = (data) => {
  console.log('buildTreeData函数被调用，输入数据:', data)
  const treeData = []

  // 增加对data参数的空值检查
  if (!data) {
    console.warn('buildTreeData: data is undefined or null')
    return treeData
  }

  console.log('data类型:', typeof data)
  console.log('data的属性:', Object.keys(data))

  // 处理可能的不同数据结构
  let containerPath = null
  let filesList = []

  // 检查是否有container_path属性
  if (data.container_path) {
    containerPath = data.container_path
    filesList = data.files || []
    console.log('找到container_path:', containerPath)
  }
  // 检查是否有其他可能的路径字段
  else if (data.path || data.directory || data.folder) {
    containerPath = data.path || data.directory || data.folder
    filesList = data.files || data.items || data.entries || []
    console.log('找到替代路径字段:', containerPath)
  }
  // 如果data本身就是一个数组，尝试直接处理
  else if (Array.isArray(data)) {
    console.log('data是一个数组，尝试直接处理')
    // 如果数组中每个元素看起来像一个文件对象
    if (data.length > 0 && data[0].name) {
      // 创建一个默认根目录
      containerPath = '/'
      filesList = data
      console.log('使用默认根目录/', '文件数量:', filesList.length)
    }
  }

  // 如果找到了有效的containerPath
  if (containerPath) {
    console.log('准备构建树形结构，容器路径:', containerPath, '文件数量:', filesList.length)
    // 确保根目录路径不包含末尾的点号
    const cleanContainerPath = containerPath.replace(/\.\/$/, '').replace(/\.$/, '')

    const rootNode = {
      label: cleanContainerPath,
      value: cleanContainerPath,
      children: [],
      disabled: true // 禁用根目录的选择框
    }

    if (filesList && Array.isArray(filesList) && filesList.length > 0) {
      console.log('处理文件列表，数量:', filesList.length)
      filesList.forEach((file, index) => {
        console.log(`处理文件${index}:`, file)
        // 确保file是有效的对象且有name属性
        if (file && typeof file === 'object' && file.name) {
          // 确保构建的文件路径没有多余的斜杠
          const fileSeparator = cleanContainerPath.endsWith('/') ? '' : '/'
          rootNode.children.push({
            label: file.name,
            value: `${cleanContainerPath}${fileSeparator}${file.name}`,
            disabled: false // 允许选择文件节点
          })
        } else if (typeof file === 'string') {
          // 处理可能是字符串的文件列表
          const fileSeparator = cleanContainerPath.endsWith('/') ? '' : '/'
          rootNode.children.push({
            label: file,
            value: `${cleanContainerPath}${fileSeparator}${file}`,
            disabled: false
          })
        }
      })
    } else {
      console.log('文件列表为空或不是有效数组')
    }

    console.log('根节点构建完成，子节点数量:', rootNode.children.length)
    treeData.push(rootNode)
  } else {
    console.log('未找到有效的容器路径，尝试创建默认根节点')
    // 如果没有找到有效的路径，创建一个默认的根节点
    const defaultRoot = {
      label: '默认目录',
      value: '/',
      children: [],
      disabled: true
    }
    treeData.push(defaultRoot)
  }

  console.log('树形数据构建完成，返回的treeData:', treeData)
  return treeData
}

const fetchUploadFileList = async () => {
  try {
    console.log('正在获取文件列表...')
    const response = await fetch('/api-internal/upload/file/list')
    const data = await response.json()

    // 打印完整的API响应数据，查看实际结构
    console.log('API返回完整数据:', data)

    if (data.status === 'success') {
      console.log('获取文件列表成功')
      console.log('data.data内容:', data.data)
      console.log('data.data类型:', typeof data.data)
      
      // 检查API返回的数据是否包含文件信息
      let hasValidFiles = false
      if (typeof data.data === 'object' && data.data !== null) {
        console.log('data.data的属性:', Object.keys(data.data))
        console.log('是否包含container_path:', 'container_path' in data.data)
        
        // 检查是否有文件列表
        if ('files' in data.data && Array.isArray(data.data.files) && data.data.files.length > 0) {
          console.log('files数组长度:', data.data.files.length)
          console.log('files内容预览:', data.data.files.slice(0, 3))
          hasValidFiles = true
        }
      }
      
      // 如果API返回的数据没有有效的文件列表，提供模拟数据
      let finalData = data.data
      if (!hasValidFiles) {
        console.log('API返回的数据没有有效的文件列表，使用模拟数据')
        finalData = {
          container_path: '/home/user/data',
          files: [
            { name: 'file1.txt' },
            { name: 'file2.bin' },
            { name: 'document.pdf' },
            { name: 'image.jpg' },
            { name: 'config.json' }
          ]
        }
      }
      
      // 使用buildTreeData函数将数据构建成树形结构
      const treeData = buildTreeData(finalData)
      console.log('构建后的树形数据:', treeData)
      fileTreeData.value = treeData || []
    } else {
      console.error(`获取文件列表失败: ${data.message || '未知错误'}`)
      // 发生错误时提供模拟数据
      console.log('使用模拟数据作为回退')
      const mockData = {
        container_path: '/home/user/data',
        files: [
          { name: 'file1.txt' },
          { name: 'file2.bin' },
          { name: 'document.pdf' }
        ]
      }
      const treeData = buildTreeData(mockData)
      fileTreeData.value = treeData || []
    }
  } catch (error) {
    console.error(`获取文件列表出错: ${error.message}`)
    // 发生异常时提供模拟数据
    console.log('使用模拟数据作为回退')
    const mockData = {
      container_path: '/home/user/data',
      files: [
        { name: 'file1.txt' },
        { name: 'file2.bin' }
      ]
    }
    const treeData = buildTreeData(mockData)
    fileTreeData.value = treeData || []
  }
}
    
    const closeFileDialog = () => {
      dialogVisible.value = false;
      // 清除选中状态
      if (treeRef.value) {
        treeRef.value.setCheckedKeys([]);
      }
    };
    
    const handleCheckChange = (data, checked, indeterminate) => {
      console.log('文件选中状态改变:', data, checked, indeterminate);
    };
    
    const confirmFileSelection = () => {
      if (treeRef.value) {
        const checkedNodes = treeRef.value.getCheckedNodes(true);
        const newFiles = checkedNodes.map((node, index) => ({
          id: index + 1,
          name: node.label,
          path: node.value
        }));
        previewFiles.value = [...previewFiles.value, ...newFiles];
        // 去重
        const uniqueFiles = [];
        const seenPaths = new Set();
        previewFiles.value.forEach(file => {
          if (!seenPaths.has(file.path)) {
            seenPaths.add(file.path);
            uniqueFiles.push(file);
          }
        });
        previewFiles.value = uniqueFiles;
        
        ElMessage.success(`已选择 ${newFiles.length} 个文件`);
        closeFileDialog();
      }
    };
    
    const removeFile = (id) => {
      previewFiles.value = previewFiles.value.filter(file => file.id !== id);
      ElMessage.success('文件已删除');
    };
    
    // 上传文件方法
    const uploadFiles = async () => {
      if (previewFiles.value.length === 0) {
        ElMessage.warning('请先选择要上传的文件');
        return;
      }
      
      isUploading.value = true;
      
      try {
        // 模拟上传文件
        const params = {
          files: previewFiles.value,
          hashAlgorithm: hashAlgorithm.value,
          encryptionAlgorithm: encryptionAlgorithm.value,
          asymmetricEncryptionAlgorithm: asymmetricEncryptionAlgorithm.value,
          otherAlgorithm: otherAlgorithm.value
        };
        
        console.log('上传文件参数:', params);
        
        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        ElMessage.success('文件上传成功');
        // 上传成功后自动触发非首次增量同步
        triggerSubsequentSync();
        previewFiles.value = [];
      } catch (error) {
        console.error('文件上传失败:', error);
        ElMessage.error('文件上传失败');
      } finally {
        isUploading.value = false;
      }
    };
    
    // 触发非首次增量同步
    const triggerSubsequentSync = async () => {
      subsequentSyncStatus.value = '正在进行增量同步...';
      
      // 这里预留后端接口位置
      console.log('触发非首次增量同步');
      
      // 模拟同步过程
      setTimeout(() => {
        subsequentSyncTraffic.value = Math.floor(Math.random() * 500000);
        subsequentSyncTime.value = Math.random() * 5 + 2;
        subsequentSyncStatus.value = '增量同步完成';
      }, 2000);
    };

    // 滚动到文本框底部的辅助函数
    const scrollToBottom = (textareaRef) => {
      if (textareaRef.value) {
        const textarea = textareaRef.value.$el.querySelector('textarea')
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight
        }
      }
    }
    
    // 监听日志输出变化，自动滚动到底部
    const unwatchLog = watch(logOutput, () => {
      nextTick(() => {
        scrollToBottom(logTextareaRef)
      })
    })
    
    // 监听日志检测结果变化，自动滚动到底部
    const unwatchLogDetect = watch(logDetectOutput, () => {
      nextTick(() => {
        scrollToBottom(logDetectTextareaRef)
      })
    })
    
      // 内容展示弹窗相关状态
    const contentModalVisible = ref(false);
    // 表格引用
    const recoveryTableRef = ref(null);
    const contentModalTitle = ref('');
    const contentModalContent = ref('');

    // 打开内容弹窗
    const openContentModal = (item, type) => {
      // 支持解密后的文件格式，优先使用filename，其次使用name
      contentModalTitle.value = item.filename || item.name || '未知文件';
      
      // 对于备份文件类型，我们需要特殊处理二进制数据
      if ((type === 'backup' || item.filename) && item.content) {
        try {
          // 尝试将内容作为二进制数据处理
          // 这里我们不做任何清理或过滤，直接显示原始内容
          // 但添加适当的提示信息，告诉用户这是二进制数据
          contentModalContent.value = item.content;
        } catch (e) {
          console.error('处理文件内容时出错:', e);
          contentModalContent.value = item.content || '处理文件内容时出错';
        }
      } else {
        // 对于Container和FileRecipe数据，保持原有的处理方式
        contentModalContent.value = item.content || '暂无内容数据';
      }
      
      contentModalVisible.value = true;
    }

    // 文件恢复相关变量
    const selectedRecoveryNode = ref('');
    const selectedRecoveryMethod = ref(''); // FeatureSync或Rsync
    const recoveryFileOptions = ref([]);
    // 恢复结果相关变量 - 使用更健壮的初始化
    const showRecoveryResult = ref(true); // 始终显示结果区域
    const isRecoveryProcessing = ref(false);
    // 使用reactive确保深层响应式
    const recoveryResult = reactive({
      totalSentSize: 0,
      totalSynTime: 0
    });
    // 添加表格key属性，用于强制重新渲染表格组件
    const tableKey = ref(0);
    
    // 模仿containerData的实现方式，直接从store获取恢复文件数据
    const recoveryFileList = computed(() => {
      // 确保store和state存在
      if (store && store.state.edgeServer && Array.isArray(store.state.edgeServer.recoveryFiles)) {
        console.log('从store获取恢复文件数据，长度:', store.state.edgeServer.recoveryFiles.length);
        return store.state.edgeServer.recoveryFiles;
      }
      // 返回空数组作为默认值
      console.log('store中没有恢复文件数据');
      return [];
    });
    
    // 表格显示数据的计算属性
    const tableData = computed(() => {
      // 优先使用recoveryFileList
      if (recoveryFileList.value.length > 0) {
        return recoveryFileList.value;
      }
      // 空数据时返回占位项
      return [{filename: '暂无文件数据', path: '', size: 0, key: 0}];
    });

    // 处理恢复方式改变
    const handleRecoveryMethodChange = () => {
      // 不再根据恢复方式重新获取文件列表，文件列表只由备份节点选择决定
      // 恢复方式仅用于后续的恢复操作接口调用
    };

    // 恢复文件功能
    const recoverFile = async () => {
      if (!selectedRecoveryNode.value) {
        ElMessage.warning('请选择备份节点');
        return;
      }

      if (!selectedRecoveryMethod.value) {
        ElMessage.warning('请选择恢复方式');
        return;
      }

      // 获取当前节点和目标节点的IP地址
      const sourceNode = store.state.edgeServer.servers.find(
        (server) => server.deviceName === selectedRecoveryNode.value
      );
      const targetNode = currentServer.value;

      if (!sourceNode || !targetNode) {
        ElMessage.error('节点信息获取失败');
        return;
      }

      // 立即设置恢复中状态，确保UI能及时响应
      isRecoveryProcessing.value = true;
      // 重置恢复结果，避免之前的数据影响
      recoveryResult.totalSentSize = 0;
      recoveryResult.totalSynTime = 0;
      // 清除store中的恢复文件数据
      if (store && store.commit) {
        store.commit('edgeServer/SET_RECOVERY_FILES', []);
      }
      
      // 强制UI更新
      await nextTick();
      
      // 显示全局提示消息
      ElMessage.info('文件恢复操作已开始，请在恢复结果区域查看进度...');

      try {
        // 根据选择的恢复方式调用不同的接口
        const apiEndpoint = selectedRecoveryMethod.value === 'FeatureSync' 
          ? '/api-internal/edge/Fsyn/restore' 
          : '/api-internal/edge/Rsyn/restore';
          
        // 调用恢复文件接口
        const response = await axios.post(apiEndpoint, {
          source: sourceNode.ipAddress, // 源节点是备份节点IP
          target: targetNode.ipAddress  // 目标节点是本节点IP
        });

        if (response.data.status === 'success') {
          ElMessage.success('文件恢复成功');
          
          // 确保显示恢复结果
          showRecoveryResult.value = true;
          
          // 详细记录完整的响应数据，便于调试
          console.log('完整API响应数据:', response.data);
          
          // 更健壮地处理响应数据，使用reactive对象的直接赋值
          // 1. 先尝试获取完整的Proxy对象
          const resultData = response.data.data || response.data.result || {};
          
          // 2. 优先从response.data中获取，然后是resultData
          recoveryResult.totalSentSize = response.data.totalSentSize || 
                                      response.data.total_sent_size || 
                                      resultData.totalSentSize || 
                                      resultData.total_sent_size || 
                                      0;
          
          recoveryResult.totalSynTime = response.data.totalSynTime || 
                                     response.data.total_syn_time || 
                                     resultData.totalSynTime || 
                                     resultData.total_syn_time || 
                                     0;
          
          // 添加数据类型检查，确保是数字类型
          recoveryResult.totalSentSize = Number(recoveryResult.totalSentSize) || 0;
          recoveryResult.totalSynTime = Number(recoveryResult.totalSynTime) || 0;
          
          // 新增：调用解密接口
          ElMessage.info('正在解密恢复文件...');
          const decryptEndpoint = selectedRecoveryMethod.value === 'FeatureSync' 
            ? '/api-internal/fsyn/decrypt' 
            : '/api-internal/rsyn/decrypt';
          
          const decryptResponse = await axios.post(decryptEndpoint);
          
          if (decryptResponse.data.status === 'success') {
            ElMessage.success('文件解密成功');
            console.log('解密接口响应数据:', decryptResponse.data);
            
            // 使用解密接口返回的文件列表
            const decryptFiles = Array.isArray(decryptResponse.data.files) ? decryptResponse.data.files : [];
            
            // 格式化解密后的文件数据
            const formattedDecryptFiles = decryptFiles.map((file, index) => ({
              filename: file.filename || '未知文件名',
              path: file.path || '未知路径',
              content: file.content || '',
              size: file.size || 0,
              key: index
            }));
            
            console.log('准备更新文件列表，共', formattedDecryptFiles.length, '个文件');
            
            // 提交数据到Vuex store，模仿containerData的更新方式
            if (store && store.commit) {
              console.log('将恢复文件数据提交到store');
              store.commit('edgeServer/SET_RECOVERY_FILES', formattedDecryptFiles);
              console.log('store中的恢复文件数据已更新，长度:', store.state.edgeServer.recoveryFiles?.length || 0);
            }
            
            // 3. 更新表格key，强制Vue重新创建表格组件
            tableKey.value += 1;
            console.log('表格key已更新为:', tableKey.value);
            
            // 2. 立即强制UI更新
            await nextTick();
            console.log('UI更新后，tableData长度:', tableData.length);
          } else {
            ElMessage.error(`文件解密失败: ${decryptResponse.data.message || '未知错误'}`);
          }
          
          // 强制UI更新以显示结果
          await nextTick();
          // 使用setTimeout再次确保UI更新
          setTimeout(() => {
            console.log('UI更新后的恢复结果数据:', recoveryResult);
            // 从store获取恢复文件数据
            if (store && store.state.edgeServer && Array.isArray(store.state.edgeServer.recoveryFiles)) {
              console.log('UI更新后的恢复文件列表:', store.state.edgeServer.recoveryFiles);
            } else {
              console.log('UI更新后的恢复文件列表: []');
            }
          }, 100);
        } else {
          ElMessage.error(`文件恢复失败: ${response.data.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('文件恢复失败:', error);
        ElMessage.error(`文件恢复失败: ${error.message || '网络错误'}`);
        // 修复：recoveryResult是reactive对象，不应该使用.value
        recoveryResult.totalSentSize = 0;
        recoveryResult.totalSynTime = 0;
        // 清除store中的恢复文件数据
        if (store && store.commit) {
          store.commit('edgeServer/SET_RECOVERY_FILES', []);
        }
      } finally {
        // 恢复完成，重置状态
        isRecoveryProcessing.value = false;
        // 确保结果区域显示
        showRecoveryResult.value = true;
        
        // 强制UI更新
        await nextTick();
        
        // 表格刷新现在通过key属性自动处理，这里不再需要手动刷新
        console.log('表格刷新由key属性自动处理');
        
        // 再次强制UI更新
        setTimeout(async () => {
          await nextTick();
          console.log('最终UI状态确认，表格数据长度:', tableData.length);
        }, 100);
      }
    };

    // 动态获取恢复文件列表
    const fetchRecoveryFiles = async () => {
      if (!selectedRecoveryNode.value) {
        return; // 不清除列表，保持已有的文件列表
      }

      const sourceNode = store.state.edgeServer.servers.find(
        (server) => server.deviceName === selectedRecoveryNode.value
      );

      if (!sourceNode) {
        return; // 不清除列表，保持已有的文件列表
      }

      try {
        // 修正API接口URL，使用正确的sync路径
        const response = await axios.get('/api-internal/other/syn/info', {
          params: { ip: sourceNode.ipAddress }
        });

        if (response.data && response.data.files && Array.isArray(response.data.files)) {
          // 处理返回的文件列表数据，确保格式正确
          recoveryFileOptions.value = response.data.files.map(file => {
            // 确保每个文件对象都有label和size属性，以适应表格显示
            return {
              label: file.name || file.label || '未知文件名',
              size: file.size || 0,
              ...file // 保留原始文件的所有其他属性
            };
          });
          console.log('成功获取并处理备份文件列表:', recoveryFileOptions.value);
        } else {
          // 即使没有数据也不清除列表，保持已有状态
          console.log('未获取到有效的备份文件列表，但保持现有列表');
        }
      } catch (error) {
        console.error('获取恢复文件列表失败:', error);
        ElMessage.error(`获取恢复文件列表失败: ${error.message || '未知错误'}`);
        // 发生错误时不清除列表，保持已有状态
      }
    };

    // 确保每个 EdgeServer 工作区的数据独立
    watch(
      () => currentServer.value.ipAddress,
      (newIp) => {
        if (newIp) {
          fetchBackupFileList(); // 切换工作区时重新获取备份文件列表
          // 不再清空恢复文件选项，保持列表数据持久化
          selectedRecoveryMethod.value = ''; // 清空恢复方式选择
        }
      },
      { immediate: true }
    );

    // 动态控制 Containers 和 Recipes 数据展示
    const shouldDisplayContainersAndRecipes = computed(() => {
      // 只有node2(192.168.104.8)显示Containers和Recipes数据
      return currentServer.value && currentServer.value.ipAddress === '192.168.104.8';
    });

  return {
      command,
      // totalSentSize,
      logOutput,
      logDetectOutput,
      showLogDetect,
      viewMode,
      viewOptions,
      executeCommand,
      createNewWorkbench,
      fetchAllData,
      fetchUploadData,
      fetchDownloadData,
      detectLog,
      dedupSize,
      lastEncryptionDelay,
      totalEncryptionDelay,
      // 备份同步相关
      showAddBackupNodeDialog,
      selectedBackupNode,
      currentServerBackupNodes,
      availableBackupNodes,
      availableBackupNodesForAdding,
      addBackupNode,
      removeBackupNode,
      featureSyncRecords,
      rsyncRecords,
      formatTimestamp,
        // 首次增量同步相关
        selectedFirstSyncNode,
        firstSyncTraffic,
        firstSyncTime,
        startFirstIncrementalSync,
        // 非首次增量同步相关
        subsequentSyncTraffic,
        subsequentSyncTime,
        subsequentSyncStatus,
        triggerSubsequentSync,
        // 文件选择相关
        dialogVisible,
        fileTreeData,
        previewFiles,
        isUploading,
        treeRef,
        openFileDialog,
        closeFileDialog,
        handleCheckChange,
        confirmFileSelection,
        removeFile,
        uploadFiles,
        // 算法相关
        hashAlgorithm,
        encryptionAlgorithm,
        asymmetricEncryptionAlgorithm,
        otherAlgorithm,
        // 获取文件列表方法
        fetchUploadFileList,
        fetchFileList,
        
        // 备份文件相关
        backupFiles,
        backupFileTitle,
        formatFileSize,
        fetchBackupFileList,
        // 文件恢复相关
        selectedRecoveryNode,
        selectedRecoveryMethod,
        recoveryFileOptions,
        recoverFile,
        fetchRecoveryFiles,
        recoveryResult,
        showRecoveryResult,
        isRecoveryProcessing,
        recoveryFileList,
      metaEncryptionDelay,
      encryptedSize,
      reductionTime,
      reducedSize,
      uniqueDataSize,
      lastDecryptionDelay,
      totalDecryptionDelay,
      metaDecryptionDelay,
      cloudReadTime,
      containerData,
      fileRecipeData,
      logTextareaRef,
      logDetectTextareaRef,
      contentModalVisible,
      contentModalTitle,
      contentModalContent,
      openContentModal,
      formatSeconds,
      shouldDisplayContainersAndRecipes,

      storageUsage,
      fetchStorageUsage,
    }
  }
})
</script>

<style scoped>
.workbench-container {
  padding: 20px;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.command-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

/* Segmented组件自定义样式 */
.custom-style .el-segmented {
  --el-segmented-item-selected-color: var(--el-text-color-primary);
  --el-segmented-item-selected-bg-color: #67c23a;
  --el-border-radius-base: 16px;
}

/* 备份同步视图样式 */
.sync-backup-view {
  min-height: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 备份节点列表样式 */
.backup-nodes-section {
  margin-bottom: 20px;
}

/* 备份文件列表样式 */
.backup-files-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

/* 暂无数据样式 */
.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  background-color: #ffffff;
  border-radius: 8px;
  color: #909399;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* Splitter分割面板样式 */
.incremental-backup-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.sync-display-box {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sync-display-box h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sync-content {
  display: flex;
  flex-direction: column;
}

.upload-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.upload-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.upload-content {
  display: flex;
  flex-direction: column;
}

.algorithm-selection {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.sync-status {
  color: #67c23a;
  font-weight: 500;
}

.metrics-display h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 弹窗样式 */
.dialog-content {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 新增行高亮样式 */
.new-row {
  background-color: rgba(147, 249, 185, 0.3) !important;
}

/* 加载状态遮罩样式 */
.el-loading-mask {
  z-index: 2000;
}

.el-loading-message {
  color: #409EFF;
  font-size: 14px;
}

.test-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.container-form,
.file-recipe-form {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.log-output {
    margin-top: 20px;
    }

  .log-detect-output {
    margin-top: 20px;
  }

  .sync-system-container {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }

  .sync-system-container h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #303133;
    font-size: 18px;
    font-weight: 500;
  }

  .metrics-display {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.el-statistic {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>