/**
 * 应用程序根组件
 * 
 * 功能描述：
 * 作为应用的顶层容器，组织页面整体结构，包括页眉、主内容区和页脚
 * 提供整体布局和样式定义
 * 
 * 结构说明：
 * > 页面头部(header)：显示应用标题和简短描述
 * > 主内容区(main)：渲染PlanList组件，展示计划管理功能
 * > 页脚(footer)：显示版权信息和年份
 */
<script>
/**
 * 脚本部分
 * 
 * > 步骤1：导入PlanList组件
 * > 步骤2：定义组件配置项
 * > 步骤3：注册PlanList为子组件
 */
import PlanList from './components/PlanList.vue'

export default {
  // 组件名称
  name: 'App',
  // 注册使用的子组件
  components: {
    PlanList
  }
}
</script>

<template>
  <!-- 应用容器 - 提供整体布局结构 -->
  <div class="app-container">
    <!-- 应用头部 - 显示标题和简介 -->
    <header class="app-header">
      <h1>计划工具</h1>
      <p>每日计划管理，支持Markdown文档关联</p>
    </header>
    
    <!-- 主内容区 - 渲染PlanList组件 -->
    <main class="main-content">
      <plan-list />
    </main>
    
    <!-- 应用页脚 - 显示版权信息和动态年份 -->
    <footer class="app-footer">
      <p>&copy; {{ new Date().getFullYear() }} 简约计划工具 - 简约而不简单</p>
    </footer>
  </div>
</template>

<style>
/**
 * 全局样式定义
 * 
 * 包含以下部分：
 * > 基础重置样式：清除默认边距和设置盒模型
 * > 全局字体和背景颜色定义
 * > 应用容器布局：采用flex布局确保最小高度充满视口
 * > 头部、内容区、页脚的样式定义
 */

/* 基础样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 全局字体和平滑度设置 */
body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #303133;
  min-height: 100vh;
}

/* 确保应用容器最小高度充满视口 */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 应用主容器样式 */
.app-container {
  width: 1270px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.app-header {
  background-color: #409EFF;
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 头部标题样式 */
.app-header h1 {
  margin-bottom: 10px;
  font-weight: 400;
}

/* 头部描述文字样式 */
.app-header p {
  font-size: 16px;
  opacity: 0.8;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  padding: 20px 0;
}

/* 页脚样式 */
.app-footer {
  background-color: #f0f2f5;
  color: #909399;
  text-align: center;
  padding: 15px;
  font-size: 14px;
  border-top: 1px solid #e4e7ed;
}
</style>
