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
