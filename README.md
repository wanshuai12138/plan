# 简约计划工具

一个简约美观的计划管理工具，支持每日新增计划并关联Markdown文档。

## 功能特点

- 每日添加新计划
- 支持Markdown文档关联
- 简约美观的界面
- 按日期和完成状态筛选计划
- 本地存储，无需后端

## 开发技术

- Vue 3
- Element Plus UI
- Marked.js (Markdown解析)
- 本地存储 (LocalStorage)

## 如何运行

1. 安装依赖
   ```
   npm install
   ```

2. 启动开发服务器
   ```
   npm run dev
   ```

3. 构建生产版本
   ```
   npm run build
   ```

## 使用说明

1. 点击"新增计划"按钮添加新计划
2. 填写标题、日期、描述和关联的Markdown文档
3. 可以预览Markdown文档效果
4. 保存后，计划会显示在列表中
5. 可以标记计划为已完成、编辑或删除计划
6. 使用过滤器按状态或日期范围筛选计划

## 存储说明

所有计划数据存储在浏览器的LocalStorage中，刷新页面或重新打开浏览器不会丢失数据。
但是，清除浏览器缓存会导致数据丢失。

# 计划管理应用 - 服务端备份还原功能

## 功能介绍

本项目是一个基于Spring Boot开发的服务端应用，主要提供备份和还原功能，配合前端计划管理工具使用。

### 主要功能

1. **自动备份**：将前端的计划数据备份到服务器指定目录
2. **自动还原**：从服务器获取最新的备份数据进行还原
3. **自动清理**：定期清理过期备份文件，仅保留最新的几个备份

## 项目结构

```
planapp/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── planapp/
│   │   │               ├── controller/
│   │   │               │   └── BackupRestoreController.java  # 接口控制器
│   │   │               ├── service/
│   │   │               │   └── BackupService.java            # 备份服务
│   │   │               ├── task/
│   │   │               │   └── BackupCleanupTask.java        # 清理任务
│   │   │               └── PlanAppApplication.java           # 应用入口
│   │   └── resources/
│   │       └── application.properties                     # 配置文件
│   └── test/
│       └── ...                                            # 单元测试
├── backups/                                               # 备份文件存储目录
├── logs/                                                  # 日志文件目录
├── pom.xml                                                # Maven配置
└── README.md                                              # 说明文档
```

## 配置说明

在`application.properties`文件中可以修改以下配置：

```properties
# 服务器端口
server.port=8080

# 备份文件存储目录
backup.directory=./backups

# 最大备份文件保留数量
backup.max-files=10
```

## API接口说明

### 1. 备份数据

- **URL**: `/api/backup`
- **方法**: POST
- **请求体**: JSON格式的计划数据
- **响应**: 
  ```json
  {
    "success": true,
    "message": "数据备份成功",
    "fileName": "backup_20230401_120000.json"
  }
  ```

### 2. 还原数据

- **URL**: `/api/restore`
- **方法**: GET
- **响应**: 最新的备份数据（JSON格式）

## 使用方法

### 安装与运行

1. 确保已安装Java 8或更高版本
2. 克隆项目到本地
3. 进入项目目录，执行以下命令编译并运行项目：

```bash
mvn clean package
java -jar target/planapp-0.0.1-SNAPSHOT.jar
```

### 前端集成

在前端Vue项目中，通过以下方式调用备份还原API：

```javascript
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

    alert('数据还原成功！');
  } catch (error) {
    console.error('还原数据失败:', error);
    alert('还原数据失败: ' + error.message);
  }
};
```

## 注意事项

1. 默认情况下，备份文件保存在应用根目录下的`backups`文件夹中
2. 系统会自动清理过时的备份文件，只保留最新的10个备份
3. 在生产环境部署时，建议修改备份目录为绝对路径，以确保数据安全
