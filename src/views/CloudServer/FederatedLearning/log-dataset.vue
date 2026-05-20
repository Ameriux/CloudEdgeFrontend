<template>
  <div class="log-dataset-container">
    <div class="page-header">
      <h1>日志数据集</h1>
      <p class="page-desc">源日志数据 (log.txt) 及其向量化特征数据集 (log_vectorized.csv)，用于联邦学习模型训练与评估</p>
    </div>

    <!-- 文件概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon raw-icon">📄</div>
        <div class="card-info">
          <div class="card-title">log.txt</div>
          <div class="card-meta">源日志数据集</div>
          <div class="card-stats">
            <span>{{ rawLogStats.totalLines.toLocaleString() }} 行</span>
            <span>{{ rawLogStats.fileSize }}</span>
          </div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon vec-icon">📊</div>
        <div class="card-info">
          <div class="card-title">log_vectorized.csv</div>
          <div class="card-meta">向量化特征数据集</div>
          <div class="card-stats">
            <span>{{ vecStats.totalRows.toLocaleString() }} 行</span>
            <span>{{ vecStats.totalCols }} 列</span>
            <span>{{ vecStats.fileSize }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'raw' }]"
        @click="activeTab = 'raw'"
      >
        源日志数据
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'vec' }]"
        @click="activeTab = 'vec'"
      >
        向量化数据集
      </button>
    </div>

    <!-- 源日志数据 Tab -->
    <div v-if="activeTab === 'raw'" class="tab-content">
      <div class="toolbar">
        <div class="search-box">
          <input
            v-model="rawSearch"
            type="text"
            placeholder="搜索日志内容 (支持组件名、消息关键词)..."
            @input="onRawSearch"
          />
          <span v-if="rawSearch" class="search-clear" @click="rawSearch = ''; onRawSearch()">✕</span>
        </div>
        <div class="toolbar-right">
          <span class="result-count">匹配 {{ filteredRawLogs.length.toLocaleString() }} / {{ rawLogs.length.toLocaleString() }} 条</span>
          <select v-model.number="rawPageSize" @change="rawPage = 1">
            <option :value="25">25条/页</option>
            <option :value="50">50条/页</option>
            <option :value="100">100条/页</option>
            <option :value="200">200条/页</option>
          </select>
        </div>
      </div>

      <div class="log-table-wrapper">
        <table class="log-table">
          <thead>
            <tr>
              <th class="col-num">#</th>
              <th class="col-msg">日志消息</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, idx) in paginatedRawLogs" :key="log.lineNum">
              <td class="col-num">{{ log.lineNum }}</td>
              <td class="col-msg">{{ log.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button :disabled="rawPage <= 1" @click="rawPage--">上一页</button>
        <span class="page-info">第 {{ rawPage }} / {{ rawTotalPages }} 页</span>
        <button :disabled="rawPage >= rawTotalPages" @click="rawPage++">下一页</button>
      </div>
    </div>

    <!-- 向量化数据集 Tab -->
    <div v-if="activeTab === 'vec'" class="tab-content">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="column-toggle">
            <span class="toggle-label">显示列组:</span>
            <label class="toggle-chip" :class="{ active: showTFIDF }">
              <input v-model="showTFIDF" type="checkbox" @change="onColToggle" />
              TF-IDF (100列)
            </label>
            <label class="toggle-chip" :class="{ active: showStats }">
              <input v-model="showStats" type="checkbox" @change="onColToggle" />
              统计特征 (11列)
            </label>
            <label class="toggle-chip" :class="{ active: showLabel }">
              <input v-model="showLabel" type="checkbox" @change="onColToggle" />
              标签
            </label>
          </div>
          <span class="visible-cols-hint">当前显示 {{ visibleColumns.length }} / {{ allColumns.length }} 列</span>
        </div>
        <div class="toolbar-right">
          <span class="result-count">共 {{ vecStats.totalRows.toLocaleString() }} 行</span>
          <select v-model.number="vecPageSize" @change="vecPage = 1">
            <option :value="25">25行/页</option>
            <option :value="50">50行/页</option>
            <option :value="100">100行/页</option>
          </select>
        </div>
      </div>

      <div class="vec-table-wrapper">
        <table class="vec-table">
          <thead>
            <tr>
              <th class="col-row-num">#</th>
              <th
                v-for="col in visibleColumns"
                :key="col"
                :class="['vec-th', getColumnGroupClass(col)]"
                :title="col"
              >
                {{ formatColumnName(col) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in paginatedVecRows" :key="vecPageStart + idx">
              <td class="col-row-num">{{ vecPageStart + idx + 1 }}</td>
              <td
                v-for="col in visibleColumns"
                :key="col"
                :class="['vec-td', getCellValueClass(row[col])]"
              >
                {{ formatCellValue(row[col]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button :disabled="vecPage <= 1" @click="vecPage--">上一页</button>
        <span class="page-info">第 {{ vecPage }} / {{ vecTotalPages }} 页</span>
        <button :disabled="vecPage >= vecTotalPages" @click="vecPage++">下一页</button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'


function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

export default defineComponent({
  name: 'LogDataset',
  setup() {
    const activeTab = ref('raw')
    const rawSearch = ref('')
    const rawPage = ref(1)
    const rawPageSize = ref(50)
    const vecPage = ref(1)
    const vecPageSize = ref(50)
    const showTFIDF = ref(true)
    const showStats = ref(true)
    const showLabel = ref(true)

    // Raw log data
    const rawLogs = ref([])
    const rawText = ref('')
    const rawFileSize = ref(0)

    // Vec data
    const vecRows = ref([])
    const allColumns = ref([])
    const vecFileSize = ref(0)

    // File loading states
    const rawLoaded = ref(false)
    const vecLoaded = ref(false)

    // Parse log line
    function parseLogLine(line, lineNum) {
      return { lineNum, message: line }
    }

    // Load raw log file
    async function loadRawLog() {
      try {
        const resp = await fetch('/log.txt')
        const text = await resp.text()
        rawText.value = text
        rawFileSize.value = text.length

        const lines = text.split('\n').filter(l => l.trim())
        rawLogs.value = lines.map((line, i) => parseLogLine(line, i + 1))
        rawLoaded.value = true
      } catch (e) {
        console.error('加载 log.txt 失败:', e)
      }
    }

    // Load vectorized CSV
    async function loadVecData() {
      try {
        const resp = await fetch('/log_vectorized.csv')
        const text = await resp.text()
        vecFileSize.value = text.length

        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        allColumns.value = headers

        const rows = []
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',')
          const row = {}
          headers.forEach((h, j) => {
            const v = vals[j] ? vals[j].trim() : ''
            row[h] = v
          })
          rows.push(row)
        }
        vecRows.value = rows
        vecLoaded.value = true
      } catch (e) {
        console.error('加载 log_vectorized.csv 失败:', e)
      }
    }

    onMounted(() => {
      loadRawLog()
      loadVecData()
    })

    // Computed: visible columns
    const visibleColumns = computed(() => {
      return allColumns.value.filter(col => {
        if (col.startsWith('tfidf_')) return showTFIDF.value
        if (col.startsWith('stat_')) return showStats.value
        if (col === 'event_type_encoded') return showLabel.value
        return true
      })
    })

    // Computed: filtered raw logs
    const filteredRawLogs = computed(() => {
      if (!rawSearch.value.trim()) return rawLogs.value
      const q = rawSearch.value.toLowerCase()
      return rawLogs.value.filter(log =>
        log.message.toLowerCase().includes(q)
      )
    })

    // Computed: raw pagination
    const rawTotalPages = computed(() =>
      Math.max(1, Math.ceil(filteredRawLogs.value.length / rawPageSize.value))
    )
    const paginatedRawLogs = computed(() => {
      const start = (rawPage.value - 1) * rawPageSize.value
      return filteredRawLogs.value.slice(start, start + rawPageSize.value)
    })

    // Computed: vec pagination
    const vecTotalPages = computed(() =>
      Math.max(1, Math.ceil(vecRows.value.length / vecPageSize.value))
    )
    const vecPageStart = computed(() => (vecPage.value - 1) * vecPageSize.value)
    const paginatedVecRows = computed(() => {
      const start = vecPageStart.value
      return vecRows.value.slice(start, start + vecPageSize.value)
    })

    // Stats
    const rawLogStats = computed(() => ({
      totalLines: rawLogs.value.length,
      fileSize: formatBytes(rawFileSize.value)
    }))

    const vecStats = computed(() => ({
      totalRows: vecRows.value.length,
      totalCols: allColumns.value.length,
      fileSize: formatBytes(vecFileSize.value)
    }))

    // Search handler with debounce
    let searchTimer = null
    function onRawSearch() {
      rawPage.value = 1
    }

    function onColToggle() {
      vecPage.value = 1
    }

    function getColumnGroupClass(col) {
      if (col.startsWith('tfidf_')) return 'col-tfidf'
      if (col.startsWith('stat_')) return 'col-stat'
      if (col === 'event_type_encoded') return 'col-label'
      return ''
    }

    function formatColumnName(col) {
      if (col.startsWith('tfidf_')) return col.replace('tfidf_', 'TF-')
      if (col.startsWith('stat_')) {
        const map = {
          'stat_char_count': '字符数',
          'stat_word_count': '单词数',
          'stat_upper_count': '大写字母数',
          'stat_digit_count': '数字数',
          'stat_special_char_count': '特殊字符数',
          'stat_has_error': '含错误',
          'stat_has_connection': '含连接',
          'stat_has_upload': '含上传',
          'stat_has_migration': '含迁移',
          'stat_has_sgx': '含SGX',
        }
        return map[col] || col
      }
      if (col === 'event_type_encoded') return '事件类型编码'
      return col
    }

    function formatCellValue(val) {
      if (val === '' || val === undefined || val === null) return '-'
      const n = parseFloat(val)
      if (isNaN(n)) return val
      if (n === 0) return '0'
      if (Math.abs(n) < 0.001) return n.toExponential(3)
      return n.toFixed(4)
    }

    function getCellValueClass(val) {
      if (val === '' || val === undefined || val === null) return 'cell-zero'
      const n = parseFloat(val)
      if (isNaN(n)) return ''
      if (n === 0) return 'cell-zero'
      if (n > 0) return 'cell-positive'
      if (n < 0) return 'cell-negative'
      return ''
    }

    return {
      activeTab,
      rawSearch,
      rawPage,
      rawPageSize,
      vecPage,
      vecPageSize,
      showTFIDF,
      showStats,
      showLabel,
      rawLogs,
      rawLoaded,
      vecLoaded,
      allColumns,
      visibleColumns,
      filteredRawLogs,
      paginatedRawLogs,
      rawTotalPages,
      paginatedVecRows,
      vecTotalPages,
      vecPageStart,
      rawLogStats,
      vecStats,
      onRawSearch,
      onColToggle,
      getColumnGroupClass,
      formatColumnName,
      formatCellValue,
      getCellValueClass
    }
  }
})
</script>

<style scoped>
.log-dataset-container {
  padding: 24px;
  max-width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-desc {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

/* Overview Cards */
.overview-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.raw-icon { background: #ecf5ff; }
.vec-icon { background: #f0f9eb; }

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-meta {
  font-size: 12px;
  color: #909399;
  margin: 2px 0 6px;
}

.card-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #606266;
}

.card-stats span {
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 0;
  border-bottom: 2px solid #e4e7ed;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  background: none;
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #409eff;
}

.tab-btn.active {
  color: #409eff;
  border-bottom-color: #409eff;
  font-weight: 600;
}

.tab-content {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 16px;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 480px;
  min-width: 240px;
}

.search-box input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #409eff;
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #c0c4cc;
  font-size: 14px;
  padding: 4px;
}

.search-clear:hover { color: #909399; }

.result-count {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}

.toolbar-right select {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

/* Column toggle chips */
.column-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.toggle-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.toggle-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  background: #f5f7fa;
  color: #909399;
  transition: all 0.2s;
}

.toggle-chip.active {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.toggle-chip input { display: none; }

.visible-cols-hint {
  font-size: 12px;
  color: #c0c4cc;
}

/* Log Table */
.log-table-wrapper {
  overflow-x: auto;
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.log-table th {
  position: sticky;
  top: 0;
  background: #f5f7fa;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #606266;
  border-bottom: 2px solid #e4e7ed;
  z-index: 1;
}

.log-table td {
  padding: 6px 12px;
  border-bottom: 1px solid #f2f3f5;
  color: #303133;
}

.log-table tr:hover td {
  background: #f5f7fa;
}

.col-num { width: 60px; color: #c0c4cc !important; text-align: center; font-size: 12px; }
.col-msg { word-break: break-all; }

/* Vectorized Table */
.vec-table-wrapper {
  overflow-x: auto;
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.vec-table {
  border-collapse: collapse;
  font-size: 12px;
  min-width: 100%;
}

.vec-table th {
  position: sticky;
  top: 0;
  background: #f5f7fa;
  padding: 8px 6px;
  font-weight: 600;
  color: #606266;
  border-bottom: 2px solid #e4e7ed;
  white-space: nowrap;
  writing-mode: horizontal-tb;
  z-index: 1;
  font-size: 12px;
  text-align: center;
  min-width: 72px;
}

.vec-table td {
  padding: 4px 6px;
  text-align: right;
  border-bottom: 1px solid #f2f3f5;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  white-space: nowrap;
}

.vec-table tr:hover td {
  background: #f5f7fa;
}

.col-row-num {
  text-align: center !important;
  color: #c0c4cc !important;
  font-family: inherit !important;
  font-size: 12px !important;
  min-width: 48px;
}

.vec-th.col-tfidf { background: #ecf5ff; }
.vec-th.col-stat { background: #f0f9eb; }
.vec-th.col-label { background: #fef0f0; }

.cell-zero { color: #dcdfe6 !important; }
.cell-positive { color: #409eff !important; }
.cell-negative { color: #f56c6c !important; }

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 8px;
}

.pagination button {
  padding: 6px 16px;
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.pagination button:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #606266;
}
</style>
