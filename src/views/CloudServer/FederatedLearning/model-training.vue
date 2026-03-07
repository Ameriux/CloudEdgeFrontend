<template>
  <div class="model-training-container">
    <h2>模型训练&投毒防御</h2>
    
    <!-- 训练参数设置 -->
    <div class="settings-container">
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <span>训练参数设置</span>
          </div>
        </template>
        
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <!-- CIFAR图像数据集参数示例 -->
          <el-tab-pane label="CIFAR图像数据集参数示例" name="image">
            <el-form :model="imageParams" label-width="150px">
              <div class="form-row">
                <el-form-item label="数据集" class="form-item-half">
                  <el-input v-model="imageParams.dataset_name" disabled placeholder="cifar10" />
                </el-form-item>
                
                <el-form-item label="模型" class="form-item-half">
                  <el-select v-model="imageParams.model_name" placeholder="选择模型">
                    <el-option label="ResNet18" value="resnet18" />
                    <el-option label="MLP" value="mlp" />
                    <el-option label="SqueezeNet" value="squeezenet" />
                    <el-option label="LeNet" value="lenet" />
                  </el-select>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="算法" class="form-item-half">
                  <el-select v-model="imageParams.fed_alg" placeholder="选择算法">
                    <el-option label="FedAdam" value="FedAdam" />
                    <el-option label="FedAVG" value="FedAVG" />
                    <el-option label="FedSGD" value="FedSGD" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="压缩率" class="form-item-half">
                  <el-input-number v-model="imageParams.zip_ratio" :min="0.01" :max="1.0" :step="0.01" />
                  <div class="setting-hint">0.01-1.0之间的小数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="总步数" class="form-item-half">
                  <el-input-number v-model="imageParams.total_step" :min="10" :max="10000" :step="1" />
                  <div class="setting-hint">10-10000步</div>
                </el-form-item>
                
                <el-form-item label="单次处理数量" class="form-item-half">
                  <el-input-number v-model="imageParams.client_batch_size" :min="8" :max="64" :step="1" />
                  <div class="setting-hint">8-64之间的整数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="学习率" class="form-item-half">
                  <el-input-number v-model="imageParams.server_lr" :min="0.001" :max="1.5" :step="0.001" />
                  <div class="setting-hint">0.001-1.5之间的小数</div>
                </el-form-item>
                
                <el-form-item label="隐私预算" class="form-item-half">
                  <el-input-number v-model="imageParams.dp_epsilon" :min="0" :max="10000.0" :step="0.1" />
                  <div class="setting-hint">0-10000.0之间的小数</div>
                </el-form-item>

              </div>
              
              <div class="form-row">
                <el-form-item label="参与 Edge 选择" class="form-item-half">
                  <el-select v-model="imageParams.edge" placeholder="选择参与模型训练的 Edge" multiple @change="handleEdgeSelectChange($event, imageParams)">
                    <el-option label="全选" value="all" />
                    <el-option label="EdgeServer-node5" value="EdgeServer-node5" />
                    <el-option label="EdgeServer-node6" value="EdgeServer-node6" />
                    <el-option label="EdgeServer-node7" value="EdgeServer-node7" />
                    <el-option label="EdgeServer-node8" value="EdgeServer-node8" />
                    <el-option label="EdgeServer-node9" value="EdgeServer-node9" />
                  </el-select>
                </el-form-item>
              </div>

            </el-form>
          </el-tab-pane>

          <!-- MNIST图像数据集参数示例 -->
          <el-tab-pane label="MNIST图像数据集参数示例" name="mnist">
            <el-form :model="mnistParams" label-width="150px">
              <div class="form-row">
                <el-form-item label="数据集" class="form-item-half">
                  <el-input v-model="mnistParams.dataset_name" disabled placeholder="mnist" />
                </el-form-item>
                
                <el-form-item label="模型" class="form-item-half">
                  <el-select v-model="mnistParams.model_name" placeholder="选择模型">
                    <el-option label="ResNet18" value="resnet18" />
                    <el-option label="MLP" value="mlp" />
                    <el-option label="SqueezeNet" value="squeezenet" />
                    <el-option label="LeNet" value="lenet" />
                  </el-select>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="算法" class="form-item-half">
                  <el-select v-model="mnistParams.fed_alg" placeholder="选择算法">
                    <el-option label="FedAdam" value="FedAdam" />
                    <el-option label="FedAVG" value="FedAVG" />
                    <el-option label="FedSGD" value="FedSGD" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="压缩率" class="form-item-half">
                  <el-input-number v-model="mnistParams.zip_ratio" :min="0.01" :max="1.0" :step="0.01" />
                  <div class="setting-hint">0.01-1.0之间的小数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="总步数" class="form-item-half">
                  <el-input-number v-model="mnistParams.total_step" :min="10" :max="10000" :step="1" />
                  <div class="setting-hint">10-10000步</div>
                </el-form-item>
                
                <el-form-item label="单次处理数量" class="form-item-half">
                  <el-input-number v-model="mnistParams.client_batch_size" :min="8" :max="64" :step="1" />
                  <div class="setting-hint">8-64之间的整数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="学习率" class="form-item-half">
                  <el-input-number v-model="mnistParams.server_lr" :min="0.001" :max="1.5" :step="0.001" />
                  <div class="setting-hint">0.001-1.5之间的小数</div>
                </el-form-item>
                
                <el-form-item label="隐私预算" class="form-item-half">
                  <el-input-number v-model="mnistParams.dp_epsilon" :min="0" :max="10000.0" :step="0.1" />
                  <div class="setting-hint">0-10000.0之间的小数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="参与 Edge 选择" class="form-item-half">
                  <el-select v-model="mnistParams.edge" placeholder="选择参与模型训练的 Edge" multiple @change="handleEdgeSelectChange($event, mnistParams)">
                    <el-option label="全选" value="all" />
                    <el-option label="EdgeServer-node5" value="EdgeServer-node5" />
                    <el-option label="EdgeServer-node6" value="EdgeServer-node6" />
                    <el-option label="EdgeServer-node7" value="EdgeServer-node7" />
                    <el-option label="EdgeServer-node8" value="EdgeServer-node8" />
                    <el-option label="EdgeServer-node9" value="EdgeServer-node9" />
                  </el-select>
                </el-form-item>
              </div>

            </el-form>
          </el-tab-pane>

          <!-- 交通图像数据集参数示例 -->
          <el-tab-pane label="交通图像数据集参数示例" name="transport">
            <el-form :model="transportParams" label-width="150px">
              <div class="form-row">
                <el-form-item label="数据集" class="form-item-half">
                  <el-input v-model="transportParams.dataset_name" disabled placeholder="gtsrb" />
                </el-form-item>
                
                <el-form-item label="模型" class="form-item-half">
                  <el-select v-model="transportParams.model_name" placeholder="选择模型">
                    <el-option label="ResNet18" value="resnet18" />
                    <el-option label="MLP" value="mlp" />
                    <el-option label="SqueezeNet" value="squeezenet" />
                    <el-option label="LeNet" value="lenet" />
                  </el-select>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="算法" class="form-item-half">
                  <el-select v-model="transportParams.fed_alg" placeholder="选择算法">
                    <el-option label="FedAdam" value="FedAdam" />
                    <el-option label="FedAVG" value="FedAVG" />
                    <el-option label="FedSGD" value="FedSGD" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="压缩率" class="form-item-half">
                  <el-input-number v-model="transportParams.zip_ratio" :min="0.01" :max="1.0" :step="0.01" />
                  <div class="setting-hint">0.01-1.0之间的小数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="总步数" class="form-item-half">
                  <el-input-number v-model="transportParams.total_step" :min="10" :max="10000" :step="1" />
                  <div class="setting-hint">10-10000步</div>
                </el-form-item>
                
                <el-form-item label="单次处理数量" class="form-item-half">
                  <el-input-number v-model="transportParams.client_batch_size" :min="8" :max="64" :step="1" />
                  <div class="setting-hint">8-64之间的整数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="学习率" class="form-item-half">
                  <el-input-number v-model="transportParams.server_lr" :min="0.001" :max="1.5" :step="0.001" />
                  <div class="setting-hint">0.001-1.5之间的小数</div>
                </el-form-item>
                
                <el-form-item label="隐私预算" class="form-item-half">
                  <el-input-number v-model="transportParams.dp_epsilon" :min="0" :max="10000.0" :step="0.1" />
                  <div class="setting-hint">0-10000.0之间的小数</div>
                </el-form-item>

              </div>
              
              <div class="form-row">
                <el-form-item label="参与 Edge 选择" class="form-item-half">
                  <el-select v-model="transportParams.edge" placeholder="选择参与模型训练的 Edge" multiple @change="handleEdgeSelectChange($event, transportParams)">
                    <el-option label="全选" value="all" />
                    <el-option label="EdgeServer-node5" value="EdgeServer-node5" />
                    <el-option label="EdgeServer-node6" value="EdgeServer-node6" />
                    <el-option label="EdgeServer-node7" value="EdgeServer-node7" />
                    <el-option label="EdgeServer-node8" value="EdgeServer-node8" />
                    <el-option label="EdgeServer-node9" value="EdgeServer-node9" />
                  </el-select>
                </el-form-item>
              </div>

            </el-form>
          </el-tab-pane>
          
          <!-- 日志数据集参数示例 -->
          <el-tab-pane label="日志数据集参数示例" name="log">
            <el-form :model="logParams" label-width="150px">
              <div class="form-row">
                <el-form-item label="数据集" class="form-item-half">
                  <el-input v-model="logParams.dataset_name" disabled placeholder="logData" />
                </el-form-item>
                
                <el-form-item label="模型" class="form-item-half">
                  <el-select v-model="logParams.model_name" placeholder="选择模型">
                    <el-option label="ResNet18" value="resnet18" />
                    <el-option label="MLP" value="mlp" />
                    <el-option label="SqueezeNet" value="squeezenet" />
                    <el-option label="LeNet" value="lenet" />
                  </el-select>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="算法" class="form-item-half">
                  <el-select v-model="logParams.fed_alg" placeholder="选择算法">
                    <el-option label="FedAdam" value="FedAdam" />
                    <el-option label="FedAVG" value="FedAVG" />
                    <el-option label="FedSGD" value="FedSGD" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="压缩率" class="form-item-half">
                  <el-input-number v-model="logParams.zip_ratio" :min="0.01" :max="1.0" :step="0.01" />
                  <div class="setting-hint">0.01-1.0之间的小数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="总步数" class="form-item-half">
                  <el-input-number v-model="logParams.total_step" :min="10" :max="10000" :step="1" />
                  <div class="setting-hint">10-10000步</div>
                </el-form-item>
                
                <el-form-item label="单次处理数量" class="form-item-half">
                  <el-input-number v-model="logParams.client_batch_size" :min="8" :max="64" :step="1" />
                  <div class="setting-hint">8-64之间的整数</div>
                </el-form-item>
              </div>
              
              <div class="form-row">
                <el-form-item label="学习率" class="form-item-half">
                  <el-input-number v-model="logParams.server_lr" :min="0.001" :max="1.5" :step="0.001" />
                  <div class="setting-hint">0.001-1.5之间的小数</div>
                </el-form-item>
                
                <el-form-item label="隐私预算" class="form-item-half">
                  <el-input-number v-model="logParams.dp_epsilon" :min="0" :max="10000.0" :step="0.1" />
                  <div class="setting-hint">0-10000.0之间的小数</div>
                </el-form-item>
              </div>
              <div class="form-row">
                <el-form-item label="参与 Edge 选择" class="form-item-half">
                  <el-select v-model="logParams.edge" placeholder="选择参与模型训练的 Edge" multiple @change="handleEdgeSelectChange($event, logParams)">
                    <el-option label="全选" value="all" />
                    <el-option label="EdgeServer-node5" value="EdgeServer-node5" />
                    <el-option label="EdgeServer-node6" value="EdgeServer-node6" />
                    <el-option label="EdgeServer-node7" value="EdgeServer-node7" />
                    <el-option label="EdgeServer-node8" value="EdgeServer-node8" />
                    <el-option label="EdgeServer-node9" value="EdgeServer-node9" />
                  </el-select>
                </el-form-item>
              </div>
              

            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
    
    <!-- 投毒攻击设置 -->
    <div class="settings-container">
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <span>投毒攻击设置</span>
          </div>
        </template>
        
        <div>
            <el-form :model="currentParams" label-width="150px">
              <div class="form-row">
                <el-form-item label="Edge3 攻击类型" class="form-item-half">
                  <el-select v-model="currentParams.edge3"
                            placeholder="选择攻击类型">
                    <el-option label="None" value="None" />
                    <el-option label="数据投毒" value="data_poisoning" />
                    <el-option label="梯度投毒" value="gradient_poisoning" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="Edge4 攻击类型" class="form-item-half">
                  <el-select v-model="currentParams.edge4"
                            placeholder="选择攻击类型">
                    <el-option label="None" value="None" />
                    <el-option label="数据投毒" value="data_poisoning" />
                    <el-option label="梯度投毒" value="gradient_poisoning" />
                  </el-select>
                </el-form-item>
              </div>
            </el-form>
          </div>
        
        
      </el-card>
    </div>
    
    <!-- 操作按钮区域 -->
    <div class="operation-area">
      <el-button 
        type="primary" 
        size="large"
        @click="startTraining"
        :loading="isTraining"
        :disabled="isTraining"
      >
        开始训练模型
      </el-button>
    </div>
    
    <!-- 训练状态展示 -->
    <div class="status-container" v-if="trainingStatus">
      <el-card class="status-card">
        <template #header>
          <div class="card-header">
            <span>训练状态</span>
            <el-tag v-if="trainingStatus && trainingStatus.progress < 100" type="info" effect="dark">训练中</el-tag>
            <el-tag v-else-if="trainingStatus" type="success" effect="dark">训练完成</el-tag>
          </div>
        </template>
        
        <!-- 总体进度 -->
        <div class="progress-overview">
          <el-progress :percentage="trainingStatus.progress" :status="trainingStatus.progress < 100 ? 'primary' : 'success'" :stroke-width="26" />
          <div class="progress-info">
            <span class="progress-step">{{ trainingStatus.step }} / {{ trainingStatus.total_steps }} 步</span>
            <span class="progress-percent">{{ trainingStatus.progress }}%</span>
          </div>
        </div>
        
        <!-- 关键指标卡片 -->
        <div class="metrics-cards">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-label">平均损失</div>
              <div class="metric-value">{{ formatNumber(trainingStatus.mean_loss) }}</div>
            </div>
          </el-card>
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-label">平均准确率</div>
              <div class="metric-value">{{ formatPercentage(trainingStatus.mean_accuracy) }}</div>
            </div>
          </el-card>
          <el-card class="metric-card highlight-card">
            <div class="metric-content">
              <div class="metric-label">单步执行时间</div>
              <div class="metric-value">{{ formatTime(trainingStatus.one_step_time) }}</div>
            </div>
          </el-card>
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-label">平均单步时间</div>
              <div class="metric-value">{{ formatTime(trainingStatus.avg_one_step_time) }}</div>
            </div>
          </el-card>
        </div>
        
        <!-- 边缘设备状态 -->
        <div class="edges-status">
          <h3>边缘设备状态</h3>
          <el-table :data="trainingStatus.edges" style="width: 100%">
            <el-table-column prop="id" label="设备ID" width="100" />
            <el-table-column prop="loss" label="损失" width="180">
              <template #default="scope">
                {{ formatNumber(scope.row.loss) }}
              </template>
            </el-table-column>
            <el-table-column prop="accuracy" label="准确率" width="180">
              <template #default="scope">
                {{ formatPercentage(scope.row.accuracy) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 使用的参数 -->
        <div class="used-parameters">
          <h3>使用的训练参数</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="数据集">{{ trainingStatus.parameters?.dataset_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="模型">{{ trainingStatus.parameters?.model_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="算法">{{ trainingStatus.parameters?.fed_alg || '-' }}</el-descriptions-item>
            <el-descriptions-item label="压缩率">{{ trainingStatus.parameters?.zip_ratio || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户端批量大小">{{ trainingStatus.parameters?.edge_batch_size || '-' }}</el-descriptions-item>
            <el-descriptions-item label="服务器学习率">{{ trainingStatus.parameters?.cloud_lr || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <!-- 训练结果按钮区域 -->
        <div v-if="canShowResultButtons" class="result-buttons">
          <el-button 
            type="primary" 
            @click="viewTrainingResult"
            :loading="isLoadingTensorboard"
          >
            查看训练结果
          </el-button>
          <el-button 
            type="success" 
            @click="viewPoisoningReport"
            :loading="isLoadingReport"
          >
            查看投毒检测报告
          </el-button>
        </div>
      </el-card>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="trainingError" class="error-message">
      <el-alert
        :title="trainingError"
        type="error"
        show-icon
        :closable="true"
        @close="clearError"
      />
    </div>
    
    <!-- 初始状态提示 -->
    <div v-if="!trainingStatus && !trainingError && !isTraining" class="initial-state">
      <el-empty description="请配置训练参数并点击开始训练按钮" />
    </div>
    
    <!-- 投毒检测报告对话框 -->
    <el-dialog
      v-model="showPoisoningReport"
      title="投毒攻击检测报告"
      width="70%"
      class="poisoning-report-dialog"
    >
      <div v-if="poisoningReportData" class="poisoning-report">
        <div class="report-header">
          <h3>{{ poisoningReportData?.security_assessment_report?.description || '-' }}</h3>
          <p class="report-timestamp">{{ poisoningReportData?.security_assessment_report?.report_timestamp || '-' }}</p>
        </div>
        
        <el-collapse v-model="activeCollapseItems">
          <el-collapse-item title="训练任务概览" name="overview">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="任务名称">{{ poisoningReportData?.security_assessment_report?.training_overview?.task_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="总轮数">{{ poisoningReportData?.security_assessment_report?.training_overview?.total_rounds || '-' }}</el-descriptions-item>
              <el-descriptions-item label="防御机制">{{ poisoningReportData?.security_assessment_report?.training_overview?.defense_mechanism || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-collapse-item>
          
          <el-collapse-item title="隐私保护效果" name="privacy">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="最终隐私开销">{{ poisoningReportData?.security_assessment_report?.privacy_protection?.final_privacy_spent || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最终ε值">{{ poisoningReportData?.security_assessment_report?.privacy_protection?.final_epsilon || '-' }}</el-descriptions-item>
              <el-descriptions-item label="δ值">{{ poisoningReportData?.security_assessment_report?.privacy_protection?.delta || '-' }}</el-descriptions-item>
              <el-descriptions-item label="说明">{{ poisoningReportData?.security_assessment_report?.privacy_protection?.notes || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-collapse-item>
          
          <el-collapse-item title="梯度分析统计" name="gradient">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="最大梯度范数">{{ poisoningReportData?.security_assessment_report?.gradient_analysis?.max_gradient_norm || '-' }}</el-descriptions-item>
              <el-descriptions-item label="平均梯度范数">{{ poisoningReportData?.security_assessment_report?.gradient_analysis?.avg_gradient_norm || '-' }}</el-descriptions-item>
              <el-descriptions-item label="说明">{{ poisoningReportData?.security_assessment_report?.gradient_analysis?.notes || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-collapse-item>
          
          <el-collapse-item title="投毒攻击检测结果" name="detection" class="detection-section">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="是否存在投毒攻击">
                <el-tag :type="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.exist_poison_attack ? 'danger' : 'success'">
                  {{ poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.exist_poison_attack ? '是' : '否' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="检测方法">
                <div v-if="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.detection_methods && poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.detection_methods.length > 0">
                  <div v-for="(method, index) in poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.detection_methods" :key="index">
                    {{ method }}
                  </div>
                </div>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="结论">{{ poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.final_conclusion || '-' }}</el-descriptions-item>
            </el-descriptions>
            
            <!-- 梯度检测结果 -->
            <div v-if="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.gradient_based_detection">
              <h4 style="margin-top: 20px;">梯度检测结果</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="可疑客户端数量">
                  {{ poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.gradient_based_detection?.suspicious_clients_count || 0 }}
                </el-descriptions-item>
              </el-descriptions>
              
              <h4 style="margin-top: 20px;">客户端摘要</h4>
              <el-table v-if="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.gradient_based_detection?.client_summaries && poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.gradient_based_detection?.client_summaries.length > 0" 
                        :data="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.gradient_based_detection?.client_summaries || []" 
                        style="width: 100%">
                <el-table-column prop="client_id" label="客户端ID" width="100" />
                <el-table-column prop="mean_dist_to_defended" label="平均距离" width="150" />
                <el-table-column prop="num_rounds" label="参与轮数" width="120" />
                <el-table-column prop="suspicious_rounds" label="可疑轮数" width="120" />
                <el-table-column prop="is_suspicious" label="是否可疑" width="120">
                  <template #default="scope">
                    <el-tag :type="scope.row.is_suspicious ? 'danger' : 'success'">
                      {{ scope.row.is_suspicious ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="无客户端数据" />
            </div>
            
            <!-- 数据检测结果 -->
            <div v-if="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection">
              <h4 style="margin-top: 20px;">数据检测结果</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="是否检测到异常">
                  <el-tag :type="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.detected ? 'danger' : 'success'">
                    {{ poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.detected ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="总体风险等级">
                  <el-tag :type="getRiskLevelType(poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.overall_risk)">
                    {{ poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.overall_risk || '-' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="高风险客户端数量" v-if="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.high_risk_clients">
                  {{ poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.high_risk_clients?.length || 0 }}
                </el-descriptions-item>
              </el-descriptions>
              
              <h4 style="margin-top: 20px;">客户端健康报告</h4>
              <el-table v-if="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.client_health_reports && poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.client_health_reports.length > 0" 
                        :data="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.data_based_detection?.client_health_reports || []" 
                        style="width: 100%">
                <el-table-column prop="client_id" label="客户端ID" width="100" />
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="suspicion_score" label="可疑分数" width="120" />
                <el-table-column prop="recent_loss" label="最近损失" width="120" />
                <el-table-column prop="recent_accuracy" label="最近准确率" width="120" />
                <el-table-column prop="current_anomaly_score" label="当前异常分数" width="150" />
                <el-table-column prop="data_points" label="数据点数量" width="120" />
              </el-table>
              <el-empty v-else description="无客户端健康报告数据" />
            </div>
          </el-collapse-item>
        </el-collapse>
        
        <div class="report-footer">
          <div v-if="poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.final_conclusion" class="final-conclusion">
            <h4 style="margin-bottom: 10px;">最终结论</h4>
            <div class="conclusion-content" style="background-color: #f5f5f5; padding: 15px; border-radius: 4px;">
              {{ poisoningReportData?.security_assessment_report?.poisoning_attack_detection?.final_conclusion }}
            </div>
          </div>
          <p style="margin-top: 15px;">{{ poisoningReportData?.security_assessment_report?.notes || '-' }}</p>
        </div>
      </div>
      <div v-else>
        <el-empty description="加载中..." />
      </div>
    </el-dialog>
</div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { apiGateway } from '@/api/request'

// 响应式数据
const isTraining = ref(false)

// 辅助函数：根据风险等级返回对应的标签类型
const getRiskLevelType = (riskLevel) => {
  if (!riskLevel) return 'info'
  const level = riskLevel.toLowerCase()
  if (level.includes('高') || level.includes('high')) return 'danger'
  if (level.includes('中') || level.includes('medium')) return 'warning'
  if (level.includes('低') || level.includes('low')) return 'success'
  return 'info'
}

// 辅助函数：根据客户端状态返回对应的标签类型
const getStatusType = (status) => {
  if (!status) return 'info'
  const statusLower = status.toLowerCase()
  if (statusLower.includes('正常') || statusLower.includes('normal')) return 'success'
  if (statusLower.includes('可疑') || statusLower.includes('suspicious')) return 'warning'
  if (statusLower.includes('异常') || statusLower.includes('abnormal') || statusLower.includes('malicious')) return 'danger'
  return 'info'
}
const trainingStatus = ref(null)
const trainingError = ref(null)
const statusPollingInterval = ref(null)
const activeTab = ref('image')
const canShowResultButtons = ref(false)
const showPoisoningReport = ref(false)
const poisoningReportData = ref(null)
const hasPoisonAttackSettings = ref(false)
const isLoadingTensorboard = ref(false)
const isLoadingReport = ref(false)

// 训练进度初始状态相关变量
const isInitialProgressState = ref(true) // 标记是否处于初始进度状态
const hasReceivedNon100Progress = ref(false) // 标记是否已经接收到非100%的进度值

// 图像数据集参数
const imageParams = reactive({
  dataset_name: 'cifar10',
  model_name: 'squeezenet',
  fed_alg: 'FedAdam',
  zip_ratio: 0.1,
  total_step: 10,
  client_batch_size: 64,
  server_lr: 0.001,
  dp_epsilon: 1.0,
  edge3: 'None',
  edge4: 'None',
  edge: [],
})

const transportParams = reactive({
  dataset_name: 'gtsrb',
  model_name: 'lenet',
  fed_alg: 'FedAVG',
  zip_ratio: 1.0,
  total_step: 10,
  client_batch_size: 64,
  server_lr: 1.0,
  dp_epsilon: 10000.0,
  edge3: 'None',
  edge4: 'None',
  edge: [],
})

// MNIST数据集参数
const mnistParams = reactive({
  dataset_name: 'mnist',
  model_name: 'squeezenet',
  fed_alg: 'FedAdam',
  zip_ratio: 0.1,
  total_step: 10,
  client_batch_size: 64,
  server_lr: 0.001,
  dp_epsilon: 1.0,
  edge3: 'None',
  edge4: 'None',
  edge: [],
})

// 日志数据集参数
const logParams = reactive({
  dataset_name: 'logData',
  model_name: 'mlp',
  fed_alg: 'FedAdam',
  zip_ratio: 0.1,
  total_step: 10,
  client_batch_size: 16,
  server_lr: 0.001,
  dp_epsilon: 1.0,
  edge3: 'None',
  edge4: 'None',
  edge: [],
})

// 获取当前参数对象
const getCurrentParam = (key) => {
  return currentParams.value[key]
}

// 更新当前参数对象
const updateCurrentParam = (key, value) => {
  currentParams.value[key] = value
}

// 当前激活标签页的参数对象
const currentParams = computed(() => {
  if (activeTab.value === 'image') {
    return imageParams
  } else if (activeTab.value === 'mnist') {
    return mnistParams
  } else if (activeTab.value === 'transport') {
    return transportParams
  }
  return logParams
})

// 处理全选功能
const handleEdgeSelectChange = (value, params) => {
  if (value.includes('all')) {
    // 全选时，选择所有Edge节点
    params.edge = ['EdgeServer-node5', 'EdgeServer-node6', 'EdgeServer-node7', 'EdgeServer-node8', 'EdgeServer-node9']
  } else {
    // 移除全选选项
    const index = value.indexOf('all')
    if (index > -1) {
      value.splice(index, 1)
    }
  }
}

// 处理选项卡切换
const handleTabClick = (tab) => {
  activeTab.value = tab.paneName
}

// 开始训练模型
const startTraining = async () => {
  isTraining.value = true
  trainingStatus.value = null
  trainingError.value = null
  canShowResultButtons.value = false
  // 重置进度相关状态变量
  isInitialProgressState.value = true
  hasReceivedNon100Progress.value = false
  
  try {
    ElMessage.info('开始训练模型...')
    console.log('当前参数对象:', currentParams.value)
    // 检查必填字段
    if (!currentParams.value.dataset_name || !currentParams.value.model_name || !currentParams.value.fed_alg || currentParams.value.total_step <= 0) {
      ElMessage.error('请填写必要的训练参数')
      isTraining.value = false
      return
    }
    
    // 检查是否有投毒攻击设置
  console.log('检查投毒攻击设置 - edge3:', currentParams.value.edge3, 'edge4:', currentParams.value.edge4)
  hasPoisonAttackSettings.value = currentParams.value.edge3 !== 'None' || currentParams.value.edge4 !== 'None'
    
    // 先调用训练模型接口，传入训练参数
    console.log('调用训练模型接口，请求参数:', currentParams.value)
    const response = await fetch('/api-internal/train/model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(currentParams.value)
    })
    
    if (!response.ok) {
      throw new Error(`训练模型接口返回错误状态码: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('训练模型接口响应:', result)
    
    if (result.status === 'success' && result.message === 'a new model starts training.') {
      ElMessage.success('训练任务已成功启动')
      // 只有在train/model接口成功返回后，才开始轮询训练状态
      startStatusPolling()
    } else {
      throw new Error(result.message || '训练任务启动失败')
    }
  } catch (error) {
    console.error('训练启动失败:', error)
    const errorMsg = `训练请求异常: ${error.message}`
    ElMessage.error(errorMsg)
    trainingError.value = errorMsg
    isTraining.value = false
  }
}

// 轮询训练状态
const startStatusPolling = () => {
  // 清除可能存在的旧轮询
  if (statusPollingInterval.value) {
    clearInterval(statusPollingInterval.value)
    console.log('清除旧的轮询定时器')
  }
  
  console.log('启动状态轮询，开始获取最新训练进度')
  // 立即获取一次状态
  fetchTrainingStatus()
  
  // 设置轮询，每2秒获取一次状态
  statusPollingInterval.value = setInterval(() => {
    // 只有在训练进行中才继续轮询
    if (isTraining.value) {
      console.log('执行状态轮询，获取最新训练进度')
      fetchTrainingStatus()
    }
  }, 2000)
}

// 获取训练状态
const fetchTrainingStatus = async () => {
  try {
    console.log('调用获取训练状态接口')
    const response = await fetch('/api-internal/training/status')
    
    if (!response.ok) {
      throw new Error(`获取训练状态接口返回错误状态码: ${response.status}`)
    }
    
    let statusData = await response.json()
    console.log('训练状态接口响应:', statusData)
    
    // 确保状态数据存在并且包含必要字段
    if (statusData && typeof statusData === 'object') {
      // 进度显示逻辑：第一次轮询强制显示进度为0
      if (isInitialProgressState.value) {
        console.log('初始轮询状态，强制显示所有值为0')
        // 初始状态时所有训练相关值都显示为0
        statusData = {
          ...statusData,
          progress: 0,
          step: 0,
          total_steps: 0,
          mean_loss: 0,
          mean_accuracy: 0,
          one_step_time: 0,
          avg_one_step_time: 0,
          edges: (statusData.edges || []).map(edge => ({
            ...edge,
            loss: 0,
            accuracy: 0
          }))
        }
        isInitialProgressState.value = false
      } else if (!hasReceivedNon100Progress.value) {
        // 记录是否接收到非100%的进度值
        if (statusData.progress !== 100.0) {
          hasReceivedNon100Progress.value = true
          console.log('第一次接收到非100%的进度值:', statusData.progress)
        } else {
          // 在接收到非100%的进度值之前，所有100%的进度值都视为初始状态
          console.log('继续等待非100%的进度值，当前显示为0')
          statusData = {
            ...statusData,
            progress: 0,
            step: 0,
            total_steps: 0,
            mean_loss: 0,
            mean_accuracy: 0,
            one_step_time: 0,
            avg_one_step_time: 0,
            edges: (statusData.edges || []).map(edge => ({
              ...edge,
              loss: 0,
              accuracy: 0
            }))
          }
        }
      }
      
      console.log('进度信息:', { 
        progress: statusData.progress,
        step: statusData.step,
        total_steps: statusData.total_steps,
        mean_loss: statusData.mean_loss,
        mean_accuracy: statusData.mean_accuracy,
        one_step_time: statusData.one_step_time,
        avg_one_step_time: statusData.avg_one_step_time,
        edges: statusData.edges?.map(({id, loss, accuracy}) => ({id, loss, accuracy})) || []
      })
      
      // 强制更新trainingStatus以确保UI响应
      trainingStatus.value = null // 先清空
      setTimeout(() => {
        trainingStatus.value = { ...statusData } // 创建新对象以触发响应式更新
        console.log('更新后的trainingStatus:', trainingStatus.value)
      }, 0)
      
      // 改进的训练结束条件判断
      if (hasReceivedNon100Progress.value && statusData.progress === 100.0) {
        console.log('训练完成，进度达到100%')
        if (isTraining.value) {
          ElMessage.success('训练完成！')
          handleTrainingComplete()
        }
      } else if (statusData.progress !== 100.0) {
        console.log('训练未完成，继续轮询')
      }
    } else {
      console.warn('状态数据格式异常:', statusData)
    }
  } catch (error) {
    console.error('获取训练状态失败:', error)
    // 记录错误但不频繁显示错误消息，避免影响用户体验
    if (errorCountSinceLastMessage.value > 10) {
      ElMessage.warning('获取训练状态遇到问题，正在重试...')
      errorCountSinceLastMessage.value = 0
    }
    errorCountSinceLastMessage.value++
  }
}

// 记录错误消息显示次数，避免频繁显示
const errorCountSinceLastMessage = ref(0)

// 处理训练完成
const handleTrainingComplete = () => {
  console.log('处理训练完成逻辑：进度已达到100%且已接收到过非100%的进度值')
  
  // 只有在isTraining为true时才处理完成逻辑，避免重复调用
  if (!isTraining.value) {
    console.log('训练已结束或未开始，跳过处理')
    return
  }
  
  console.log('处理训练完成逻辑')
  stopStatusPolling()
  isTraining.value = false
  canShowResultButtons.value = true
  
  // 判断是否有投毒攻击设置
  hasPoisonAttackSettings.value = currentParams.value.edge3 !== 'None' || currentParams.value.edge4 !== 'None'
  
  console.log('训练真的完成了！')
  ElMessage.success('模型训练已成功完成！')
}

// 查看训练结果（打开TensorBoard）
const viewTrainingResult = async () => {
  try {
    isLoadingTensorboard.value = true
    ElMessage.info('正在启动TensorBoard服务，请稍候...')
    
    // 使用apiGateway调用启动TensorBoard的接口
    console.log('调用启动TensorBoard接口')
    const data = await apiGateway.get('/tensorboard/start')
    console.log('TensorBoard接口响应:', data)
    
    ElMessage.success('TensorBoard已启动')
    // 短暂延迟，确保服务有时间启动
    setTimeout(() => {
      // 打开TensorBoard网页
      window.open('http://192.168.104.8:6006/?smoothing=0#scalars', '_blank')
    }, 1000)
  } catch (error) {
    console.error('启动TensorBoard失败:', error)
    // 更友好的错误提示
    if (error.response && error.response.data) {
      ElMessage.error(`启动TensorBoard失败: ${error.response.data.message || '未知错误'}`)
    } else if (error.message.includes('Unexpected token')) {
      ElMessage.error('启动TensorBoard失败: 接口返回格式错误，请检查接口是否正确')
    } else {
      ElMessage.error(`启动TensorBoard失败: ${error.message || '未知错误'}`)
    }
  } finally {
    isLoadingTensorboard.value = false
  }
}

// 查看投毒检测报告
const viewPoisoningReport = async () => {
  try {
    isLoadingReport.value = true
    showPoisoningReport.value = true
    ElMessage.info('正在获取投毒检测报告，请稍候...')
    
    // 调用获取投毒检测报告的接口
    console.log('调用获取投毒检测报告接口')
    const response = await fetch('/api-internal/get/poisoning/attack')
    
    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('投毒检测报告接口响应:', data)
    poisoningReportData.value = data
    ElMessage.success('投毒检测报告获取成功')
  } catch (error) {
    console.error('获取投毒检测报告失败:', error)
    ElMessage.error(`获取投毒检测报告失败: ${error.message}`)
    poisoningReportData.value = null
  } finally {
    isLoadingReport.value = false
  }
}

// 投毒报告折叠面板状态
const activeCollapseItems = ref(['overview', 'detection'])

// 停止轮询
const stopStatusPolling = () => {
  if (statusPollingInterval.value) {
    clearInterval(statusPollingInterval.value)
    statusPollingInterval.value = null
  }
}

// 格式化数字
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0.00'
  return Number(num).toFixed(6)
}

// 格式化百分比
const formatPercentage = (num) => {
  if (num === null || num === undefined) return '0.00%'
  return (Number(num) * 100).toFixed(2) + '%'
}

// 格式化时间（毫秒）
const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '0.000ms'
  // 将秒转换为毫秒并保留3位小数
  return (Number(seconds) * 1000).toFixed(3) + 'ms'
}

// 清除错误
const clearError = () => {
  trainingError.value = null
}

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopStatusPolling()
})
</script>

<style scoped>
.model-training-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.model-training-container h2 {
  margin-bottom: 30px;
  color: #303133;
  font-size: 24px;
}

.settings-container {
  margin-bottom: 20px;
}

.settings-card {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-item-half {
  flex: 1;
}

.setting-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.operation-area {
  margin: 30px 0;
  text-align: center;
}

.status-container {
  margin-top: 30px;
}

.status-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.progress-overview {
  margin: 30px 0;
  text-align: center;
  position: relative;
}

.progress-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
  font-size: 16px;
}

.progress-step {
  color: #606266;
}

.progress-percent {
  color: #409eff;
  font-weight: bold;
  font-size: 18px;
}

/* 结果按钮区域样式 */
.result-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.result-buttons .el-button {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.result-buttons .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
}

/* 投毒检测报告样式 */
.poisoning-report {
  font-size: 14px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 10px;
}

.report-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.report-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-weight: 600;
}

.report-timestamp {
  color: #909399;
  font-size: 12px;
  margin: 0;
}

.detection-section {
  background-color: #fafafa;
  border: 1px solid #ebeef5;
}

.report-footer {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
  color: #909399;
  font-size: 12px;
}

.poisoning-report-dialog .el-dialog__body {
  max-height: 60vh;
  overflow-y: auto;
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.metric-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-radius: 4px;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.metric-card.highlight-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.metric-content {
  text-align: center;
  padding: 15px;
}

.metric-label {
  font-size: 14px;
  margin-bottom: 10px;
  opacity: 0.8;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
}

.edges-status {
  margin: 30px 0;
}

.edges-status h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
  font-weight: 600;
}

.used-parameters {
  margin: 30px 0;
}

.used-parameters h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
  font-weight: 600;
}

/* 错误消息样式优化 */
.error-message {
  margin: 20px 0;
  color: #f56c6c;
  padding: 12px;
  background-color: #fef0f0;
  border-radius: 4px;
  border-left: 4px solid #f56c6c;
}

.initial-state {
  margin: 50px 0;
}

/* 标签页样式优化 */
.tabs-container .el-tabs__header {
  margin-bottom: 20px;
}

.tabs-container .el-tabs__nav-wrap::after {
  background-color: #ebeef5;
}

.tabs-container .el-tabs__active-bar {
  background-color: #409eff;
}

.tabs-container .el-tabs__item.is-active {
  color: #409eff;
}

/* 折叠面板样式优化 */
.el-collapse {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.el-collapse-item__header {
  font-weight: 500;
  color: #303133;
}

.el-collapse-item__wrap {
  border-top: 1px solid #ebeef5;
}

/* 确保表单样式统一 */
.el-form-item__label {
  font-weight: 500;
  color: #303133;
}

/* 确保进度条样式美观 */
.el-progress-bar__outer {
  border-radius: 10px;
  overflow: hidden;
}

.el-progress-bar__inner {
  border-radius: 10px;
  transition: width 0.6s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .metrics-cards {
    grid-template-columns: 1fr;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .result-buttons {
    flex-direction: column;
    gap: 10px;
  }
}
</style>