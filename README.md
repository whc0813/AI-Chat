# AI 聊天应用

一个基于 Vue 3 的现代化 AI 聊天应用，支持多种 AI 模型对话，具备丰富的功能和优雅的用户界面。

## ✨ 主要功能

### 🤖 多模型支持
- **DeepSeek-V3**: 强大的通用对话模型，擅长推理和创作
- **DeepSeek-R1**: 专业推理模型，具备强大的逻辑思维能力，支持思考过程展示
- **GLM-4-Flash**: 智谱AI的快速响应模型，适合日常对话和简单任务
- **模型切换**: 在对话过程中随时切换AI模型
- **模型统计**: 显示每条回复的耗时、Token消耗和使用模型

### 💬 对话管理
- **多对话支持**: 创建和管理多个独立对话会话
- **对话历史**: 自动保存所有对话记录到本地存储
- **对话搜索**: 通过关键词快速搜索历史对话
- **对话重命名**: 双击标题或使用重命名按钮自定义对话名称
- **导出功能**: 支持导出对话为JSON、Markdown、HTML和图片格式

### 🎛️ 生成控制
- **停止生成**: 随时中断AI回复生成过程
- **重新生成**: 重新生成最后一条AI回复
- **思考过程**: 显示AI的推理思考过程（DeepSeek-R1模型特有，可折叠查看）
- **流式输出**: 实时显示AI回复内容，提升交互体验
- **回复风格**: 支持四种回复风格（简洁、平衡、详细、创意），可调节温度参数

### 📎 文件支持
- **文档上传**: 支持 Word (.doc, .docx) 和纯文本 (.txt) 文档
- **表格处理**: 支持 Excel (.xlsx, .xls) 文件解析
- **文件预览**: 内置文件内容预览功能，支持模态框查看
- **附件管理**: 消息中显示文件附件信息和预览按钮
- **文件信息**: 显示文件大小、类型和修改时间

### 🎙️ 语音交互
- **语音输入**: 支持浏览器原生Web Speech API语音识别
- **实时转录**: 语音实时转换为文字输入
- **语音状态**: 显示语音识别状态和错误提示

### 🎨 用户体验
- **深色/浅色主题**: 支持主题切换，现代化UI设计
- **响应式设计**: 完美适配桌面端和移动端
- **智能侧边栏**: 支持折叠/展开，移动端自动适配
- **移动端优化**: 触摸友好的交互设计和布局
- **语法高亮**: 代码块语法高亮显示（基于highlight.js）
- **Markdown渲染**: 完整的Markdown格式支持（基于markdown-it）
- **欢迎界面**: 新对话时显示示例问题和引导

### 🔧 实用工具
- **消息复制**: 一键复制AI回复内容
- **对话清空**: 清空当前对话内容
- **批量操作**: 清空所有对话记录
- **本地存储**: 数据完全本地保存，保护用户隐私
- **数据持久化**: 自动保存对话状态和用户设置

## 🛠️ 技术栈

### 前端框架
- **Vue 3.2.13**: 现代化的渐进式JavaScript框架
- **Vue CLI 5.0**: 官方脚手架工具和构建系统

### UI 和样式
- **原生CSS**: 自定义样式设计，支持CSS变量
- **响应式布局**: Flexbox 和 Grid 布局系统
- **主题系统**: CSS变量实现深色/浅色主题切换
- **图标**: 内置SVG图标和Emoji图标系统
- **现代化设计**: 渐变背景、阴影效果、动画过渡

### 数据处理与API
- **Axios 1.11.0**: HTTP客户端，用于GLM API调用
- **OpenAI SDK 5.12.2**: DeepSeek API调用和流式响应处理
- **Markdown-it 14.1.0**: Markdown解析和渲染
- **Highlight.js 11.11.1**: 代码语法高亮显示
- **Mammoth 1.10.0**: Word文档(.docx)解析
- **XLSX 0.18.5**: Excel文件(.xlsx/.xls)处理

### 导出功能
- **HTML2Canvas 1.4.1**: 将对话导出为图片
- **jsPDF 3.0.1**: PDF文档生成和导出

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

### API 密钥配置（推荐方式）
应用内置设置面板用于配置 API 密钥：
- 在侧边栏底部点击“设置”，打开设置模态框
- 填入：
  - DeepSeek API Key（localStorage 键：deepseek_api_key）
  - GLM API Key（localStorage 键：glm_api_key）
- 点击“保存”，密钥将安全保存在浏览器本地（仅当前设备可用）

首次调用前，如果未配置密钥，应用会提示先前往设置页面填写。

### API 配置（源码层）
在 `src/api/chat.js` 中可以看到集成的 API 端点与调用方式：
- DeepSeek：通过 OpenAI SDK 初始化客户端，`baseURL: https://api.deepseek.com`，并启用 `dangerouslyAllowBrowser: true`
- GLM-4-Flash：使用 `fetch` 调用 `https://open.bigmodel.cn/api/paas/v4/chat/completions`，开启 `stream: true` 获取SSE流式结果

### 支持的文件格式
应用支持以下文件类型的上传和解析：
- **Word文档**: .doc, .docx
- **Excel表格**: .xls, .xlsx
- **纯文本**: .txt

### 浏览器兼容性
- 支持现代浏览器（Chrome、Firefox、Safari、Edge）
- 语音输入功能需要浏览器支持 Web Speech API
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
        └── SettingsModal.vue  # 设置模态框（API 密钥配置）
```

## 🎯 核心组件说明

### App.vue - 应用根组件
- **对话管理**: 管理多个对话会话的创建、切换、删除
- **数据持久化**: 自动保存对话数据到 localStorage
- **状态管理**: 管理当前对话索引、生成状态、主题模式
- **事件协调**: 协调各组件间的数据传递和事件处理
- **导出功能**: 支持单个对话导出（JSON/Markdown/HTML/图片）与全部对话导出（JSON）
- **设置面板**: 打开/关闭 API 密钥设置模态框

### ChatContainer.vue - 主聊天界面
- **消息渲染**: 支持 Markdown、代码高亮（markdown-it + highlight.js）
- **流式输出**: 实时显示 AI 回复内容
- **文件处理**: 支持 Word、Excel、文本文件的上传和预览（含模态框与HTML预览）
- **语音输入**: 集成浏览器语音识别 API
- **模型切换**: 动态切换 AI 模型（DeepSeek-V3 / DeepSeek-R1 / GLM-4-Flash）
- **主题切换**: 深色/浅色主题切换功能
- **消息操作**: 复制、重新生成、删除消息
- **思考过程**: DeepSeek-R1 输出 reasoning_content 时展示（可折叠）
- **统计信息**: 显示每条回复的耗时、Token 消耗与模型
- **分享导出**: 导出为 JSON、Markdown、HTML、图片

### Sidebar.vue - 侧边栏组件
- **对话列表**: 显示所有对话，按更新时间排序
- **搜索功能**: 通过关键词搜索历史对话
- **对话操作**: 重命名、删除、切换对话
- **响应式设计**: 支持折叠/展开，移动端自适应
- **批量操作**: 清空所有对话、导出所有对话
- **设置入口**: 打开 API 密钥设置模态框

### chat.js - API接口层
- **多模型支持**: DeepSeek（OpenAI SDK）与 GLM-4-Flash（SSE 流）
- **流式响应**: 统一流式回调 onChunk，区分思考/答案段落
- **请求管理**: 支持请求取消（AbortController）
- **Token统计**: 汇总并返回 input/output/total token 使用
- **回复风格**: 提供简洁/平衡/详细/创意四种风格预设







