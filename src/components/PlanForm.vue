<template>
  <el-form :model="form" label-width="80px" class="plan-form">
    <el-form-item label="标题">
      <el-input v-model="form.title" placeholder="请输入计划标题"></el-input>
    </el-form-item>
    
    <el-form-item label="日期">
      <el-date-picker
        v-model="form.date"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        style="width: 100%"
      ></el-date-picker>
    </el-form-item>
    
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
    
    <el-form-item label="标签">
      <div class="tags-container">
        <!-- 预设标签 -->
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
        
        <!-- 自定义标签 -->
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
    
    <el-form-item label="颜色">
      <el-color-picker v-model="form.color"></el-color-picker>
      <span class="color-preview" :style="{backgroundColor: form.color || '#ffffff'}" />
    </el-form-item>
    
    <el-form-item label="描述">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="请输入计划描述"
      ></el-input>
    </el-form-item>
    
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
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { reactive, computed, ref } from 'vue';
import { marked } from 'marked';
import { Plus } from '@element-plus/icons-vue';

export default {
  name: 'PlanForm',
  components: {
    Plus
  },
  props: {
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
    availableTags: {
      type: Array,
      default: () => []
    },
    priorityOptions: {
      type: Array,
      default: () => [
        { value: 'high', label: '高', color: '#ff6b6b' },
        { value: 'medium', label: '中', color: '#e6a23c' },
        { value: 'low', label: '低', color: '#55cc77' }
      ]
    },
    projects: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    // 创建表单数据
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

    // 标签相关
    const showCustomTagInput = ref(false);
    const customTag = ref('');
    
    // 切换标签选择状态
    const toggleTag = (tagName) => {
      const index = form.tags.indexOf(tagName);
      if (index > -1) {
        form.tags.splice(index, 1);
      } else {
        form.tags.push(tagName);
      }
    };
    
    // 添加自定义标签
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

    // Markdown预览
    const renderedMarkdown = computed(() => {
      return form.markdownContent ? marked(form.markdownContent) : '';
    });

    // 在setup函数中，添加自定义标签相关逻辑
    const customTags = computed(() => {
      // 筛选出不在预设标签中的自定义标签
      return form.tags.filter(tag => !props.availableTags.some(avTag => avTag.name === tag));
    });

    // 移除标签
    const removeTag = (tagName) => {
      const index = form.tags.indexOf(tagName);
      if (index > -1) {
        form.tags.splice(index, 1);
      }
    };

    // 提交表单
    const submitForm = () => {
      console.log('表单提交内容:', form);
      
      // 确保表单填写完整
      if (!form.title) {
        alert('请填写标题');
        return;
      }
      
      if (!form.date) {
        alert('请选择日期');
        return;
      }

      // 创建计划对象
      const plan = {
        id: form.id || Date.now(), // 如果没有ID则生成一个
        title: form.title,
        date: form.date instanceof Date ? form.date : new Date(form.date),
        description: form.description || '',
        markdownContent: form.markdownContent || '',
        completed: form.completed || false,
        priority: form.priority || 'medium',
        tags: [...form.tags],
        color: form.color || '',
        projectId: form.projectId
      };

      console.log('准备提交的计划:', plan);
      
      // 发送提交事件
      emit('save', plan);
    };

    return {
      form,
      renderedMarkdown,
      submitForm,
      showCustomTagInput,
      customTag,
      toggleTag,
      addCustomTag,
      customTags,
      removeTag
    };
  }
}
</script>

<style scoped>
.plan-form {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.markdown-preview {
  min-height: 200px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f9f9f9;
  overflow-y: auto;
}

/* 优先级样式 */
.priority-group {
  display: flex;
  gap: 15px;
}

.priority-option {
  display: flex;
  align-items: center;
  margin-right: 0;
  padding: 8px 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.priority-option:hover {
  border-color: #409eff;
}

.priority-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
  display: inline-block;
}

/* 标签样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.tag-item {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-item.selected {
  font-weight: 500;
}

.tag-item.custom-tag {
  position: relative;
  padding-right: 25px;
}

.tag-close {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
}

.tag-close:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.add-tag-container {
  margin-top: 10px;
  width: 100%;
}

/* 颜色预览 */
.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-left: 10px;
  border: 1px solid #dcdfe6;
  vertical-align: middle;
}

/* Markdown样式 */
.markdown-preview h1 {
  font-size: 1.8em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.markdown-preview h2 {
  font-size: 1.5em;
  margin-top: 0.8em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

.markdown-preview h3 {
  font-size: 1.3em;
  margin-top: 0.8em;
  margin-bottom: 0.5em;
}

.markdown-preview p {
  margin: 0.8em 0;
  line-height: 1.6;
}

.markdown-preview ul, .markdown-preview ol {
  padding-left: 20px;
  margin: 0.8em 0;
}

.markdown-preview li {
  margin-bottom: 5px;
}

.markdown-preview a {
  color: #409eff;
  text-decoration: none;
}

.markdown-preview a:hover {
  text-decoration: underline;
}

.markdown-preview code {
  background-color: #f1f1f1;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-preview pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-preview blockquote {
  border-left: 4px solid #e4e7ed;
  padding-left: 15px;
  color: #909399;
  margin: 1em 0;
}

.markdown-preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-preview th, .markdown-preview td {
  border: 1px solid #e4e7ed;
  padding: 8px;
  text-align: left;
}

.markdown-preview th {
  background-color: #f5f7fa;
}
</style> 