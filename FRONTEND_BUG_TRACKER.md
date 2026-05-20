# 前端 Bug 跟踪与修复记录

> 最后更新: 2026-05-21 | 维护分支: main

---

## 已修复

### Bug #1 — `this.$message` 未定义导致运行时崩溃

- **严重程度**: 🔴 严重
- **发现日期**: 2026-05-21
- **修复日期**: 2026-05-21
- **文件**: 
  - `src/views/EdgeServer/HomomorphicEncryptionTransfer/index.vue`
  - `src/views/CloudServer/HomomorphicEncryptionAnalysis/index.vue`
- **问题描述**: 两个组件通过 Options API 使用 `this.$message.warning/success/error()`，但 Element Plus (Vue 3) 中 `$message` 不会通过 `app.use(ElementPlus)` 自动注册为全局实例属性，导致运行时 `TypeError: Cannot read properties of undefined`
- **修复方法**: 
  1. 添加 `import { ElMessage } from 'element-plus'`
  2. 将所有 `this.$message.xxx(...)` 替换为 `ElMessage.xxx(...)`
- **修复提交**: 待提交

---

### Bug #2 — Store 中使用未导入的 `Vue.set`

- **严重程度**: 🔴 严重
- **发现日期**: 2026-05-21
- **修复日期**: 2026-05-21
- **文件**: `src/store/modules/homomorphicEncryption.js`
- **问题描述**: `SET_CIPHER_LOADING` mutation 调用了 `Vue.set(state.analysisState.cipherLoading, key, loading)`，但文件未 import Vue，且 Vue 3 中 `Vue.set` 已被移除，会抛出 `ReferenceError: Vue is not defined`
- **修复方法**: 将 `Vue.set(state.analysisState.cipherLoading, key, loading)` 替换为 `state.analysisState.cipherLoading = { ...state.analysisState.cipherLoading, [key]: loading }`（Vue 3 使用 Proxy 响应式系统，直接赋值即可触发响应式更新）
- **修复提交**: 待提交

---

### Bug #3 — EdgeServer 子菜单 index 缺少 `/` 前缀

- **严重程度**: 🟠 重要
- **发现日期**: 2026-05-21
- **修复日期**: 2026-05-21
- **文件**: `src/App.vue`
- **问题描述**: EdgeServer 子菜单 `index="edgeserver"` 缺少前导 `/`，而相关路由路径为 `/edgeserver/...`。Element Plus `el-menu` 在 `router` 模式下通过 `$route.path` 与子菜单 `index` 前缀匹配来决定展开状态，不匹配导致访问 EdgeServer 工作区页面时父级子菜单不会自动展开和高亮
- **修复方法**: 将 `index="edgeserver"` 改为 `index="/edgeserver"`
- **修复提交**: 待提交

---

### Bug #4 — EdgeServer 动态工作区菜单项无选中高亮效果

- **严重程度**: 🟠 重要
- **发现日期**: 2026-05-21
- **修复日期**: 2026-05-21
- **文件**: `src/App.vue`
- **问题描述**: 动态生成的设备工作区菜单项使用 `:index="3-3-${server.id}"`（如 `3-3-1`），与路由路径 `/edgeserver/workspace/xxx` 完全不匹配。虽然通过 `@click="$router.push(...)"` 手动跳转能成功导航，但 Element Plus 的 `router` 模式通过匹配 `index` 确定高亮项，导致**导航跳转成功但菜单项不显示选中效果**
- **修复方法**: 将 `:index="3-3-${server.id}"` 改为 `:index="'/edgeserver/workspace/' + server.id"`，并移除手动 `@click` 处理器，完全依赖 Element Plus 的 `router` 模式自动导航和高亮
- **修复提交**: 待提交

---

### Bug #9 — XSS 漏洞：`v-html` 渲染未充分转义的数据

- **严重程度**: 🟢 一般 (安全)
- **发现日期**: 2026-05-21
- **修复日期**: 2026-05-21
- **文件**: `src/views/CloudServer/HomomorphicEncryptionAnalysis/index.vue`
- **问题描述**: `formatFieldValue` 方法生成 HTML 字符串时，仅对单引号做了转义（`field.replace(/'/g, "\\'")`），未转义 `<`, `>`, `&`, `"` 等关键 HTML 字符。数据库中的密文字段如包含恶意脚本，会直接注入页面执行。同时 `disabled="${isLoading}"` 在 `isLoading=false` 时渲染为 `disabled="false"`，由于 `disabled` 是 HTML 布尔属性，其存在即表示禁用，导致按钮始终处于禁用状态
- **修复方法**: 
  1. 新增 `escapeHtml()` 方法，对 `&`, `<`, `>`, `"`, `'` 五个字符做完整实体编码
  2. `formatFieldValue` 中所有用户数据（displayText、fieldName、field、size）均通过 `escapeHtml()` 处理后输出
  3. 非密文字段的返回值也通过 `escapeHtml()` 处理
  4. 将 `disabled="${isLoading}"` 改为 `${isLoading ? 'disabled' : ''}`，仅在加载中时才输出 disabled 属性
- **修复提交**: 待提交

---

### Bug #10 — 35MB 静态 JSON 文件直接 import 导致性能问题

- **严重程度**: 🟢 一般 (性能)
- **发现日期**: 2026-05-21
- **修复日期**: 2026-05-21
- **文件**: `src/views/CloudServer/HomomorphicEncryptionAnalysis/index.vue`
- **问题描述**: `import homoData from '@/assets/homo.json'` 静态导入一个 35.4MB 的 JSON 文件。该文件会被完整打包进主 JS bundle，导致首页加载极慢、内存占用巨大。理想方案应通过后端 API 分页返回，或至少使用动态导入延迟加载
- **修复方法**: 移除顶部静态 import，在 `mounted()` 中使用 `await import('@/assets/homo.json')` 动态导入。Vite 会将其构建为独立的异步 chunk，不再阻塞主 bundle 加载。同时 `homoRecord` 初始值改为 `null`，模板已有 `v-if="homoRecord"` 处理空状态
- **修复提交**: 待提交

---

## 待修复

### Bug #5 — CloudServer Workbench1 `redundancyReductionTime` 数据计算错误

- **严重程度**: 🟠 重要
- **发现日期**: 2026-05-21
- **文件**: `src/views/CloudServer/Workbench1/index.vue:156`
- **问题描述**: `redundancyReductionTime` 被错误地乘以 1000 两次。Store mutation `UPDATE_MIGRATION_DATA` 已将 API 返回的 `dedup_time`（秒）转换为毫秒（`× 1000`），但组件 computed 又做了一次 `* 1000`，导致显示值是实际的 1000 倍
- **待修复**: 
  ```js
  // 当前 (错误)：
  const redundancyReductionTime = computed(() => store.getters['cloudServer/getAllData'].redundancyReductionTime * 1000)
  // 应改为：
  const redundancyReductionTime = computed(() => store.getters['cloudServer/getAllData'].redundancyReductionTime)
  ```

---

### Bug #6 — Store mutation 重复定义 (死代码)

- **严重程度**: 🟡 中等
- **发现日期**: 2026-05-21
- **文件**: 
  - `src/store/modules/edgeServer.js:63-65, 225-227` — `SET_UPLOAD_EVENT_STATUS` 定义两次
  - `src/store/modules/homomorphicEncryption.js:129-162` — `SET_USER_ID`, `SET_ANALYSIS_OPERATION`, `SET_LOG_ID` 定义两次
- **问题描述**: 同一 mutation 在对象中定义了两次，后定义的覆盖前面的。homomorphicEncryption.js 中第一组不带 `saveStateToStorage()`，第二组带，目前运行时使用带持久化的版本，第一组为死代码
- **待修复**: 删除重复的第一组定义（不带持久化的版本）

---

### Bug #7 — 加密延迟单位标签与实际计算不一致

- **严重程度**: 🟡 中等
- **发现日期**: 2026-05-21
- **文件**: `src/store/modules/edgeServer.js:94-97`, `src/components/EdgeServerWorkbench.vue`
- **问题描述**: Store 中加密延迟计算使用二进制单位 `MiB`（`1024 × 1024`），计算注释和代码均按 `ms/MiB` 实现。但 v1.3.1 中将 UI 标签从 `ms/MiB` 改为 `ms/MB`（十进制单位，`1000 × 1000`），导致标签与实际计算值不匹配
- **待修复**: 统一单位和标签——要么改标签回 `ms/MiB`，要么改计算为 `/(1000*1000)`

---

### Bug #8 — CloudServer Workbench1 `backupSyncDelay` 可能为 Infinity

- **严重程度**: 🟡 中等
- **发现日期**: 2026-05-21
- **文件**: `src/views/CloudServer/Workbench1/index.vue:158`
- **问题描述**: `backupSyncDelay = backupSyncDelay / inputDataSize.value`，当 `inputDataSize` 为 0 时（首次加载或无数据）结果为 `Infinity`。此外 `inputDataSize` 使用了 `.toFixed(4)` 返回字符串，类型不严谨
- **待修复**: 添加除零保护 `inputDataSize.value > 0 ? ... : 0`，并在 computed 中保持数值类型

---

## Bug 状态概览

| Bug # | 标题 | 严重程度 | 状态 |
|-------|------|----------|------|
| #1 | `this.$message` 未定义 | 🔴 严重 | ✅ 已修复 |
| #2 | `Vue.set` 未定义 | 🔴 严重 | ✅ 已修复 |
| #3 | edgeserver 子菜单 index 缺少 `/` | 🟠 重要 | ✅ 已修复 |
| #4 | 工作区菜单项无选中效果 | 🟠 重要 | ✅ 已修复 |
| #5 | redundancyReductionTime 计算错误 | 🟠 重要 | ⏳ 待修复 |
| #6 | Store mutation 重复定义 | 🟡 中等 | ⏳ 待修复 |
| #7 | 加密延迟单位不一致 | 🟡 中等 | ⏳ 待修复 |
| #8 | backupSyncDelay Infinity | 🟡 中等 | ⏳ 待修复 |
| #9 | v-html XSS 安全漏洞 | 🟢 一般 | ✅ 已修复 |
| #10 | 35MB JSON 静态导入 | 🟢 一般 | ✅ 已修复 |
