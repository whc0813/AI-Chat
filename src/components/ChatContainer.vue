<template>
  <div class="chat-wrapper">
     <div class="chat-title">
      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="toggleSidebar">
        <span class="menu-icon">☰</span>
      </button>
      
      
      <!-- 模型选择器 -->
      <div class="title-model-selector" ref="modelSelector" @click="toggleModelDropdown" :class="{ 'open': showModelDropdown }">
        <div class="current-model">
          <div class="model-icon">{{ getModelIcon(selectedModel) }}</div>
          <div class="model-info">
            <div class="model-name">{{ getModelName(selectedModel) }}</div>
          </div>
          <div class="dropdown-arrow">{{ showModelDropdown ? '▲' : '▼' }}</div>
        </div>
        
        <div v-if="showModelDropdown" class="model-dropdown">
          <div 
            v-for="model in availableModels" 
            :key="model.value"
            class="model-option"
            :class="{ 'selected': selectedModel === model.value }"
            @click.stop="selectModel(model.value)"
          >
            <div class="model-icon">{{ model.icon }}</div>
            <div class="model-details">
              <div class="model-name">{{ model.name }}</div>
              <div class="model-description">{{ model.description }}</div>
            </div>
            <div v-if="selectedModel === model.value" class="check-icon">✓</div>
          </div>
        </div>
      </div>
      
      <span
        class="title-text"
        v-if="!isRenaming"
        @dblclick="startRenaming"
      >{{ displayTitle || currentTitle || "新对话" }}</span>

      <div v-else class="title-edit-container">
        <input
          ref="titleInput"
          v-model="newTitle"
          @keyup.enter="saveTitle"
          @blur="saveTitle"
          class="title-input"
          maxlength="50"
        />

      </div>
      <button class="share-btn" @click.stop="openShareModal" title="分享对话">
        <span class="share-icon">📤</span>
      </button>
      <button class="theme-toggle-btn" @click.stop="toggleTheme">
        <span class="theme-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
      </button>
    </div>
  <div class="chat-container">
    <div class="chat-messages" ref="chatMessages">
      <!-- 新对话欢迎界面 -->
      <div v-if="messages.length === 0" class="welcome-container">
        <div class="welcome-content">
          <div class="welcome-header">
            <div class="welcome-logo">🤖</div>
            <h1 class="welcome-title">AI 智能助手</h1>
          </div>
          
          <div class="example-questions">
            <div class="example-grid">
              <div class="example-item" @click="sendExampleQuestion('解释一下机器学习和深度学习的区别')">
                解释一下机器学习和深度学习的区别
              </div>
              <div class="example-item" @click="sendExampleQuestion('创作一首关于春天的现代诗')">
                创作一首关于春天的现代诗
              </div>
              <div class="example-item" @click="sendExampleQuestion('帮我写一个Python函数来计算斐波那契数列')">
                帮我写一个Python函数来计算斐波那契数列
              </div>
              <div class="example-item" @click="sendExampleQuestion('帮我制定一个学习计划来提升编程技能')">
                帮我制定一个学习计划来提升编程技能
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-for="(message, index) in messages" :key="message.id" :class="['message', message.role]">
        <div v-if="message.type === 'combined' && message.thinking" class="thinking-content"> 
          <div class="thinking-header" @click="toggleThinking(index)"> 
            <span>思考过程：</span> 
            <span class="toggle-icon">{{ isThinkingExpanded(index) ? '▼' : '▶' }}</span> 
          </div> 
          <div class="thinking-text" v-if="isThinkingExpanded(index)" v-html="renderMarkdown(message.thinking)"></div> 
        </div> 

        <div class="plain-content" v-if="message.role === 'user'" v-text="message.content"></div> 
        <div class="plain-content" v-else v-html="renderMarkdown(message.content)"></div>

        <div v-if="message.attachment" class="message-attachment-info" @click="openFilePreview(message.attachment)">
            <span class="file-icon">{{ getFileIcon(message.attachment.name) }}</span>
            <span>{{ message.attachment.name }}</span>
            <span class="preview-hint">点击预览</span>
        </div>

        <!-- 模型调用统计信息 -->
        <div v-if="message.role === 'assistant' && message.stats" class="message-stats">
          <div class="stats-container">
            <div class="stats-item">
              <span class="stats-icon">⏱️</span>
              <span class="stats-label">耗时:</span>
              <span class="stats-value">{{ formatDuration(message.stats.duration) }}</span>
            </div>
            <div class="stats-item" v-if="message.stats.tokens">
              <span class="stats-icon">🔢</span>
              <span class="stats-label">Token:</span>
              <span class="stats-value">{{ message.stats.tokens.total || 'N/A' }}</span>
              <span class="stats-detail" v-if="message.stats.tokens.input && message.stats.tokens.output">
                (输入: {{ message.stats.tokens.input }}, 输出: {{ message.stats.tokens.output }})
              </span>
            </div>
            <div class="stats-item">
              <span class="stats-icon">{{ getModelIcon(message.stats.model) }}</span>
              <span class="stats-label">模型:</span>
              <span class="stats-value">{{ getModelName(message.stats.model) }}</span>
            </div>
          </div>
        </div>

        <!-- 用户消息操作按钮 -->
        <div v-if="message.role === 'user'" class="message-actions">
          <button class="action-btn" @click="quoteMessage(message)" title="引用">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
            </svg>
          </button>
        </div>
        
        <!-- 助手消息操作按钮 -->
        <div v-if="message.role === 'assistant'" class="message-actions">
          <button class="action-btn" @click="copyMessage(message.content,$event)" title="复制">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="action-btn" @click="quoteMessage(message)" title="引用">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
            </svg>
          </button>
          <button v-if="isLastAssistantMessage(index)" class="action-btn" @click="regenerateContent" title="重新生成">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M8 16H3v5"></path>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="isStreaming" class="message assistant">
        <div v-if="currentThinking" class="thinking-content">
          <div class="thinking-header" @click="toggleCurrentThinking">
            <span>思考过程：</span>
            <span class="toggle-icon">{{ isCurrentThinkingExpanded ? '▼' : '▶' }}</span>
          </div>
          <div class="thinking-text" v-if="isCurrentThinkingExpanded" v-html="renderMarkdown(currentThinking)">
          </div>
        </div>
        <div v-if="currentAnswer" class="plain-content" v-html="renderMarkdown(currentAnswer)">
        </div>
        <div v-if="!currentAnswer && !currentThinking" class="loading-indicator">
          正在生成回复...
        </div>
      </div>
      </div>
    </div>


  </div>
  
  <!-- 文件预览模态框 -->
  <div v-if="showPreviewModal" class="preview-modal-overlay" @click="closeFilePreview">
    <div class="preview-modal" @click.stop>
      <div class="preview-modal-header">
        <h3>{{ previewModalFile?.name }}</h3>
        <button class="close-btn" @click="closeFilePreview">×</button>
      </div>
      
      <div class="preview-modal-content">
        <!-- 加载状态 -->
        <div v-if="isLoadingModalPreview" class="modal-loading">
          <span>正在加载预览...</span>
        </div>
        
        <!-- 错误状态 -->
        <div v-else-if="modalPreviewError" class="modal-error">
          <span>{{ modalPreviewError }}</span>
        </div>
        
        <!-- 文本内容预览 -->
        <div v-else-if="previewModalContent" class="modal-text-preview">
          <pre>{{ previewModalContent }}</pre>
        </div>
        
        <!-- 文件内容 -->
        <div v-else class="modal-text-preview">
          <pre>{{ previewModalFile?.fileText || '文件内容不可用' }}</pre>
        </div>
      </div>
    </div>
  </div>
  
  <!-- HTML预览模态框 -->
  <div v-if="showHtmlPreviewModal" class="preview-modal-overlay" @click="closeHtmlPreview">
    <div class="html-preview-modal" @click.stop>
      <div class="preview-modal-header">
        <h3>HTML预览</h3>
        <button class="close-btn" @click="closeHtmlPreview">×</button>
      </div>
      
      <div class="html-preview-content">
        <iframe 
          :srcdoc="htmlPreviewContent" 
          class="html-preview-iframe"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </div>
    </div>
  </div>

  <!-- 分享模态框 -->
  <div v-if="showShareModal" class="preview-modal-overlay" @click="closeShareModal">
    <div class="share-modal" @click.stop>
      <div class="preview-modal-header">
        <h3>分享对话</h3>
        <button class="close-btn" @click="closeShareModal">×</button>
      </div>
      
      <div class="share-modal-content">
        <div class="share-options">
          <button class="share-option" @click="exportAsJson">
            <span class="share-icon">📄</span>
            <span class="share-text">导出为JSON</span>
          </button>
          <button class="share-option" @click="exportAsMarkdown">
            <span class="share-icon">📝</span>
            <span class="share-text">导出为Markdown</span>
          </button>
          <button class="share-option" @click="exportAsHtml">
            <span class="share-icon">🌐</span>
            <span class="share-text">导出为HTML</span>
          </button>
          <button class="share-option" @click="exportAsTxt">
            <span class="share-icon">📃</span>
            <span class="share-text">导出为TXT</span>
          </button>
          <button class="share-option" @click="exportAsWord">
            <span class="share-icon">📄</span>
            <span class="share-text">导出为Word</span>
          </button>
          <button class="share-option" @click="exportAsImage">
            <span class="share-icon">🖼️</span>
            <span class="share-text">导出为图片</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { chatWithAI, cancelAllRequests } from '../api/chat';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { marked } from 'marked';

export default {
  emits: [
    'send-message',
    'delete-message',
    'clear-chat',
    'model-changed',
    'theme-changed',
    'update-title',
    'toggle-sidebar',
    'generating-changed',
    'input-changed',
    'send-user-message',
    'quote-message'
  ],
  props: {
    messages: {
      type: Array,
      required: true
    },
    currentModel: {
      type: String,
      default: 'deepseek'
    },
    currentTitle: {
      type: String,
      default: ''
    },
    userInput: {
      type: String,
      default: ''
    },
    isGenerating: {
      type: Boolean,
      default: false
    },
    replyStyle: {
      type: String,
      default: 'balanced'
    },
    isDeepThinking: {
      type: Boolean,
      default: false
    }
  },
  data() {
    // 初始化 markdown-it 实例
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(str, { language: lang }).value;
          } catch (err) {
            console.warn('语法高亮失败:', err);
          }
        }
        return hljs.highlightAuto(str).value;
      }
    });

    return {
      selectedModel: this.currentModel === 'deepseek-chat' || this.currentModel === 'deepseek-reasoner' ? 'deepseek' : this.currentModel,
      isStreaming: false,
      currentThinking: '',
      currentAnswer: '',
      streamingUpdateTimer: null,
      // 性能优化：渲染缓存
      _renderCache: new Map(),
      _lastRenderedLength: 0,
      expandedThinking: {},
      isCurrentThinkingExpanded: true,
      requestStartTime: null,
      currentRequestStats: null,
      isDarkMode: false,
      displayTitle: '',
      debounceTimer: null,
      titleClickTimer: null,
      isRenaming: false,
      newTitle: '',
      selectedFile: null,
      filePreviewContent: null,
      isLoadingPreview: false,
      previewError: null,
      showPreviewModal: false,
      previewModalContent: null,
      previewModalFile: null,
      isLoadingModalPreview: false,
      modalPreviewError: null,
      showHtmlPreviewModal: false,
      htmlPreviewContent: '',
      showModelDropdown: false,
      showShareModal: false,
      // markdown-it 实例
      markdownRenderer: md,

      availableModels: [
        {
          value: 'deepseek',
          name: 'DeepSeek',
          description: '强大的通用对话模型，支持深度思考模式',
          icon: '🧠'
        },
        {
          value: 'glm-4-flash',
          name: 'GLM-4-Flash',
          description: '快速响应模型，适合日常对话和简单任务',
          icon: '⚡'
        }
      ]

    };
  },
  computed: {
    isMobile() {
      return window.innerWidth <= 768;
    }
  },
  watch: {
    messages: {
      handler(newMessages, oldMessages) {
        // 避免在流式状态下或初始化时触发
        if (this.isStreaming || this.isGenerating) {
          return;
        }
        
        // 只在消息数量真正变化时处理
        if (!oldMessages || newMessages.length !== oldMessages.length) {
          // 使用requestAnimationFrame确保在下一帧执行，避免递归
          requestAnimationFrame(() => {
            const container = this.$refs.chatMessages;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
            // 重新设置事件监听器以处理新添加的代码块
            this.$nextTick(() => {
              this.setupCopyButtons();
            });
          });
        }
      },
      deep: false,
      immediate: false
    }
  },
  created() {
    const savedTheme = localStorage.getItem('darkMode');
    this.isDarkMode = savedTheme !== null ? JSON.parse(savedTheme) : true;
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    
    // 清理复制按钮事件监听器
    if (this._copyButtonsSetup && this._copyButtonHandler) {
      const messagesContainer = this.$refs.chatMessages;
      if (messagesContainer) {
        messagesContainer.removeEventListener('click', this._copyButtonHandler);
      }
    }
    
    // 清理所有定时器，防止内存泄漏
    if (this.streamingUpdateTimer) {
      clearTimeout(this.streamingUpdateTimer);
      this.streamingUpdateTimer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.titleClickTimer) {
      clearTimeout(this.titleClickTimer);
      this.titleClickTimer = null;
    }
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    
    this._copyButtonsSetup = false;
    this._copyButtonHandler = null;
    
    // 清理渲染缓存
    if (this._renderCache) {
      this._renderCache.clear();
    }
    this._lastRenderedLength = 0;
    

  },
  mounted() {
        // 添加点击外部关闭下拉框的事件监听
        document.addEventListener('click', this.handleClickOutside);
        this.$nextTick(() => {
            this.setupCopyButtons();
            // 移除applyCodeHighlighting - markdown-it已在renderMarkdown中完成语法高亮
        });
        document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
    },
  methods: {
    sendExampleQuestion(question) {
      this.$emit('send-user-message', question);
    },
    
    // 生成唯一ID
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // 消息引用功能
    quoteMessage(message) {
      // 检查是否有选中的文本
      const selection = window.getSelection();
      let contentToQuote = message.content;
      
      if (selection && selection.toString().trim()) {
        // 如果有选中文本，使用选中的内容
        contentToQuote = selection.toString().trim();
      }
      
      this.$emit('quote-message', contentToQuote);
      
      // 清除选择
      if (selection) {
        selection.removeAllRanges();
      }
    },

    isLastAssistantMessage(index) {
      // 找到最后一条助手消息的索引
      const lastAssistantIndex = this.messages.map(m => m.role).lastIndexOf('assistant');
      return index === lastAssistantIndex;
    },

    renderMarkdown(content) {
        if (!content) return '';
        
        // 性能优化：流式渲染时使用缓存和增量更新
        if (this.isStreaming && content === this.currentAnswer) {
            return this._renderStreamingContent(content);
        }
        
        // 非流式渲染：检查缓存
        const cacheKey = content;
        if (this._renderCache.has(cacheKey)) {
            return this._renderCache.get(cacheKey);
        }
        
        try {
            // 使用 markdown-it 渲染
            let html = this.markdownRenderer.render(content);
            
            // 应用自定义代码块样式
            html = html.replace(/<pre><code class="language-(\w+)"([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, lang, attrs, code) => {
                return this._wrapCodeBlock(lang, code);
            }).replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
                return this._wrapCodeBlock('plaintext', code);
            });
            
            // 为表格添加包装器以支持水平滚动
            html = html.replace(/<table([^>]*)>([\s\S]*?)<\/table>/g, (match, attrs, tableContent) => {
                return `<div class="table-wrapper"><table${attrs}>${tableContent}</table></div>`;
            });
            
            // 包装在 markdown-body 类中以应用样式
            const result = `<div class="markdown-body">${html}</div>`;
            
            // 缓存结果（限制缓存大小）
            if (this._renderCache.size > 50) {
                const firstKey = this._renderCache.keys().next().value;
                this._renderCache.delete(firstKey);
            }
            this._renderCache.set(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('Markdown rendering error:', error);
            return '<div class="render-error">内容渲染失败</div>';
        }
    },
    
    // 流式渲染优化：增量更新机制
    _renderStreamingContent(content) {
        const contentLength = content.length;
        
        // 如果内容长度没有显著增加，跳过重新渲染
        if (contentLength - this._lastRenderedLength < 50 && contentLength > 100) {
            // 返回简单的文本包装，避免复杂的Markdown解析
            return `<div class="markdown-body"><div class="streaming-text">${this._escapeHtml(content)}</div></div>`;
        }
        
        // 更新最后渲染长度
        this._lastRenderedLength = contentLength;
        
        // 对于较短的内容或显著增长的内容，进行完整渲染
        try {
            let html = this.markdownRenderer.render(content);
            
            // 简化的样式处理（减少正则表达式操作）
            if (html.includes('<pre><code')) {
                html = html.replace(/<pre><code class="language-(\w+)"([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, lang, attrs, code) => {
                    return this._wrapCodeBlock(lang, code);
                }).replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (match, attrs, code) => {
                    return this._wrapCodeBlock('plaintext', code);
                });
            }
            
            if (html.includes('<table')) {
                html = html.replace(/<table([^>]*)>([\s\S]*?)<\/table>/g, (match, attrs, tableContent) => {
                    return `<div class="table-wrapper"><table${attrs}>${tableContent}</table></div>`;
                });
            }
            
            return `<div class="markdown-body">${html}</div>`;
        } catch (error) {
            console.error('Streaming render error:', error);
            return `<div class="markdown-body"><div class="streaming-text">${this._escapeHtml(content)}</div></div>`;
        }
    },
    
    // HTML转义函数
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    _wrapCodeBlock(language, highlightedCode) {
        const lang = language || 'plaintext';
        const showPreviewBtn = lang.toLowerCase() === 'html';
        
        // 将代码按行分割并添加行号，过滤末尾空行
        const lines = highlightedCode.split('\n');
        // 如果最后一行是空的，则移除它
        if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        const numberedLines = lines.map((line, index) => {
            const lineNumber = index + 1;
            return `<div class="code-line"><span class="line-number">${lineNumber}</span><span class="line-content">${line || ' '}</span></div>`;
        }).join('');
        
        return `
            <div class="code-block-container">
                <div class="code-block-header">
                    <span class="code-language">${lang}</span>
                    <div class="code-actions">
                        ${showPreviewBtn ? '<button class="preview-html-btn">🔍 预览</button>' : ''}
                        <button class="copy-code-btn">
                            📋 Copy
                        </button>
                    </div>
                </div>
                <div class="code-block-wrapper">
                    <div class="line-numbers-column">
                        ${lines.map((_, index) => `<div class="line-number-item">${index + 1}</div>`).join('')}
                    </div>
                    <pre class="custom-code-block"><code class="hljs language-${lang}">${highlightedCode}</code></pre>
                </div>
            </div>
        `;
    },
    setupCopyButtons(retryCount = 0) {
      // 移除旧的事件监听器
      if (this._copyButtonsSetup) {
        const messagesContainer = this.$refs.chatMessages;
        if (messagesContainer && this._copyButtonHandler) {
          messagesContainer.removeEventListener('click', this._copyButtonHandler);
        }
      }
      
      // 使用事件委托，但限制在消息容器内
      const messagesContainer = this.$refs.chatMessages;
      if (!messagesContainer) {
        // 防止无限递归，最多重试5次
        if (retryCount < 5) {
          // 增加延迟，给DOM更多时间渲染
          setTimeout(() => {
            this.setupCopyButtons(retryCount + 1);
          }, 50 * (retryCount + 1)); // 递增延迟
        } else {
          // 静默处理，避免控制台警告
          return;
        }
        return;
      }
      
      // 创建事件处理器
      this._copyButtonHandler = (e) => {
        const copyBtn = e.target.closest('.copy-code-btn');
        const previewBtn = e.target.closest('.preview-html-btn');
        
        if (copyBtn) {
          e.preventDefault();
          e.stopPropagation();
          this.handleCopyCode(copyBtn);
        }
        
        if (previewBtn) {
          e.preventDefault();
          e.stopPropagation();
          this.handlePreviewHtml(previewBtn);
        }
      };
      
      messagesContainer.addEventListener('click', this._copyButtonHandler);
      this._copyButtonsSetup = true;
    },
    
    handleCopyCode(copyBtn) {
      const codeBlock = copyBtn.closest('.code-block-container').querySelector('code');
      if (!codeBlock) {
        console.error('未找到代码块');
        return;
      }
      
      const code = codeBlock.textContent;
      const originalHTML = copyBtn.innerHTML;
      
      // 防止重复点击
      if (copyBtn.disabled) return;
      copyBtn.disabled = true;
      
      // 创建反馈元素
      const feedbackEl = document.createElement('div');
      feedbackEl.className = 'copy-feedback message-feedback';
      
      // 使用相对定位避免页面抖动
      const container = copyBtn.closest('.code-block-container') || copyBtn.parentElement;
      container.style.position = 'relative';
      container.appendChild(feedbackEl);
      
      // 相对于容器定位
      feedbackEl.style.position = 'absolute';
      feedbackEl.style.top = '-45px';
      feedbackEl.style.left = '50%';
      feedbackEl.style.transform = 'translateX(-50%) translateY(15px) scale(0.9)';
      feedbackEl.style.zIndex = '1000';
      
      const onSuccess = () => {
        copyBtn.innerHTML = '✓ 已复制';
        copyBtn.style.background = '#48bb78';
        copyBtn.style.color = 'white';
        copyBtn.style.borderColor = '#48bb78';
        
        feedbackEl.textContent = '✓ 复制成功';
        feedbackEl.classList.add('show', 'success');
        feedbackEl.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        
        setTimeout(() => {
          feedbackEl.classList.remove('show');
          setTimeout(() => {
            if (feedbackEl.parentNode) {
              feedbackEl.remove();
            }
          }, 300);
          
          if (copyBtn.parentNode) {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
            copyBtn.disabled = false;
          }
        }, 2000);
      };
      
      const onError = (err) => {
        console.error('复制失败:', err);
        copyBtn.innerHTML = '✗ 失败';
        copyBtn.style.background = '#f56565';
        copyBtn.style.color = 'white';
        copyBtn.style.borderColor = '#f56565';
        
        feedbackEl.textContent = '✗ 复制失败';
        feedbackEl.classList.add('show', 'error');
        feedbackEl.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        
        setTimeout(() => {
          feedbackEl.classList.remove('show');
          setTimeout(() => {
            if (feedbackEl.parentNode) {
              feedbackEl.remove();
            }
          }, 300);
          
          if (copyBtn.parentNode) {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
            copyBtn.disabled = false;
          }
        }, 2000);
      };
      
      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(onSuccess).catch((error) => {
          console.warn('Clipboard API 失败，尝试备用方法:', error);
          this.fallbackCopyTextToClipboard(code, onSuccess, onError);
        });
      } else {
        this.fallbackCopyTextToClipboard(code, onSuccess, onError);
      }
    },
    
    handlePreviewHtml(previewBtn) {
      const codeBlock = previewBtn.closest('.code-block-container').querySelector('code');
      if (!codeBlock) return;
      
      const htmlCode = codeBlock.textContent;
      this.openHtmlPreview(htmlCode);
    },


    triggerFileUpload() {
        this.$refs.fileInput.click();
    },
    async handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!this.isDocumentFile(file.name)) {
            alert('仅支持上传文档(.doc, .docx)、表格(.xls, .xlsx)和文本(.txt)文件');
            event.target.value = '';
            return;
        }
        
        this.selectedFile = file;
        // 移除自动预览，改为点击时预览
    },
    removeFile() {
        this.selectedFile = null;
        this.filePreviewContent = null;
        this.isLoadingPreview = false;
        this.previewError = null;
        // 清理模态框相关状态
        this.showPreviewModal = false;
        this.previewModalContent = null;
        this.previewModalFile = null;
        this.isLoadingModalPreview = false;
        this.modalPreviewError = null;
        this.$refs.fileInput.value = '';
    },
    // 新的sendMessage方法，供App.vue调用
    async sendMessage(userText, file) {
        if (this.isGenerating) return;
        if (!userText && !file) return;
        
        return await this.handleSend(userText, file);
    },
    
    async handleSend(userText = '', file = null) {
        if (this.isGenerating) return;
        if (!userText && !file) return;

        // 首先检查 API 密钥
        const deepseekKey = localStorage.getItem('deepseek_api_key');
        const glmKey = localStorage.getItem('glm_api_key');
        
        // 如果密钥不存在，提示用户并直接返回，不添加消息到聊天记录
        if (!deepseekKey || !glmKey) {
            alert('请先在设置中配置您的 API 密钥。');
            return;
        }

        // 根据 isDeepThinking 状态决定实际使用的模型
        let actualModel = this.selectedModel;
        if (this.selectedModel === 'deepseek') {
            actualModel = this.isDeepThinking ? 'deepseek-reasoner' : 'deepseek-chat';
        }
        console.log('发送消息 - 选择的模型:', this.selectedModel, '深度思考状态:', this.isDeepThinking, '实际使用模型:', actualModel);

        this.$emit('generating-changed', true);
        this.isStreaming = true;
        this.currentThinking = '';
        this.currentAnswer = '';
        this.isCurrentThinkingExpanded = true;
        
        // 记录请求开始时间
        this.requestStartTime = Date.now();
        this.currentRequestStats = {
            model: actualModel,
            startTime: this.requestStartTime,
            tokens: null
        };
        
        const userMessageForUI = {
            id: this.generateId(),
            role: 'user',
            content: userText,
            type: 'simple',
            attachment: null
        };

        if (file) {
            try {
                const fileText = await this.readFileContent(file);
                userMessageForUI.attachment = {
                    name: file.name,
                    fileText: fileText 
                };
            } catch (e) {
                console.error("文件读取失败:", e);
                this.$emit('generating-changed', false);
                this.isStreaming = false;
                return;
            }
        }

        this.$emit('send-message', userMessageForUI);

        await this.$nextTick();

        try {
            const apiKeys = {
                deepseek: deepseekKey,
                glm: glmKey
            };
            
            const messagesForAPI = this.formatMessagesForAPI(this.messages);
            const result = await chatWithAI(
                messagesForAPI,
                actualModel,
                (content, type) => {
                    if (type === 'thinking') {
                        this.currentThinking += content;
                    } else {
                        this.currentAnswer += content;
                    }
                    
                    // 优化流式更新：使用requestAnimationFrame和防抖
                    if (this.streamingUpdateTimer) {
                        clearTimeout(this.streamingUpdateTimer);
                    }
                    
                    this.streamingUpdateTimer = setTimeout(() => {
                        // 使用requestAnimationFrame确保在浏览器下一帧渲染
                        requestAnimationFrame(() => {
                            // 强制Vue更新，但避免频繁的DOM操作
                            this.$forceUpdate();
                        });
                    }, 100); // 增加到100ms，减少更新频率
                },
                apiKeys,
                this.replyStyle
            );
            
            // 更新Token统计信息
            if (result && result.tokens) {
                this.currentRequestStats.tokens = result.tokens;
            }

            if (this.messages.length === 1) {
                this.generateTitleFromConversation();
            }
            this.addAIMessage();

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('对话出错:', error);
                if (this.currentAnswer || this.currentThinking) {
                    this.addAIMessage();
                } else {
                    this.$emit('send-message', { role: 'assistant', content: '抱歉，我遇到了问题，请稍后再试。', type: 'simple' });
                }
            }
        } finally {
            this.$emit('generating-changed', false);
            this.isStreaming = false;
            
            // 重置渲染状态，确保最终内容完整渲染
            this._lastRenderedLength = 0;
            
            // 清理流式更新定时器
            if (this.streamingUpdateTimer) {
                clearTimeout(this.streamingUpdateTimer);
                this.streamingUpdateTimer = null;
            }
        }
    },
    formatMessagesForAPI(messages) {
        return messages.map(msg => {
            let content = msg.content;
            if (msg.role === 'user' && msg.attachment && msg.attachment.fileText) {
                content = `${msg.content}\n\n--- 文件《${msg.attachment.name}》的附加内容如下 ---\n${msg.attachment.fileText}`;
            }
            return {
                role: msg.role,
                content: content
            };
        });
    },
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const fileName = file.name.toLowerCase();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    if (fileName.endsWith('.docx')) {
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        resolve(result.value);
                    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                        let fullText = '';
                        workbook.SheetNames.forEach(sheetName => {
                            fullText += `--- 表格: ${sheetName} ---\n`;
                            const worksheet = workbook.Sheets[sheetName];
                            const data = XLSX.utils.sheet_to_csv(worksheet);
                            fullText += data + '\n\n';
                        });
                        resolve(fullText);
                    } else if (fileName.endsWith('.txt')) {
                        // 对于txt文件，直接读取为文本
                        const textReader = new FileReader();
                        textReader.onload = (event) => resolve(event.target.result);
                        textReader.onerror = (error) => reject(error);
                        textReader.readAsText(file, 'UTF-8');
                        return; // 提前返回，避免执行下面的逻辑
                    } else {
                        const textReader = new FileReader();
                        textReader.onload = (event) => resolve(event.target.result);
                        textReader.onerror = (error) => reject(error);
                        textReader.readAsText(file);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            if (fileName.endsWith('.docx') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
               reader.readAsArrayBuffer(file);
            } else {
               // 对于txt文件和其他文本文件，直接读取为文本
               reader.readAsText(file, 'UTF-8');
            }
        });
    },
    async regenerateContent() {
        if (this.isGenerating) return;
        const lastUserMessage = this.messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            // 根据 isDeepThinking 状态决定实际使用的模型
            let actualModel = this.selectedModel;
            if (this.selectedModel === 'deepseek') {
                actualModel = this.isDeepThinking ? 'deepseek-reasoner' : 'deepseek-chat';
            }

            this.$emit('generating-changed', true);
            this.isStreaming = true;
            this.currentThinking = '';
            this.currentAnswer = '';
            this.isCurrentThinkingExpanded = true;
            
            // 记录请求开始时间
            this.requestStartTime = Date.now();
            this.currentRequestStats = {
                model: actualModel,
                startTime: this.requestStartTime,
                tokens: null
            };
            
            const lastAssistantIndex = this.messages.map(m => m.role).lastIndexOf('assistant');
            if (lastAssistantIndex > -1) {
                this.$emit('delete-message', lastAssistantIndex);
            }

            await this.$nextTick();

            try {
                // 从 localStorage 读取 API 密钥
                const deepseekKey = localStorage.getItem('deepseek_api_key');
                const glmKey = localStorage.getItem('glm_api_key');
                
                // 检查密钥是否存在
                if (!deepseekKey || !glmKey) {
                    alert('请先在设置中配置您的 API 密钥。');
                    this.$emit('generating-changed', false);
                    this.isStreaming = false;
                    return;
                }
                
                const apiKeys = {
                    deepseek: deepseekKey,
                    glm: glmKey
                };
                
                const messagesForAPI = this.formatMessagesForAPI(this.messages);
                const result = await chatWithAI(
                    messagesForAPI,
                    actualModel,
                    (content, type) => {
                        if (type === 'thinking') {
                            this.currentThinking += content;
                        } else {
                            this.currentAnswer += content;
                        }
                        
                        // 优化流式更新：使用requestAnimationFrame和防抖
                        if (this.streamingUpdateTimer) {
                            clearTimeout(this.streamingUpdateTimer);
                        }
                        
                        this.streamingUpdateTimer = setTimeout(() => {
                            // 使用requestAnimationFrame确保在浏览器下一帧渲染
                            requestAnimationFrame(() => {
                                // 强制Vue更新，但避免频繁的DOM操作
                                this.$forceUpdate();
                            });
                        }, 100); // 增加到100ms，减少更新频率
                    },
                    apiKeys,
                    this.replyStyle
                );
                
                // 更新Token统计信息
                if (result && result.tokens) {
                    this.currentRequestStats.tokens = result.tokens;
                }
                
                this.addAIMessage();
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('对话出错:', error);
                    if (this.currentAnswer || this.currentThinking) {
                        this.addAIMessage();
                    } else {
                        this.$emit('send-message', { role: 'assistant', content: '抱歉，我遇到了问题，请稍后再试。', type: 'simple' });
                    }
                }
            } finally {
                this.$emit('generating-changed', false);
                this.isStreaming = false;
                
                // 重置渲染状态，确保最终内容完整渲染
                this._lastRenderedLength = 0;
                
                // 清理流式更新定时器
                if (this.streamingUpdateTimer) {
                    clearTimeout(this.streamingUpdateTimer);
                    this.streamingUpdateTimer = null;
                }
            }
        }
    },
    addAIMessage() {
        // 计算请求耗时
        const endTime = Date.now();
        const duration = this.requestStartTime ? endTime - this.requestStartTime : 0;
        
        const actualModel = this.currentRequestStats?.model || this.selectedModel;
        const aiMessage = {
            id: this.generateId(),
            role: 'assistant',
            content: this.currentAnswer,
            type: actualModel === 'deepseek-reasoner' ? 'combined' : 'simple',
            isStreaming: false,
            stats: {
                model: actualModel,
                duration: duration,
                tokens: this.currentRequestStats?.tokens || null,
                timestamp: endTime
            }
        };
        if (actualModel === 'deepseek-reasoner') {
            aiMessage.thinking = this.currentThinking;
            aiMessage.isThinkingExpanded = true;
        }
        this.$emit('send-message', aiMessage);
        
        // 使用$nextTick确保DOM更新完成后再处理
        this.$nextTick(() => {
            // 延迟一点时间确保DOM完全渲染
            setTimeout(() => {
                this.setupCopyButtons();
            }, 100);
        });
        
        // 保留文件内容以便后续预览
        // const lastUserMessage = this.messages.filter(m => m.role === 'user').pop();
        // if(lastUserMessage && lastUserMessage.attachment && lastUserMessage.attachment.fileText) {
        //     delete lastUserMessage.attachment.fileText;
        // }

        this.currentAnswer = '';
        this.currentThinking = '';
    },
    
    startRenaming() {
        if (this.titleClickTimer) {
          clearTimeout(this.titleClickTimer);
          this.titleClickTimer = null;
        }
        this.isRenaming = true;
        this.newTitle = this.currentTitle || '';
        this.$nextTick(() => { 
          this.$refs.titleInput.focus(); 
          this.$refs.titleInput.select(); 
        });
      },
    saveTitle() {
        this.isRenaming = false;
        if (this.newTitle.trim() && this.newTitle !== this.currentTitle) {
          this.$emit('update-title', this.newTitle.trim());
        }
      },

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
        this.$emit('theme-changed', this.isDarkMode);
      },
    stopGeneration() {
        cancelAllRequests();
        this.$emit('generating-changed', false);
        this.isStreaming = false;
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
          if (this.currentAnswer || this.currentThinking) {
            lastMessage.content = this.currentAnswer;
            lastMessage.thinking = this.currentThinking;
            // 根据当前选择的模型和深度思考状态决定消息类型
            const actualModel = this.selectedModel === 'deepseek' ? 
                (this.isDeepThinking ? 'deepseek-reasoner' : 'deepseek-chat') : 
                this.selectedModel;
            lastMessage.type = actualModel === 'deepseek-reasoner' ? 'combined' : 'simple';
            lastMessage.isStreaming = false;
            lastMessage.isThinkingExpanded = lastMessage.isThinkingExpanded !== false;
            this.$emit('send-message', lastMessage);
          }
        }
        if (this.messages.length === 1 && !this.currentAnswer && !this.currentThinking) {
          const userMessage = this.messages.find(m => m.role === 'user')?.content || '';
          const fallbackTitle = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
          this.$emit('update-title', fallbackTitle);
        }
    },
    copyMessage(content, event = null) {
      const triggerBtn = event?.currentTarget || null;
      const originalContent = triggerBtn?.innerHTML || '';
      const feedbackEl = document.createElement('div');
      feedbackEl.className = 'copy-feedback';
      
      if (triggerBtn) {
        // 使用相对定位避免页面抖动
        const container = triggerBtn.closest('.message') || triggerBtn.parentElement;
        container.style.position = 'relative';
        container.appendChild(feedbackEl);
        
        // 相对于容器定位
        feedbackEl.style.position = 'absolute';
        feedbackEl.style.top = '-35px';
        feedbackEl.style.right = '10px';
        feedbackEl.style.transform = 'translateY(15px) scale(0.9)';
        feedbackEl.style.zIndex = '1000';
      } else {
        // 如果没有触发按钮，使用固定定位
        document.body.appendChild(feedbackEl);
        feedbackEl.style.top = '20px';
        feedbackEl.style.right = '20px';
      }
      
      // 复制成功的处理函数
      const onSuccess = () => {
        feedbackEl.textContent = '✓ 已复制';
        feedbackEl.classList.add('show', 'success');
        if (triggerBtn) {
          triggerBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" d="M20 6L9 17l-5-5"/></svg>`;
          triggerBtn.classList.add('copied');
        }
        setTimeout(() => {
          feedbackEl.classList.remove('show');
          setTimeout(() => feedbackEl.remove(), 300);
          if (triggerBtn) {
            triggerBtn.innerHTML = originalContent;
            triggerBtn.classList.remove('copied');
          }
        }, 2000);
      };
      
      // 复制失败的处理函数
      const onError = (error) => {
        console.error('内容复制失败:', error);
        feedbackEl.textContent = '✗ 复制失败';
        feedbackEl.classList.add('show', 'error');
        if (triggerBtn) {
          triggerBtn.innerHTML = '!';
          triggerBtn.classList.add('error');
        }
        setTimeout(() => {
          feedbackEl.classList.remove('show');
          setTimeout(() => feedbackEl.remove(), 300);
          if (triggerBtn) {
            triggerBtn.innerHTML = originalContent;
            triggerBtn.classList.remove('error');
          }
        }, 2000);
      };
      
      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content).then(onSuccess).catch((error) => {
          // 如果 Clipboard API 失败，尝试使用传统方法
          this.fallbackCopyTextToClipboard(content, onSuccess, onError);
        });
      } else {
        // 如果不支持 Clipboard API，直接使用传统方法
        this.fallbackCopyTextToClipboard(content, onSuccess, onError);
      }
    },
    
    // 传统的复制方法（兼容性更好）
    fallbackCopyTextToClipboard(text, onSuccess, onError) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 避免在页面上显示
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          onSuccess();
        } else {
          onError(new Error('execCommand copy failed'));
        }
      } catch (err) {
        onError(err);
      }
      
      document.body.removeChild(textArea);
    },


    async generateTitleFromConversation() {
        if (!this.currentAnswer && !this.currentThinking) {
        const userMessage = this.messages.find(m => m.role === 'user')?.content || '';
        const fallbackTitle = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
        this.$emit('update-title', fallbackTitle);
        return;
        }
        try {
        // 获取 API 密钥
        const deepseekKey = localStorage.getItem('deepseek_api_key');
        const glmKey = localStorage.getItem('glm_api_key');
        
        // 检查密钥是否存在
        if (!deepseekKey || !glmKey) {
            console.warn('API 密钥未配置，跳过标题生成');
            const userMessage = this.messages.find(m => m.role === 'user')?.content || '';
            const fallbackTitle = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
            this.$emit('update-title', fallbackTitle);
            return;
        }
        
        const apiKeys = {
            deepseek: deepseekKey,
            glm: glmKey
        };
        
        let finalTitle = ''; // 使用局部变量累积标题
        // 开始时重置显示标题
        this.displayTitle = '';
        
        await chatWithAI(
            [
            { role: "system", content: "你是一个专业的对话标题总结助手。请仔细分析对话的核心主题和关键内容，生成一个准确、简洁的标题。\n\n要求：\n1. 标题应准确反映对话的主要内容或问题\n2. 优先提取用户的具体问题、需求或讨论的主题\n3. 避免使用模糊的词汇，如'问题'、'咨询'、'讨论'等\n4. 长度控制在8-12个字之间\n5. 使用中文，语言简洁明了\n6. 以流式方式逐字输出标题，不要包含引号或其他符号" },
            { role: "user", content: `请为以下对话生成标题:\n用户: ${this.messages.find(m => m.role === 'user')?.content}\nAI: ${this.currentAnswer}` }
            ],
            "deepseek-chat",
            (content, type) => {
            if (type === 'answer') { 
                finalTitle += content; 
                // 更新本地数据属性，而不是emit事件
                this.displayTitle = finalTitle.trim(); 
            }
            },
            apiKeys,
            'concise'
        );
        
        // 完成后，向父组件emit最终标题
        this.$emit('update-title', this.displayTitle);
        } catch (error) {
        console.error("标题流式生成失败:", error);
        const userMessage = this.messages.find(m => m.role === 'user')?.content || '';
        const fallbackTitle = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
        this.$emit('update-title', fallbackTitle);
        }
    },
    changeModel() {
        this.$emit('model-changed', this.selectedModel);
    },
    toggleModelDropdown() {
        this.showModelDropdown = !this.showModelDropdown;
    },
    selectModel(modelValue) {
        this.selectedModel = modelValue;
        this.showModelDropdown = false;
        this.changeModel();
    },
    getModelIcon(modelValue) {
        const model = this.availableModels.find(m => m.value === modelValue);
        return model ? model.icon : '🤖';
    },
    getModelName(modelValue) {
        const model = this.availableModels.find(m => m.value === modelValue);
        if (model) {
            return model.name;
        }
        
        // 处理具体的deepseek子模型
        if (modelValue === 'deepseek-chat') {
            return 'DeepSeek Chat';
        }
        if (modelValue === 'deepseek-reasoner') {
            return 'DeepSeek Reasoner';
        }
        
        return 'Unknown Model';
    },
    getModelDescription(modelValue) {
        const model = this.availableModels.find(m => m.value === modelValue);
        return model ? model.description : '未知模型';
    },
    handleClickOutside(event) {
        const modelSelector = this.$refs.modelSelector;
        if (modelSelector && !modelSelector.contains(event.target)) {
            this.showModelDropdown = false;
        }
    },
    toggleThinking(index) {
        this.expandedThinking = { ...this.expandedThinking, [index]: !this.isThinkingExpanded(index) };
    },
    toggleCurrentThinking() {
        this.isCurrentThinkingExpanded = !this.isCurrentThinkingExpanded;
    },
    isThinkingExpanded(index) {
        const message = this.messages[index];
        return (message.isThinkingExpanded ?? true) && (this.expandedThinking[index] ?? true);
    },
    
    // 文件预览相关方法
    async generateFilePreview(file) {
        this.isLoadingPreview = true;
        this.previewError = null;
        this.filePreviewContent = null;
        
        try {
            if (this.isDocumentFile(file.name)) {
                // 文档和表格文件预览
                const content = await this.readFileContent(file);
                // 限制预览内容长度
                const maxLength = 500;
                this.filePreviewContent = content.length > maxLength 
                    ? content.substring(0, maxLength) + '...\n\n(内容已截断，完整内容将在发送时使用)'
                    : content;
                this.isLoadingPreview = false;
            } else {
                // 不支持的文件类型
                this.previewError = '仅支持文档和表格文件';
                this.isLoadingPreview = false;
            }
        } catch (error) {
            console.error('文件预览生成失败:', error);
            this.previewError = '预览生成失败';
            this.isLoadingPreview = false;
        }
    },
    
    isDocumentFile(filename) {
        const documentExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.txt'];
        return documentExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },
    
    getFileIcon(filename) {
        if (filename.toLowerCase().includes('.doc')) return '📄';
        if (filename.toLowerCase().includes('.xls')) return '📊';
        if (filename.toLowerCase().includes('.txt')) return '📝';
        return '📎';
    },
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN');
    },
    

     
     // 文件预览模态框相关方法
     async openFilePreview(attachment) {
         this.showPreviewModal = true;
         this.previewModalFile = attachment;
         this.isLoadingModalPreview = true;
         this.modalPreviewError = null;
         this.previewModalContent = null;
         
         try {
             if (attachment && attachment.fileText) {
                 // 如果有文本内容，直接显示（已发送的消息附件）
                 this.previewModalContent = attachment.fileText;
             } else if (attachment && attachment.name) {
                 // 如果是新选择的文件，读取文件内容
                 const content = await this.readFileContent(attachment);
                 this.previewModalContent = content;
             } else {
                 // 如果没有文本内容，设置错误信息
                 this.modalPreviewError = '文件内容不可用';
             }
             this.isLoadingModalPreview = false;
         } catch (error) {
             console.error('文件预览失败:', error);
             this.modalPreviewError = '预览失败';
             this.isLoadingModalPreview = false;
         }
     },
     
     closeFilePreview() {
          this.showPreviewModal = false;
          this.previewModalFile = null;
          this.previewModalContent = null;
          this.isLoadingModalPreview = false;
          this.modalPreviewError = null;
      },
      
      // 移动端侧边栏切换方法
      toggleSidebar() {
          this.$emit('toggle-sidebar');
      },
      
      getFileTypeDescription(filename) {
          if (!filename) return '未知';
          if (filename.toLowerCase().includes('.doc')) return 'Word文档';
          if (filename.toLowerCase().includes('.xls')) return 'Excel表格';
          if (filename.toLowerCase().includes('.txt')) return '文本文件';
          return '不支持的文件类型';
      },
      
      // HTML预览相关方法
      openHtmlPreview(htmlCode) {
          this.htmlPreviewContent = htmlCode;
          this.showHtmlPreviewModal = true;
      },
      
      closeHtmlPreview() {
          this.showHtmlPreviewModal = false;
          this.htmlPreviewContent = '';
      },
      
      // 格式化时间显示
      formatDuration(milliseconds) {
          if (!milliseconds || milliseconds < 0) return 'N/A';
          
          if (milliseconds < 1000) {
              return `${milliseconds}ms`;
          } else if (milliseconds < 60000) {
              return `${(milliseconds / 1000).toFixed(1)}s`;
          } else {
              const minutes = Math.floor(milliseconds / 60000);
              const seconds = Math.floor((milliseconds % 60000) / 1000);
              return `${minutes}m ${seconds}s`;
          }
      },
      
      // applyCodeHighlighting方法已删除 - markdown-it在renderMarkdown中完成所有语法高亮
      
    // 发送示例问题
    sendExampleQuestion(question) {
      // 通过emit事件通知父组件发送消息
      this.$emit('send-user-message', question);
    },

    // 显示分享模态框
    openShareModal() {
      this.showShareModal = true;
    },

    // 关闭分享模态框
    closeShareModal() {
      this.showShareModal = false;
    },

    // 导出为JSON
    exportAsJson() {
      const conversation = this.getCurrentConversation();
      if (!conversation) return;
      
      // 检查是否有模型切换，并添加元数据
      const usedModels = new Set();
      conversation.messages.forEach(message => {
        if (message.role === 'assistant' && message.stats && message.stats.model) {
          usedModels.add(message.stats.model);
        }
      });
      
      // 为导出数据添加模型切换信息
      const exportData = {
        ...conversation,
        metadata: {
          hasModelSwitch: usedModels.size > 1,
          usedModels: Array.from(usedModels),
          exportTime: new Date().toISOString()
        }
      };
      
      const dataStr = JSON.stringify([exportData], null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
      const fileName = safeTitle || 'untitled_chat';
      this.downloadFile(dataUri, `${fileName}.json`);
      this.closeShareModal();
    },

    // 导出为Markdown
    exportAsMarkdown() {
      const conversation = this.getCurrentConversation();
      if (!conversation) return;
      
      // 检查是否有模型切换
      const usedModels = new Set();
      conversation.messages.forEach(message => {
        if (message.role === 'assistant' && message.stats && message.stats.model) {
          usedModels.add(message.stats.model);
        }
      });
      
      let markdown = `# ${conversation.title}\n\n`;
      markdown += `**创建时间:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
      markdown += `**更新时间:** ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      
      if (usedModels.size > 1) {
        markdown += `**使用模型:** ${Array.from(usedModels).map(model => this.getModelName(model)).join(', ')} (对话中切换)\n\n`;
      } else if (usedModels.size === 1) {
        // 如果只有一个模型，显示实际使用的模型
        markdown += `**模型:** ${this.getModelName(Array.from(usedModels)[0])}\n\n`;
      } else {
        // 如果没有模型统计信息，显示当前选择的模型或对话的模型
        markdown += `**模型:** ${this.getModelName(this.selectedModel || conversation.model)}\n\n`;
      }
      markdown += '---\n\n';

      conversation.messages.forEach((message, index) => {
        if (message.role === 'user') {
          markdown += `**用户:**\n\n${message.content}\n\n`;
        } else if (message.role === 'assistant') {
          // 显示AI助手和使用的模型
          const modelInfo = message.stats && message.stats.model ? ` (${this.getModelName(message.stats.model)})` : '';
          markdown += `**AI助手${modelInfo}:**\n\n`;
          if (message.type === 'combined' && message.thinking) {
            markdown += `<details>\n<summary>思考过程</summary>\n\n${message.thinking}\n\n</details>\n\n`;
          }
          markdown += `${message.content}\n\n`;
        }
        if (index < conversation.messages.length - 1) {
          markdown += '---\n\n';
        }
      });

      const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
      const fileName = safeTitle || 'untitled_chat';
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      this.downloadFile(url, `${fileName}.md`);
      URL.revokeObjectURL(url);
      this.closeShareModal();
    },

    // 导出为HTML
    exportAsHtml() {
      const conversation = this.getCurrentConversation();
      if (!conversation) return;
      
      // 检查是否有模型切换
      const usedModels = new Set();
      conversation.messages.forEach(message => {
        if (message.role === 'assistant' && message.stats && message.stats.model) {
          usedModels.add(message.stats.model);
        }
      });
      
      let modelInfo;
      if (usedModels.size > 1) {
        modelInfo = `${Array.from(usedModels).map(model => this.getModelName(model)).join(', ')} (对话中切换)`;
      } else if (usedModels.size === 1) {
        // 如果只有一个模型，显示实际使用的模型
        modelInfo = this.getModelName(Array.from(usedModels)[0]);
      } else {
        // 如果没有模型统计信息，显示当前选择的模型或对话的模型
        modelInfo = this.getModelName(this.selectedModel || conversation.model);
      }
      
      let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${conversation.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
    .message { margin-bottom: 30px; padding: 20px; border-radius: 8px; }
    .user-message { background-color: #f0f9ff; border-left: 4px solid #0ea5e9; }
    .assistant-message { background-color: #f9fafb; border-left: 4px solid #10b981; }
    .role { font-weight: bold; margin-bottom: 10px; color: #374151; }
    .model-info { font-size: 0.9em; color: #666; margin-left: 8px; }
    .thinking { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #f59e0b; }
    .thinking-title { font-weight: bold; margin-bottom: 8px; color: #92400e; }
    pre { background-color: #f4f4f4; padding: 15px; border-radius: 6px; overflow-x: auto; }
    code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${conversation.title}</h1>
    <p><strong>创建时间:</strong> ${new Date(conversation.createdAt).toLocaleString()}</p>
    <p><strong>更新时间:</strong> ${new Date(conversation.updatedAt).toLocaleString()}</p>
    <p><strong>使用模型:</strong> ${modelInfo}</p>
  </div>
`;

      conversation.messages.forEach(message => {
        const messageClass = message.role === 'user' ? 'user-message' : 'assistant-message';
        let roleText = message.role === 'user' ? '用户' : 'AI助手';
        
        // 为AI助手消息添加模型信息
        if (message.role === 'assistant' && message.stats && message.stats.model) {
          roleText += `<span class="model-info">(${this.getModelName(message.stats.model)})</span>`;
        }
        
        html += `  <div class="message ${messageClass}">
`;
        html += `    <div class="role">${roleText}</div>
`;
        
        if (message.role === 'assistant' && message.type === 'combined' && message.thinking) {
          html += `    <div class="thinking">
`;
          html += `      <div class="thinking-title">思考过程:</div>
`;
          html += `      <div>${this.markdownRenderer.render(message.thinking)}</div>
`;
          html += `    </div>
`;
        }
        
        html += `    <div>${this.markdownRenderer.render(message.content)}</div>
`;
        html += `  </div>
`;
      });

      html += `</body>
</html>`;

      const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
      const fileName = safeTitle || 'untitled_chat';
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      this.downloadFile(url, `${fileName}.html`);
      URL.revokeObjectURL(url);
      this.closeShareModal();
    },

    // 导出为图片
    async exportAsImage() {
      const conversation = this.getCurrentConversation();
      if (!conversation) return;
      
      try {
        // 动态导入html2canvas库
        const html2canvas = (await import('html2canvas')).default;

        // 创建临时容器
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.top = '-9999px';
        tempDiv.style.left = '0';
        tempDiv.style.width = '800px';
        tempDiv.style.padding = '20px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        tempDiv.style.lineHeight = '1.6';
        tempDiv.style.color = '#333';
        tempDiv.style.fontSize = '14px';
        tempDiv.style.visibility = 'visible';
        tempDiv.style.pointerEvents = 'none';

        // 生成内容
        let content = `<div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; page-break-inside: avoid;">`;
        content += `<h1 style="margin: 0 0 15px 0; font-size: 24px; color: #1f2937;">${conversation.title}</h1>`;
        content += `<p style="margin: 5px 0; font-size: 12px; color: #6b7280;"><strong>创建时间:</strong> ${new Date(conversation.createdAt).toLocaleString()}</p>`;
        content += `<p style="margin: 5px 0; font-size: 12px; color: #6b7280;"><strong>更新时间:</strong> ${new Date(conversation.updatedAt).toLocaleString()}</p>`;
        content += `<p style="margin: 5px 0; font-size: 12px; color: #6b7280;"><strong>模型:</strong> ${conversation.model}</p>`;
        content += `</div>`;

        conversation.messages.forEach((message, index) => {
          const bgColor = message.role === 'user' ? '#f0f9ff' : '#f9fafb';
          const borderColor = message.role === 'user' ? '#0ea5e9' : '#10b981';
          const roleText = message.role === 'user' ? '用户' : 'AI助手';
          
          content += `<div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background-color: ${bgColor}; border-left: 4px solid ${borderColor}; page-break-inside: avoid; break-inside: avoid;">`;
          content += `<div style="font-weight: bold; margin-bottom: 10px; color: #374151; font-size: 16px;">${roleText}</div>`;
          
          if (message.role === 'assistant' && message.type === 'combined' && message.thinking) {
            content += `<div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #f59e0b; page-break-inside: avoid;">`;
            content += `<div style="font-weight: bold; margin-bottom: 8px; color: #92400e; font-size: 14px;">思考过程:</div>`;
            content += `<div style="font-size: 13px; line-height: 1.5;">${this.markdownRenderer.render(message.thinking)}</div>`;
            content += `</div>`;
          }
          
          content += `<div style="font-size: 14px; line-height: 1.6;">${this.markdownRenderer.render(message.content)}</div>`;
          content += `</div>`;
          
          if (index < conversation.messages.length - 1) {
            content += `<div style="page-break-after: auto; margin: 10px 0;"></div>`;
          }
        });

        tempDiv.innerHTML = content;
        document.body.appendChild(tempDiv);

        // 等待DOM渲染
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        // 生成图片
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: 800,
          height: tempDiv.scrollHeight
        });

        // 下载图片
        const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
        const fileName = safeTitle || 'untitled_chat';
        
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // 清理
        document.body.removeChild(tempDiv);
        this.closeShareModal();

      } catch (error) {
        console.error('图片导出失败:', error);
        alert('图片导出失败，请稍后再试');
      }
    },

    // 导出为TXT
    exportAsTxt() {
      const conversation = this.getCurrentConversation();
      if (!conversation) return;
      
      // 检查是否有模型切换
      const usedModels = new Set();
      conversation.messages.forEach(message => {
        if (message.role === 'assistant' && message.stats && message.stats.model) {
          usedModels.add(message.stats.model);
        }
      });
      
      let text = `对话标题: ${conversation.title}\n`;
      text += `创建时间: ${new Date(conversation.createdAt).toLocaleString()}\n`;
      text += `更新时间: ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      
      if (usedModels.size > 1) {
        text += `使用模型: ${Array.from(usedModels).map(model => this.getModelName(model)).join(', ')} (对话中切换)\n\n`;
      } else if (usedModels.size === 1) {
        text += `模型: ${this.getModelName(Array.from(usedModels)[0])}\n\n`;
      } else {
        text += `模型: ${this.getModelName(this.selectedModel || conversation.model)}\n\n`;
      }
      text += '='.repeat(50) + '\n\n';
      
      conversation.messages.forEach((message, index) => {
        if (message.role === 'user') {
          text += `【用户】\n${message.content}\n\n`;
        } else if (message.role === 'assistant') {
          const modelInfo = message.stats && message.stats.model ? ` (${this.getModelName(message.stats.model)})` : '';
          text += `【AI助手${modelInfo}】\n`;
          if (message.type === 'combined' && message.thinking) {
            text += `\n[思考过程]\n${message.thinking}\n\n`;
          }
          text += `${message.content}\n\n`;
        }
        if (index < conversation.messages.length - 1) {
          text += '-'.repeat(30) + '\n\n';
        }
      });
      
      const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
      const fileName = safeTitle || 'untitled_chat';
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      this.downloadFile(url, `${fileName}.txt`);
      URL.revokeObjectURL(url);
      this.closeShareModal();
    },

    // 这个新方法将作为所有转换逻辑的入口
    async convertMarkdownToDocx(markdown) {
      if (!markdown || typeof markdown !== 'string') {
        return [new Paragraph({ text: '' })];
      }

      try {
        const tokens = marked.lexer(markdown);
        let elements = [];

        for (const token of tokens) {
          const converted = await this.tokenToDocx(token);
          if (Array.isArray(converted)) {
            elements.push(...converted);
          } else if (converted) {
            elements.push(converted);
          }
        }
        return elements.length > 0 ? elements : [new Paragraph({ text: '' })];
      } catch (error) {
        console.error('Markdown转换失败:', error);
        return [new Paragraph({ text: markdown })];
      }
    },

    // 递归处理内联元素（粗体、斜体等）
    parseInline(tokens) {
      const runs = [];
      for (const token of tokens) {
        switch (token.type) {
          case 'strong':
            this.parseInline(token.tokens).forEach(run => {
              if (!run.options) run.options = {};
              run.options.bold = true;
              runs.push(run);
            });
            break;
          case 'em':
            this.parseInline(token.tokens).forEach(run => {
              if (!run.options) run.options = {};
              run.options.italics = true;
              runs.push(run);
            });
            break;
          case 'codespan':
            runs.push(new TextRun({ text: token.text, font: 'Courier New' }));
            break;
          case 'link':
            this.parseInline(token.tokens).forEach(run => {
              if (!run.options) run.options = {};
              run.options.color = '0066CC';
              run.options.underline = {};
              runs.push(run);
            });
            break;
          case 'del':
            this.parseInline(token.tokens).forEach(run => {
              if (!run.options) run.options = {};
              run.options.strike = true;
              runs.push(run);
            });
            break;
          case 'text':
            runs.push(new TextRun(token.text));
            break;
          default:
            // 对于未处理的token类型，尝试提取文本内容而不是原始Markdown
            if (token.text) {
              runs.push(new TextRun(token.text));
            } else if (token.tokens && token.tokens.length > 0) {
              // 如果有嵌套tokens，递归处理
              runs.push(...this.parseInline(token.tokens));
            }
        }
      }
      return runs;
    },

    // 主 token 转换器
    async tokenToDocx(token) {
      switch (token.type) {
        case 'heading':
          return new Paragraph({
            children: this.parseInline(token.tokens),
            heading: HeadingLevel[`HEADING_${token.depth}`],
          });
        case 'paragraph':
          return new Paragraph({ children: this.parseInline(token.tokens) });
        case 'list': {
          const items = [];
          for (const item of token.items) {
            items.push(new Paragraph({
              children: this.parseInline(item.tokens),
              bullet: { level: 0 },
            }));
          }
          return items;
        }
        case 'code': {
          // 为每一行代码创建一个新的 Paragraph 来保证换行
          const codeLines = token.text.split('\n');
          return codeLines.map(line => new Paragraph({
            children: [new TextRun({
              text: line,
              font: 'Courier New',
              size: 20
            })],
            shading: { fill: "F5F5F5" },
          }));
        }
        case 'table': {
          const header = new TableRow({
            children: token.header.map(cell => new TableCell({
              children: [new Paragraph({ children: this.parseInline(cell.tokens) })],
              shading: { fill: "F0F0F0" },
            })),
            tableHeader: true,
          });
          const rows = token.rows.map(row => new TableRow({
            children: row.map(cell => new TableCell({
              children: [new Paragraph({ children: this.parseInline(cell.tokens) })],
            })),
          }));
          return new Table({
            rows: [header, ...rows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          });
        }
        case 'space':
          return new Paragraph(""); // 空行
        case 'hr':
          return new Paragraph({ border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } });
        default:
          // 对于未处理的token类型，尝试提取文本内容而不是原始Markdown
          if (token.text) {
            return new Paragraph({ children: [new TextRun(token.text)] });
          } else if (token.tokens && token.tokens.length > 0) {
            return new Paragraph({ children: this.parseInline(token.tokens) });
          }
          return null;
      }
      return null;
    },

    // 导出为Word文档
    async exportAsWord() {
      const conversation = this.getCurrentConversation();
      if (!conversation) return;
      
      try {
        
        // 检查是否有模型切换
        const usedModels = new Set();
        conversation.messages.forEach(message => {
          if (message.role === 'assistant' && message.stats && message.stats.model) {
            usedModels.add(message.stats.model);
          }
        });
        
        let modelInfo;
        if (usedModels.size > 1) {
          modelInfo = `${Array.from(usedModels).map(model => this.getModelName(model)).join(', ')} (对话中切换)`;
        } else if (usedModels.size === 1) {
          modelInfo = this.getModelName(Array.from(usedModels)[0]);
        } else {
          modelInfo = this.getModelName(this.selectedModel || conversation.model);
        }
        
        const children = [];
        
        // 添加主标题 - 使用Heading1样式
        children.push(
          new Paragraph({
            text: conversation.title,
            heading: HeadingLevel.HEADING_1,
          })
        );
        
        children.push(new Paragraph({ text: "" })); // 空行
        
        // 添加元信息区域 - 使用引用样式
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "📋 对话信息", bold: true, size: 24 })
            ],
            heading: HeadingLevel.HEADING_2
          })
        );
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "📅 创建时间: ", bold: true }),
              new TextRun(new Date(conversation.createdAt).toLocaleString())
            ],
            indent: { left: 720 } // 缩进
          })
        );
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "🔄 更新时间: ", bold: true }),
              new TextRun(new Date(conversation.updatedAt).toLocaleString())
            ],
            indent: { left: 720 }
          })
        );
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "🤖 使用模型: ", bold: true }),
              new TextRun(modelInfo)
            ],
            indent: { left: 720 }
          })
        );
        
        children.push(new Paragraph({ text: "" })); // 空行
        
        // 添加分隔线
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "─".repeat(80), color: "CCCCCC" })
            ]
          })
        );
        
        children.push(new Paragraph({ text: "" })); // 空行
        
        // 添加对话内容标题
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "💬 对话内容", bold: true, size: 24 })
            ],
            heading: HeadingLevel.HEADING_2
          })
        );
        
        children.push(new Paragraph({ text: "" })); // 空行
        
        // 添加对话内容
        for (let index = 0; index < conversation.messages.length; index++) {
          const message = conversation.messages[index];
          
          if (message.role === 'user') {
            // 用户消息 - 使用Heading3样式
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "👤 用户", bold: true, color: "0066CC", size: 22 })
                ],
                heading: HeadingLevel.HEADING_3
              })
            );
            
            // 使用新的Markdown转换方法处理用户消息内容
            const userElements = await this.convertMarkdownToDocx(message.content);
            userElements.forEach(element => {
              // 为用户消息添加缩进
              if (element.options && element.options.indent) {
                element.options.indent.left = (element.options.indent.left || 0) + 360;
              } else {
                element.options = { ...element.options, indent: { left: 360 } };
              }
              children.push(element);
            });
            
          } else if (message.role === 'assistant') {
            const modelInfo = message.stats && message.stats.model ? ` (${this.getModelName(message.stats.model)})` : '';
            
            // AI助手消息 - 使用Heading3样式
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `🤖 AI助手${modelInfo}`, bold: true, color: "009900", size: 22 })
                ],
                heading: HeadingLevel.HEADING_3
              })
            );
            
            // 思考过程 - 使用特殊样式
            if (message.type === 'combined' && message.thinking) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "💭 思考过程", bold: true, italics: true, color: "FF6600", size: 20 })
                  ],
                  indent: { left: 360 }
                })
              );
              
              // 使用新的Markdown转换方法处理思考过程内容
              const thinkingElements = await this.convertMarkdownToDocx(message.thinking);
              thinkingElements.forEach(element => {
                // 为思考过程添加更深的缩进和灰色样式
                if (element.options && element.options.indent) {
                  element.options.indent.left = (element.options.indent.left || 0) + 720;
                } else {
                  element.options = { ...element.options, indent: { left: 720 } };
                }
                
                // 为思考过程的文本添加灰色和斜体
                if (element.root && element.root.children) {
                  element.root.children.forEach(child => {
                    if (child.text !== undefined) {
                      child.color = child.color || '666666';
                      child.italics = true;
                    }
                  });
                }
                
                children.push(element);
              });
              
              children.push(new Paragraph({ text: "" })); // 空行
            }
            
            // 使用新的Markdown转换方法处理AI回复内容
            const assistantElements = await this.convertMarkdownToDocx(message.content);
            assistantElements.forEach(element => {
              // 为AI消息添加缩进
              if (element.options && element.options.indent) {
                element.options.indent.left = (element.options.indent.left || 0) + 360;
              } else {
                element.options = { ...element.options, indent: { left: 360 } };
              }
              children.push(element);
            });
          }
          
          // 消息间分隔
          if (index < conversation.messages.length - 1) {
            children.push(new Paragraph({ text: "" })); // 空行
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "━".repeat(60), color: "E0E0E0" })
                ]
              })
            );
            children.push(new Paragraph({ text: "" })); // 空行
          }
        }
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: children
          }]
        });
        
        const buffer = await Packer.toBlob(doc);
        const url = URL.createObjectURL(buffer);
        
        const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
        const fileName = safeTitle || 'untitled_chat';
        this.downloadFile(url, `${fileName}.docx`);
        URL.revokeObjectURL(url);
        this.closeShareModal();
        
      } catch (error) {
        console.error('Word文档导出失败:', error);
        let errorMessage = 'Word文档导出失败';
        if (error.message) {
          errorMessage += ': ' + error.message;
        } else {
          errorMessage += '，请稍后再试';
        }
        alert(errorMessage);
      }
    },

    // 获取当前对话
    getCurrentConversation() {
      if (!this.messages || this.messages.length === 0) {
        return null;
      }
      
      return {
        title: this.currentTitle || '未命名对话',
        messages: this.messages,
        model: this.currentModel || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },

    // 下载文件
    downloadFile(url, filename) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // 分享为文本
    shareAsText() {
      const conversation = {
        title: this.currentTitle,
        messages: this.messages,
        model: this.currentModel
      };
      
      // 检查是否有模型切换
      const usedModels = new Set();
      conversation.messages.forEach(message => {
        if (message.role === 'assistant' && message.stats && message.stats.model) {
          usedModels.add(message.stats.model);
        }
      });
      
      let text = `对话标题: ${conversation.title}\n`;
      if (usedModels.size > 1) {
        text += `使用模型: ${Array.from(usedModels).map(model => this.getModelName(model)).join(', ')} (对话中切换)\n\n`;
      } else if (usedModels.size === 1) {
        // 如果只有一个模型，显示实际使用的模型
        text += `模型: ${this.getModelName(Array.from(usedModels)[0])}\n\n`;
      } else {
        // 如果没有模型统计信息，显示当前选择的模型或对话的模型
        text += `模型: ${this.getModelName(this.selectedModel || conversation.model)}\n\n`;
      }
      text += '---\n\n';
      
      conversation.messages.forEach((message, index) => {
        if (message.role === 'user') {
          text += `用户:\n${message.content}\n\n`;
        } else if (message.role === 'assistant') {
          // 显示AI助手和使用的模型
          const modelInfo = message.stats && message.stats.model ? ` (${this.getModelName(message.stats.model)})` : '';
          text += `AI助手${modelInfo}:\n`;
          if (message.type === 'combined' && message.thinking) {
            text += `思考过程:\n${message.thinking}\n\n`;
          }
          text += `${message.content}\n\n`;
        }
        if (index < conversation.messages.length - 1) {
          text += '---\n\n';
        }
      });
      
      navigator.clipboard.writeText(text).then(() => {
        alert('对话内容已复制到剪贴板');
      }).catch(() => {
        alert('复制失败，请手动复制');
      });
      
      this.closeShareModal();
    },

    // 分享为链接（暂时显示提示）
    shareAsLink() {
      alert('链接分享功能正在开发中');
      this.closeShareModal();
    },

  },
};
</script>

<style scoped>
/* 新增附件信息样式 */
.message-attachment-info {
    margin-top: 8px;
    padding: 6px 10px;
    background-color: var(--action-btn-bg);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-color);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color);
}

.message-attachment-info:hover {
    background-color: var(--primary-color);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}

.message-attachment-info .file-icon {
    font-size: 16px;
}

.preview-hint {
    font-size: 11px;
    opacity: 0.7;
    margin-left: auto;
}

/* 模型调用统计信息样式 */
.message-stats {
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 11px;
    color: var(--text-color);
    opacity: 0.8;
    transition: all 0.2s ease;
}

.message-stats:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.05);
}

.stats-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.stats-item {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
}

.stats-icon {
    font-size: 12px;
    opacity: 0.7;
}

.stats-label {
    font-weight: 500;
    opacity: 0.8;
}

.stats-value {
    font-weight: 600;
    color: var(--primary-color);
}

.stats-detail {
    font-size: 10px;
    opacity: 0.6;
    margin-left: 2px;
}

/* 深色模式下的统计信息样式 */
:root.dark-mode .message-stats {
    background: rgba(255, 255, 255, 0.05);
}

:root.dark-mode .message-stats:hover {
    background: rgba(255, 255, 255, 0.08);
}
/* ... 其他所有样式保持不变 ... */
/* 新增文件预览样式 */
.file-preview {
  background-color: var(--secondary-color);
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid var(--border-color);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  order: -1;
  flex-shrink: 0;
}

.file-preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
}

.file-preview-content {
  border-top: 1px solid var(--border-color);
  background-color: var(--card-bg);
}



.file-info {
  padding: 10px;
}

.file-info p {
  margin: 4px 0;
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.8;
}

.preview-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}

.preview-loading {
  padding: 20px;
  text-align: center;
  color: var(--text-color);
  opacity: 0.7;
}

.preview-error {
  padding: 10px;
  text-align: center;
  color: #e53e3e;
  font-size: 12px;
}
.file-icon {
  font-size: 20px;
}
.file-preview-name {
  flex-grow: 1;
  font-size: 13px;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.remove-file-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  min-width: 20px;
  font-size: 16px;
  background-color: var(--action-btn-bg);
  color: var(--text-color);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.input-content {
  padding: 12px 0;
}

/* 现有样式... */



.model-selector {
  flex-shrink: 0;
  min-width: 150px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.model-selector label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
}
.speech-error-indicator {
  padding: 8px 20px 0;
  color: #e53e3e;
  font-size: 14px;
  text-align: center;
  font-weight: 500;
}

/* 欢迎界面样式 */
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 70vh;
  padding: 40px 20px;
  animation: fadeIn 0.6s ease-out;
}

.welcome-content {
  text-align: center;
  max-width: 900px;
  width: 100%;
}

.welcome-header {
  margin-bottom: 48px;
}

.welcome-logo {
  font-size: 4rem;
  margin-bottom: 16px;
  animation: bounce 2s infinite;
}

.welcome-title {
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 16px;
  line-height: 1.2;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-description {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
  opacity: 0.9;
  line-height: 1.5;
}

.example-questions {
  margin-top: 32px;
}

.example-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2x2 网格 */
  gap: 16px;
  max-width: 700px; /* 限制最大宽度 */
  margin: 0 auto;
}

.example-item {
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 14px;
  color: var(--text-color);
}

.example-item:hover {
  border-color: var(--primary-color);
  background-color: var(--secondary-color);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .example-grid {
    grid-template-columns: 1fr; /* 移动端单列显示 */
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
.title-text {
  display: inline-block;
  max-width: 15ch; /* 限制为15个字符宽度 */
  margin: 0 auto;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}
.title-text:hover {
  background-color: var(--action-btn-bg);
}

.rename-btn {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  padding: 0;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.rename-btn:hover {
  opacity: 1;
  background: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}

.rename-btn svg {
  stroke: var(--text-color);
  transition: stroke 0.2s ease;
}

.rename-btn:hover svg {
  stroke: white;
}

.title-edit-container {
  display: flex;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  max-width: 400px;
  min-width: 250px;
}

.title-input {
  flex: 1;
  min-width: 150px;
  padding: 6px 12px;
  border: 2px solid var(--primary-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  transition: all 0.2s ease;
}

.title-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
  background: var(--card-bg);
}


.theme-toggle-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  padding: 6px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.theme-toggle-btn:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
  opacity: 1;
  background: var(--primary-color);
  border-color: var(--primary-color);
}
.theme-toggle-btn .theme-icon {
  color: var(--text-color);
  transition: color 0.2s ease;
}
.theme-toggle-btn:hover .theme-icon {
  color: white;
}

.share-btn {
  position: absolute;
  right: 60px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  padding: 6px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.share-btn:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
  opacity: 1;
  background: var(--primary-color);
  border-color: var(--primary-color);
}
.share-btn .share-icon {
  color: var(--text-color);
  transition: color 0.2s ease;
}
.share-btn:hover .share-icon {
  color: white;
}

.chat-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-color);
}
.chat-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 60px 20px 24px;
  position: relative;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  background: var(--gradient-secondary);
  backdrop-filter: blur(20px);
  border-radius: 16px 16px 0 0;
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.title-model-selector {
  position: absolute;
  left: 70px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
}

.current-model {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card-bg);
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
}

.current-model:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.model-icon {
  font-size: 16px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  line-height: 1.2;
}

.dropdown-arrow {
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.6;
  transition: transform 0.2s ease;
}

.title-model-selector.open .dropdown-arrow {
  transform: rotate(180deg);
}

.model-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  margin-top: 4px;
  overflow: hidden;
  z-index: 1001;
  opacity: 0;
  transform: translateY(-8px);
  transition: all 0.2s ease;
  pointer-events: none;
}

.title-model-selector.open .model-dropdown {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.model-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.model-option:last-child {
  border-bottom: none;
}

.model-option:hover {
  background: var(--secondary-color);
}

.model-option.selected {
  background: rgba(66, 153, 225, 0.1);
  border-left: 3px solid var(--primary-color);
}

.model-option .model-icon {
  margin-top: 2px;
}

.model-details {
  flex: 1;
  min-width: 0;
}

.model-details .model-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-description {
  font-size: 11px;
  color: var(--text-color);
  opacity: 0.7;
  line-height: 1.4;
  margin: 0;
}

.check-icon {
  color: var(--primary-color);
  font-weight: bold;
  font-size: 14px;
  margin-left: 8px;
}
.chat-container {
  width: 85%;
  max-width: 1200px;
  margin: 0 auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg);
  border-radius: 0;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
  position: relative;
  animation: fadeInContainer 0.6s ease-out;
}

@keyframes fadeInContainer {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 40px 40px 120px 40px; /* 增加足够的底部内边距，防止被输入框遮挡 */
  background: var(--bg-color);
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) transparent;
  position: relative;
}
.chat-messages::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
  pointer-events: none;
}
.chat-messages::-webkit-scrollbar {
  width: 8px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--primary-color), var(--primary-hover));
  border-radius: 4px;
}

.message {
  margin-bottom: 32px; /* 增加消息间距 */
  padding: 24px 28px; /* 增加内边距 */
  border-radius: 16px;
  max-width: 65%;
  word-wrap: break-word;
  position: relative;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.5s ease-out;
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  background: var(--user-message-bg);
  color: white;
  margin-left: auto;
  box-shadow: var(--shadow-md);
  border-top-right-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.message.assistant {
  background: var(--assistant-message-bg);
  color: var(--text-color);
  margin-right: auto;
  box-shadow: var(--shadow-md);
  border-top-left-radius: 6px;
}
.plain-content,
.thinking-text {
  line-height: 1.8; /* 增加行间距 */
  font-size: 15px;
  color: var(--text-color);
}
.plain-content p,
.thinking-text p {
  margin: 1.2em 0; /* 增加段落间距 */
}
.plain-content li,
.thinking-text li {
  margin: 0.6em 0; /* 增加列表项间距 */
}

.model-selector select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--input-bg);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  min-width: 120px;
}
.model-selector select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}
input {
  flex-grow: 1;
  max-width: 85%; /* 增加输入框最大宽度，减少右侧空白 */
  height: 32px;
  padding: 6px 14px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background-color: var(--input-bg);
  color: var(--text-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  transform: scale(1);
  box-sizing: border-box;
}
input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15), var(--shadow-md);
  background-color: var(--card-bg);
}
input::placeholder {
  color: var(--text-color);
  opacity: 0.5;
}
input:focus::placeholder {
  opacity: 0.3;
}
button {
  height: 32px;
  padding: 6px 16px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.3s ease;
  transform: translateY(0);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 新对话界面按钮样式 */
.input-area.centered button {
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  min-height: 48px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.input-area.centered button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(66, 153, 225, 0.25);
}

/* 发送按钮样式 */
.input-area.centered button:last-child {
  background: var(--secondary-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  font-weight: 600;
}

/* 功能按钮样式 */
.input-area.centered button:not(:last-child) {
  background: var(--secondary-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.input-area.centered button:not(:last-child):hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.input-area.centered button:last-child:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}
button:active {
  transform: translateY(0);
  transition: all 0.1s ease;
}
button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

button.active {
  background: linear-gradient(135deg, var(--error-color) 0%, #dc2626 100%);
  box-shadow: var(--shadow-sm);
  animation: pulse-recording 1.5s ease-in-out infinite;
  position: relative;
}

/* 语音识别中的脉冲动画 */
@keyframes pulse-recording {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(220, 38, 38, 0.2);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
  }
}

/* 语音识别中的呼吸光效 */
button.active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #ff6b6b, #ee5a24, #ff6b6b);
  border-radius: inherit;
  z-index: -1;
  animation: breathing-glow 2s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes breathing-glow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
  }
}

.listening-indicator {
  padding: 8px 20px 0;
  color: var(--primary-color);
  font-size: 14px;
  text-align: center;
  animation: fade-pulse 1.5s ease-in-out infinite;
}

/* 聆听指示器的淡入淡出动画 */
@keyframes fade-pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}
.thinking-content {
  margin-bottom: 20px;
  padding: 20px;
  background: var(--thinking-bg);
  border-radius: 12px;
  border-left: 4px solid var(--primary-color);
  box-shadow: var(--shadow-sm);
  color: var(--text-color);
  backdrop-filter: blur(10px);
}

.thinking-header {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  font-size: 14px;
}
.toggle-icon {
  font-size: 0.9em;
  margin-left: 8px;
  color: var(--text-color);
  opacity: 0.7;
}
.message-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.message:hover .message-actions {
  opacity: 1;
}
/* 消息框中的action-btn样式 */
.message-actions .action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--action-btn-bg);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: scale(1);
}
.message-actions .action-btn:hover {
  background: var(--primary-color);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}
.message-actions .action-btn svg {
  width: 14px;
  height: 14px;
  stroke: var(--text-color);
}
/* 输入区域的action-btn样式 */
.input-area .action-btn {
  min-width: 36px;
  height: 32px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: scale(1);
  color: white;
  font-size: 12px;
  white-space: nowrap;
}
.input-area .action-btn:hover {
  background: var(--primary-hover);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}
.stop-btn {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  box-shadow: 0 2px 5px rgba(229, 62, 62, 0.2) !important;
}

.loading-indicator {
  padding: 12px;
  color: var(--text-color);
  opacity: 0.7;
  font-style: italic;
  display: flex;
  align-items: center;
}
.loading-indicator::before {
  content: "";
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
/* 代码块容器样式 - 优化版 */
:deep(.code-block-container) {
  position: relative;
  margin: 2em 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  background: var(--code-bg);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}



/* 代码块头部样式 - 优化版 */
:deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.05), rgba(14, 165, 233, 0.02));
  color: var(--text-color);
  font-size: 0.85em;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  border-bottom: 1px solid rgba(14, 165, 233, 0.1);
  backdrop-filter: blur(10px);
  font-weight: 600;
}

/* 代码操作按钮组样式 */
:deep(.code-actions) {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 代码语言标签样式 */
:deep(.code-language) {
  text-transform: uppercase;
  font-weight: 600;
}

/* 复制按钮样式 - 优化版 */
:deep(.copy-code-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 8px;
  cursor: pointer;
  color: rgb(14, 165, 233);
  font-size: 0.8em;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

:deep(.copy-code-btn:hover) {
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.4);
  color: rgb(14, 165, 233);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

:deep(.copy-code-btn:active) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.2);
}

/* HTML预览按钮样式 - 优化版 */
:deep(.preview-html-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 8px;
  cursor: pointer;
  color: rgb(14, 165, 233);
  font-size: 0.8em;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

:deep(.preview-html-btn:hover) {
  background: rgba(14, 165, 233, 0.15);
  border-color: rgba(14, 165, 233, 0.4);
  color: rgb(14, 165, 233);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

:deep(.preview-html-btn:active) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.2);
}

/* HTML预览模态框样式 */
.html-preview-modal {
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  max-height: 800px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.html-preview-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.html-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: 0 0 12px 12px;
}


/* 代码块包装器 - 新结构 */
:deep(.code-block-wrapper) {
  display: flex;
  background: var(--code-bg);
  overflow: hidden;
}

/* 行号列 - 固定不滚动 */
:deep(.line-numbers-column) {
  background: linear-gradient(to right, rgba(14, 165, 233, 0.03), rgba(14, 165, 233, 0.01));
  border-right: 1px solid rgba(14, 165, 233, 0.15);
  padding: 1.5rem 0;
  min-width: 3.5rem;
  flex-shrink: 0;
  user-select: none;
  position: sticky;
  left: 0;
  z-index: 2;
}

:deep(.line-number-item) {
  text-align: right;
  padding-right: 0.8rem;
  color: rgba(14, 165, 233, 0.5);
  font-size: 0.88em; /* 与代码字体大小一致 */
  line-height: 1.5;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  /* 移除固定高度，让行高自然对齐 */
}

/* 代码内容区域 - 可滚动 */
:deep(pre.custom-code-block) {
  margin: 0;
  border-radius: 0;
  background: transparent;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
}

:deep(pre.custom-code-block code) {
  display: block;
  padding: 1.5rem 1.2rem;
  font-size: 0.88em;
  line-height: 1.5;
  tab-size: 2;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: var(--text-color);
  background: transparent;
  white-space: pre;
  min-width: max-content;
}

:deep(.hljs) {
  background: var(--code-bg) !important;
  color: var(--text-color) !important;
  display: block;
  overflow-x: auto;
  padding: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  scrollbar-color: var(--primary-color) transparent;
}

/* 语法高亮样式 - 蓝色主题优化版 */
.hljs .hljs-keyword,
.hljs .hljs-selector-tag,
.hljs .hljs-literal,
.hljs .hljs-section,
.hljs .hljs-link {
  color: #7c3aed !important; /* 蓝紫色关键字 */
  font-weight: 600 !important;
}

.hljs .hljs-function .hljs-keyword {
  color: #0ea5e9 !important; /* 亮蓝色函数关键字 */
}

:deep(.hljs-subst) {
  color: #06b6d4; /* 青色替换 */
}

.hljs .hljs-string,
.hljs .hljs-title,
.hljs .hljs-name,
.hljs .hljs-type,
.hljs .hljs-attribute,
.hljs .hljs-symbol,
.hljs .hljs-bullet,
.hljs .hljs-addition,
.hljs .hljs-variable,
.hljs .hljs-template-tag,
.hljs .hljs-template-variable {
  color: #10b981 !important; /* 青绿色字符串 */
}

.hljs .hljs-comment,
.hljs .hljs-quote,
.hljs .hljs-deletion,
.hljs .hljs-meta {
  color: rgba(14, 165, 233, 0.6) !important; /* 淡蓝色注释 */
  font-style: italic !important;
}

.hljs .hljs-number {
  color: #f59e0b !important; /* 橙色数字 */
  font-weight: 500 !important;
}

:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-literal),
:deep(.hljs-doctag),
:deep(.hljs-title),
:deep(.hljs-section),
:deep(.hljs-type),
:deep(.hljs-name),
:deep(.hljs-strong) {
  font-weight: bold;
}

.hljs .hljs-number,
.hljs .hljs-regexp,
.hljs .hljs-link {
  color: #d19a66 !important;
}

:deep(.hljs-built_in),
:deep(.hljs-builtin-name) {
  color: #e6c07b;
}

:deep(.hljs-attr) {
  color: #d19a66;
}

:deep(.hljs-class .hljs-title) {
  color: #e6c07b;
}

:deep(.hljs-tag) {
  color: #e06c75;
}

:deep(.hljs-tag .hljs-name) {
  color: #e06c75;
}

:deep(.hljs-tag .hljs-attr) {
  color: #d19a66;
}

:deep(.hljs-emphasis) {
  font-style: italic;
}

:deep(.hljs-strong) {
  font-weight: bold;
}

/* JavaScript 特定高亮 */
:deep(.language-javascript .hljs-keyword),
:deep(.language-js .hljs-keyword) {
  color: #c678dd;
}

:deep(.language-javascript .hljs-function),
:deep(.language-js .hljs-function) {
  color: #61afef;
}

:deep(.language-javascript .hljs-string),
:deep(.language-js .hljs-string) {
  color: #98c379;
}

/* Python 特定高亮 */
:deep(.language-python .hljs-keyword) {
  color: #c678dd;
}

:deep(.language-python .hljs-string) {
  color: #98c379;
}

:deep(.language-python .hljs-function .hljs-title) {
  color: #61afef;
}

/* CSS 特定高亮 */
:deep(.language-css .hljs-selector-tag),
:deep(.language-css .hljs-selector-id),
:deep(.language-css .hljs-selector-class) {
  color: #e06c75;
}

:deep(.language-css .hljs-attribute) {
  color: #d19a66;
}

:deep(.language-css .hljs-string) {
  color: #98c379;
}

/* HTML 特定高亮 */
:deep(.language-html .hljs-tag) {
  color: #e06c75;
}



:deep(.language-html .hljs-name) {
  color: #e06c75;
}

:deep(.language-html .hljs-attr) {
  color: #d19a66;
}

:deep(.language-html .hljs-string) {
  color: #98c379;
}

/* 暗色模式语法高亮调整 */
[data-theme="dark"] :deep(.hljs-keyword),
[data-theme="dark"] :deep(.hljs-selector-tag),
[data-theme="dark"] :deep(.hljs-literal) {
  color: #bb9af7;
}

[data-theme="dark"] :deep(.hljs-string),
[data-theme="dark"] :deep(.hljs-title),
[data-theme="dark"] :deep(.hljs-name) {
  color: #9ece6a;
}

[data-theme="dark"] :deep(.hljs-comment),
[data-theme="dark"] :deep(.hljs-quote) {
  color: #565f89;
}

[data-theme="dark"] :deep(.hljs-number),
[data-theme="dark"] :deep(.hljs-regexp) {
  color: #ff9e64;
}

[data-theme="dark"] :deep(.hljs-built_in),
[data-theme="dark"] :deep(.hljs-builtin-name) {
  color: #e0af68;
}

[data-theme="dark"] :deep(.hljs-function .hljs-keyword) {
  color: #7aa2f7;
}

[data-theme="dark"] :deep(.hljs-tag),
[data-theme="dark"] :deep(.hljs-tag .hljs-name) {
  color: #f7768e;
}

[data-theme="dark"] :deep(.hljs-attr) {
  color: #ff9e64;
}

/* 亮色模式语法高亮调整 */
[data-theme="light"] :deep(.hljs-keyword),
[data-theme="light"] :deep(.hljs-selector-tag),
[data-theme="light"] :deep(.hljs-literal) {
  color: #8b5cf6;
}

[data-theme="light"] :deep(.hljs-string),
[data-theme="light"] :deep(.hljs-title),
[data-theme="light"] :deep(.hljs-name) {
  color: #059669;
}

[data-theme="light"] :deep(.hljs-comment),
[data-theme="light"] :deep(.hljs-quote) {
  color: #6b7280;
}

[data-theme="light"] :deep(.hljs-number),
[data-theme="light"] :deep(.hljs-regexp) {
  color: #d97706;
}

[data-theme="light"] :deep(.hljs-built_in),
[data-theme="light"] :deep(.hljs-builtin-name) {
  color: #b45309;
}

[data-theme="light"] :deep(.hljs-function .hljs-keyword) {
  color: #3b82f6;
}

[data-theme="light"] :deep(.hljs-tag),
[data-theme="light"] :deep(.hljs-tag .hljs-name) {
  color: #dc2626;
}

[data-theme="light"] :deep(.hljs-attr) {
  color: #d97706;
}

/* 代码块滚动条样式 - 优化版 */
:deep(pre.custom-code-block code::-webkit-scrollbar) {
  height: 6px;
}

:deep(pre.custom-code-block code::-webkit-scrollbar-track) {
  background: rgba(14, 165, 233, 0.05);
  border-radius: 3px;
}

:deep(pre.custom-code-block code::-webkit-scrollbar-thumb) {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.6), rgba(14, 165, 233, 0.8));
  border-radius: 3px;
  transition: all 0.3s ease;
}

:deep(pre.custom-code-block code::-webkit-scrollbar-thumb:hover) {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.8), rgba(14, 165, 233, 1));
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
}

/* 内联代码样式 */
:deep(:not(pre) > code) {
  padding: 0.15em 0.5em;
  margin: 0 0.1em;
  font-size: 0.9em;
  background: linear-gradient(135deg, var(--code-bg), var(--card-bg));
  border-radius: 6px;
  color: var(--primary-color);
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  border: 1px solid var(--border-color);
  font-weight: 500;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.3;
  display: inline-block;
  vertical-align: baseline;
  max-width: 100%;
  overflow-wrap: break-word;
}





/* 复制反馈样式 */
.copy-feedback {
  position: fixed;
  min-width: 120px;
  padding: 10px 18px;
  border-radius: 8px;
  background: var(--secondary-color);
  color: white;
  text-align: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  opacity: 0;
  transform: translateY(15px) scale(0.9);
  pointer-events: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.copy-feedback.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

.copy-feedback.show.message-feedback {
  transform: translateY(0) scale(1);
}

.copy-feedback.success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border-color: rgba(72, 187, 120, 0.3);
  box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
}

.copy-feedback.error {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  border-color: rgba(245, 101, 101, 0.3);
  box-shadow: 0 6px 20px rgba(245, 101, 101, 0.4);
}

/* 按钮状态样式 */
.copied {
  background-color: #48bb78 !important;
  color: white !important;
}

.error {
  background-color: #f56565 !important;
  color: white !important;
}
/* 禁用状态样式 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
  background: var(--action-btn-bg) !important;
}

/* 语音按钮禁用状态 */
button.active:disabled {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  opacity: 0.5;
}

/* 清空按钮禁用状态 */
button[disabled] {
  background: var(--action-btn-bg) !important;
  color: var(--text-color) !important;
}

/* 语音按钮禁用状态下的hover效果 */
button[disabled]:hover {
  transform: none !important;
  box-shadow: none !important;
}

/* 预览模态框样式 */
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.preview-modal {
  background-color: var(--card-bg);
  border-radius: 20px;
  box-shadow: var(--shadow-xl);
  max-width: 85vw;
  max-height: 85vh;
  width: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
  animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.preview-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--secondary-color);
}

.preview-modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: var(--action-btn-bg);
  color: #e53e3e;
}

.preview-modal-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: var(--card-bg);
}

.modal-loading {
  text-align: center;
  padding: 40px;
  color: var(--text-color);
  opacity: 0.7;
}

.modal-error {
  text-align: center;
  padding: 40px;
  color: #e53e3e;
}

.modal-text-preview {
  max-height: 400px;
  overflow-y: auto;
}

.modal-text-preview pre {
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-color);
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: var(--secondary-color);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.modal-file-info {
  padding: 20px;
}

.modal-file-info p {
  margin: 12px 0;
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.5;
}

.modal-file-info strong {
  color: var(--primary-color);
  font-weight: 600;
}

/* 桌面端input-controls样式 - 统一容器内水平排列 */
.input-controls {
  display: flex;
  align-items: center;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 0;
  gap: 12px;
  position: relative;
}

.input-controls .add-btn {
  width: 48px;
  height: 36px;
  min-width: 48px;
  max-width: 48px;
  padding: 0;
  border-radius: 8px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.input-controls .add-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: scale(1.05);
}

.input-controls input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 16px;
  color: var(--text-color);
  outline: none;
  border-radius: 0;
  box-shadow: none;
  min-width: 0;
}

.input-controls input::placeholder {
  color: var(--text-color);
  opacity: 0.6;
}

.input-controls .button-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.input-controls .action-btn {
  width: 48px;
  height: 36px;
  min-width: 48px;
  max-width: 48px;
  padding: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.input-controls .action-btn:hover {
  background: var(--primary-color);
  color: white;
  transform: scale(1.05);
}

/* 移动端菜单按钮 - 默认隐藏 */
.mobile-menu-btn {
  display: none;
}



/* 移动端响应式设计 - 优化版本 */
@media (max-width: 768px) {
  .preview-modal {
    max-width: 95vw;
    max-height: 90vh;
    margin: 20px;
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
  
  .preview-modal-header h3 {
    max-width: 250px;
  }

  /* 移动端适配 - 优化布局与间距 */
  .chat-container {
    width: 96%;
    margin: 20px auto;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .input-area {
    padding: 20px 0;
  }

  .chat-title {
    padding: 20px 24px;
    font-size: 1.3rem;
    border-radius: 20px 20px 0 0;
    justify-content: center;
    gap: 24px;
    display: flex;
    align-items: center;
    position: relative;
    min-height: 64px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .title-model-selector {
    position: static;
    left: auto;
    top: auto;
    transform: none;
    z-index: 1000;
  }

  .current-model {
    background: var(--secondary-color);
    padding: 8px 14px;
    border-radius: 12px;
    min-width: 130px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border-color);
  }

  .model-name {
    font-size: 12px;
    font-weight: 500;
  }

  .model-icon {
    font-size: 16px;
    width: 18px;
    height: 18px;
  }

  .dropdown-arrow {
    font-size: 11px;
  }

  .model-dropdown {
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    z-index: 1002;
    border: 1px solid var(--border-color);
  }

  .model-option {
    padding: 14px 16px;
    gap: 12px;
    border-radius: 12px;
    margin: 4px 8px;
  }

  .model-details .model-name {
    font-size: 13px;
    font-weight: 500;
  }

  .model-description {
    font-size: 11px;
    line-height: 1.4;
  }

  .title-text {
    display: none;
  }

  .rename-btn {
    left: 20px;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .title-edit-container {
    position: static;
    transform: none;
    width: 65%;
    max-width: 340px;
    min-width: 240px;
    left: auto;
    top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .title-input {
    min-width: 160px;
    font-size: 1.2rem;
    padding: 12px 20px;
    text-align: center;
    border-radius: 12px;
    border: 2px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .theme-toggle-btn {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    padding: 12px;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    line-height: 1;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .chat-messages {
    padding: 28px 24px;
    gap: 20px;
  }

  /* 聊天消息优化 - 占据更宽比例 */
  .message {
    max-width: 95%;
    padding: 24px 26px;
    margin-bottom: 28px;
    border-radius: 20px;
    font-size: 16px;
    line-height: 1.8;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border-color);
  }

  .plain-content,
  .thinking-text {
    font-size: 16px;
    line-height: 1.8;
  }

  .thinking-content {
    padding: 24px;
    margin-bottom: 24px;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .thinking-header {
    font-size: 15px;
    font-weight: 600;
  }

  /* 输入区域优化 */
  .input-area {
    padding: 20px 0;
    border-radius: 0 0 20px 20px;
    position: relative;
  }

  .input-content {
    padding: 0;
    padding-top: 0;
  }

  /* 移动端布局样式优化 */
  .input-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 0;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 20px 16px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  }

  /* 移动端输入框优化 */
  .input-controls input {
    order: 1;
    width: 100%;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 18px 16px;
    font-size: 17px;
    line-height: 1.5;
    color: var(--text-color);
    outline: none;
    box-shadow: none;
    margin: 0;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .input-controls input:focus {
    border: none;
    box-shadow: none;
  }

  .input-controls input::placeholder {
    color: var(--text-color);
    opacity: 0.65;
    font-size: 16px;
  }

  /* 移动端按钮容器优化 */
  .input-controls .button-group {
    order: 2;
  }

  .input-controls {
    position: relative;
  }

  /* 添加按钮优化 */
  .input-controls .add-btn {
    position: absolute;
    bottom: 20px;
    left: 16px;
    width: 64px;
    height: 52px;
    min-width: 64px;
    max-width: 64px;
    padding: 0;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    background: var(--secondary-color);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .input-controls .button-group {
    position: absolute;
    bottom: 20px;
    right: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .input-controls .add-btn:hover {
    background: var(--primary-color);
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(66, 153, 225, 0.25);
  }

  /* 操作按钮优化 */
  .input-controls .button-group .action-btn {
    width: 64px;
    height: 52px;
    min-width: 64px;
    max-width: 64px;
    padding: 0;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background: var(--secondary-color);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    font-weight: 600;
  }

  .input-controls .button-group .action-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(66, 153, 225, 0.25);
  }

  /* 为按钮留出空间 */
  .input-controls {
    padding-bottom: 88px;
  }

  /* 居中输入区域优化 */
  .input-area.centered {
    width: 92%;
    max-width: none;
    padding: 28px;
    top: 50%;
    border-radius: 28px;
    gap: 20px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(24px);
    border: 1px solid var(--border-color);
  }

  .input-area.centered .button-group {
    justify-content: center;
    gap: 16px;
    margin-top: 8px;
  }

  .input-area.centered input {
    padding: 20px 24px;
    font-size: 17px;
    line-height: 1.5;
    border-radius: 18px;
    min-height: 56px;
    border: 2px solid var(--border-color);
    background: var(--input-bg);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .input-area.centered .model-selector {
    padding: 14px 20px;
    border-radius: 16px;
    background: var(--secondary-color);
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .input-area.centered .model-selector select {
    padding: 12px 18px;
    font-size: 16px;
    border-radius: 12px;
    background: var(--input-bg);
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .input-area.centered .model-selector label {
    font-size: 14px;
    font-weight: 600;
  }

  .model-selector {
    min-width: auto;
    width: 100%;
  }

  .model-selector label {
    font-size: 14px;
    font-weight: 500;
  }

  .model-selector select {
    width: 100%;
    padding: 14px 18px;
    font-size: 16px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  input {
    padding: 18px 22px;
    font-size: 17px;
    line-height: 1.5;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 16px;
    justify-items: center;
    align-items: center;
  }

  button {
    padding: 16px 22px;
    font-size: 16px;
    border-radius: 14px;
    min-width: 88px;
    width: 100%;
    max-width: 140px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
  }

  .input-area.centered button:last-child {
    background: var(--primary-color);
    color: white;
    border: 1px solid var(--primary-color);
    font-weight: 700;
  }

  .input-area.centered button:not(:last-child) {
    background: var(--primary-color);
    color: white;
    border: 1px solid var(--primary-color);
  }

  .input-area.centered button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  }

  /* 操作按钮尺寸优化 */
  .action-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .action-btn svg {
    width: 20px;
    height: 20px;
  }

  .message-actions {
    opacity: 1;
    margin-top: 20px;
    gap: 12px;
  }

  .file-preview {
    margin-bottom: 20px;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .file-preview-header {
    padding: 18px;
    border-radius: 16px 16px 0 0;
  }

  .file-info {
    padding: 20px;
  }

  .file-info p {
    font-size: 15px;
    line-height: 1.6;
  }

  .preview-btn {
    padding: 12px 24px;
    font-size: 15px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .speech-error-indicator {
    padding: 12px 24px 0;
    font-size: 15px;
  }

  .listening-indicator {
    padding: 12px 24px 0;
  }

  .input-content {
    padding: 0;
    padding-top: 0;
  }



  .mobile-menu-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    padding: 0;
    margin: 0;
    flex-shrink: 0;
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
    background: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  .mobile-menu-btn:hover {
    background: var(--secondary-color);
    border-color: var(--secondary-color);
    transform: translateY(-50%) scale(1.05);
  }

  .mobile-menu-btn .menu-icon {
    line-height: 1;
  }



  .theme-toggle-btn {
    position: absolute !important;
    right: 12px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    padding: 0;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    background: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 1 !important;
    box-sizing: border-box;
  }

  .theme-toggle-btn:hover {
    background: var(--secondary-color);
    border-color: var(--secondary-color);
    transform: translateY(-50%) scale(1.05) !important;
  }

  .theme-toggle-btn .theme-icon {
    line-height: 1;
    display: block;
  }

  .share-btn {
    position: absolute !important;
    right: 60px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    padding: 0;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    background: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 1 !important;
    box-sizing: border-box;
  }

  .share-btn:hover {
    background: var(--secondary-color);
    border-color: var(--secondary-color);
    transform: translateY(-50%) scale(1.05) !important;
  }

  .share-btn .share-icon {
    line-height: 1;
    display: block;
  }

  /* 代码块移动端优化 */
  :deep(.code-block-container) {
    margin: 2em 0;
    border-radius: 16px;
  }

  :deep(.code-block-header) {
    padding: 14px 20px;
    font-size: 0.85em;
  }

  :deep(.copy-code-btn) {
    padding: 6px 12px;
    font-size: 0.8em;
  }

  :deep(pre) {
    font-size: 14px !important;
    padding: 20px !important;
    overflow-x: auto;
  }

  :deep(code) {
    font-size: 14px !important;
  }
}

/* 极小屏幕设备优化 */
@media (max-width: 360px) {
  .title-model-selector {
    margin-left: 20px;
  }
  
  .current-model {
    padding: 3px 5px;
    min-width: 70px;
  }
  
  .model-name {
    font-size: 8px;
  }
  
  .model-icon {
    font-size: 10px;
    width: 12px;
    height: 12px;
  }
  
  .dropdown-arrow {
    font-size: 6px;
  }
  
  .title-text {
    display: none;
  }

  .title-model-selector {
    position: static;
    left: auto;
    top: auto;
    transform: none;
    margin-left: 0;
  }
  
  .chat-title {
    padding: 12px 45px 12px 15px;
  }
  
  .title-edit-container {
    position: static;
    transform: none;
    width: 70%;
    max-width: 200px;
    min-width: 150px;
    left: auto;
    top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  
  .title-input {
    min-width: 100px;
    font-size: 0.9rem;
    padding: 6px 10px;
    text-align: center;
    border-radius: 6px;
  }
}

/* 中等屏幕优化 - 处理PC浏览器宽度较低的情况 */
@media (max-width: 1024px) and (min-width: 769px) {
  .title-model-selector {
    left: 50px;
  }
  
  .current-model {
    min-width: 140px;
    padding: 6px 10px;
  }
  
  .model-name {
    font-size: 11px;
  }
  
  /* 模型描述由Vue条件渲染控制显示 */
}

/* 小屏幕设备进一步优化 */
@media (max-width: 480px) {
  .chat-container {
    width: 98%;
    margin: 10px auto;
  }

  .chat-title {
    padding: 12px 50px 12px 20px;
    font-size: 1.1rem;
  }

  .title-model-selector {
    margin-left: 30px;
  }

  .current-model {
    padding: 4px 6px;
    border-radius: 6px;
    min-width: 80px;
  }

  .model-name {
    font-size: 9px;
  }

  /* 模型描述由Vue条件渲染控制显示 */

  .model-icon {
    font-size: 12px;
    width: 14px;
    height: 14px;
  }

  .dropdown-arrow {
    font-size: 8px;
  }

  .model-option {
    padding: 8px 10px;
    gap: 6px;
  }

  .model-details .model-name {
    font-size: 11px;
  }

  .model-description {
    font-size: 9px;
  }

  .title-text {
    max-width: 15ch; /* 限制为15个字符宽度 */
    font-size: 1rem;
  }

  .rename-btn {
    left: 16px;
    width: 36px;
    height: 36px;
  }

  .title-edit-container {
    position: static;
    transform: none;
    width: 55%;
    max-width: 260px;
    min-width: 180px;
    left: auto;
    top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .title-input {
    min-width: 120px;
    font-size: 1rem;
    padding: 8px 14px;
    text-align: center;
    border-radius: 6px;
  }

  .mobile-menu-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    padding: 0;
    margin: 0;
    flex-shrink: 0;
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
    background: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  .mobile-menu-btn:hover {
    background: var(--secondary-color);
    border-color: var(--secondary-color);
    transform: translateY(-50%) scale(1.05);
  }

  .theme-toggle-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    padding: 0;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    background: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .theme-toggle-btn:hover {
    background: var(--secondary-color);
    border-color: var(--secondary-color);
    transform: translateY(-50%) scale(1.05);
  }

  .chat-messages {
    padding: 20px 16px;
  }

  .message {
    max-width: 92%;
    padding: 18px 20px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .plain-content,
  .thinking-text {
    font-size: 14px;
    line-height: 1.6;
  }

  .thinking-content {
    padding: 18px;
  }

  .input-area {
    padding: 14px 0;
  }

  .input-area.centered {
    width: 96%;
    padding: 24px 0;
    top: 40%;
    border-radius: 18px;
  }

  /* 移动端欢迎界面样式 */
  .welcome-container {
    min-height: 60vh;
    padding: 20px 16px;
  }

  .welcome-content {
    max-width: 100%;
  }

  .welcome-header {
    margin-bottom: 32px;
  }

  .welcome-logo {
    font-size: 3rem;
    margin-bottom: 12px;
  }

  .welcome-title {
    font-size: 2.2rem;
    margin-bottom: 12px;
  }

  .welcome-description {
    font-size: 1rem;
    margin-bottom: 16px;
  }

  .example-questions {
    margin-top: 24px;
  }

  .example-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .example-item {
    padding: 16px;
    border-radius: 12px;
  }

  input {
    padding: 14px 18px;
    font-size: 16px;
  }

  button {
    padding: 12px 20px;
    font-size: 14px;
    min-width: 80px;
  }

  .model-selector select {
    padding: 10px 14px;
    font-size: 14px;
  }

  .action-btn {
    width: 32px;
    height: 32px;
  }
}

/* 分享模态框样式 */
.share-modal {
  background: var(--bg-color);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.share-modal-content {
  padding: 20px;
}

.share-options {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-color);
  text-align: center;
  width: 100%;
  min-height: 80px;
}

.share-option:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.share-icon {
  font-size: 20px;
  min-width: 24px;
}

.share-text {
  font-size: 14px;
  font-weight: 500;
}

/* 移动端分享模态框优化 */
@media (max-width: 768px) {
  .share-modal {
    max-width: 350px;
    width: 95%;
  }
  
  .share-modal-content {
    padding: 16px;
  }
  
  .share-options {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .share-option {
    padding: 12px 8px;
    min-height: 70px;
    font-size: 13px;
  }
  
  .share-icon {
    font-size: 18px;
  }
  
  .share-icon {
    font-size: 18px;
  }
  
  .share-text {
    font-size: 12px;
  }
}

.action-btn svg {
    width: 16px;
    height: 16px;
  }



  :deep(pre) {
    font-size: 13px !important;
    padding: 16px !important;
  }

  :deep(code) {
    font-size: 13px !important;
  }

</style>

<style>
/* 全局语法高亮样式 */
.hljs .hljs-keyword,
.hljs .hljs-selector-tag,
.hljs .hljs-literal,
.hljs .hljs-section,
.hljs .hljs-link {
  color: #c678dd !important;
  font-weight: 600 !important;
}

.hljs .hljs-function .hljs-keyword {
  color: #61afef !important;
}

.hljs .hljs-string,
.hljs .hljs-title,
.hljs .hljs-name,
.hljs .hljs-type,
.hljs .hljs-attribute,
.hljs .hljs-symbol,
.hljs .hljs-bullet,
.hljs .hljs-addition,
.hljs .hljs-variable,
.hljs .hljs-template-tag,
.hljs .hljs-template-variable {
  color: #98c379 !important;
}

.hljs .hljs-comment,
.hljs .hljs-quote,
.hljs .hljs-deletion,
.hljs .hljs-meta {
  color: #5c6370 !important;
  font-style: italic !important;
}

.hljs .hljs-number,
.hljs .hljs-regexp {
  color: #d19a66 !important;
}

.hljs .hljs-built_in,
.hljs .hljs-builtin-name {
  color: #e6c07b !important;
}

/* 流式文本样式 */
.streaming-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
}


</style>
