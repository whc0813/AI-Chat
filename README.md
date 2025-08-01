# AI 聊天应用

一个基于 Vue 3 的现代化 AI 聊天应用，支持多种 AI 模型对话，具备丰富的功能和优雅的用户界面。

## ✨ 主要功能

### 🤖 多模型支持
- **DeepSeek Chat**: 高质量的对话模型
- **GLM-4-Flash**: 智谱AI的快速响应模型
- 支持模型间无缝切换

### 💬 对话管理
- **多对话支持**: 创建和管理多个独立对话
- **对话历史**: 自动保存所有对话记录
- **智能标题**: 基于对话内容自动生成标题
- **对话排序**: 按最近更新时间排序
- **导出功能**: 支持导出单个或全部对话

### 🎛️ 生成控制
- **停止生成**: 随时中断AI回复
- **重新生成**: 重新生成最后一条AI回复
- **思考过程**: 显示AI的思考过程（可折叠）

### 📎 文件支持
- **文档上传**: 支持 Word (.docx) 文档
- **表格处理**: 支持 Excel (.xlsx) 文件
- **文件预览**: 内置文件内容预览功能
- **附件管理**: 消息中显示文件附件信息

### 🎨 用户体验
- **深色/浅色主题**: 支持主题切换，优化按钮可见性
- **响应式设计**: 适配不同屏幕尺寸，移动端优化
- **智能侧边栏**: PC端折叠按钮图标显示，移动端自动关闭
- **移动端优化**: 按钮对称布局，触摸友好的交互设计
- **流式输出**: 实时显示AI回复
- **语法高亮**: 代码块语法高亮显示
- **数学公式**: 支持 LaTeX 数学公式渲染
- **Markdown渲染**: 完整的Markdown格式支持

### 🔧 实用工具
- **消息复制**: 一键复制AI回复内容
- **消息删除**: 删除不需要的消息
- **对话清空**: 清空当前对话
- **批量操作**: 清空所有对话
- **本地存储**: 数据本地保存，隐私安全

## 🛠️ 技术栈

### 前端框架
- **Vue 3**: 现代化的渐进式JavaScript框架
- **Vue CLI**: 官方脚手架工具

### UI 和样式
- **原生CSS**: 自定义样式设计
- **响应式布局**: Flexbox 和 Grid
- **主题系统**: CSS变量实现主题切换
- **图标**: SVG图标系统

### 数据处理
- **Axios**: HTTP客户端
- **OpenAI SDK**: DeepSeek API调用
- **Marked**: Markdown解析
- **Highlight.js**: 代码语法高亮
- **KaTeX**: 数学公式渲染
- **Mammoth**: Word文档解析
- **XLSX**: Excel文件处理

### 开发工具
- **ESLint**: 代码质量检查
- **Babel**: JavaScript编译
- **Vue DevTools**: 开发调试

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
const GLM_API_KEY = "your-glm-api-key"; // 替换为你的API密钥
```

### 环境变量
可以创建 `.env` 文件来管理环境变量：
```
VUE_APP_DEEPSEEK_API_KEY=your-deepseek-api-key
VUE_APP_GLM_API_KEY=your-glm-api-key
```

## 📁 项目结构

```
chat/
├── public/                 # 静态资源
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── api/               # API接口
│   │   └── chat.js        # AI模型API调用
│   ├── assets/            # 静态资源
│   ├── components/        # Vue组件
│   │   ├── ChatContainer.vue  # 主聊天界面
│   │   └── Sidebar.vue        # 侧边栏
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── dist/                  # 构建输出目录
├── package.json           # 项目配置
├── vue.config.js          # Vue CLI配置
├── babel.config.js        # Babel配置
└── README.md              # 项目文档
```

## 🎯 核心组件说明

### App.vue
- 应用根组件
- 管理对话列表和当前对话
- 处理对话切换、创建、删除
- 数据持久化到localStorage

### ChatContainer.vue
- 主聊天界面组件
- 消息显示和输入
- AI生成控制（暂停/继续/停止）
- 文件上传和预览
- 主题切换
- Markdown和代码渲染

### Sidebar.vue
- 侧边栏组件
- 对话列表管理
- 新建对话
- 导出功能
- 批量操作







