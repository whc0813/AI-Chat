<template>
  <div class="chat-wrapper">
     <div class="chat-title">
      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="toggleSidebar">
        <span class="menu-icon">☰</span>
      </button>
      
      <span
        class="title-text"
        v-if="!isRenaming"
        @dblclick="startRenaming"
      >{{ currentTitle || "新对话" }}</span>

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
      <button class="theme-toggle-btn" @click.stop="toggleTheme">
        <span class="theme-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
      </button>
    </div>
  <div class="chat-container">
    <div class="chat-messages" ref="chatMessages">
      <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
        <div v-if="message.type === 'combined'">
            <div v-if="message.thinking" class="thinking-content">
                <div class="thinking-header" @click="toggleThinking(index)">
                <span>思考过程：</span>
                <span class="toggle-icon">{{ isThinkingExpanded(index) ? '▼' : '▶' }}</span>
                </div>
                <div class="thinking-text" v-if="isThinkingExpanded(index)" v-html="renderMarkdown(message.thinking)"></div>
            </div>
            <div class="plain-content" v-html="renderMarkdown(message.content)"></div>
        </div>
        <div v-else class="plain-content" v-html="renderMarkdown(message.content)"></div>

        <div v-if="message.attachment" class="message-attachment-info" @click="openFilePreview(message.attachment)">
            <span class="file-icon">{{ getFileIcon(message.attachment.name) }}</span>
            <span>{{ message.attachment.name }}</span>
            <span class="preview-hint">点击预览</span>
        </div>

        <div v-if="message.role === 'assistant'" class="message-actions">
          <button class="action-btn" @click="copyMessage(message.content,$event)" title="复制">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="action-btn" @click="regenerateContent" title="重新生成">
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
          <div class="thinking-text" v-if="isCurrentThinkingExpanded" v-html="renderMarkdown(currentThinking)"></div>
        </div>
        <div v-if="currentAnswer" class="plain-content" v-html="renderMarkdown(currentAnswer)"></div>
        <div v-if="!currentAnswer && !currentThinking" class="loading-indicator">
          正在生成回复...
        </div>
      </div>
    </div>

    <div class="input-area" :class="{ 'centered': messages.length === 0 }">
      <div v-if="selectedFile" class="file-preview">
        <div class="file-preview-header">
          <span class="file-icon">{{ getFileIcon(selectedFile.name) }}</span>
          <span class="file-preview-name">{{ selectedFile.name }}</span>
          <button @click="removeFile" class="remove-file-btn">×</button>
        </div>
        
        <!-- 文件信息和预览按钮 -->
        <div class="file-preview-content">
          <div class="file-info">
            <p>文件大小: {{ formatFileSize(selectedFile.size) }}</p>
            <p>文件类型: {{ selectedFile.type || '未知' }}</p>
            <p>最后修改: {{ formatDate(selectedFile.lastModified) }}</p>
            <button @click="openFilePreview(selectedFile)" class="preview-btn">点击预览</button>
          </div>
        </div>
      </div>

      <div class="input-controls">
        <div class="top-controls">
          <div class="model-selector">
            <label>模型选择：</label>
            <select v-model="selectedModel" @change="changeModel">
              <option value="deepseek-chat">DeepSeek-V3-0324</option>
              <option value="deepseek-reasoner">DeepSeek-R1-0528</option>
              <option value="glm-4-flash">GLM-4-Flash</option>
            </select>
          </div>
          <input
            v-model="userInput"
            @keyup.enter="handleSend"
            placeholder="输入消息或上传文件..."
            :disabled="isGenerating"
          />
           <input
            type="file"
            ref="fileInput"
            @change="handleFileChange"
            style="display: none"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.txt,text/plain"
          />
        </div>
        <div class="button-group">
        <button @click="triggerFileUpload" :disabled="isGenerating" title="上传文件">
          📎
        </button>
        <button
          @click="toggleVoiceInput"
          :class="{ active: isSpeechRecognizing,disabled: isGenerating}"
          :disabled="!isSpeechSupported || isGenerating"
          title="语音输入"
        >
          🎤
        </button>
        <button
          @click="isGenerating ? stopGeneration() : handleSend()"
          :class="{ 'stop-btn': isGenerating }">
          {{ isGenerating ? '停止' : '发送' }}
        </button>
        <button
        @click="$emit('clear-chat')"
        :disabled="isGenerating"
        >
          清空
        </button>
        </div>
      </div>
    </div>

    <div v-if="isSpeechRecognizing" class="listening-indicator">
      正在聆听中...
    </div>
    <div v-if="speechError" class="speech-error-indicator">
      {{ speechError }}
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
 </div>
 </template>

<script>
import { chatWithAI, cancelAllRequests } from '../api/chat';
import { marked } from 'marked';
import hljs from 'highlight.js';
// 移除默认主题CSS，使用自定义语法高亮样式
// import 'highlight.js/styles/base16/dracula.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export default {
  props: {
    messages: {
      type: Array,
      required: true
    },
    currentModel: {
      type: String,
      default: 'deepseek-chat'
    },
    currentTitle: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      userInput: '',
      selectedModel: this.currentModel,
      isSpeechRecognizing: false,
      recognition: null,
      stopTimer: null,
      isSpeechSupported: false,
      speechError: '',
      isStreaming: false,
      currentThinking: '',
      currentAnswer: '',
      expandedThinking: {},
      isCurrentThinkingExpanded: true,
      isGenerating: false,
      isDarkMode: false,
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

    };
  },
  watch: {
    messages() {
      this.$nextTick(() => {
        const container = this.$refs.chatMessages;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
        // 重新应用语法高亮
        this.applyCodeHighlighting();
      });
    }
  },
  created() {
    const savedTheme = localStorage.getItem('darkMode');
    this.isDarkMode = savedTheme !== null ? JSON.parse(savedTheme) : true;
  },
  mounted() {
    this.initSpeechRecognition();
    marked.setOptions({
      breaks: true,
      gfm: true,
       highlight: (code, lang) => {
        const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        try {
            const result = hljs.highlight(code, { language: validLang, ignoreIllegals: true });
            console.log('Highlight result for', validLang, ':', result.value.substring(0, 200));
            // 手动添加基础样式类
            return `<span class="hljs">${result.value}</span>`;
        } catch (e) {
            console.error('Code highlighting error:', e);
            return `<span class="hljs">${code}</span>`;
        }
      }
    });
    this.$nextTick(() => {
      this.setupCopyButtons();
      this.applyCodeHighlighting();
    });
    document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
  },
  methods: {
    renderMarkdown(content) {
        if (!content) return '';
        try {
            const katexBlocks = [];
            content = content.replace(/(\$\$|\\\[)([\s\S]+?)(\$\$|\\\])/g, (match) => {
                const key = `KATEX_BLOCK_${katexBlocks.length}`;
                katexBlocks.push({ key, content: match, block: true });
                return key;
            });
            content = content.replace(/(?<!\\)(\$|\\\()([\s\S]+?)(\$|\\\))/g, (match, p1, p2, p3) => {
                if (!p2.trim() || p2.match(/\s/)) {
                    return match;
                }
                const key = `KATEX_BLOCK_${katexBlocks.length}`;
                katexBlocks.push({ key, content: match, block: false });
                return key;
            });

            let html = marked(content);
            
            html = html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (_, lang, code) => this._wrapCodeBlock(lang, code))
                     .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, code) => this._wrapCodeBlock('plaintext', code));

            katexBlocks.forEach(({ key, content: formula, block }) => {
                try {
                    let renderedKatex;
                    const formulaContent = formula.replace(/^(\$\$|\\\[|\$|\\\()|(\$\$|\\\]|\$|\\\))$/g, '');
                    renderedKatex = katex.renderToString(formulaContent, {
                        throwOnError: false,
                        displayMode: block
                    });
                    html = html.replace(key, renderedKatex);
                } catch(e) {
                    console.error("KaTeX rendering error:", e);
                    html = html.replace(key, `<span class="formula-error">${formula}</span>`);
                }
            });
            return html;

        } catch (error) {
            console.error('Markdown rendering error:', error);
            return '<div class="render-error">内容渲染失败</div>';
        }
    },
    _wrapCodeBlock(language, highlightedCode) {
        const lang = language || 'plaintext';
        const showPreviewBtn = lang.toLowerCase() === 'html';
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
                <pre class="custom-code-block"><code class="hljs language-${lang}">${highlightedCode}</code></pre>
            </div>
        `;
    },
    setupCopyButtons() {
      this.$el.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-code-btn');
        const previewBtn = e.target.closest('.preview-html-btn');
        
        if (copyBtn) {
          e.preventDefault();
          e.stopPropagation();
          const codeBlock = copyBtn.closest('.code-block-container').querySelector('code');
          const code = codeBlock.textContent;
          navigator.clipboard.writeText(code).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ 已复制';
              setTimeout(() => {
               copyBtn.innerHTML = originalHTML;
             }, 2000);
          }).catch((err) => {
            console.error('复制失败:', err);
          });
        }
        
        if (previewBtn) {
          e.preventDefault();
          e.stopPropagation();
          const codeBlock = previewBtn.closest('.code-block-container').querySelector('code');
          const htmlCode = codeBlock.textContent;
          this.openHtmlPreview(htmlCode);
        }
      });
    },
    applyCodeHighlighting(streamingOnly = false) {
      // 手动对代码块应用语法高亮
      let selector = 'pre code';
      if (streamingOnly) {
        // 流式输出时只处理当前流式消息中的代码块
        selector = '.message.assistant:last-child pre code';
      }
      
      const codeBlocks = this.$el.querySelectorAll(selector);
      codeBlocks.forEach(block => {
        if (!block.classList.contains('hljs')) {
          block.classList.add('hljs');
        }
        // 重新应用highlight.js
        hljs.highlightElement(block);
      });
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
    async handleSend() {
        if (this.isGenerating) return;
        const userText = this.userInput.trim();
        const file = this.selectedFile;
        if (!userText && !file) return;

        this.isGenerating = true;
        this.isStreaming = true;
        this.currentThinking = '';
        this.currentAnswer = '';
        this.isCurrentThinkingExpanded = true;
        
        const userMessageForUI = {
            role: 'user',
            content: userText,
            type: 'simple',
            attachment: null,
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
                this.isGenerating = false;
                this.isStreaming = false;
                return;
            }
        }

        this.$emit('send-message', userMessageForUI);
        
        this.userInput = '';
        this.removeFile();

        await this.$nextTick();

        try {
            const messagesForAPI = this.formatMessagesForAPI(this.messages);
            await chatWithAI(
                messagesForAPI,
                this.selectedModel,
                (content, type) => {
                    if (type === 'thinking') {
                        this.currentThinking += content;
                    } else {
                        this.currentAnswer += content;
                    }
                }
            );

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
            this.isGenerating = false;
            this.isStreaming = false;
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
            this.isGenerating = true;
            this.isStreaming = true;
            this.currentThinking = '';
            this.currentAnswer = '';
            this.isCurrentThinkingExpanded = true;
            
            const lastAssistantIndex = this.messages.map(m => m.role).lastIndexOf('assistant');
            if (lastAssistantIndex > -1) {
                this.$emit('delete-message', lastAssistantIndex);
            }

            await this.$nextTick();

            try {
                const messagesForAPI = this.formatMessagesForAPI(this.messages);
                await chatWithAI(
                    messagesForAPI,
                    this.selectedModel,
                    (content, type) => {
                        if (type === 'thinking') {
                            this.currentThinking += content;
                        } else {
                            this.currentAnswer += content;
                        }
                    }
                );
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
                this.isGenerating = false;
                this.isStreaming = false;
            }
        }
    },
    addAIMessage() {
        const aiMessage = {
            role: 'assistant',
            content: this.currentAnswer,
            type: this.selectedModel === 'deepseek-reasoner' ? 'combined' : 'simple',
            isStreaming: false
        };
        if (this.selectedModel === 'deepseek-reasoner') {
            aiMessage.thinking = this.currentThinking;
            aiMessage.isThinkingExpanded = true;
        }
        this.$emit('send-message', aiMessage);
        
        // 确保新添加的消息应用语法高亮
        this.$nextTick(() => {
            // 只对最后一条消息应用语法高亮，避免性能问题
            const lastMessage = this.$el.querySelector('.message.assistant:last-child');
            if (lastMessage) {
                const codeBlocks = lastMessage.querySelectorAll('pre code');
                codeBlocks.forEach(block => {
                    if (!block.classList.contains('hljs')) {
                        block.classList.add('hljs');
                    }
                    hljs.highlightElement(block);
                });
            }
            this.setupCopyButtons();
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
        this.isGenerating = false;
        this.isStreaming = false;
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
          if (this.currentAnswer || this.currentThinking) {
            lastMessage.content = this.currentAnswer;
            lastMessage.thinking = this.currentThinking;
            lastMessage.type = this.selectedModel === 'deepseek-reasoner' ? 'combined' : 'simple';
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
      document.body.appendChild(feedbackEl);
      if (triggerBtn) {
        const rect = triggerBtn.getBoundingClientRect();
        feedbackEl.style.top = `${rect.top - 30}px`;
        feedbackEl.style.left = `${rect.left + rect.width / 2 - 50}px`;
      } else {
        feedbackEl.style.top = '20px';
        feedbackEl.style.right = '20px';
      }
      navigator.clipboard.writeText(content).then(() => {
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

      }).catch((error) => {
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
      });
    },
    initSpeechRecognition() {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        this.isSpeechSupported = false;
        console.warn('您的浏览器不支持语音识别API');
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'zh-CN';
      this.recognition.interimResults = false;
      this.recognition.continuous = false;
      this.isSpeechSupported = true;
      this.recognition.onstart = () => { this.isSpeechRecognizing = true; this.speechError = ''; };
      this.recognition.onresult = (event) => { const transcript = event.results[0][0].transcript; this.userInput = this.userInput ? this.userInput + ' ' + transcript : transcript; };
      this.recognition.onerror = (event) => {
        let errorMessage = '发生未知错误，语音识别失败。';
        switch (event.error) {
          case 'no-speech': errorMessage = '未检测到语音，请重试。'; break;
          case 'audio-capture': errorMessage = '无法访问麦克风，请检查设备是否连接正常。'; break;
          case 'not-allowed': errorMessage = '语音权限被拒绝，请在浏览器设置中允许麦克风访问。'; break;
          case 'network': errorMessage = '网络错误，语音识别服务不可用。'; break;
        }
        this.speechError = errorMessage;
        this.stopVoiceInput();
        setTimeout(() => this.speechError = '', 5000);
      };
      this.recognition.onend = () => { this.isSpeechRecognizing = false; if (this.stopTimer) { clearTimeout(this.stopTimer); this.stopTimer = null; } };
    },
    toggleVoiceInput() {
      if (this.debounceTimer) { clearTimeout(this.debounceTimer); }
      this.debounceTimer = setTimeout(() => {
        if (this.isSpeechRecognizing) { this.stopVoiceInput(); } else { this.startVoiceInput(); }
        this.debounceTimer = null;
      }, 200);
    },
    startVoiceInput() {
      if (!this.recognition || this.isSpeechRecognizing) { return; }
      this.speechError = '';
      try {
        this.isSpeechRecognizing = true;
        this.recognition.start();
        this.stopTimer = setTimeout(() => { if (this.isSpeechRecognizing) { this.stopVoiceInput(); } }, 60000);
      } catch (error) {
        this.isSpeechRecognizing = false;
        this.speechError = '无法启动语音识别服务。';
        setTimeout(() => this.speechError = '', 5000);
      }
    },
    stopVoiceInput() {
      if (this.recognition && this.isSpeechRecognizing) {
        try { this.recognition.stop(); } catch (error) { console.error('停止语音识别失败:', error); }
      }
      this.isSpeechRecognizing = false;
      if (this.stopTimer) { clearTimeout(this.stopTimer); this.stopTimer = null; }
    },
    async generateTitleFromConversation() {
        if (!this.currentAnswer && !this.currentThinking) {
        const userMessage = this.messages.find(m => m.role === 'user')?.content || '';
        const fallbackTitle = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
        this.$emit('update-title', fallbackTitle);
        return;
        }
        try {
        let title = '';
        await chatWithAI(
            [
            { role: "system", content: "你是一个专业的对话标题总结助手。请仔细分析对话的核心主题和关键内容，生成一个准确、简洁的标题。\n\n要求：\n1. 标题应准确反映对话的主要内容或问题\n2. 优先提取用户的具体问题、需求或讨论的主题\n3. 避免使用模糊的词汇，如'问题'、'咨询'、'讨论'等\n4. 长度控制在8-12个字之间\n5. 使用中文，语言简洁明了\n6. 以流式方式逐字输出标题，不要包含引号或其他符号" },
            { role: "user", content: `请为以下对话生成标题:\n用户: ${this.messages.find(m => m.role === 'user')?.content}\nAI: ${this.currentAnswer}` }
            ],
            "deepseek-chat",
            (content, type) => {
            if (type === 'answer') { title += content; this.$emit('update-title-stream', title.trim()); }
            }
        );
        this.$emit('update-title', title.trim());
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
      }

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

/* 现有样式... */
.input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: var(--gradient-secondary);
  border-top: 1px solid var(--border-color);
  position: relative;
  backdrop-filter: blur(20px);
  border-radius: 0 0 16px 16px;
}

.input-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
}

.input-area.centered .input-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}

.input-area.centered .top-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.top-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.input-area.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  z-index: 20;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.input-area.centered .model-selector {
  align-self: center;
}

.input-area.centered input {
  text-align: center;
  font-size: 16px;
  padding: 14px 20px;
}

.button-group {
  display: flex;
  gap: 16px;
  align-items: center;
}

.input-area.centered .button-group {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}
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
.title-text {
  display: inline-block;
  max-width: 60%;
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
.chat-container {
  width: 85%;
  max-width: 1200px;
  margin: 0 auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg);
  border-radius: 16px;
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
  padding: 32px;
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
  margin-bottom: 24px;
  padding: 20px 24px;
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
  line-height: 1.7;
  font-size: 15px;
  color: var(--text-color);
}
.plain-content p,
.thinking-text p {
  margin: 0.7em 0;
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
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  background-color: var(--input-bg);
  color: var(--text-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  transform: scale(1);
}
input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15), var(--shadow-md);
  background-color: var(--card-bg);
  transform: scale(1.02);
}
input::placeholder {
  color: var(--text-color);
  opacity: 0.5;
}
input:focus::placeholder {
  opacity: 0.3;
}
button {
  padding: 10px 16px;
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
}

.listening-indicator {
  padding: 8px 20px 0;
  color: var(--primary-color);
  font-size: 14px;
  text-align: center;
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
.action-btn {
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
.action-btn:hover {
  background: var(--primary-color);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}
.action-btn svg {
  width: 14px;
  height: 14px;
  stroke: var(--text-color);
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
/* 代码块容器样式 */
:deep(.code-block-container) {
  position: relative;
  margin: 2em 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: var(--code-bg);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
}



/* 代码块头部样式 */
:deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--secondary-color), var(--card-bg));
  color: var(--text-color);
  font-size: 0.9em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
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

/* 复制按钮样式 */
:deep(.copy-code-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color);
  font-size: 0.8em;
  transition: all 0.2s ease;
}

:deep(.copy-code-btn:hover) {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
}

/* HTML预览按钮样式 */
:deep(.preview-html-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  background: var(--action-btn-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-color);
  font-size: 0.8em;
  transition: all 0.2s ease;
}

:deep(.preview-html-btn:hover) {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.3);
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


/* 代码内容区域样式 */
:deep(pre.custom-code-block) {
  margin: 0;
  border-radius: 0;
  background: var(--code-bg);
  position: relative;
  overflow: hidden;
}

:deep(pre.custom-code-block code) {
  display: block;
  padding: 1.5rem 2rem;
  overflow-x: auto;
  font-size: 0.95em;
  line-height: 1.7;
  tab-size: 2;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: var(--text-color);
  background: transparent;
  scrollbar-width: thin;
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

/* 语法高亮样式 - 全局样式 */
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

:deep(.hljs-subst) {
  color: #e06c75;
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

:deep(pre.custom-code-block code::-webkit-scrollbar) {
  height: 8px;
}

:deep(pre.custom-code-block code::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(pre.custom-code-block code::-webkit-scrollbar-thumb) {
  background: var(--primary-color);
  border-radius: 4px;
}

:deep(pre.custom-code-block code::-webkit-scrollbar-thumb:hover) {
  background: var(--primary-hover);
}

/* 内联代码样式 */
:deep(:not(pre) > code) {
  padding: 0.3em 0.6em;
  margin: 0 0.1em;
  font-size: 0.9em;
  background: linear-gradient(135deg, var(--code-bg), var(--card-bg));
  border-radius: 8px;
  color: var(--primary-color);
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  border: 1px solid var(--border-color);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}



/* 复制反馈样式 */
.copy-feedback {
  position: fixed;
  min-width: 120px;
  padding: 8px 16px;
  border-radius: 4px;
  background: var(--secondary-color);
  color: white;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
}

.copy-feedback.show {
  opacity: 1;
  transform: translateY(0);
}

.copy-feedback.success {
  background: #48bb78;
}

.copy-feedback.error {
  background: #f56565;
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

/* 移动端菜单按钮 - 默认隐藏 */
.mobile-menu-btn {
  display: none;
}

/* 移动端响应式设计 */
@media (max-width: 768px) {
  .preview-modal {
    max-width: 95vw;
    max-height: 90vh;
    margin: 20px;
  }
  
  .preview-modal-header h3 {
    max-width: 250px;
  }

  /* 移动端适配 - 优化布局 */
  .chat-container {
    width: 96%;
    margin: 15px auto;
    border-radius: 16px;
  }

  .chat-title {
    padding: 16px 20px;
    font-size: 1.2rem;
    border-radius: 16px 16px 0 0;
    justify-content: center;
    gap: 12px;
    display: flex;
    align-items: center;
    position: relative;
  }

  .title-text {
    flex: 1;
    text-align: center;
    font-size: 1.1rem;
    margin: 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
  }

  .rename-btn {
    left: 18px;
    width: 40px;
    height: 40px;
  }

  .title-edit-container {
    width: 50%;
    max-width: 320px;
    min-width: 220px;
  }

  .title-input {
    min-width: 140px;
    font-size: 1.1rem;
    padding: 10px 16px;
  }

  .theme-toggle-btn {
    position: static;
    width: 40px;
    height: 40px;
    padding: 8px;
    margin: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
  }

  .chat-messages {
    padding: 24px 20px;
  }

  .message {
    max-width: 88%;
    padding: 20px 22px;
    margin-bottom: 24px;
    border-radius: 16px;
    font-size: 15px;
  }

  .plain-content,
  .thinking-text {
    font-size: 15px;
    line-height: 1.7;
  }

  .thinking-content {
    padding: 20px;
    margin-bottom: 20px;
  }

  .thinking-header {
    font-size: 14px;
  }

  .input-area {
    padding: 16px;
    border-radius: 0 0 16px 16px;
  }

  .input-area.centered {
    width: 94%;
    max-width: none;
    padding: 28px;
    top: 45%;
    border-radius: 20px;
  }

  .input-area.centered .top-controls {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .input-area.centered .button-group {
    justify-content: center;
    gap: 16px;
  }

  .input-controls {
    flex-direction: column;
    gap: 16px;
  }

  .top-controls {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .model-selector {
    min-width: auto;
    width: 100%;
  }

  .model-selector label {
    font-size: 13px;
  }

  .model-selector select {
    width: 100%;
    padding: 12px 16px;
    font-size: 15px;
  }

  input {
    padding: 16px 20px;
    font-size: 16px;
    border-radius: 12px;
  }

  .button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 12px;
    justify-items: center;
    align-items: center;
  }

  button {
    padding: 14px 20px;
    font-size: 15px;
    border-radius: 10px;
    min-width: 80px;
    width: 100%;
    max-width: 120px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  .action-btn svg {
    width: 18px;
    height: 18px;
  }

  .message-actions {
    opacity: 1;
    margin-top: 16px;
  }

  .file-preview {
    margin-bottom: 16px;
  }

  .file-preview-header {
    padding: 14px;
  }

  .file-info {
    padding: 16px;
  }

  .file-info p {
    font-size: 14px;
  }

  .preview-btn {
    padding: 10px 20px;
    font-size: 14px;
  }

  .speech-error-indicator {
    padding: 8px 20px 0;
    font-size: 14px;
  }

  .listening-indicator {
    padding: 8px 20px 0;
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

/* 小屏幕设备进一步优化 */
@media (max-width: 480px) {
  .chat-container {
    width: 98%;
    margin: 10px auto;
  }

  .chat-title {
    padding: 16px 50px 16px 20px;
    font-size: 1.1rem;
  }

  .title-text {
    max-width: 50%;
    font-size: 1.1rem;
  }

  .rename-btn {
    left: 16px;
    width: 36px;
    height: 36px;
  }

  .title-edit-container {
    width: 45%;
    max-width: 260px;
    min-width: 200px;
  }

  .title-input {
    min-width: 120px;
    font-size: 1rem;
    padding: 8px 14px;
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
    padding: 14px;
  }

  .input-area.centered {
    width: 96%;
    padding: 24px;
    top: 40%;
    border-radius: 18px;
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
</style>
