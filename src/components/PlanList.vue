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
          
          <el-select v-model="projectFilter" size="small" placeholder="项目" class="project-filter">
            <el-option value="all" label="所有项目" />
            <el-option 
              v-for="project in projects" 
              :key="project.id" 
              :label="project.name" 
              :value="project.id.toString()">
              <div class="project-option">
                <span class="project-dot" :style="{backgroundColor: project.color}"></span>
                <span>{{ project.name }}</span>
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
          <el-icon><Plus /></el-icon> 新建计划
        </el-button>
        
        <el-button type="primary" size="small" @click="showProjectDialog">
          <el-icon><Folder /></el-icon> 项目管理
        </el-button>
        
        <el-button @click="exportData" type="success" size="small">
          <el-icon><Download /></el-icon> 导出
        </el-button>
        
        <el-button @click="showImportDialog" type="warning" size="small">
          <el-icon><Upload /></el-icon> 导入
        </el-button>
        
        <!-- 添加备份还原按钮 -->
        <el-button @click="backupData" type="info" size="small">
          <el-icon><DocumentCopy /></el-icon> 备份
        </el-button>
        
        <el-button @click="restoreData" type="info" size="small">
          <el-icon><RefreshRight /></el-icon> 还原
        </el-button>
        
        <el-button type="info" size="small" @click="importTestData">测试数据</el-button>
        
        <el-button @click="resetApp" type="danger" size="small">
          <el-icon><Delete /></el-icon> 重置
        </el-button>
      </div>
    </div>

    <!-- 标签过滤器 -->
    <div class="tag-filters">
      <div 
        v-for="tag in allAvailableTags" 
        :key="tag.name"
        :class="['tag-filter', { active: selectedTags.includes(tag.name) }]"
        :style="{ 
          borderColor: tag.color, 
          backgroundColor: selectedTags.includes(tag.name) ? tag.color : 'transparent',
          color: selectedTags.includes(tag.name) ? '#fff' : tag.color
        }"
        @click="toggleTagFilter(tag.name)">
        {{ tag.name }}
        <el-icon v-if="tag.isCustom" class="custom-tag-icon"><Edit /></el-icon>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 计划列表 -->
      <div class="plan-list">
        <div v-if="filteredPlans.length === 0" class="empty-state">
          <el-icon :size="60"><Document /></el-icon>
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
              
              <div class="plan-meta">
                <div class="plan-date">
                  <el-icon><Calendar /></el-icon> {{ formatDate(plan.date) }}
                </div>
                
                <!-- 添加项目标识 -->
                <div v-if="plan.projectId" class="plan-project">
                  <el-tag 
                    size="mini" 
                    :style="{ backgroundColor: getProjectInfo(plan.projectId)?.color, color: '#fff', border: 'none' }">
                    {{ getProjectInfo(plan.projectId)?.name }}
                  </el-tag>
                </div>
              </div>
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
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button size="mini" type="text" @click.stop="deletePlan(plan.id)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
            <div class="drag-handle">
              <el-icon><Rank /></el-icon>
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
                  <el-icon><Calendar /></el-icon> {{ formatDate(selectedPlan.date) }}
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
                <!-- 添加项目信息 -->
                <div v-if="selectedPlan.projectId" class="detail-project">
                  <el-tag 
                    :style="{ backgroundColor: getProjectInfo(selectedPlan.projectId)?.color, color: '#fff', border: 'none' }">
                    项目: {{ getProjectInfo(selectedPlan.projectId)?.name }}
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
                <el-icon><Edit /></el-icon> 编辑计划
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                v-if="!selectedPlan.completed"
                @click="() => { selectedPlan.completed = true; updatePlan(selectedPlan); }">
                <el-icon><Check /></el-icon> 标记为已完成
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                v-else
                @click="() => { selectedPlan.completed = false; updatePlan(selectedPlan); }">
                <el-icon><RefreshLeft /></el-icon> 标记为进行中
              </el-button>
              <el-button type="danger" size="small" @click="deletePlan(selectedPlan.id)">
                <el-icon><Delete /></el-icon> 删除计划
              </el-button>
            </div>
          </div>
          <div v-else class="empty-detail">
            <div class="empty-illustration">
              <el-icon :size="80"><Document /></el-icon>
            </div>
            <p>选择一个计划查看详情</p>
            <el-button type="primary" size="small" @click="showAddForm">
              <el-icon><Plus /></el-icon> 新建计划
            </el-button>
          </div>
        </transition>
      </div>
      
      <!-- 表单容器 -->
      <div class="form-container" v-if="formVisible">
        <PlanForm 
          :plan="currentPlan" 
          @save="savePlan" 
          @cancel="hideForm" 
          :availableTags="availableTags" 
          :priorityOptions="priorityOptions"
          :projects="projects" />
      </div>
    </div>
    
    <!-- 导入对话框 -->
    <el-dialog
      title="导入计划数据"
      v-model="importDialogVisible"
      width="500px"
      @close="cancelImport">
      <div class="import-container">
        <div class="file-upload">
          <!-- 移除el-upload组件，使用简单的按钮和input -->
          <el-button type="primary" @click="triggerFileSelect">
            选择文件
          </el-button>
          <input 
            ref="fileInput" 
            type="file" 
            id="file-input" 
            accept=".json" 
            @change="handleFileChange" 
            style="display:none">
          
          <div v-if="selectedFile" class="selected-file">
            <p>已选择文件: {{ selectedFile.name }}</p>
          </div>
        </div>
        
        <div v-if="importPreview" class="import-preview">
          <p v-if="importPreview.format === 'new'">
            检测到新格式数据，包含:
            <ul>
              <li>{{ importPreview.count }} 个计划</li>
              <li>{{ importPreview.projectCount }} 个项目</li>
              <li>版本: {{ importPreview.version }}</li>
            </ul>
          </p>
          <p v-else>
            检测到旧格式数据，包含 {{ importPreview.count }} 个计划
          </p>
        </div>
        
        <div class="debug-area" style="display: none;">
          <p>导入状态: {{ importData ? '数据已加载' : '未加载数据' }}</p>
          <p>已选文件: {{ selectedFile ? selectedFile.name : '未选择文件' }}</p>
          <p>对话框可见性: {{ importDialogVisible }}</p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelImport">取消</el-button>
          <el-button type="primary" @click="confirmImport" :disabled="!selectedFile">
            确认导入
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 调试按钮和信息 -->
    <div class="debug-panel" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); display: block;">
      <h4>调试面板</h4>
      <p>导入对话框状态: {{ importDialogVisible ? '打开' : '关闭' }}</p>
      <el-button @click="importDialogVisible = true" type="primary" size="small">
        直接打开对话框
      </el-button>
      <el-button @click="importTestData" type="success" size="small">
        测试数据导入
      </el-button>
    </div>

    <!-- 主题切换按钮 -->
    <div class="theme-toggle" @click="toggleTheme">
      <el-icon>
        <component :is="darkTheme ? 'Sunny' : 'Moon'" />
      </el-icon>
    </div>

    <!-- 项目管理对话框 -->
    <el-dialog
      title="项目管理"
      v-model="projectDialogVisible"
      width="500px"
      @close="hideProjectDialog">
      <div class="project-container">
        <div class="project-list">
          <div v-if="projects.length === 0" class="empty-state">
            <el-icon :size="60"><Document /></el-icon>
            <p>暂无项目</p>
            <el-button type="primary" size="small" @click="showProjectDialog">
              添加新项目
            </el-button>
          </div>
          
          <transition-group name="project-list" tag="div" class="projects-transition-group">
            <div
              v-for="project in projects"
              :key="project.id"
              class="project-item"
              @click="startEditProject(project)">
              <div class="project-item-header">
                <div class="project-title">{{ project.name }}</div>
              </div>
              <div class="project-actions">
                <el-button size="mini" type="text" @click.stop="deleteProject(project)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </div>
            </div>
          </transition-group>
        </div>
        
        <div class="form-container">
          <el-form
            :model="editingProject"
            :rules="projectRules"
            @submit.prevent="updateProject">
            <el-form-item label="项目名称">
              <el-input v-model="newProjectName" />
            </el-form-item>
            <el-form-item label="项目颜色">
              <el-color-picker v-model="newProjectColor" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addProject">添加项目</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import PlanItem from './PlanItem.vue';
import PlanForm from './PlanForm.vue';
import { marked } from 'marked';
// 导入Element Plus需要的图标
import { 
  Upload, Download, Plus, Delete, Document, Edit, Calendar, 
  Check, RefreshLeft, DocumentAdd, Rank, Collection, Sunny, 
  Moon, Folder, DocumentCopy, RefreshRight 
} from '@element-plus/icons-vue';

export default {
  name: 'PlanList',
  components: {
    PlanItem,
    PlanForm,
    // 注册图标组件
    Upload,
    Download,
    Plus,
    Delete,
    Document,
    Edit,
    Calendar,
    Check,
    RefreshLeft,
    DocumentAdd,
    Rank,
    Collection,
    Sunny,
    Moon,
    Folder,
    DocumentCopy,
    RefreshRight
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
    
    // 项目数据
    const projects = ref([
      { id: 1, name: '个人', color: '#409EFF' },
      { id: 2, name: '工作', color: '#67C23A' },
      { id: 3, name: '学习', color: '#E6A23C' }
    ]);
    
    // 项目过滤器
    const projectFilter = ref('all');
    
    // 当前编辑的计划
    const currentPlan = ref({
      id: null,
      title: '',
      date: new Date(),
      description: '',
      markdownContent: '',
      completed: false,
      priority: 'medium', // 优先级字段
      tags: [], // 标签字段
      color: '', // 颜色字段
      projectId: null // 新增：项目ID字段
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
    const tagFilter = ref(''); // 单标签筛选（旧版）
    const selectedTags = ref([]); // 多标签筛选（新版）
    const priorityFilter = ref('all'); // 新增：优先级过滤
    const selectedPriority = ref(''); // 新版优先级筛选
    const selectedProject = ref(''); // 新版项目筛选
    const showCompleted = ref(true); // 是否显示已完成的计划
    
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
    
    // 项目管理对话框
    const projectDialogVisible = ref(false);
    const editingProject = ref(null);
    const newProjectName = ref('');
    const newProjectColor = ref('#409EFF');
    
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

    // 根据标签筛选计划
    const filteredPlans = computed(() => {
      let result = plans.value;
      
      // 按标签筛选
      if (selectedTags.value.length > 0) {
        result = result.filter(plan => {
          // 检查计划是否包含任何选中的标签
          return selectedTags.value.some(tag => {
            // 如果是预设标签，直接检查
            if (availableTags.value.some(t => t.name === tag)) {
              return plan.tags.includes(tag);
            }
            // 如果是自定义标签，检查是否在自定义标签列表中
            return plan.tags.includes(tag);
          });
        });
      }
      
      // 按优先级筛选
      if (selectedPriority.value) {
        result = result.filter(plan => plan.priority === selectedPriority.value);
      }
      
      // 按项目筛选
      if (selectedProject.value) {
        result = result.filter(plan => plan.projectId === selectedProject.value);
      }
      
      // 按完成状态筛选
      if (showCompleted.value === false) {
        result = result.filter(plan => !plan.completed);
      }
      
      // 按日期筛选
      if (dateRange.value && dateRange.value.length === 2) {
        const startDate = new Date(dateRange.value[0]);
        const endDate = new Date(dateRange.value[1]);
        result = result.filter(plan => {
          const planDate = new Date(plan.date);
          return planDate >= startDate && planDate <= endDate;
        });
      }
      
      return result;
    });

    // 获取所有可用的标签（包括预设标签和自定义标签）
    const allAvailableTags = computed(() => {
      // 获取所有计划中的自定义标签
      const customTags = new Set();
      plans.value.forEach(plan => {
        plan.tags.forEach(tag => {
          // 如果标签不在预设标签中，则为自定义标签
          if (!availableTags.value.some(t => t.name === tag)) {
            customTags.add(tag);
          }
        });
      });

      // 合并预设标签和自定义标签
      return [
        ...availableTags.value,
        ...Array.from(customTags).map(tag => ({
          name: tag,
          color: '#67c23a', // 自定义标签使用绿色
          isCustom: true
        }))
      ];
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
        color: plan.color || '',
        projectId: plan.projectId || null // 新增：保存项目ID
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
      selectedTags.value = []; // 重置多标签筛选
      priorityFilter.value = 'all';
      selectedPriority.value = '';
      selectedProject.value = '';
      projectFilter.value = 'all'; // 新增：重置项目过滤
      showCompleted.value = true;
    };
    
    // 切换标签过滤（更新为多标签选择）
    const toggleTagFilter = (tag) => {
      // 如果该标签已经被选中，则移除它
      const index = selectedTags.value.indexOf(tag);
      if (index !== -1) {
        selectedTags.value.splice(index, 1);
      } else {
        // 否则添加该标签到选中列表
        selectedTags.value.push(tag);
      }
      
      // 兼容旧版单标签筛选（可选）
      tagFilter.value = selectedTags.value.length === 1 ? selectedTags.value[0] : '';
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      console.log('组件挂载');
      
      // 清除localStorage中可能损坏的数据（仅用于调试，通常应注释）
      // localStorage.removeItem('plans');

      // 加载已有计划
      loadPlans();
      
      // 加载项目数据
      loadProjects();
      
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
          color: '#4b90ff',
          projectId: 1 // 工作项目
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
        color: '',
        projectId: null
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
      if (confirm('确定要重置应用吗？这将删除所有计划数据和项目数据！')) {
        localStorage.removeItem('plans');
        plans.value = [];
        
        // 重置项目到默认值
        localStorage.removeItem('projects');
        projects.value = [
          { id: 1, name: '个人', color: '#409EFF' },
          { id: 2, name: '工作', color: '#67C23A' },
          { id: 3, name: '学习', color: '#E6A23C' }
        ];
        saveProjectsToStorage();
        
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
          color: '#4b90ff',
          projectId: 1 // 个人项目
        };
        plans.value = [examplePlan];
        savePlansToStorage();
        
        // 重置过滤条件
        resetFilters();
        
        alert('应用已重置，添加了新的示例计划和默认项目');
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
        // 准备数据 - 同时导出计划和项目
        const dataToExport = JSON.stringify({
          plans: plans.value,
          projects: projects.value,
          version: '1.0' // 添加版本信息便于将来兼容性处理
        }, null, 2);
        
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
        alert(`已成功导出 ${plans.value.length} 条计划数据和 ${projects.value.length} 个项目到文件 ${fileName}`);
      } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出数据失败: ' + error.message);
      }
    };
    
    // 显示导入对话框
    const showImportDialog = () => {
      console.log('显示导入对话框 - 开始');
      // 重置导入状态
      importData.value = null;
      importPreview.value = null;
      selectedFile.value = null;
      
      // 确保将对话框设置为可见
      setTimeout(() => {
        importDialogVisible.value = true;
        console.log('设置importDialogVisible为:', importDialogVisible.value);
        
        // 调试：打印所有响应式变量的状态
        console.log('导入对话框状态变量:', {
          importDialogVisible: importDialogVisible.value,
          selectedFile: selectedFile.value,
          importData: importData.value
        });
      }, 0);
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
            console.log('解析后的数据类型:', typeof parsedData);
            
            // 验证数据格式 - 支持新旧两种格式
            if (Array.isArray(parsedData)) {
              // 旧格式: 直接是计划数组
              console.log('解析到的计划数量(旧格式):', parsedData.length);
              importData.value = parsedData;
              importPreview.value = {
                count: parsedData.length,
                format: 'old'
              };
            } else if (typeof parsedData === 'object' && parsedData !== null && Array.isArray(parsedData.plans)) {
              // 新格式: {plans: [...], projects: [...], version: '...'}
              console.log('解析到的计划数量(新格式):', parsedData.plans.length);
              console.log('解析到的项目数量:', parsedData.projects ? parsedData.projects.length : 0);
              importData.value = parsedData;
              importPreview.value = {
                count: parsedData.plans.length,
                projectCount: parsedData.projects ? parsedData.projects.length : 0,
                format: 'new',
                version: parsedData.version || '1.0'
              };
            } else {
              console.error('导入数据格式不正确:', parsedData);
              alert('导入失败: 文件格式不正确，应为计划数组或包含plans字段的对象');
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
        
        // 检查导入的数据结构
        let importedPlans = [];
        let importedProjects = [];
        
        // 判断是新格式还是旧格式
        if (importData.value && typeof importData.value === 'object' && !Array.isArray(importData.value)) {
          // 新格式：{plans: [...], projects: [...]}
          console.log('检测到新格式的导入数据');
          importedPlans = importData.value.plans || [];
          importedProjects = importData.value.projects || [];
        } else if (Array.isArray(importData.value)) {
          // 旧格式：直接是计划数组
          console.log('检测到旧格式的导入数据（仅包含计划）');
          importedPlans = importData.value;
        } else {
          console.error('无法识别的数据格式');
          alert('导入失败: 无法识别的数据格式');
          return;
        }
        
        // 处理计划数据
        const processedPlans = importedPlans.map(plan => ({
          ...plan,
          id: plan.id || Date.now(),
          date: new Date(plan.date),
          description: plan.description || '',
          markdownContent: plan.markdownContent || '',
          completed: !!plan.completed,
          priority: plan.priority || 'medium',
          tags: Array.isArray(plan.tags) ? plan.tags : [],
          color: plan.color || '',
          projectId: plan.projectId || null
        }));
        
        // 处理项目数据
        const processedProjects = importedProjects.map(project => ({
          ...project,
          id: project.id || Date.now(),
          name: project.name || '未命名项目',
          color: project.color || '#409EFF'
        }));
        
        console.log('处理后的计划数据:', processedPlans);
        console.log('处理后的项目数据:', processedProjects);
        
        // 提示用户是否覆盖还是合并
        const action = confirm(`导入包含 ${processedPlans.length} 条计划和 ${processedProjects.length} 个项目。\n\n点击"确定"完全替换现有数据\n点击"取消"将新数据合并到现有数据中`);
        
        if (action) {
          // 完全替换
          plans.value = processedPlans;
          
          // 只有当有项目数据时才替换项目
          if (processedProjects.length > 0) {
            projects.value = processedProjects;
            saveProjectsToStorage();
          }
        } else {
          // 合并数据 - 对计划使用ID去重
          const existingIds = plans.value.map(p => p.id);
          
          // 筛选出新的计划（ID不在现有计划中）
          const newPlans = processedPlans.filter(p => !existingIds.includes(p.id));
          
          // 更新同ID的计划，并保留新计划
          const updatedPlans = [
            ...plans.value.map(p => {
              const imported = processedPlans.find(ip => ip.id === p.id);
              return imported || p;
            }),
            ...newPlans
          ];
          
          plans.value = updatedPlans;
          
          // 合并项目 - 对项目使用ID去重
          if (processedProjects.length > 0) {
            const existingProjectIds = projects.value.map(p => p.id);
            
            // 筛选出新的项目
            const newProjects = processedProjects.filter(p => !existingProjectIds.includes(p.id));
            
            // 更新同ID的项目，并保留新项目
            const updatedProjects = [
              ...projects.value.map(p => {
                const imported = processedProjects.find(ip => ip.id === p.id);
                return imported || p;
              }),
              ...newProjects
            ];
            
            projects.value = updatedProjects;
            saveProjectsToStorage();
          }
        }
        
        // 自动选中第一个计划
        if (plans.value.length > 0) {
          selectedPlan.value = { ...plans.value[0] };
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
        alert(`已成功导入 ${processedPlans.length} 条计划数据${processedProjects.length > 0 ? ` 和 ${processedProjects.length} 个项目` : ''}`);
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
          color: '#ff6b6b',
          projectId: 2 // 工作项目
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
          color: '#55cc77',
          projectId: 1 // 个人项目
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
          color: '#8159fe',
          projectId: 3 // 学习项目
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
              color: plan.color || '',
              projectId: plan.projectId || null // 新增：保存项目ID
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

    // 获取项目信息
    const getProjectInfo = (projectId) => {
      if (!projectId) return null;
      return projects.value.find(p => p.id === projectId) || null;
    };

    // 显示项目管理对话框
    const showProjectDialog = () => {
      projectDialogVisible.value = true;
      editingProject.value = null;
      newProjectName.value = '';
      newProjectColor.value = '#409EFF';
    };

    // 添加新项目
    const addProject = () => {
      if (!newProjectName.value.trim()) {
        alert('请输入项目名称');
        return;
      }
      
      // 检查是否已存在同名项目
      if (projects.value.some(p => p.name === newProjectName.value.trim())) {
        alert('已存在同名项目');
        return;
      }
      
      // 创建新项目
      const newProject = {
        id: Date.now(),
        name: newProjectName.value.trim(),
        color: newProjectColor.value
      };
      
      // 添加到项目列表
      projects.value.push(newProject);
      
      // 清空输入
      newProjectName.value = '';
      newProjectColor.value = '#409EFF';
      
      // 保存项目列表到localStorage
      saveProjectsToStorage();
    };
    
    // 编辑项目
    const startEditProject = (project) => {
      editingProject.value = project;
      newProjectName.value = project.name;
      newProjectColor.value = project.color;
    };
    
    // 更新项目
    const updateProject = () => {
      if (!editingProject.value) return;
      
      if (!newProjectName.value.trim()) {
        alert('请输入项目名称');
        return;
      }
      
      // 检查是否已存在同名项目（排除当前编辑的项目）
      if (projects.value.some(p => p.name === newProjectName.value.trim() && p.id !== editingProject.value.id)) {
        alert('已存在同名项目');
        return;
      }
      
      // 更新项目
      const index = projects.value.findIndex(p => p.id === editingProject.value.id);
      if (index !== -1) {
        projects.value[index].name = newProjectName.value.trim();
        projects.value[index].color = newProjectColor.value;
      }
      
      // 重置编辑状态
      editingProject.value = null;
      newProjectName.value = '';
      newProjectColor.value = '#409EFF';
      
      // 保存项目列表到localStorage
      saveProjectsToStorage();
    };
    
    // 删除项目
    const deleteProject = (project) => {
      // 检查是否有计划使用该项目
      const usedByPlans = plans.value.filter(p => p.projectId === project.id);
      if (usedByPlans.length > 0) {
        if (!confirm(`该项目已被 ${usedByPlans.length} 个计划使用，删除将会清除这些计划的项目关联，确定继续吗？`)) {
          return;
        }
        
        // 清除关联的计划
        plans.value.forEach(p => {
          if (p.projectId === project.id) {
            p.projectId = null;
          }
        });
        savePlansToStorage();
      }
      
      // 删除项目
      projects.value = projects.value.filter(p => p.id !== project.id);
      
      // 保存项目列表到localStorage
      saveProjectsToStorage();
    };
    
    // 保存项目列表到localStorage
    const saveProjectsToStorage = () => {
      try {
        localStorage.setItem('projects', JSON.stringify(projects.value));
      } catch (error) {
        console.error('保存项目列表失败:', error);
      }
    };
    
    // 加载项目列表
    const loadProjects = () => {
      try {
        const savedProjects = localStorage.getItem('projects');
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects);
          if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            projects.value = parsedProjects;
          }
        }
      } catch (error) {
        console.error('加载项目列表失败:', error);
      }
    };

    // 隐藏项目管理对话框
    const hideProjectDialog = () => {
      projectDialogVisible.value = false;
      editingProject.value = null;
      newProjectName.value = '';
      newProjectColor.value = '#409EFF';
    };

    // 备份数据到服务器
    const backupData = async () => {
      try {
        // 准备要备份的数据
        const backupData = {
          plans: plans.value,
          projects: projects.value,
          version: '1.0',
          backupTime: new Date().toISOString()
        };

        // 发送备份请求到服务器
        const response = await fetch('/api/backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(backupData)
        });

        if (!response.ok) {
          throw new Error('备份失败');
        }

        const result = await response.json();
        alert('数据备份成功！');
      } catch (error) {
        console.error('备份数据失败:', error);
        alert('备份数据失败: ' + error.message);
      }
    };

    // 从服务器还原数据
    const restoreData = async () => {
      try {
        // 确认是否要还原
        if (!confirm('确定要还原数据吗？这将覆盖当前的所有数据！')) {
          return;
        }

        // 从服务器获取最新的备份数据
        const response = await fetch('/api/restore');
        if (!response.ok) {
          throw new Error('获取备份数据失败');
        }

        const backupData = await response.json();
        
        // 验证数据格式
        if (!backupData.plans || !Array.isArray(backupData.plans)) {
          throw new Error('备份数据格式不正确');
        }

        // 更新计划数据
        plans.value = backupData.plans.map(plan => ({
          ...plan,
          date: new Date(plan.date)
        }));

        // 更新项目数据（如果有）
        if (backupData.projects && Array.isArray(backupData.projects)) {
          projects.value = backupData.projects;
          saveProjectsToStorage();
        }

        // 保存到本地存储
        savePlansToStorage();

        // 重置过滤条件
        resetFilters();

        // 自动选中第一个计划
        if (plans.value.length > 0) {
          selectedPlan.value = { ...plans.value[0] };
        } else {
          selectedPlan.value = null;
        }

        alert('数据还原成功！');
      } catch (error) {
        console.error('还原数据失败:', error);
        alert('还原数据失败: ' + error.message);
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
      exportData,
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
      selectedTags, // 添加selectedTags到返回对象
      // 优先级相关
      priorityOptions,
      priorityFilter,
      getPriorityInfo,
      selectedPriority, // 添加selectedPriority到返回对象
      // 项目相关
      selectedProject, // 添加selectedProject到返回对象
      showCompleted, // 添加showCompleted到返回对象
      // 动画相关
      animating,
      // 过滤复位
      resetFilters,
      projects,
      projectFilter,
      getProjectInfo,
      showProjectDialog,
      projectDialogVisible,
      editingProject,
      newProjectName,
      newProjectColor,
      addProject,
      startEditProject,
      updateProject,
      deleteProject,
      hideProjectDialog,
      allAvailableTags,
      backupData,
      restoreData,
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

.header-buttons .el-button:active {
  transform: translateY(0);
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

.plan-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.plan-date {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
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

/* 项目筛选器样式 */
.project-filter {
  width: 120px;
}

.project-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

.project-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 计划中的项目标签样式 */
.plan-project {
  margin-top: 5px;
}

/* 项目管理对话框样式 */
.project-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s;
}

.project-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.project-title {
  font-weight: 500;
  font-size: 16px;
  color: #333;
}

.project-actions {
  display: flex;
  gap: 10px;
}

.projects-transition-group {
  min-height: 50px;
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

/* 主题切换按钮 */
.theme-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: white;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
}

.theme-toggle:hover {
  background: #e0e0e0;
}

.custom-tag-icon {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.tag-filter {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
}

.tag-filter:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-filter.active {
  font-weight: 500;
}
</style> 