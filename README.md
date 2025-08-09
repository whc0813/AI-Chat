# AI 聊天应用

一个基于 Vue 3 的现代化 AI 聊天应用，支持多种 AI 模型对话，具备丰富的功能和优雅的用户界面。

## ✨ 主要功能

### 🤖 多模型支持
- **DeepSeek Chat**: 高质量的对话模型，支持复杂推理
- **GLM-4-Flash**: 智谱AI的快速响应模型，适合日常对话
- **模型切换**: 在对话过程中随时切换AI模型
- **模型统计**: 显示每条回复的耗时、Token消耗和使用模型

### 💬 对话管理
- **多对话支持**: 创建和管理多个独立对话会话
- **对话历史**: 自动保存所有对话记录到本地存储
- **智能标题**: 基于对话内容自动生成有意义的标题
- **对话搜索**: 通过关键词快速搜索历史对话
- **对话重命名**: 双击标题或使用重命名按钮自定义对话名称
- **导出功能**: 支持导出单个对话或全部对话为JSON格式

### 🎛️ 生成控制
- **停止生成**: 随时中断AI回复生成过程
- **重新生成**: 重新生成最后一条AI回复
- **思考过程**: 显示AI的推理思考过程（可折叠查看）
- **流式输出**: 实时显示AI回复内容，提升交互体验

### 📎 文件支持
- **文档上传**: 支持 Word (.docx) 和纯文本 (.txt) 文档
- **表格处理**: 支持 Excel (.xlsx, .xls) 文件解析
- **文件预览**: 内置文件内容预览功能，支持模态框查看
- **附件管理**: 消息中显示文件附件信息和预览按钮
- **文件信息**: 显示文件大小、类型和修改时间

### 🎙️ 语音交互
- **语音输入**: 支持浏览器原生语音识别功能
- **实时转录**: 语音实时转换为文字输入
- **语音状态**: 显示语音识别状态和错误提示

### 🎨 用户体验
- **深色/浅色主题**: 支持主题切换，现代化UI设计
- **响应式设计**: 完美适配桌面端和移动端
- **智能侧边栏**: 支持折叠/展开，移动端自动适配
- **移动端优化**: 触摸友好的交互设计和布局
- **语法高亮**: 代码块语法高亮显示（基于highlight.js）

- **Markdown渲染**: 完整的Markdown格式支持（基于marked）
- **欢迎界面**: 新对话时显示示例问题和引导

### 🔧 实用工具
- **消息复制**: 一键复制AI回复内容
- **对话清空**: 清空当前对话内容
- **批量操作**: 清空所有对话记录
- **本地存储**: 数据完全本地保存，保护用户隐私
- **数据持久化**: 自动保存对话状态和用户设置

## 🛠️ 技术栈

### 前端框架
- **Vue 3.5.17**: 现代化的渐进式JavaScript框架
- **Vue CLI 5.0**: 官方脚手架工具和构建系统
- **Vue Router 4.5.1**: 官方路由管理器
- **Pinia 3.0.3**: 现代化的状态管理库

### UI 和样式
- **原生CSS**: 自定义样式设计，支持CSS变量
- **响应式布局**: Flexbox 和 Grid 布局系统
- **主题系统**: CSS变量实现深色/浅色主题切换
- **图标**: 内置SVG图标和Emoji图标系统
- **现代化设计**: 渐变背景、阴影效果、动画过渡

### 数据处理与API
- **Axios 1.10.0**: HTTP客户端，用于GLM API调用
- **OpenAI SDK 5.11.0**: DeepSeek API调用和流式响应处理
- **Marked 16.1.1**: Markdown解析和渲染
- **Highlight.js**: 代码语法高亮显示

- **Mammoth 1.9.1**: Word文档(.docx)解析
- **XLSX 0.18.5**: Excel文件(.xlsx/.xls)处理

### 开发工具
- **Babel**: JavaScript编译和转换
- **ESLint**: 代码质量检查和格式化
- **Core-js 3.8.3**: JavaScript标准库polyfill


## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run serve
```
应用将在 `http://localhost:8080` 启动

### 生产环境构建
```bash
npm run build
```
构建文件将生成在 `dist/` 目录

### 代码检查
```bash
npm run lint
```

## ⚙️ 配置说明

### API 配置
在 `src/api/chat.js` 中配置AI模型的API密钥：

```javascript
// DeepSeek 配置
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'your-deepseek-api-key', // 替换为你的API密钥
  dangerouslyAllowBrowser: true
});

// GLM-4-Flash 配置
const GLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const GLM_API_KEY = "your-glm-api-key"; // 替换为你的API密钥
```

### 支持的文件格式
应用支持以下文件类型的上传和解析：
- **Word文档**: .doc, .docx
- **Excel表格**: .xls, .xlsx
- **纯文本**: .txt

### 浏览器兼容性
- 支持现代浏览器（Chrome、Firefox、Safari、Edge）
- 语音输入功能需要浏览器支持Web Speech API
- 建议使用最新版本的浏览器以获得最佳体验

## 📁 项目结构

```
chat/
├── .gitignore             # Git忽略文件配置
├── .trae/                 # Trae IDE配置
│   └── .ignore
├── README.md              # 项目文档
├── babel.config.js        # Babel编译配置
├── jsconfig.json          # JavaScript项目配置
├── netlify.toml           # Netlify部署配置
├── package.json           # 项目依赖和脚本
├── package-lock.json      # 依赖版本锁定
├── vue.config.js          # Vue CLI配置
├── public/                # 静态资源目录
│   ├── _redirects         # 路由重定向配置
│   ├── favicon.ico        # 网站图标
│   └── index.html         # HTML模板
└── src/                   # 源代码目录
    ├── App.vue            # 根组件
    ├── main.js            # 应用入口文件
    ├── api/               # API接口层
    │   └── chat.js        # AI模型API调用逻辑
    ├── assets/            # 静态资源
    └── components/        # Vue组件
        ├── ChatContainer.vue  # 主聊天界面组件
        ├── Sidebar.vue        # 侧边栏组件
        └── test.vue           # 测试组件
```

## 🎯 核心组件说明

### App.vue - 应用根组件
- **对话管理**: 管理多个对话会话的创建、切换、删除
- **数据持久化**: 自动保存对话数据到localStorage
- **状态管理**: 管理当前对话索引、生成状态、主题模式
- **事件协调**: 协调各组件间的数据传递和事件处理
- **标题管理**: 处理对话标题的自动生成和手动更新
- **导出功能**: 支持单个对话和全部对话的JSON格式导出

### ChatContainer.vue - 主聊天界面
- **消息渲染**: 支持Markdown、代码高亮
- **流式输出**: 实时显示AI回复的流式内容
- **文件处理**: 支持Word、Excel、文本文件的上传和预览
- **语音输入**: 集成浏览器语音识别API
- **模型切换**: 动态切换AI模型（DeepSeek/GLM-4-Flash）
- **主题切换**: 深色/浅色主题切换功能
- **消息操作**: 复制、重新生成、删除消息功能
- **思考过程**: 显示和折叠AI的推理思考过程
- **统计信息**: 显示每条回复的耗时、Token消耗等统计数据
- **欢迎界面**: 新对话时的引导界面和示例问题

### Sidebar.vue - 侧边栏组件
- **对话列表**: 显示所有对话，按更新时间排序
- **搜索功能**: 通过关键词搜索历史对话
- **对话操作**: 重命名、删除、切换对话
- **响应式设计**: 支持折叠/展开，移动端自适应
- **批量操作**: 清空所有对话、导出功能
- **状态管理**: 保存侧边栏折叠状态到localStorage
- **移动端优化**: 遮罩层和触摸友好的交互设计

### chat.js - API接口层
- **多模型支持**: 集成DeepSeek和GLM-4-Flash API
- **流式响应**: 处理AI模型的流式输出
- **请求管理**: 支持请求取消和错误处理
- **Token统计**: 收集和返回API调用的Token使用情况
- **标题生成**: 基于对话内容自动生成对话标题







