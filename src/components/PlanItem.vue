<template>
  <div class="plan-item" :class="{ 'completed': plan.completed }">
    <div class="plan-header">
      <el-checkbox v-model="plan.completed" @change="updatePlan"></el-checkbox>
      <h3>{{ plan.title }}</h3>
      <div class="plan-date">{{ formatDate(plan.date) }}</div>
    </div>
    
    <div class="plan-content">
      <p>{{ plan.description }}</p>
      
      <!-- 关联的Markdown文档内容 -->
      <div v-if="plan.markdownContent" class="markdown-content">
        <el-collapse>
          <el-collapse-item title="查看关联文档">
            <div v-html="renderedMarkdown"></div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    
    <div class="plan-actions">
      <el-button type="primary" size="small" @click="$emit('edit', plan)">编辑</el-button>
      <el-button type="danger" size="small" @click="$emit('delete', plan.id)">删除</el-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { marked } from 'marked';

export default {
  name: 'PlanItem',
  props: {
    plan: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    // 渲染Markdown内容
    const renderedMarkdown = computed(() => {
      return props.plan.markdownContent ? marked(props.plan.markdownContent) : '';
    });

    // 格式化日期显示
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };

    // 更新计划状态
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
.plan-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.plan-item.completed {
  opacity: 0.7;
  background-color: #f8f8f8;
}

.plan-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.plan-header h3 {
  margin: 0 10px;
  flex-grow: 1;
}

.plan-date {
  color: #909399;
  font-size: 14px;
}

.plan-content {
  margin: 10px 0;
  color: #606266;
}

.markdown-content {
  margin-top: 10px;
  border-top: 1px dashed #ebeef5;
  padding-top: 10px;
}

.plan-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.plan-actions .el-button {
  margin-left: 10px;
}
</style> 