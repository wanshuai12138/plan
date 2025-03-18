<template>
  <div class="plan-container">
    <!-- 头部和操作按钮 -->
    <div class="header-container">
      <div class="header">
        <h2>我的计划</h2>
        <div class="filters">
          <el-radio-group v-model="filter" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="active">进行中</el-radio-button>
            <el-radio-button label="completed">已完成</el-radio-button>
          </el-radio-group>
          
          <el-select v-model="priorityFilter" size="small" placeholder="优先级" class="priority-filter">
            <el-option value="all" label="所有优先级" />
            <el-option 
              v-for="option in priorityOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value">
              <div class="priority-option">
                <span class="priority-dot" :style="{backgroundColor: option.color}"></span>
                <span>{{ option.label }}优先级</span>
              </div>
            </el-option>
          </el-select>
          
          <el-date-picker
            v-model="dateFilter"
            type="daterange"
            size="small"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="onDateFilterChange"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD">
          </el-date-picker>
        </div>
      </div>
      
      <div class="header-buttons">
        <el-button type="primary" size="small" @click="showAddForm" :disabled="formVisible">
          <i class="el-icon-plus"></i> 新建计划
        </el-button>
        
        <el-button @click="exportData" type="success" size="small">
          <i class="el-icon-download"></i> 导出
        </el-button>
        
        <el-button @click="showImportDialog" type="warning" size="small">
          <i class="el-icon-upload2"></i> 导入
        </el-button>
        
        <el-button type="info" size="small" @click="importTestData">测试数据</el-button>
        
        <el-button @click="resetApp" type="danger" size="small">
          <i class="el-icon-delete"></i> 重置
        </el-button>
      </div>
    </div>

    <!-- 标签过滤器 -->
    <div class="tag-filters" v-if="availableTags.length > 0">
      <div 
        v-for="tag in availableTags" 
        :key="tag.name" 
        class="tag-filter" 
        :class="{ active: tagFilter === tag.name }"
        :style="{ borderColor: tag.color, color: tagFilter === tag.name ? '#fff' : tag.color, backgroundColor: tagFilter === tag.name ? tag.color : 'transparent' }"
        @click="toggleTagFilter(tag.name)">
        {{ tag.name }}
      </div>
      <div 
        v-if="tagFilter" 
        class="tag-filter clear-filter"
        @click="tagFilter = ''">
        清除筛选
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 计划列表 -->
      <div class="plan-list">
        <div v-if="filteredPlans.length === 0" class="empty-state">
          <i class="el-icon-document"></i>
          <p>暂无计划</p>
          <el-button type="primary" size="small" @click="showAddForm">
            创建第一个计划
          </el-button>
        </div>
        
        <transition-group name="plan-list" tag="div" class="plans-transition-group">
          <div
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="plan-item"
            :class="{ 
              'completed': plan.completed,
              'selected': selectedPlan && selectedPlan.id === plan.id,
              'dragging': isDragging && draggedItem && draggedItem.id === plan.id
            }"
            :style="{ borderLeftColor: plan.color || getPriorityInfo(plan.priority).color }"
            @click="selectPlan(plan)"
            draggable="true"
            @dragstart="startDrag(plan, $event)"
            @dragover.prevent="onDragOver($event, plan)"
            @drop="onDrop($event, plan)"
            @dragend="onDragEnd">
            <div class="plan-item-header">
              <div class="plan-title-row">
                <div class="plan-checkbox">
                  <el-checkbox 
                    v-model="plan.completed" 
                    @change="() => updatePlan(plan)"
                    @click.stop>
                  </el-checkbox>
                </div>
                <div class="plan-title" :class="{ 'completed': plan.completed }">{{ plan.title }}</div>
                <div class="plan-priority">
                  <el-tag 
                    size="small" 
                    :type="plan.priority === 'high' ? 'danger' : plan.priority === 'medium' ? 'warning' : 'success'"
                    effect="plain">
                    {{ getPriorityInfo(plan.priority).label }}
                  </el-tag>
                </div>
              </div>
              
              <div class="plan-date">{{ formatDate(plan.date) }}</div>
            </div>
            
            <div class="plan-description">{{ plan.description }}</div>
            
            <div class="plan-tags" v-if="plan.tags && plan.tags.length > 0">
              <el-tag 
                v-for="tag in plan.tags" 
                :key="tag" 
                size="mini" 
                effect="plain"
                :style="{ 
                  borderColor: (availableTags.find(t => t.name === tag) || {}).color || '#909399',
                  color: (availableTags.find(t => t.name === tag) || {}).color || '#909399'
                }">
                {{ tag }}
              </el-tag>
            </div>
            
            <div class="plan-actions">
              <el-button size="mini" type="text" @click.stop="editPlan(plan)">
                <i class="el-icon-edit"></i> 编辑
              </el-button>
              <el-button size="mini" type="text" @click.stop="deletePlan(plan.id)">
                <i class="el-icon-delete"></i> 删除
              </el-button>
            </div>
            <div class="drag-handle">
              <i class="el-icon-rank"></i>
            </div>
          </div>
        </transition-group>
      </div>
      
      <!-- 计划详情 -->
      <div class="plan-detail" v-if="!formVisible">
        <transition name="fade">
          <div v-if="selectedPlan" :class="{'animating': animating}">
            <div class="detail-header">
              <h3>{{ selectedPlan.title }}</h3>
              <div class="detail-meta">
                <div class="detail-date">
                  <i class="el-icon-date"></i> {{ formatDate(selectedPlan.date) }}
                </div>
                <div class="detail-status">
                  <el-tag :type="selectedPlan.completed ? 'success' : 'info'" effect="dark">
                    {{ selectedPlan.completed ? '已完成' : '进行中' }}
                  </el-tag>
                </div>
                <div class="detail-priority">
                  <el-tag 
                    :type="selectedPlan.priority === 'high' ? 'danger' : selectedPlan.priority === 'medium' ? 'warning' : 'success'"
                    effect="plain">
                    {{ getPriorityInfo(selectedPlan.priority).label }}优先级
                  </el-tag>
                </div>
              </div>
              <div class="detail-tags" v-if="selectedPlan.tags && selectedPlan.tags.length > 0">
                <el-tag 
                  v-for="tag in selectedPlan.tags" 
                  :key="tag" 
                  size="small" 
                  effect="plain"
                  :style="{ 
                    borderColor: (availableTags.find(t => t.name === tag) || {}).color || '#909399',
                    color: (availableTags.find(t => t.name === tag) || {}).color || '#909399'
                  }">
                  {{ tag }}
                </el-tag>
              </div>
              <p v-if="selectedPlan.description" class="detail-description">{{ selectedPlan.description }}</p>
            </div>
            
            <div v-if="selectedPlan.markdownContent" class="markdown-content">
              <div v-html="renderMarkdown(selectedPlan.markdownContent)"></div>
            </div>
            
            <div class="detail-actions">
              <el-button type="primary" size="small" @click="editPlan(selectedPlan)">
                <i class="el-icon-edit"></i> 编辑计划
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                v-if="!selectedPlan.completed"
                @click="() => { selectedPlan.completed = true; updatePlan(selectedPlan); }">
                <i class="el-icon-check"></i> 标记为已完成
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                v-else
                @click="() => { selectedPlan.completed = false; updatePlan(selectedPlan); }">
                <i class="el-icon-refresh-left"></i> 标记为进行中
              </el-button>
              <el-button type="danger" size="small" @click="deletePlan(selectedPlan.id)">
                <i class="el-icon-delete"></i> 删除计划
              </el-button>
            </div>
          </div>
          <div v-else class="empty-detail">
            <div class="empty-illustration">
              <i class="el-icon-document"></i>
            </div>
            <p>选择一个计划查看详情</p>
            <el-button type="primary" size="small" @click="showAddForm">
              <i class="el-icon-plus"></i> 新建计划
            </el-button>
          </div>
        </transition>
      </div>
      
      <!-- 表单容器 -->
      <div class="form-container" v-if="formVisible">
        <PlanForm :plan="currentPlan" @save="savePlan" @cancel="hideForm" :availableTags="availableTags" :priorityOptions="priorityOptions" />
      </div>
    </div>
    
    <!-- 导入对话框 -->
    <el-dialog
      title="导入计划数据"
      :visible.sync="importDialogVisible"
      width="500px"
      @close="cancelImport">
      <div class="import-container">
        <div class="file-upload">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept=".json">
            <el-button type="primary" @click="triggerFileSelect">
              选择文件
            </el-button>
            <input ref="fileInput" type="file" id="file-input" accept=".json" @change="handleFileChange" style="display:none">
          </el-upload>
          <div v-if="selectedFile" class="selected-file">
            <p>已选择文件: {{ selectedFile.name }}</p>
          </div>
        </div>
        
        <div v-if="importPreview" class="import-preview">
          <p>发现 {{ importPreview.count }} 个计划</p>
        </div>
        
        <div class="debug-area" style="display: none;">
          <p>导入状态: {{ importData ? '数据已加载' : '未加载数据' }}</p>
          <p>已选文件: {{ selectedFile ? selectedFile.name : '未选择文件' }}</p>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelImport">取消</el-button>
        <el-button type="primary" @click="confirmImport" :disabled="!selectedFile">
          确认导入
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import PlanItem from './PlanItem.vue';
import PlanForm from './PlanForm.vue';
import { marked } from 'marked';

export default {
  name: 'PlanList',
  components: {
    PlanItem,
    PlanForm
  },
  setup() {
    console.log('PlanList组件初始化');
    
    // 开发调试 - 设置为true可以在每次刷新页面时清空数据（仅开发时使用）
    const DEBUG_RESET = false;
    if (DEBUG_RESET) {
      console.warn('调试模式：清空所有计划数据');
      localStorage.removeItem('plans');
      localStorage.removeItem('plans_backup');
    }
    
    // 确保plans是一个有效的响应式数组
    const plans = ref([]);
    console.log('初始plans.value:', plans.value);

    // 表单显示控制
    const formVisible = ref(false);
    
    // 当前编辑的计划
    const currentPlan = ref({
      id: null,
      title: '',
      date: new Date(),
      description: '',
      markdownContent: '',
      completed: false,
      priority: 'medium', // 新增：优先级字段
      tags: [], // 新增：标签字段
      color: '' // 新增：颜色字段
    });
    
    // 选中的计划（用于详情显示）
    const selectedPlan = ref(null);
    
    // 过滤条件
    const filter = ref('all');
    const dateFilter = ref(null);
    const dateRange = reactive({
      start: null,
      end: null
    });
    const tagFilter = ref(''); // 新增：标签过滤
    const priorityFilter = ref('all'); // 新增：优先级过滤
    
    // 拖拽相关
    const isDragging = ref(false);
    const draggedItem = ref(null);
    
    // 动画相关
    const animating = ref(false);
    
    // 导入功能相关
    const importDialogVisible = ref(false);
    const fileInput = ref(null);
    const importData = ref(null);
    const importPreview = ref(null);
    const selectedFile = ref(null);
    
    // 常用标签列表
    const availableTags = ref([
      { name: '工作', color: '#4b90ff' },
      { name: '生活', color: '#55cc77' },
      { name: '学习', color: '#e6a23c' },
      { name: '紧急', color: '#ff6b6b' },
      { name: '长期', color: '#8159fe' }
    ]);
    
    // 优先级选项
    const priorityOptions = [
      { value: 'high', label: '高', color: '#ff6b6b' },
      { value: 'medium', label: '中', color: '#e6a23c' },
      { value: 'low', label: '低', color: '#55cc77' }
    ];
    
    // 选择计划
    const selectPlan = (plan) => {
      if (formVisible.value) return; // 如果正在编辑，不允许选择
      
      // 添加动画效果
      animating.value = true;
      selectedPlan.value = null;
      
      setTimeout(() => {
        selectedPlan.value = { ...plan };
        animating.value = false;
      }, 300);
    };
    
    // 日期格式化
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '无效日期';
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };
    
    // 渲染Markdown
    const renderMarkdown = (markdownText) => {
      if (!markdownText) return '';
      return marked(markdownText);
    };
    
    // 获取计划优先级信息
    const getPriorityInfo = (priority) => {
      const option = priorityOptions.find(opt => opt.value === priority) || priorityOptions[1]; // 默认返回中等优先级
      return option;
    };
    
    // 开始拖拽
    const startDrag = (plan, event) => {
      event.stopPropagation();
      isDragging.value = true;
      draggedItem.value = plan;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', plan.id);
      
      // 修改拖拽时的图像效果
      const dragImage = event.target.cloneNode(true);
      dragImage.style.opacity = '0.6';
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 0, 0);
      
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    };
    
    // 拖拽进入
    const onDragOver = (event, index) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    };
    
    // 放置
    const onDrop = (event, targetPlan) => {
      event.preventDefault();
      if (!isDragging.value || !draggedItem.value) return;
      
      const draggedId = draggedItem.value.id;
      const targetId = targetPlan.id;
      
      if (draggedId === targetId) return;
      
      // 获取拖拽项和目标项的索引
      const draggedIndex = plans.value.findIndex(p => p.id === draggedId);
      const targetIndex = plans.value.findIndex(p => p.id === targetId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // 创建新数组，将拖拽项移动到目标位置
      const newPlans = [...plans.value];
      const [removed] = newPlans.splice(draggedIndex, 1);
      newPlans.splice(targetIndex, 0, removed);
      
      // 更新数组
      plans.value = newPlans;
      savePlansToStorage();
      
      isDragging.value = false;
      draggedItem.value = null;
    };
    
    // 结束拖拽
    const onDragEnd = () => {
      isDragging.value = false;
      draggedItem.value = null;
    };

    // 根据过滤条件显示计划
    const filteredPlans = computed(() => {
      console.log('过滤前计划数:', plans.value.length);
      console.log('当前过滤条件:', { 
        status: filter.value, 
        dateRange,
        tag: tagFilter.value,
        priority: priorityFilter.value
      });
      
      if (!Array.isArray(plans.value)) {
        console.warn('计划数据不是数组');
        return [];
      }
      
      const filtered = plans.value
        .filter(plan => {
          // 状态过滤
          if (filter.value === 'active' && plan.completed) return false;
          if (filter.value === 'completed' && !plan.completed) return false;
          
          // 日期过滤
          if (dateRange.start && dateRange.end) {
            const planDate = new Date(plan.date);
            if (isNaN(planDate.getTime())) {
              console.warn('计划日期无效:', plan.date);
              return true; // 保留无效日期的计划
            }
            
            if (planDate < dateRange.start || planDate > dateRange.end) {
              return false;
            }
          }
          
          // 标签过滤
          if (tagFilter.value && (!plan.tags || !plan.tags.includes(tagFilter.value))) {
            return false;
          }
          
          // 优先级过滤
          if (priorityFilter.value !== 'all' && plan.priority !== priorityFilter.value) {
            return false;
          }
          
          return true;
        })
        .sort((a, b) => {
          // 首先按优先级排序（高 > 中 > 低）
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityA = priorityOrder[a.priority] ?? 1; // 默认中等优先级
          const priorityB = priorityOrder[b.priority] ?? 1;
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          
          // 其次按日期降序排列
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return 0; // 如果日期无效，不改变顺序
          }
          
          return dateB - dateA;
        });
        
      console.log('过滤后计划数:', filtered.length);
      return filtered;
    });
    
    // 保存计划
    const savePlan = (plan) => {
      console.log('准备保存计划:', plan);
      
      // 创建新的计划对象
      const newPlan = {
        id: plan.id || Date.now(),
        title: plan.title,
        date: plan.date instanceof Date ? plan.date : new Date(plan.date),
        description: plan.description || '',
        markdownContent: plan.markdownContent || '',
        completed: plan.completed || false,
        priority: plan.priority || 'medium',
        tags: Array.isArray(plan.tags) ? plan.tags : [],
        color: plan.color || ''
      };
      
      // 使用新数组替换原数组，确保响应式更新
      if (newPlan.id && plans.value.some(p => p.id === newPlan.id)) {
        // 更新现有计划
        plans.value = plans.value.map(p => 
          p.id === newPlan.id ? newPlan : p
        );
        // 如果当前选中的是这个计划，也更新选中的计划
        if (selectedPlan.value && selectedPlan.value.id === newPlan.id) {
          selectedPlan.value = { ...newPlan };
        }
      } else {
        // 添加新计划 - 创建新数组并赋值给plans.value
        plans.value = [newPlan, ...plans.value]; // 新计划添加到最前面
        // 自动选中新添加的计划
        selectedPlan.value = { ...newPlan };
      }
      
      console.log('保存前计划数组:', JSON.stringify(plans.value));
      savePlansToStorage();
      console.log('保存后plans.value长度:', plans.value.length);
      hideForm();
      
      // 确保当前过滤条件不会隐藏新添加的计划
      resetFilters();
    };
    
    // 重置过滤条件
    const resetFilters = () => {
      filter.value = 'all';
      dateFilter.value = null;
      dateRange.start = null;
      dateRange.end = null;
      tagFilter.value = '';
      priorityFilter.value = 'all';
    };
    
    // 切换标签过滤
    const toggleTagFilter = (tag) => {
      if (tagFilter.value === tag) {
        tagFilter.value = ''; // 取消过滤
      } else {
        tagFilter.value = tag; // 设置过滤
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      console.log('组件挂载');
      
      // 清除localStorage中可能损坏的数据（仅用于调试，通常应注释）
      // localStorage.removeItem('plans');

      // 加载已有计划
      loadPlans();
      
      // 确保plans是一个数组
      if (!Array.isArray(plans.value)) {
        console.warn('计划数据不是数组，重置为空数组');
        plans.value = [];
      }
      
      // 添加一个示例计划（仅当没有计划时）
      if (!plans.value || plans.value.length === 0) {
        console.log('没有现有计划，添加示例计划');
        
        const examplePlan = {
          id: Date.now(),
          title: '示例计划',
          date: new Date(),
          description: '这是一个示例计划，您可以通过点击"编辑"按钮查看详情或修改。',
          markdownContent: '# 欢迎使用简约计划工具\n\n这是一个示例Markdown文档，您可以在创建计划时添加自己的Markdown内容。\n\n## 支持的语法\n\n- **粗体**\n- *斜体*\n- 列表项\n- [链接](https://example.com)\n- 等等...',
          completed: false,
          priority: 'medium',
          tags: ['示例'],
          color: '#4b90ff'
        };
        
        // 直接设置新数组，而不是push
        plans.value = [examplePlan];
        console.log('设置示例计划后，plans值:', JSON.stringify(plans.value));
        console.log('添加示例计划后数组长度:', plans.value.length);
        
        // 自动选中示例计划
        selectedPlan.value = { ...examplePlan };
        
        // 保存到存储
        savePlansToStorage();
        console.log('示例计划已保存到localStorage');
      } else if (plans.value.length > 0) {
        // 自动选中第一个计划
        selectedPlan.value = { ...plans.value[0] };
      }
      
      // 再次检查数据加载情况
      console.log('初始化后计划总数:', plans.value.length);
    });

    // 显示添加表单
    const showAddForm = () => {
      selectedPlan.value = null; // 清除选择的计划
      currentPlan.value = {
        id: null,
        title: '',
        date: new Date(),
        description: '',
        markdownContent: '',
        completed: false,
        priority: 'medium',
        tags: [],
        color: ''
      };
      formVisible.value = true;
    };

    // 隐藏表单
    const hideForm = () => {
      formVisible.value = false;
    };
    
    // 更新计划状态
    const updatePlan = (plan) => {
      const index = plans.value.findIndex(p => p.id === plan.id);
      if (index !== -1) {
        const updatedPlan = { ...plan };
        plans.value[index] = updatedPlan;
        
        // 如果当前选中的是这个计划，也更新选中的计划
        if (selectedPlan.value && selectedPlan.value.id === plan.id) {
          selectedPlan.value = { ...updatedPlan };
        }
        
        savePlansToStorage();
      }
    };
    
    // 编辑计划
    const editPlan = (plan) => {
      currentPlan.value = { ...plan };
      formVisible.value = true;
    };
    
    // 删除计划
    const deletePlan = (id) => {
      if (confirm('确定要删除这个计划吗？')) {
        plans.value = plans.value.filter(plan => plan.id !== id);
        
        // 如果删除的是当前选中的计划，清除选中状态
        if (selectedPlan.value && selectedPlan.value.id === id) {
          selectedPlan.value = null;
        }
        
        savePlansToStorage();
      }
    };
    
    // 日期过滤器变化
    const onDateFilterChange = () => {
      if (dateFilter.value) {
        dateRange.start = dateFilter.value[0];
        dateRange.end = dateFilter.value[1];
      } else {
        dateRange.start = null;
        dateRange.end = null;
      }
    };
    
    // 重置所有数据
    const resetApp = () => {
      if (confirm('确定要重置应用吗？这将删除所有计划数据！')) {
        localStorage.removeItem('plans');
        plans.value = [];
        
        // 添加示例计划
        const examplePlan = {
          id: Date.now(),
          title: '示例计划',
          date: new Date(),
          description: '这是一个示例计划，您可以通过点击"编辑"按钮查看详情或修改。',
          markdownContent: '# 欢迎使用简约计划工具\n\n这是一个示例Markdown文档，您可以在创建计划时添加自己的Markdown内容。\n\n## 支持的语法\n\n- **粗体**\n- *斜体*\n- 列表项\n- [链接](https://example.com)\n- 等等...',
          completed: false,
          priority: 'medium',
          tags: ['示例'],
          color: '#4b90ff'
        };
        plans.value = [examplePlan];
        savePlansToStorage();
        
        // 重置过滤条件
        resetFilters();
        
        alert('应用已重置，添加了新的示例计划');
      }
    };
    
    // 处理下拉菜单命令
    const handleCommand = (command) => {
      switch(command) {
        case 'exportData':
          exportData();
          break;
        case 'importData':
          showImportDialog();
          break;
        case 'resetApp':
          resetApp();
          break;
      }
    };
    
    // 导出数据到文件
    const exportData = () => {
      try {
        // 准备数据
        const dataToExport = JSON.stringify(plans.value, null, 2);
        
        // 创建下载链接
        const blob = new Blob([dataToExport], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // 设置文件名（使用当前日期）
        const date = new Date();
        const fileName = `plans_backup_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.json`;
        link.download = fileName;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 显示成功消息
        alert(`已成功导出 ${plans.value.length} 条计划数据到文件 ${fileName}`);
      } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出数据失败: ' + error.message);
      }
    };
    
    // 显示导入对话框
    const showImportDialog = () => {
      console.log('显示导入对话框');
      // 重置导入状态
      importData.value = null;
      importPreview.value = null;
      selectedFile.value = null;
      importDialogVisible.value = true;
    };
    
    // 触发文件选择
    const triggerFileSelect = () => {
      const fileInputElement = document.getElementById('file-input');
      if (fileInputElement) {
        fileInputElement.click();
      }
    };
    
    // 处理文件选择
    const handleFileChange = (event) => {
      const file = event.target.files[0];
      console.log('选择的文件:', file);
      
      // 清除之前的数据
      importData.value = null;
      importPreview.value = null;
      
      if (file) {
        // 保存已选文件信息
        selectedFile.value = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            console.log('文件内容长度:', content.length);
            
            const parsedData = JSON.parse(content);
            console.log('解析后的数据类型:', Array.isArray(parsedData) ? '数组' : typeof parsedData);
            
            // 验证数据
            if (Array.isArray(parsedData)) {
              console.log('解析到的计划数量:', parsedData.length);
              importData.value = parsedData;
              importPreview.value = {
                count: parsedData.length
              };
              console.log('设置importData后的值:', importData.value);
            } else {
              console.error('导入数据不是数组:', parsedData);
              alert('导入失败: 文件格式不正确，应为包含计划数组的JSON');
              selectedFile.value = null;
            }
          } catch (error) {
            console.error('解析导入文件失败:', error);
            alert('解析导入文件失败: ' + error.message);
            selectedFile.value = null;
          }
        };
        
        reader.onerror = (error) => {
          console.error('读取文件失败:', error);
          alert('读取文件失败');
          selectedFile.value = null;
        };
        
        reader.readAsText(file);
      } else {
        selectedFile.value = null;
      }
    };
    
    // 确认导入
    const confirmImport = () => {
      console.log('点击确认导入按钮');
      
      if (!selectedFile.value) {
        alert('请先选择文件');
        return;
      }
      
      try {
        // 如果importData.value不存在，但有选择文件，尝试重新解析
        if (!importData.value && selectedFile.value) {
          alert('数据未准备好，请重新选择文件');
          return;
        }
        
        // 处理日期
        const processedData = importData.value.map(plan => ({
          ...plan,
          id: plan.id || Date.now(),
          date: new Date(plan.date),
          description: plan.description || '',
          markdownContent: plan.markdownContent || '',
          completed: !!plan.completed,
          priority: plan.priority || 'medium',
          tags: Array.isArray(plan.tags) ? plan.tags : [],
          color: plan.color || ''
        }));
        
        console.log('处理后的数据:', processedData);
        
        // 替换现有数据
        plans.value = processedData;
        
        // 自动选中第一个计划
        if (processedData.length > 0) {
          selectedPlan.value = { ...processedData[0] };
        } else {
          selectedPlan.value = null;
        }
        
        // 保存到localStorage
        savePlansToStorage();
        
        // 关闭对话框并重置状态
        importDialogVisible.value = false;
        importData.value = null;
        importPreview.value = null;
        selectedFile.value = null;
        
        // 确保文件输入被清空
        const fileInputElement = document.getElementById('file-input');
        if (fileInputElement) {
          fileInputElement.value = '';
        }
        
        // 重置过滤
        resetFilters();
        
        // 显示成功消息
        alert(`已成功导入 ${processedData.length} 条计划数据`);
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('导入数据失败: ' + error.message);
      }
    };
    
    // 取消导入
    const cancelImport = () => {
      importDialogVisible.value = false;
      importData.value = null;
      importPreview.value = null;
      selectedFile.value = null;
      
      // 确保文件输入被清空
      const fileInputElement = document.getElementById('file-input');
      if (fileInputElement) {
        fileInputElement.value = '';
      }
    };
    
    // 在测试文件上传组件之前，先尝试一个简单的文本导入功能
    const importTestData = () => {
      console.log('导入测试数据');
      
      // 示例数据
      const testData = [
        {
          id: Date.now(),
          title: '测试计划1',
          date: new Date(),
          description: '这是测试导入的计划1',
          markdownContent: '# 测试计划\n\n这是测试导入的Markdown内容',
          completed: false,
          priority: 'high',
          tags: ['工作', '紧急'],
          color: '#ff6b6b'
        },
        {
          id: Date.now() + 1000,
          title: '测试计划2',
          date: new Date(Date.now() + 86400000), // 明天
          description: '这是测试导入的计划2',
          markdownContent: '# 测试计划2\n\n这是另一个测试导入的Markdown内容',
          completed: true,
          priority: 'medium',
          tags: ['生活'],
          color: '#55cc77'
        },
        {
          id: Date.now() + 2000,
          title: '长期学习计划',
          date: new Date(Date.now() + 2 * 86400000), // 后天
          description: '这是一个长期学习计划示例',
          markdownContent: '# 学习计划\n\n## 目标\n\n- 学习Vue 3\n- 掌握TypeScript\n- 每周至少完成一个项目练习\n\n## 资源\n\n- [Vue官方文档](https://v3.vuejs.org/)\n- [TypeScript官方文档](https://www.typescriptlang.org/docs/)',
          completed: false,
          priority: 'low',
          tags: ['学习', '长期'],
          color: '#8159fe'
        }
      ];
      
      // 替换现有数据
      plans.value = testData;
      
      // 自动选中第一个计划
      selectedPlan.value = { ...testData[0] };
      
      // 保存到localStorage
      savePlansToStorage();
      
      // 重置过滤
      resetFilters();
      
      // 显示成功消息
      alert('已成功导入测试数据');
    };
    
    // 从本地存储加载数据
    const loadPlans = () => {
      try {
        console.log('开始加载计划数据');
        // 重新初始化为空数组，避免潜在的引用问题
        plans.value = [];
        
        const savedPlans = localStorage.getItem('plans');
        console.log('localStorage中的plans原始数据:', savedPlans);
        
        if (savedPlans && savedPlans !== '[]' && savedPlans !== 'null') {
          const parsedPlans = JSON.parse(savedPlans);
          console.log('解析后的计划数据:', parsedPlans);
          
          if (Array.isArray(parsedPlans) && parsedPlans.length > 0) {
            // 修复日期对象并创建新数组
            const newPlans = parsedPlans.map(plan => ({
              ...plan,
              id: plan.id || Date.now(),
              date: new Date(plan.date),
              description: plan.description || '',
              markdownContent: plan.markdownContent || '',
              completed: !!plan.completed,
              priority: plan.priority || 'medium',
              tags: Array.isArray(plan.tags) ? plan.tags : [],
              color: plan.color || ''
            }));
            
            // 直接赋值新数组
            plans.value = newPlans;
          } else {
            console.warn('存储的计划数据为空数组或不是数组');
            plans.value = [];
          }
        } else {
          console.log('localStorage中没有计划数据或为空');
          plans.value = [];
        }
      } catch (e) {
        console.error('加载计划数据失败', e);
        plans.value = [];
      }
      
      console.log('加载后的计划数组:', JSON.stringify(plans.value));
      console.log('加载的计划数:', plans.value.length);
    };
    
    // 保存数据到本地存储
    const savePlansToStorage = () => {
      try {
        // 安全检查
        if (!Array.isArray(plans.value)) {
          console.error('保存前发现plans.value不是数组:', plans.value);
          plans.value = plans.value ? [plans.value] : [];
        }
        
        // 防止存储空数组导致丢失数据
        if (plans.value.length === 0) {
          console.warn('尝试保存空数组，请检查是否有丢失数据');
        }
        
        // 序列化数据
        const plansToSave = JSON.stringify(plans.value);
        console.log('准备存储的数据:', plansToSave);
        
        // 清除并重新设置
        localStorage.removeItem('plans');
        localStorage.setItem('plans', plansToSave);
        
        // 验证存储是否成功
        const savedData = localStorage.getItem('plans');
        console.log('localStorage中的plans:', savedData);
        
        if (savedData !== plansToSave) {
          console.error('存储验证失败，存储的数据与原始数据不匹配');
        }
        
        console.log('保存的计划数:', plans.value.length);
      } catch (error) {
        console.error('保存计划时出错:', error);
        // 尝试使用备用方法保存
        try {
          if (Array.isArray(plans.value) && plans.value.length > 0) {
            localStorage.setItem('plans_backup', JSON.stringify(plans.value));
            console.log('已使用备用方法保存计划');
          }
        } catch (backupError) {
          console.error('备用保存也失败:', backupError);
        }
      }
    };

    return {
      plans,
      formVisible,
      currentPlan,
      selectedPlan,
      filter,
      dateFilter,
      filteredPlans,
      showAddForm,
      hideForm,
      savePlan,
      updatePlan,
      editPlan,
      deletePlan,
      onDateFilterChange,
      resetApp,
      // 导入导出相关
      handleCommand,
      importDialogVisible,
      fileInput,
      importPreview,
      handleFileChange,
      confirmImport,
      selectedFile,
      triggerFileSelect,
      cancelImport,
      // 新增功能
      selectPlan,
      formatDate,
      renderMarkdown,
      showImportDialog,
      importTestData,
      // 拖拽相关
      startDrag,
      onDragOver,
      onDrop,
      onDragEnd,
      isDragging,
      // 标签相关
      availableTags,
      tagFilter,
      toggleTagFilter,
      // 优先级相关
      priorityOptions,
      priorityFilter,
      getPriorityInfo,
      // 动画相关
      animating,
      // 过滤复位
      resetFilters
    };
  }
}
</script>

<style scoped>
.plan-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #f9fafb;
  overflow: hidden;
  position: relative;
}

.header-container {
  padding: 20px 30px;
  background: linear-gradient(120deg, #f8f9fa, #e9ecef);
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  max-width: 1600px;
  margin: 0 auto 15px auto;
  width: 100%;
}

.header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(90deg, #333, #555);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.header-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.header-buttons .el-button {
  transition: all 0.3s;
}

.header-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tag-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 auto 20px auto;
  padding: 0 30px;
  max-width: 1600px;
  width: 100%;
}

.tag-filter {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.tag-filter:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.tag-filter.active {
  font-weight: 500;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.tag-filter.clear-filter {
  border-color: #909399;
  color: #606266;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 30px;
  padding: 0 30px 30px 30px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  height: calc(100vh - 150px);
}

.plan-list {
  flex: 0 0 380px;
  overflow-y: auto;
  border-radius: 12px;
  background-color: #fff;
  padding: 15px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  height: 100%;
  position: relative;
}

.plan-list::-webkit-scrollbar {
  width: 6px;
}

.plan-list::-webkit-scrollbar-thumb {
  background-color: #d0d0d0;
  border-radius: 6px;
}

.plan-list::-webkit-scrollbar-track {
  background-color: #f5f5f5;
  border-radius: 6px;
}

.plans-transition-group {
  min-height: 100%;
}

.plan-item {
  position: relative;
  padding: 16px;
  margin-bottom: 15px;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
  border-left: 4px solid #909399;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.plan-item:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
}

.plan-item.selected {
  background-color: #f0f7ff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3), 0 6px 16px rgba(0, 0, 0, 0.08);
}

.plan-item.completed {
  opacity: 0.75;
  background-color: #f8f8f8;
}

.plan-item.dragging {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.plan-item-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.plan-checkbox {
  flex: 0 0 auto;
}

.plan-title {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
  transition: color 0.3s;
}

.plan-title.completed {
  text-decoration: line-through;
  color: #909399;
}

.plan-priority {
  flex: 0 0 auto;
}

.plan-date {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.plan-date::before {
  content: '\e78f'; /* el-icon-date 的 unicode */
  font-family: 'element-icons';
  font-size: 12px;
}

.plan-description {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.6;
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.plan-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.plan-item:hover .plan-actions {
  opacity: 1;
}

.drag-handle {
  position: absolute;
  top: 16px;
  right: 12px;
  color: #c0c4cc;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  cursor: grab;
}

.plan-item:hover .drag-handle {
  opacity: 0.7;
}

.plan-item:hover .drag-handle:hover {
  opacity: 1;
  color: #409eff;
}

.plan-detail {
  flex: 1;
  padding: 25px 30px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
  height: 100%;
}

.plan-detail::-webkit-scrollbar {
  width: 6px;
}

.plan-detail::-webkit-scrollbar-thumb {
  background-color: #d0d0d0;
  border-radius: 6px;
}

.plan-detail::-webkit-scrollbar-track {
  background-color: #f5f5f5;
  border-radius: 6px;
}

.detail-header {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  position: relative;
}

.detail-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #a0cfff);
  border-radius: 3px;
}

.detail-header h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 26px;
  color: #303133;
  font-weight: 600;
  line-height: 1.3;
}

.detail-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 15px;
  color: #606266;
}

.detail-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.detail-description {
  margin-top: 15px;
  color: #606266;
  line-height: 1.6;
  font-size: 15px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.markdown-content {
  margin-bottom: 30px;
  padding: 25px;
  background-color: #f9f9f9;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  box-shadow: inset 0 1px 8px rgba(0, 0, 0, 0.03);
}

.markdown-content :deep(h1) {
  font-size: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
  margin-top: 0;
  color: #303133;
}

.markdown-content :deep(h2) {
  font-size: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  color: #303133;
  margin-top: 30px;
}

.markdown-content :deep(p) {
  line-height: 1.8;
  margin: 16px 0;
  color: #606266;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  padding-left: 25px;
  margin: 16px 0;
}

.markdown-content :deep(li) {
  margin-bottom: 8px;
  line-height: 1.6;
}

.markdown-content :deep(a) {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.markdown-content :deep(a:hover) {
  color: #66b1ff;
  text-decoration: underline;
}

.markdown-content :deep(code) {
  background-color: #f3f3f3;
  padding: 3px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.9em;
  color: #d63200;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.detail-actions .el-button {
  padding: 10px 20px;
  transition: all 0.3s;
}

.detail-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
}

.empty-illustration {
  font-size: 80px;
  margin-bottom: 30px;
  color: #e0e0e0;
  opacity: 0.8;
}

.empty-detail p {
  margin-bottom: 25px;
  font-size: 18px;
  color: #606266;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
}

.empty-state i {
  font-size: 80px;
  margin-bottom: 30px;
  color: #e0e0e0;
  opacity: 0.8;
}

.empty-state p {
  margin-bottom: 25px;
  font-size: 18px;
  color: #606266;
}

.form-container {
  flex: 1;
  padding: 25px 30px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
  height: 100%;
}

.import-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selected-file {
  margin-top: 15px;
  padding: 12px 16px;
  background-color: #f0f9eb;
  border-radius: 6px;
  border-left: 3px solid #67c23a;
}

.selected-file p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.import-preview {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s, transform 0.4s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

.plan-list-enter-active,
.plan-list-leave-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.plan-list-enter,
.plan-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.plan-list-move {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animating {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s, transform 0.4s;
}

/* 优先级下拉选项 */
.priority-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

.priority-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.priority-filter {
  width: 120px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    padding: 0 20px 20px 20px;
  }
  
  .plan-list {
    flex: 0 0 340px;
  }
}

@media (max-width: 992px) {
  .header-container {
    padding: 15px 20px;
  }
  
  .tag-filters {
    padding: 0 20px;
  }
  
  .main-content {
    flex-direction: column;
    height: auto;
    gap: 20px;
  }
  
  .plan-list {
    flex: none;
    width: 100%;
    max-height: 400px;
  }
  
  .plan-detail, .form-container {
    max-height: 600px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .filters {
    flex-direction: column;
    width: 100%;
    align-items: flex-start;
    gap: 10px;
  }
  
  .filters .el-radio-group,
  .filters .el-date-picker,
  .filters .el-select {
    width: 100%;
  }
  
  .header-buttons {
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-top: 15px;
  }
  
  .plan-list {
    max-height: 350px;
  }
  
  .plan-detail, .form-container {
    padding: 20px;
  }
}

@media (max-width: 576px) {
  .header-container {
    padding: 15px;
  }
  
  .tag-filters {
    padding: 0 15px;
  }
  
  .main-content {
    padding: 0 15px 15px 15px;
  }
  
  .header-buttons .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .plan-item {
    padding: 12px;
  }
  
  .plan-list {
    max-height: 300px;
    padding: 10px;
  }
}
</style> 