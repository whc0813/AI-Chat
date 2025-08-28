# AI 聊天应用

一个基于 Vue 3 的现代化 AI 聊天应用，支持多种 AI 模型对话，具备丰富的功能和优雅的用户界面。支持 DeepSeek 和 GLM 系列模型，提供流式对话、文件处理、语音输入等强大功能。

## ✨ 主要功能

### 🤖 多模型支持
- **DeepSeek-Chat**: 强大的通用对话模型，擅长推理和创作
- **DeepSeek-Reasoner**: 专业推理模型，具备强大的逻辑思维能力，支持思考过程展示
- **GLM-4-Flash**: 智谱AI的快速响应模型，适合日常对话和简单任务
- **模型切换**: 在对话过程中随时切换AI模型，支持下拉选择器
- **模型统计**: 显示每条回复的耗时、Token消耗和使用模型
- **深度思考模式**: DeepSeek-Reasoner 模型支持展示详细的推理思考过程

### 💬 对话管理
- **多对话支持**: 创建和管理多个独立对话会话
- **对话历史**: 自动保存所有对话记录到本地存储（localStorage）
- **对话搜索**: 通过关键词快速搜索历史对话内容
- **对话重命名**: 双击标题或使用重命名按钮自定义对话名称
- **智能标题**: 基于对话内容自动生成有意义的标题
- **导出功能**: 支持导出对话为JSON、Markdown、HTML和图片格式
- **批量操作**: 支持清空所有对话、导出所有对话

### 🎛️ 生成控制
- **停止生成**: 随时中断AI回复生成过程（支持AbortController）
- **重新生成**: 重新生成最后一条AI回复
- **思考过程**: 显示AI的推理思考过程（DeepSeek-Reasoner模型特有，可折叠查看）
- **流式输出**: 实时显示AI回复内容，提升交互体验
- **参数配置**: 支持自定义Temperature、Top-P、Max Tokens等生成参数
- **消息操作**: 支持复制、引用、删除消息功能

### 📎 文件支持
- **文档上传**: 支持 Word (.doc, .docx) 和纯文本 (.txt) 文档
- **表格处理**: 支持 Excel (.xlsx, .xls) 文件解析和内容提取
- **文件预览**: 内置文件内容预览功能，支持模态框查看完整内容
- **附件管理**: 消息中显示文件附件信息和预览按钮
- **文件信息**: 显示文件大小、类型和修改时间
- **拖拽上传**: 支持文件拖拽上传到输入区域
- **文件解析**: 使用 Mammoth.js 解析 Word 文档，XLSX.js 处理 Excel 文件

### 🎙️ 语音交互
- **语音输入**: 支持浏览器原生Web Speech API语音识别
- **实时转录**: 语音实时转换为文字输入到聊天框
- **语音状态**: 显示语音识别状态和错误提示
- **语音按钮**: 专用语音输入按钮，支持开始/停止录音

### 🎨 用户体验
- **深色/浅色主题**: 支持主题切换，现代化UI设计，使用CSS变量实现
- **响应式设计**: 完美适配桌面端和移动端，支持触摸操作
- **智能侧边栏**: 支持折叠/展开，移动端自动适配，显示对话数量
- **移动端优化**: 触摸友好的交互设计和布局，移动端遮罩层
- **语法高亮**: 代码块语法高亮显示（基于highlight.js）
- **Markdown渲染**: 完整的Markdown格式支持（基于markdown-it）
- **欢迎界面**: 新对话时显示欢迎信息和使用指导
- **DeepSeek风格输入**: 现代化的输入区域设计，支持多功能按钮
- **加载动画**: 生成过程中的视觉反馈和状态提示

### 🔧 实用工具
- **消息复制**: 一键复制AI回复内容到剪贴板
- **消息引用**: 引用之前的消息内容进行回复
- **分享对话**: 支持分享对话链接和导出功能
- **设置面板**: 完整的API密钥和参数配置界面
- **对话清空**: 清空当前对话内容
- **批量操作**: 清空所有对话记录
- **本地存储**: 数据完全本地保存，保护用户隐私
- **数据持久化**: 自动保存对话状态和用户设置

## 🛠️ 技术栈

### 前端框架
- **Vue 3.2.13**: 现代化的渐进式JavaScript框架，使用Composition API
- **Vue CLI 5.0**: 官方脚手架工具和构建系统

### UI 和样式
- **原生CSS**: 自定义样式设计，支持CSS变量和现代CSS特性
- **响应式布局**: Flexbox 和 Grid 布局系统，完美适配移动端
- **主题系统**: CSS变量实现深色/浅色主题切换，支持系统主题检测
- **图标**: 内置SVG图标和Emoji图标系统
- **现代化设计**: 渐变背景、阴影效果、动画过渡、毛玻璃效果

### 数据处理与API
- **Axios 1.11.0**: HTTP客户端，用于GLM API调用和文件上传
- **OpenAI SDK 5.12.2**: DeepSeek API调用和流式响应处理，支持浏览器环境
- **Markdown-it 14.1.0**: Markdown解析和渲染，支持扩展语法
- **Highlight.js 11.11.1**: 代码语法高亮显示，支持多种编程语言
- **Mammoth 1.10.0**: Word文档(.docx)解析和HTML转换
- **XLSX 0.18.5**: Excel文件(.xlsx/.xls)处理和数据提取
- **Marked 16.1.2**: 备用Markdown解析器

### 导出功能
- **HTML2Canvas 1.4.1**: 将对话导出为图片格式
- **jsPDF 3.0.1**: PDF文档生成和导出
- **DOCX 8.5.0**: Word文档生成和导出

### 开发工具
- **Babel**: JavaScript编译和转换，支持最新ES特性
- **ESLint**: 代码质量检查和格式化
- **Core-js 3.8.3**: JavaScript标准库polyfill，确保浏览器兼容性


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
- 在侧边栏底部点击"⚙️ 设置"，打开设置模态框
- 填入：
  - DeepSeek API Key（localStorage 键：deepseek_api_key）
  - GLM API Key（localStorage 键：glm_api_key）
- 配置AI参数：
  - Max Tokens：控制AI回复的最大长度（1-64000）
  - Temperature：控制回复的随机性和创造性（0.01-2.0）
  - Top P：控制词汇选择的多样性（0.01-0.99）
- 点击"保存"，密钥和参数将安全保存在浏览器本地（仅当前设备可用）

首次调用前，如果未配置密钥，应用会提示先前往设置页面填写。

### API 配置（源码层）
在 `src/api/chat.js` 中可以看到集成的 API 端点与调用方式：
- **DeepSeek**：通过 OpenAI SDK 初始化客户端，`baseURL: https://api.deepseek.com`，并启用 `dangerouslyAllowBrowser: true`
- **GLM-4-Flash**：使用 `fetch` 调用 `https://open.bigmodel.cn/api/paas/v4/chat/completions`，开启 `stream: true` 获取SSE流式结果
- **请求管理**：支持 AbortController 取消请求，避免重复调用
- **Token统计**：自动收集和返回输入/输出/总计Token使用情况

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
- **对话管理**: 管理多个对话会话的创建、切换、删除，支持智能标题生成
- **数据持久化**: 自动保存对话数据到 localStorage，包括消息、设置和状态
- **状态管理**: 管理当前对话索引、生成状态、主题模式、深度思考模式
- **事件协调**: 协调各组件间的数据传递和事件处理
- **文件处理**: 集成文件上传、预览和解析功能
- **DeepSeek风格输入**: 现代化输入区域，支持文件拖拽、语音输入、深度思考切换
- **导出功能**: 支持单个对话导出（JSON/Markdown/HTML/图片）与全部对话导出（JSON）
- **设置面板**: 打开/关闭 API 密钥和参数设置模态框

### ChatContainer.vue - 主聊天界面
- **消息渲染**: 支持 Markdown、代码高亮（markdown-it + highlight.js）
- **流式输出**: 实时显示 AI 回复内容，支持思考过程和答案分离
- **模型切换**: 动态切换 AI 模型（DeepSeek-Chat / DeepSeek-Reasoner / GLM-4-Flash）
- **主题切换**: 深色/浅色主题切换功能，支持系统主题检测
- **消息操作**: 复制、重新生成、引用、删除消息
- **思考过程**: DeepSeek-Reasoner 输出 reasoning_content 时展示（可折叠）
- **统计信息**: 显示每条回复的耗时、Token 消耗与使用模型
- **分享导出**: 导出为 JSON、Markdown、HTML、图片
- **欢迎界面**: 新对话时显示欢迎信息和使用指导
- **移动端适配**: 完整的移动端交互支持

### Sidebar.vue - 侧边栏组件
- **对话列表**: 显示所有对话，按更新时间排序，支持实时搜索过滤
- **搜索功能**: 通过关键词搜索历史对话内容
- **对话操作**: 重命名、删除、切换对话，支持键盘快捷键
- **响应式设计**: 支持折叠/展开，移动端自适应，显示对话数量
- **批量操作**: 清空所有对话、导出所有对话
- **设置入口**: 打开 API 密钥和参数设置模态框
- **移动端优化**: 遮罩层、触摸友好的交互设计

### SettingsModal.vue - 设置模态框
- **API密钥管理**: 安全配置 DeepSeek 和 GLM API 密钥
- **参数配置**: 自定义 Max Tokens、Temperature、Top P 等生成参数
- **本地存储**: 密钥和参数安全保存在浏览器本地
- **参数说明**: 提供详细的参数说明和推荐值
- **表单验证**: 输入范围验证和错误提示

### chat.js - API接口层
- **多模型支持**: DeepSeek（OpenAI SDK）与 GLM-4-Flash（Fetch + SSE）
- **流式响应**: 统一流式回调 onChunk，区分思考过程和答案内容
- **请求管理**: 支持请求取消（AbortController），避免重复调用
- **Token统计**: 自动收集并返回 input/output/total token 使用情况
- **参数配置**: 支持从 localStorage 读取用户自定义参数
- **错误处理**: 完善的错误处理和用户友好的错误提示
- **标题生成**: 基于对话内容自动生成有意义的标题







