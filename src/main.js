import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 导入Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import * as d3 from 'd3'
// 导入全局样式
import './styles/variables.css'
import './styles/global.css'
import './styles/components.css'

const app = createApp(App)

// 全局注册ElementPlus
app.use(ElementPlus)
// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// 全局注册路由
app.use(router)
// 全局注册Vuex
app.use(store)
// 全局挂载echarts和d3
app.config.globalProperties.$echarts = echarts
app.config.globalProperties.$d3 = d3

app.mount('#app')