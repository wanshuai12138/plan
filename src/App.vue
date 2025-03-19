<script>
import PlanList from './components/PlanList.vue'

export default {
  name: 'App',
  components: {
    PlanList
  }
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>计划工具</h1>
      <p>每日计划管理，支持Markdown文档关联</p>
    </header>
    
    <main class="main-content">
      <plan-list />
    </main>
    
    <footer class="app-footer">
      <p>&copy; {{ new Date().getFullYear() }} 简约计划工具 - 简约而不简单</p>
    </footer>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #303133;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  width: 1270px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #409EFF;
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin-bottom: 10px;
  font-weight: 400;
}

.app-header p {
  font-size: 16px;
  opacity: 0.8;
}

.main-content {
  flex: 1;
  padding: 20px 0;
}

.app-footer {
  background-color: #f0f2f5;
  color: #909399;
  text-align: center;
  padding: 15px;
  font-size: 14px;
  border-top: 1px solid #e4e7ed;
}
</style>
