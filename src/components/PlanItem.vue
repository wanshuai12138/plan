/**
 * 计划项组件
 * 
 * 功能描述：
 * 展示单个计划的详细信息，包括标题、日期、描述和关联的Markdown文档
 * 提供计划完成状态切换、编辑和删除功能
 * 
 * 组件结构：
 * > 计划头部：显示完成状态复选框、标题和日期
 * > 计划内容：展示描述文本和可折叠的Markdown文档
 * > 操作按钮：提供编辑和删除功能
 */

<template>
  <!-- 计划项容器 - 根据完成状态应用不同样式 -->
  <div class="plan-item" :class="{ 'completed': plan.completed }">
    <!-- 计划头部 - 包含状态、标题和日期 -->
    <div class="plan-header">
      <!-- 完成状态复选框 - 绑定到plan.completed并触发更新 -->
      <el-checkbox v-model="plan.completed" @change="updatePlan"></el-checkbox>
      <!-- 计划标题 -->
      <h3>{{ plan.title }}</h3>
      <!-- 计划日期 - 使用formatDate格式化显示 -->
      <div class="plan-date">{{ formatDate(plan.date) }}</div>
    </div>
    
    <!-- 计划内容区域 - 包含描述和Markdown文档 -->
    <div class="plan-content">
      <!-- 计划描述文本 -->
      <p>{{ plan.description }}</p>
      
      <!-- 关联的Markdown文档内容 - 仅在存在时显示 -->
      <div v-if="plan.markdownContent" class="markdown-content">
        <!-- 使用Element Plus的折叠面板组件 -->
        <el-collapse>
          <el-collapse-item title="查看关联文档">
            <!-- 渲染Markdown内容为HTML -->
            <div v-html="renderedMarkdown"></div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    
    <!-- 操作按钮区域 - 提供编辑和删除功能 -->
    <div class="plan-actions">
      <!-- 编辑按钮 - 触发edit事件 -->
      <el-button type="primary" size="small" @click="$emit('edit', plan)">编辑</el-button>
      <!-- 删除按钮 - 触发delete事件 -->
      <el-button type="danger" size="small" @click="$emit('delete', plan.id)">删除</el-button>
    </div>
  </div>
</template>

<script>
/**
 * 脚本部分
 * 
 * 功能实现：
 * > 导入必要的Vue组合式API和Markdown解析库
 * > 定义组件属性和事件
 * > 实现Markdown渲染、日期格式化和状态更新功能
 */

import { computed } from 'vue';
import { marked } from 'marked';

export default {
  name: 'PlanItem',
  // 定义组件属性
  props: {
    plan: {
      type: Object,
      required: true
    }
  },
  // 使用组合式API设置组件逻辑
  setup(props, { emit }) {
    /**
     * 渲染Markdown内容
     * 
     * 功能：将Markdown文本转换为HTML
     * 返回值：HTML字符串，如果没有内容则返回空字符串
     */
    const renderedMarkdown = computed(() => {
      return props.plan.markdownContent ? marked(props.plan.markdownContent) : '';
    });

    /**
     * 格式化日期显示
     * 
     * 参数：
     * - dateString: 日期字符串
     * 返回值：格式化的日期字符串 (YYYY-MM-DD)
     */
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };

    /**
     * 更新计划状态
     * 
     * 功能：当完成状态改变时触发update事件
     */
    const updatePlan = () => {
      emit('update', props.plan);
    };

    return {
      renderedMarkdown,
      formatDate,
      updatePlan
    };
  }
}
</script>

<style scoped>
/**
 * 组件样式定义
 * 
 * 样式特点：
 * > 使用scoped确保样式仅应用于当前组件
 * > 采用flex布局实现灵活的布局结构
 * > 添加过渡效果提升用户体验
 * > 使用Element Plus的设计规范
 */

/* 计划项容器样式 */
.plan-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s; /* 添加过渡效果 */
}

/* 已完成计划项的样式 */
.plan-item.completed {
  opacity: 0.7;
  background-color: #f8f8f8;
}

/* 计划头部样式 - 使用flex布局对齐元素 */
.plan-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

/* 标题样式 */
.plan-header h3 {
  margin: 0 10px;
  flex-grow: 1; /* 占据剩余空间 */
}

/* 日期样式 */
.plan-date {
  color: #909399;
  font-size: 14px;
}

/* 计划内容区域样式 */
.plan-content {
  margin: 10px 0;
  color: #606266;
}

/* Markdown内容区域样式 */
.markdown-content {
  margin-top: 10px;
  border-top: 1px dashed #ebeef5;
  padding-top: 10px;
}

/* 操作按钮区域样式 */
.plan-actions {
  display: flex;
  justify-content: flex-end; /* 右对齐按钮 */
  margin-top: 10px;
}

/* 按钮间距 */
.plan-actions .el-button {
  margin-left: 10px;
}
</style> 