/**
 * 项目入口文件
 * 
 * 功能描述：
 * 配置并初始化Vue应用实例，加载全局样式和组件库
 * 
 * 实现原理：
 * > 步骤1：导入Vue核心功能createApp
 * > 步骤2：导入Element Plus组件库
 * > 步骤3：导入样式文件
 * > 步骤4：导入根组件App
 * > 步骤5：创建应用实例
 * > 步骤6：注册Element Plus组件库
 * > 步骤7：将应用挂载到DOM节点
 */

// 导入Vue的createApp函数用于创建应用实例
import { createApp } from 'vue'
// 导入Element Plus组件库
import ElementPlus from 'element-plus'
// 导入Element Plus的样式
import 'element-plus/dist/index.css'
// 导入自定义全局样式
import './style.css'
// 导入根组件
import App from './App.vue'

// 创建Vue应用实例
const app = createApp(App)
// 使用Element Plus组件库
app.use(ElementPlus)
// 将应用挂载到id为app的DOM元素上
app.mount('#app')
