/**
 * 计划表单组件
 * 
 * 功能描述：
 * 提供计划创建和编辑的表单界面，支持设置标题、日期、优先级、项目、标签等属性
 * 包含Markdown文档编辑和预览功能
 * 
 * 表单字段：
 * > 标题：计划名称
 * > 日期：计划执行日期
 * > 优先级：高、中、低三个等级
 * > 项目：关联的项目选择
 * > 标签：预设标签和自定义标签
 * > 颜色：计划项的自定义颜色
 * > 描述：计划详细描述
 * > MD文档：Markdown格式的关联文档
 */

<template>
  <!-- 使用Element Plus的表单组件 -->
  <el-form :model="form" label-width="80px" class="plan-form">
    <!-- 标题输入框 -->
    <el-form-item label="标题">
      <el-input v-model="form.title" placeholder="请输入计划标题"></el-input>
    </el-form-item>
    
    <!-- 日期选择器 -->
    <el-form-item label="日期">
      <el-date-picker
        v-model="form.date"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        style="width: 100%"
      ></el-date-picker>
    </el-form-item>
    
    <!-- 优先级选择 -->
    <el-form-item label="优先级">
      <el-radio-group v-model="form.priority" class="priority-group">
        <el-radio 
          v-for="option in priorityOptions" 
          :key="option.value" 
          :label="option.value"
          class="priority-option">
          <span class="priority-dot" :style="{backgroundColor: option.color}"></span>
          {{ option.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    
    <!-- 项目选择 -->
    <el-form-item label="项目">
      <el-select v-model="form.projectId" placeholder="选择项目" style="width: 100%">
        <el-option 
          v-for="project in projects" 
          :key="project.id" 
          :label="project.name" 
          :value="project.id">
          <div class="project-option">
            <span class="project-dot" :style="{backgroundColor: project.color}"></span>
            <span>{{ project.name }}</span>
          </div>
        </el-option>
        <el-option :value="null" label="无项目"></el-option>
      </el-select>
    </el-form-item>
    
    <!-- 标签选择区域 -->
    <el-form-item label="标签">
      <div class="tags-container">
        <!-- 预设标签列表 -->
        <div 
          v-for="tag in availableTags" 
          :key="tag.name"
          :class="['tag-item', { selected: form.tags.includes(tag.name) }]"
          :style="{ 
            borderColor: tag.color, 
            backgroundColor: form.tags.includes(tag.name) ? tag.color : 'transparent',
            color: form.tags.includes(tag.name) ? '#fff' : tag.color
          }"
          @click="toggleTag(tag.name)">
          {{ tag.name }}
        </div>
        
        <!-- 自定义标签列表 -->
        <div 
          v-for="tag in customTags" 
          :key="tag"
          class="tag-item custom-tag selected"
          :style="{ 
            borderColor: '#67c23a', 
            backgroundColor: '#67c23a',
            color: '#fff'
          }"
          @click="toggleTag(tag)">
          {{ tag }}
          <span class="tag-close" @click.stop="removeTag(tag)">×</span>
        </div>
        
        <!-- 添加自定义标签的输入框和按钮 -->
        <div class="add-tag-container">
          <el-input 
            v-if="showCustomTagInput" 
            v-model="customTag" 
            size="small"
            placeholder="输入标签名称"
            @keyup.enter="addCustomTag"
            @blur="addCustomTag">
          </el-input>
          <el-button 
            v-else
            size="small" 
            type="text" 
            @click="showCustomTagInput = true">
            <el-icon><Plus /></el-icon> 添加自定义标签
          </el-button>
        </div>
      </div>
    </el-form-item>
    
    <!-- 颜色选择器 -->
    <el-form-item label="颜色">
      <el-color-picker v-model="form.color"></el-color-picker>
      <span class="color-preview" :style="{backgroundColor: form.color || '#ffffff'}" />
    </el-form-item>
    
    <!-- 描述输入框 -->
    <el-form-item label="描述">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="请输入计划描述"
      ></el-input>
    </el-form-item>
    
    <!-- Markdown文档编辑和预览 -->
    <el-form-item label="MD文档">
      <el-tabs style="min-width: 100%">
        <el-tab-pane label="编辑">
          <el-input
            v-model="form.markdownContent"
            type="textarea"
            :rows="10"
            placeholder="输入Markdown格式文档内容"
          ></el-input>
        </el-tab-pane>
        <el-tab-pane label="预览">
          <div v-html="renderedMarkdown" class="markdown-preview"></div>
        </el-tab-pane>
      </el-tabs>
    </el-form-item>
    
    <!-- 表单操作按钮 -->
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
/**
 * 脚本部分
 * 
 * 功能实现：
 * > 导入必要的Vue组合式API和Markdown解析库
 * > 定义组件属性和默认值
 * > 实现表单数据处理和验证
 * > 处理标签的添加、删除和切换
 * > 实现Markdown预览功能
 */

import { reactive, computed, ref } from 'vue';
import { marked } from 'marked';
import { Plus } from '@element-plus/icons-vue';

export default {
  name: 'PlanForm',
  components: {
    Plus
  },
  // 定义组件属性
  props: {
    // 计划数据对象
    plan: {
      type: Object,
      default: () => ({
        id: null,
        title: '',
        date: new Date(),
        description: '',
        markdownContent: '',
        completed: false,
        priority: 'medium',
        tags: [],
        color: ''
      })
    },
    // 可用的预设标签列表
    availableTags: {
      type: Array,
      default: () => []
    },
    // 优先级选项配置
    priorityOptions: {
      type: Array,
      default: () => [
        { value: 'high', label: '高', color: '#ff6b6b' },
        { value: 'medium', label: '中', color: '#e6a23c' },
        { value: 'low', label: '低', color: '#55cc77' }
      ]
    },
    // 项目列表
    projects: {
      type: Array,
      default: () => []
    }
  },
  // 使用组合式API设置组件逻辑
  setup(props, { emit }) {
    /**
     * 创建响应式表单数据
     * 使用reactive确保表单数据的响应式更新
     */
    const form = reactive({
      id: props.plan.id,
      title: props.plan.title,
      date: props.plan.date,
      description: props.plan.description,
      markdownContent: props.plan.markdownContent,
      completed: props.plan.completed,
      priority: props.plan.priority || 'medium',
      tags: Array.isArray(props.plan.tags) ? [...props.plan.tags] : [],
      color: props.plan.color || '',
      projectId: props.plan.projectId || null
    });

    // 自定义标签相关的响应式变量
    const showCustomTagInput = ref(false);
    const customTag = ref('');
    
    /**
     * 切换标签选择状态
     * 
     * 参数：
     * - tagName: 要切换的标签名称
     */
    const toggleTag = (tagName) => {
      const index = form.tags.indexOf(tagName);
      if (index > -1) {
        form.tags.splice(index, 1);
      } else {
        form.tags.push(tagName);
      }
    };
    
    /**
     * 添加自定义标签
     * 
     * 功能：
     * > 验证标签名称不为空
     * > 避免重复添加
     * > 清空输入框并隐藏
     */
    const addCustomTag = () => {
      if (customTag.value && customTag.value.trim()) {
        const newTag = customTag.value.trim();
        if (!form.tags.includes(newTag)) {
          form.tags.push(newTag);
        }
        customTag.value = '';
      }
      showCustomTagInput.value = false;
    };

    /**
     * Markdown预览
     * 
     * 功能：将Markdown文本转换为HTML用于预览
     */
    const renderedMarkdown = computed(() => {
      return form.markdownContent ? marked(form.markdownContent) : '';
    });

    /**
     * 计算自定义标签列表
     * 
     * 功能：筛选出不在预设标签中的自定义标签
     */
    const customTags = computed(() => {
      return form.tags.filter(tag => !props.availableTags.some(avTag => avTag.name === tag));
    });

    /**
     * 移除标签
     * 
     * 参数：
     * - tagName: 要移除的标签名称
     */
    const removeTag = (tagName) => {
      const index = form.tags.indexOf(tagName);
      if (index > -1) {
        form.tags.splice(index, 1);
      }
    };

    /**
     * 提交表单
     * 
     * 功能：
     * > 验证必填字段
     * > 触发保存事件
     */
    const submitForm = () => {
      console.log('表单提交内容:', form);
      
      // 验证必填字段
      if (!form.title) {
        alert('请填写标题');
        return;
      }
      
      if (!form.date) {
        alert('请选择日期');
        return;
      }

      // 触发保存事件
      emit('save', { ...form });
    };

    return {
      form,
      showCustomTagInput,
      customTag,
      toggleTag,
      addCustomTag,
      renderedMarkdown,
      customTags,
      removeTag,
      submitForm
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
 * > 自定义标签和优先级选项的样式
 * > 响应式设计适配不同屏幕尺寸
 */

/* 表单容器样式 */
.plan-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* 优先级选项组样式 */
.priority-group {
  display: flex;
  gap: 20px;
}

/* 优先级选项样式 */
.priority-option {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 优先级点样式 */
.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 项目选项样式 */
.project-option {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 项目点样式 */
.project-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 标签容器样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* 标签项样式 */
.tag-item {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

/* 自定义标签样式 */
.custom-tag {
  background-color: #67c23a;
  color: white;
}

/* 标签关闭按钮样式 */
.tag-close {
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

/* 添加标签容器样式 */
.add-tag-container {
  display: inline-block;
}

/* 颜色预览样式 */
.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-left: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

/* Markdown预览样式 */
.markdown-preview {
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plan-form {
    padding: 10px;
  }
  
  .priority-group {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 