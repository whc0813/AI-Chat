<template>
  <div id="app" :class="{'dark-mode': isDarkMode}">
    <div class="app-container">
      <Sidebar
        ref="sidebar"
        :conversations="sortedConversations"
        :currentConversationIndex="currentConversationIndex"
        :isGenerating="isGenerating"
        @update-conversations="updateConversations"
        @new-chat="newChat"
        @switch-conversation="switchConversation"
        @delete-conversation="deleteConversation"
        @export-chats="exportChats"
        @clear-all-chats="clearAllChats"
        @export-chat="exportChat"
        @rename-conversation="renameConversation"
        @sidebar-toggle="handleSidebarToggle"
        @open-settings="openSettingsModal"
      />
      <div class="main-content">
        <ChatContainer
          :messages="currentMessages"
          :current-model="currentConversation.model"
          :current-title="currentConversation.title"
          :user-input="userInput"
          :is-generating="isGenerating"

          :is-deep-thinking="isDeepThinking"
          @send-message="handleSendMessage"
          @delete-message="handleDeleteMessage"
          @clear-chat="clearCurrentChat"
          @model-changed="updateModel"
          @theme-changed="handleThemeChange"
          @update-title="handleUpdateTitle"
          @toggle-sidebar="toggleSidebar"
          @generating-changed="handleGeneratingChanged"
          @input-changed="handleInputChanged"
          @send-user-message="handleSendUserMessage"
          @quote-message="handleQuoteMessage"
          ref="chatContainer"
        />
        
        <!-- 输入区域移动到这里 -->
        <div class="input-area" v-show="shouldShowInputArea">
          <div class="input-content">
            <div v-if="selectedFile" class="file-preview">
              <div class="file-preview-header">
                <span class="file-icon">{{ getFileIcon(selectedFile.name) }}</span>
                <span class="file-preview-name">{{ selectedFile.name }}</span>
                <button @click="removeFile" class="remove-file-btn">×</button>
              </div>
              
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
              <div class="add-btn-container" :class="{ 'dropdown-open': showAddDropdown }">
                <button class="add-btn" @click="toggleAddDropdown" :disabled="isGenerating" title="添加选项">
                  +
                </button>
                <div v-if="showAddDropdown" class="add-dropdown" @click.stop>
                  <div class="dropdown-item" @click="triggerFileUpload">
                    <span class="dropdown-icon">📎</span>
                    <span class="dropdown-text">上传文件</span>
                  </div>
                </div>
              </div>
              <div class="chat-input" @click="focusTextInput" contenteditable="true" ref="textInput" @input="handleTextInput" @keydown="handleInputKeyDown" placeholder="询问任何问题">
              </div>
              <input
                type="file"
                ref="fileInput"
                @change="handleFileChange"
                style="display: none"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.txt,text/plain,.md,text/markdown"
              />
              <!-- 深度思考开关按钮 -->
              <div class="deep-thinking-toggle" :class="{ disabled: !isDeepSeekModel }" :title="!isDeepSeekModel ? '仅 DeepSeek 模型支持' : ''">
                <button 
                  class="thinking-toggle-btn"
                  :class="{ active: isDeepThinking, disabled: !isDeepSeekModel }"
                  @click="toggleDeepThinking"
                  :disabled="!isDeepSeekModel"
                >
                  <span class="toggle-text sm:inline hidden">深度思考</span>
                  <span class="toggle-icon sm:hidden">🧠</span>
                </button>
              </div>
              <div class="button-group">
                <button 
                  class="action-btn"
                  @click="toggleVoiceInput"
                  :class="{ active: isSpeechRecognizing, disabled: isGenerating }"
                  :disabled="!isSpeechSupported || isGenerating"
                  title="语音输入">
                  🎤
                </button>
                <button
                  class="action-btn send-btn"
                  @click="isGenerating ? stopGeneration() : handleSend()"
                  :class="{ 'stop-btn': isGenerating }"
                  title="发送消息">
                  {{ isGenerating ? '⏹' : '⚡' }}
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
      </div>
    </div>
    
    <!-- 设置模态框 -->
    <SettingsModal 
      v-if="isSettingsModalVisible" 
      @close="closeSettingsModal" 
    />
    

  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import ChatContainer from './components/ChatContainer.vue';
import SettingsModal from './components/SettingsModal.vue';

export default {
  name: 'App',
  components: {
    Sidebar,
    ChatContainer,
    SettingsModal
  },
  data() {
    const savedConversations = JSON.parse(localStorage.getItem('conversations'));
    return {
      isDarkMode: false,
      isGenerating: false,
      conversations: savedConversations || [{
        id: this.generateId(),
        title: '新对话',
        messages: [], // messages 数组现在会包含带有 attachment 的对象
        model: 'deepseek-chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      currentConversationIndex: 0,
      saveTimer: null,
      isSettingsModalVisible: false,
      // 侧边栏状态
      isSidebarCollapsed: true,
      showInputAreaDelayed: true,
      inputAreaTimer: null,
      // 输入框相关状态
      userInput: '',
      selectedFile: null,
      // 语音识别相关状态
      isSpeechRecognizing: false,
      recognition: null,
      stopTimer: null,
      isSpeechSupported: false,
      speechError: '',
      finalTranscript: '',      // 存储已确认的最终文本
      interimTranscript: '',    // 存储实时的、未确认的文本
      autoSendTimer: null,      // 用于自动发送的计时器
      debounceTimer: null,
      // 下拉菜单状态
      showAddDropdown: false,
      // 深度思考开关
      isDeepThinking: false
    };
  },
  // ... computed, watch, mounted, methods 等部分与上一轮回复中的代码相同，无需修改 ...
  computed: {
    currentConversation() {
      return this.conversations[this.currentConversationIndex] || {};
    },
    currentMessages() {
      return this.currentConversation.messages || [];
    },
    shouldShowInputArea() {
      // 在移动端，只有当侧边栏收起且延迟时间到达时才显示输入区域
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        return this.isSidebarCollapsed && this.showInputAreaDelayed;
      }
      // 桌面端始终显示
      return this.showInputAreaDelayed;
    },
    sortedConversations() {
      // 使用缓存机制优化性能
      const cacheKey = this.conversations.map(c => `${c.id}-${c.updatedAt || c.createdAt}`).join('|');
      if (this._sortedConversationsCache && this._sortedConversationsCacheKey === cacheKey) {
        return this._sortedConversationsCache;
      }
      
      const result = [...this.conversations].map((conv, index) => ({
        ...conv,
        originalIndex: index
      })).sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt;
        const timeB = b.updatedAt || b.createdAt;
        return new Date(timeB) - new Date(timeA);
      });
      
      this._sortedConversationsCache = result;
      this._sortedConversationsCacheKey = cacheKey;
      return result;
    },
    hasVoiceContent() {
      return this.finalTranscript || this.interimTranscript;
    },
    isDeepSeekModel() {
      return this.currentConversation.model && this.currentConversation.model.startsWith('deepseek');
    }
  },
  watch: {
    conversations: {
      handler(newVal) {
        // 使用防抖优化localStorage写入性能
        if (this.saveTimer) {
          clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
          try {
            localStorage.setItem('conversations', JSON.stringify(newVal));
          } catch (error) {
            console.error('保存对话到localStorage失败:', error);
          }
        }, 500); // 500ms防抖
      },
      deep: true
    }
  },
  mounted() {
      const savedTheme = localStorage.getItem('darkMode');
      this.isDarkMode = savedTheme !== null ? JSON.parse(savedTheme) : true;
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark-mode');
      }
      
      // 初始化侧边栏状态
      const savedSidebarState = localStorage.getItem('sidebarCollapsed');
      this.isSidebarCollapsed = savedSidebarState !== null ? JSON.parse(savedSidebarState) : true;
      
      // 初始化输入区域延迟显示状态
      this.showInputAreaDelayed = true;
      
      // 添加窗口大小变化监听器
      this.handleResize = () => {
        // 在桌面端确保输入区域显示
        if (typeof window !== 'undefined' && window.innerWidth > 768) {
          this.showInputAreaDelayed = true;
        }
        this.$forceUpdate(); // 强制更新以重新计算shouldShowInputArea
      };
      window.addEventListener('resize', this.handleResize);
      
      // 监听点击外部关闭下拉菜单（支持桌面端和移动端）
      document.addEventListener('click', this.handleClickOutside);
      document.addEventListener('touchstart', this.handleClickOutside);
      
      // 初始化语音识别
      this.initSpeechRecognition();
      
      // 添加全局快捷键监听器
      window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeDestroy() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    if (this.inputAreaTimer) {
      clearTimeout(this.inputAreaTimer);
    }
    // 清理窗口大小变化监听器
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    // 清理点击外部事件监听器
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('touchstart', this.handleClickOutside);
    
    // 清理全局快捷键监听器
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {

    handleUpdateTitle(finalTitle) {
      const currentConv = this.conversations[this.currentConversationIndex];
      if(currentConv) {
        // Vue 3 中直接赋值即可触发响应式更新
        currentConv.title = finalTitle;
        currentConv.updatedAt = new Date().toISOString();
        // 清除缓存以确保sortedConversations重新计算
        this._sortedConversationsCache = null;
        this._sortedConversationsCacheKey = null;
      }
    },
    handleThemeChange(isDarkMode) {
      this.isDarkMode = isDarkMode;
    },
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    newChat() {
      const newConversation = {
        id: this.generateId(),
        title: '新对话',
        messages: [],
        model: 'deepseek-chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.conversations.push(newConversation);
      this.currentConversationIndex = this.conversations.length - 1;
    },
    switchConversation(index) {
      // 如果正在进行语音识别，先停止
      if (this.isSpeechRecognizing) {
        this.stopVoiceInput();
      }
      this.currentConversationIndex = index;
      
      // 在移动端视图下且侧边栏展开时，调用子组件方法关闭侧边栏
      if (typeof window !== 'undefined' && window.innerWidth <= 768 && !this.isSidebarCollapsed) {
        if (this.$refs.sidebar) {
          this.$refs.sidebar.toggleCollapse();
        }
      }
    },
    deleteConversation(index) {
      if (this.conversations.length <= 1) {
        alert('至少需要保留一个对话');
        return;
      }
      this.conversations.splice(index, 1);
      if (this.currentConversationIndex >= index) {
        this.currentConversationIndex = Math.max(0, this.currentConversationIndex - 1);
      }
    },
    exportChat(format = 'json') {
      const currentConv = this.conversations[this.currentConversationIndex];
      if (!currentConv) return;

      // 检查对话是否为空
      if (!currentConv.messages || currentConv.messages.length === 0) {
        alert('当前对话为空，无法导出');
        return;
      }

      // 使用对话标题作为文件名，清理特殊字符
      const safeTitle = currentConv.title.replace(/[<>:"/\\|?*]/g, '_').trim();
      const baseFileName = safeTitle || 'untitled_chat';

      switch (format) {
        case 'json':
          this.exportToJson(currentConv, baseFileName);
          break;
        case 'md':
          this.exportToMarkdown(currentConv, baseFileName);
          break;
        case 'html':
          this.exportToHtml(currentConv, baseFileName);
          break;
        case 'image':
          this.exportToImage(currentConv, baseFileName);
          break;
        default:
          this.exportToJson(currentConv, baseFileName);
      }
    },

    exportToJson(conversation, fileName) {
      const dataStr = JSON.stringify([conversation], null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      this.downloadFile(dataUri, `${fileName}.json`);
    },

    exportToMarkdown(conversation) {
      let markdown = `# ${conversation.title}\n\n`;
      markdown += `**创建时间:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
      markdown += `**更新时间:** ${new Date(conversation.updatedAt).toLocaleString()}\n`;
      markdown += `**模型:** ${conversation.model}\n\n`;
      markdown += '---\n\n';

      conversation.messages.forEach((message, index) => {
        if (message.role === 'user') {
          markdown += `**用户:**\n\n${message.content}\n\n`;
        } else if (message.role === 'assistant') {
          markdown += `**AI助手:**\n\n`;
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
    },

    exportToHtml(conversation) {
      const markdownRenderer = this.$refs.chatContainer?.markdownRenderer;
      if (!markdownRenderer) {
        alert('Markdown渲染器未准备就绪，请稍后再试');
        return;
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
    <p><strong>模型:</strong> ${conversation.model}</p>
  </div>
`;

      conversation.messages.forEach(message => {
        const messageClass = message.role === 'user' ? 'user-message' : 'assistant-message';
        const roleText = message.role === 'user' ? '用户' : 'AI助手';
        
        html += `  <div class="message ${messageClass}">
`;
        html += `    <div class="role">${roleText}</div>
`;
        
        if (message.role === 'assistant' && message.type === 'combined' && message.thinking) {
          html += `    <div class="thinking">
`;
          html += `      <div class="thinking-title">思考过程:</div>
`;
          html += `      <div>${markdownRenderer.render(message.thinking)}</div>
`;
          html += `    </div>
`;
        }
        
        html += `    <div>${markdownRenderer.render(message.content)}</div>
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
    },

    async exportToImage(conversation) {
      try {
        // 动态导入html2canvas库
        const html2canvas = (await import('html2canvas')).default;

        // 获取HTML内容
        const markdownRenderer = this.$refs.chatContainer?.markdownRenderer;
        if (!markdownRenderer) {
          alert('Markdown渲染器未准备就绪，请稍后再试');
          return;
        }

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
            content += `<div style="font-size: 13px; line-height: 1.5;">${markdownRenderer.render(message.thinking)}</div>`;
            content += `</div>`;
          }
          
          content += `<div style="font-size: 14px; line-height: 1.6;">${markdownRenderer.render(message.content)}</div>`;
          content += `</div>`;
          
          // 在消息之间添加分页提示（除了最后一条消息）
          if (index < conversation.messages.length - 1) {
            content += `<div style="page-break-after: auto; margin: 10px 0;"></div>`;
          }
        });

        tempDiv.innerHTML = content;
        document.body.appendChild(tempDiv);

        // 等待两个动画帧，确保DOM完全渲染
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        // 使用html2canvas生成图片
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // 提高图片质量
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: 800,
          height: tempDiv.scrollHeight
        });

        // 将canvas转换为图片并下载
        const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
        const fileName = safeTitle || 'untitled_chat';
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // 清理临时元素
        document.body.removeChild(tempDiv);

      } catch (error) {
        console.error('图片导出失败:', error);
        alert('图片导出失败，请稍后再试');
      }
    },

    downloadFile(url, fileName) {
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', fileName);
      linkElement.style.display = 'none';
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
    },
    handleSendMessage(message) {
      const currentConv = this.conversations[this.currentConversationIndex];
      if(!currentConv) return;

      const existingMessageIndex = currentConv.messages.findIndex(m => m.id === message.id && message.id);
      if (existingMessageIndex !== -1) {
         currentConv.messages.splice(existingMessageIndex, 1, message);
      } else {
         currentConv.messages.push(message);
      }

      if (message.role === 'user' && currentConv.messages.length === 1 && currentConv.title === '新对话') {
        this.$refs.chatContainer.generateTitleFromConversation();
      }
      currentConv.updatedAt = new Date().toISOString();
    },
    handleDeleteMessage(index) {
      const currentConv = this.conversations[this.currentConversationIndex];
      if (currentConv && currentConv.messages[index]) {
        currentConv.messages.splice(index, 1);
      }
    },
    clearCurrentChat() {
      if (confirm('确定要清空当前对话吗？')) {
        const currentConv = this.conversations[this.currentConversationIndex];
        currentConv.messages = [];
        currentConv.title = '新对话';
        currentConv.updatedAt = new Date().toISOString();
      }
    },
    exportChats() {
      const dataStr = JSON.stringify(this.conversations, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `chat_export_${new Date().toISOString().slice(0,10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    },
    clearAllChats() {
      if (confirm('确定要清空所有对话吗？此操作不可撤销！')) {
        this.conversations = [{
          id: this.generateId(),
          title: '新对话',
          messages: [],
          model: 'deepseek-chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }];
        this.currentConversationIndex = 0;
      }
    },
    updateConversations(updatedConversations) {
      this.conversations = updatedConversations;
    },
    updateModel(model) {
      this.conversations[this.currentConversationIndex].model = model;
      
      // 如果切换到非 DeepSeek 模型，自动关闭深度思考状态
      if (!model.startsWith('deepseek') && this.isDeepThinking) {
        this.isDeepThinking = false;
        localStorage.setItem('deep_thinking', false);
      }
    },
    toggleSidebar() {
      if (this.$refs.sidebar) {
        this.$refs.sidebar.toggleCollapse();
      }
    },
    renameConversation({ index, newTitle }) {
      if (this.conversations[index]) {
        this.conversations[index].title = newTitle;
        this.conversations[index].updatedAt = new Date().toISOString();
      }
    },
    handleGeneratingChanged(isGenerating) {
      this.isGenerating = isGenerating;
    },
    handleSidebarToggle(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
      
      // 在移动端添加延迟显示输入区域的逻辑
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        if (isCollapsed) {
          // 侧边栏收起时，确保输入区域能够显示
          // 清除之前可能存在的延迟定时器
          if (this.inputAreaTimer) {
            clearTimeout(this.inputAreaTimer);
          }
          // 先隐藏，然后延迟显示
          this.showInputAreaDelayed = false;
          this.inputAreaTimer = setTimeout(() => {
            this.showInputAreaDelayed = true;
          }, 300); // 与侧边栏动画时间一致
        } else {
          // 侧边栏展开时，立即隐藏输入区域并清除定时器
          if (this.inputAreaTimer) {
            clearTimeout(this.inputAreaTimer);
          }
          this.showInputAreaDelayed = false;
        }
      }
      
      // 强制重新计算布局，防止div错位
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'));
      });
    },
    openSettingsModal() {
      this.isSettingsModalVisible = true;
    },
    closeSettingsModal() {
      this.isSettingsModalVisible = false;
    },
    
    // 输入框相关方法
    handleInputChanged(value) {
      this.userInput = value;
    },
    
    focusTextInput() {
      if (this.$refs.textInput && !this.hasVoiceContent) {
        this.$refs.textInput.focus();
      }
    },
    
    handleSendUserMessage(message) {
      if (message) {
        this.userInput = message;
      }
      this.handleSend();
    },
    
    // 消息编辑和重新发送

    
    // 消息引用回复
    handleQuoteMessage(content) {
      // 将内容格式化为 Markdown 引用块
      const quoteText = `> ${content.split('\n').join('\n> ')}\n\n`;
      
      // 将引用文本追加到输入框
      if (this.$refs.textInput) {
        const currentContent = this.$refs.textInput.textContent || '';
        this.$refs.textInput.textContent = currentContent + quoteText;
        
        // 更新userInput以保持同步
        this.userInput = this.$refs.textInput.textContent;
        
        // 聚焦到输入框
        this.focusTextInput();
        
        // 将光标移动到末尾
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(this.$refs.textInput);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
    
    async handleSend() {
      // 优先使用userInput（来自示例问题），否则从 contenteditable div 获取文本内容
      const userText = this.userInput || (this.$refs.textInput ? this.$refs.textInput.textContent.trim() || '' : '');
      
      if (!userText && !this.selectedFile) return;
      
      // 立即清空输入框，提供即时反馈
      this.userInput = '';
      const fileToSend = this.selectedFile;
      this.selectedFile = null;
      
      // 清空输入框和语音转录文本
      if (this.$refs.textInput) {
        this.$refs.textInput.textContent = '';
      }
      this.finalTranscript = '';
      this.interimTranscript = '';
      
      // 强制触发DOM更新
      this.$nextTick(() => {
        if (this.$refs.textInput) {
          this.$refs.textInput.textContent = '';
          this.$refs.textInput.innerHTML = '';
        }
      });
      
      // 委托给ChatContainer处理发送逻辑
      if (this.$refs.chatContainer) {
        try {
          await this.$refs.chatContainer.sendMessage(userText, fileToSend);
        } catch (error) {
          console.error('发送消息失败:', error);
        }
      }
    },
    
    handleTextInput(event) {
      // 更新 userInput 以保持与 contenteditable div 同步
      this.userInput = event.target.textContent || '';
    },
    
    stopGeneration() {
      if (this.$refs.chatContainer) {
        this.$refs.chatContainer.stopGeneration();
      }
    },
    
    toggleAddDropdown() {
      this.showAddDropdown = !this.showAddDropdown;
    },
    
    triggerFileUpload() {
      this.$refs.fileInput.click();
      this.showAddDropdown = false;
    },
    

     
     toggleDeepThinking() {
       // 只有在选择 DeepSeek 模型时才允许切换
       if (!this.isDeepSeekModel) {
         return;
       }
       this.isDeepThinking = !this.isDeepThinking;
       localStorage.setItem('deep_thinking', this.isDeepThinking);
     },
     
     handleClickOutside(event) {
       // 检查是否点击了add-btn-container外部
       const addBtnContainer = this.$el && this.$el.querySelector ? this.$el.querySelector('.add-btn-container') : null;
       if (addBtnContainer && !addBtnContainer.contains(event.target)) {
         this.showAddDropdown = false;
       }
       
       // 移动端额外处理：检查是否点击了下拉菜单外部
       if (this.showAddDropdown) {
         const dropdown = this.$el && this.$el.querySelector ? this.$el.querySelector('.add-dropdown') : null;
         if (dropdown && !dropdown.contains(event.target) && !addBtnContainer.contains(event.target)) {
           this.showAddDropdown = false;
         }
       }
     },
    
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      }
    },
    
    removeFile() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
    },
    
    getFileIcon(fileName) {
      const ext = fileName.split('.').pop().toLowerCase();
      const iconMap = {
        'doc': '📄', 'docx': '📄',
        'xls': '📊', 'xlsx': '📊',
        'txt': '📝', 'md': '📝'
      };
      return iconMap[ext] || '📎';
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
    
    openFilePreview(file) {
      // 委托给ChatContainer处理文件预览
      if (this.$refs.chatContainer) {
        this.$refs.chatContainer.openFilePreview(file);
      }
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
      this.recognition.interimResults = true;  // 开启实时结果
      this.recognition.continuous = true;      // 保持持续聆听
      this.isSpeechSupported = true;
      this.recognition.onstart = () => { this.isSpeechRecognizing = true; this.speechError = ''; };
      this.recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            this.finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        this.interimTranscript = interim;
        
        // 直接更新contenteditable div的内容
        if (this.$refs.textInput) {
          const finalText = this.finalTranscript;
          const interimText = this.interimTranscript;
          const combinedText = finalText + interimText;
          
          // 只有当内容真正改变时才更新DOM
          if (this.$refs.textInput.textContent !== combinedText) {
            this.$refs.textInput.textContent = combinedText;
          }
        }
      };
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
      this.recognition.onend = () => {
        this.isSpeechRecognizing = false;
        if (this.stopTimer) { clearTimeout(this.stopTimer); this.stopTimer = null; }
      };
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
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.speechError = '';
      
      // 清空contenteditable div的内容
      if (this.$refs.textInput) {
        this.$refs.textInput.textContent = '';
      }
      
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
    sendVoiceTranscript() {
      // 处理语音识别结束后的自动发送逻辑
      if (this.finalTranscript.trim()) {
        this.userInput = this.finalTranscript.trim();
        // 更新 contenteditable div 的内容
        if (this.$refs.textInput) {
          this.$refs.textInput.textContent = this.userInput;
        }
        // 清空语音转录状态
        this.finalTranscript = '';
        this.interimTranscript = '';
        // 可以在这里添加自动发送逻辑，或者让用户手动发送
        // this.handleSend(); // 如果需要自动发送，取消注释这行
      }
    },
    
    // 输入框键盘事件处理
    handleInputKeyDown(event) {
      if (event.key === 'Enter') {
        if (event.shiftKey) {
          // Shift + Enter: 换行，不做任何处理，让默认行为发生
          return;
        } else {
          // 单独 Enter: 发送消息
          event.preventDefault();
          this.handleSend();
        }
      }
    },
    
    // 全局快捷键处理
    handleKeyDown(event) {
      // Ctrl + K 或 Cmd + K 新建对话
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault(); // 防止浏览器默认行为（如搜索）
        this.newChat();
      }
    }
  },
  
  mounted() {
    // 加载保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark-mode');
    }
    
    // 加载保存的侧边栏状态
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      this.isSidebarCollapsed = JSON.parse(savedSidebarState);
    }
    
    // 加载保存的深度思考状态
    const savedDeepThinking = localStorage.getItem('deep_thinking');
    if (savedDeepThinking !== null) {
      this.isDeepThinking = JSON.parse(savedDeepThinking);
    }
    
    // 添加窗口大小变化监听器
    window.addEventListener('resize', this.handleResize);
    
    // 添加点击外部事件监听器
    document.addEventListener('click', this.handleClickOutside);
    
    // 添加全局键盘事件监听器
    window.addEventListener('keydown', this.handleKeyDown);
    
    // 初始化语音识别
    this.initSpeechRecognition();
  },
  
  beforeUnmount() {
    // 清理定时器
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    if (this.inputAreaTimer) {
      clearTimeout(this.inputAreaTimer);
    }
    
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('keydown', this.handleKeyDown);
  }
};
</script>

<style>
/* 添加主题切换按钮样式 */
.theme-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-color);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  transform: scale(1.1);
}

/* 现代化亮色主题 */
:root {
  --bg-color: #fafbfc;
  --text-color: #1a1d23;
  --primary-color: #0ea5e9;
  --primary-hover: #0284c7;
  --secondary-color: #f8fafc;
  --border-color: #e5e7eb;
  --card-bg: #ffffff;
  --secondary-bg: #f9fafb;
  --user-message-bg: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  --assistant-message-bg: #ffffff;
  --code-bg: #f8fafc;
  --sidebar-bg: rgba(255, 255, 255, 0.95);
  --input-bg: #ffffff;
  --thinking-bg: #f1f5f9;
  --action-btn-bg: rgba(14, 165, 233, 0.08);
  --toggle-btn-bg: rgba(255, 255, 255, 0.95);
  --toggle-btn-border: rgba(0, 0, 0, 0.08);
  --toggle-btn-hover: #f1f5f9;
  --toggle-btn-text: #1a1d23;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --gradient-primary: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  --gradient-secondary: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

/* 现代化暗色主题 */
.dark-mode {
  --bg-color: #0f1419;
  --text-color: #e5e7eb;
  --primary-color: #38bdf8;
  --primary-hover: #0ea5e9;
  --secondary-color: #1f2937;
  --border-color: #374151;
  --card-bg: #1f2937;
  --secondary-bg: #111827;
  --user-message-bg: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
  --assistant-message-bg: #1f2937;
  --code-bg: #111827;
  --sidebar-bg: rgba(31, 41, 55, 0.95);
  --input-bg: #1f2937;
  --thinking-bg: #111827;
  --action-btn-bg: rgba(56, 189, 248, 0.12);
  --toggle-btn-bg: rgba(31, 41, 55, 0.95);
  --toggle-btn-border: rgba(255, 255, 255, 0.08);
  --toggle-btn-hover: #374151;
  --toggle-btn-text: #e5e7eb;
  --success-color: #34d399;
  --warning-color: #fbbf24;
  --error-color: #f87171;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
  --gradient-primary: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
  --gradient-secondary: linear-gradient(135deg, #1f2937 0%, #374151 100%);
}

/* 允许HTML页面滚动 */
html, body {
  overflow: auto;
  margin: 0;
  padding: 0;
  height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  /* color: #2c3e50; */
  height: 100vh;
  margin: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.app-container {
  display: flex;
  flex-grow: 1;
  overflow: hidden; /* 防止滚动条出现在错误的位置 */
  min-width: 360px; /* 防止宽度过小导致布局问题 */
  background-color: var(--bg-color);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  position: relative; /* 为固定输入框做准备 */
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: margin-left;
}

.markdown-body {
  line-height: 1.5;
  color: var(--text-color);
}

.markdown-body p {
  margin: 0.3em 0;
  line-height: 1.5;
}

.markdown-body ul,
.markdown-body ol {
  margin: 0.3em 0;
  padding-left: 1.2em;
}

.markdown-body li {
  margin: 0.1em 0;
  line-height: 1.5;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin: 0.6em 0;
  line-height: 1.3;
}

.markdown-body pre {
  margin: 0.8em 0;
}

/* 表格样式 */
.markdown-body table {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.markdown-body thead {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: white;
}

.markdown-body thead th {
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: none;
}

.markdown-body tbody tr {
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.markdown-body tbody tr:last-child {
  border-bottom: none;
}



.markdown-body td,
.markdown-body th {
  padding: 14px 20px;
  text-align: left;
  vertical-align: middle;
  border: none;
}

.markdown-body td {
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.5;
}

.markdown-body tbody tr:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}

[data-theme="dark"] .markdown-body tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

/* 表格响应式设计 */
@media (max-width: 768px) {
  .markdown-body table {
    font-size: 13px;
    border-radius: 8px;
  }
  
  .markdown-body td,
  .markdown-body th {
    padding: 10px 12px;
  }
  
  .markdown-body thead th {
    padding: 12px;
    font-size: 12px;
  }
}

/* 表格内容对齐 */
.markdown-body table td:first-child,
.markdown-body table th:first-child {
  padding-left: 24px;
}

.markdown-body table td:last-child,
.markdown-body table th:last-child {
  padding-right: 24px;
}

/* 表格滚动容器 */
.markdown-body .table-wrapper {
  overflow-x: auto;
  margin: 1em 0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.markdown-body .table-wrapper table {
  margin: 0;
  min-width: 100%;
  box-shadow: none;
  border-radius: 0;
}

/* 输入框样式 - ChatGPT风格 */
.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-color);
  border-top: 1px solid var(--border-color);
  padding: 20px;
  z-index: 10;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
}

.input-content {
  max-width: 768px;
  margin: 0 auto;
}

.input-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.input-controls:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.15);
}

/* 移除重复的chat-input样式定义，使用下方更完整的定义 */

/* 添加按钮容器 */
.add-btn-container {
  position: relative;
}

.add-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--secondary-color);
  color: var(--text-color);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-open .add-btn {
  background: var(--primary-color);
  color: white;
}

/* 下拉菜单样式 */
.add-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 160px;
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--secondary-color);
}

.dropdown-icon {
  margin-right: 8px;
  font-size: 14px;
}

.dropdown-text {
  font-size: 14px;
  color: var(--text-color);
}

/* 深度思考开关样式 */
.deep-thinking-toggle {
  display: flex;
  align-items: center;
  margin: 0 4px;
}

.deep-thinking-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.thinking-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--secondary-color);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  white-space: nowrap;
  min-width: 80px;
  justify-content: center;
}

.thinking-toggle-btn:hover:not(.disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.thinking-toggle-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.thinking-toggle-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.toggle-text {
  font-weight: 500;
}

/* 深度思考开关移动端响应式样式 */
@media (max-width: 640px) {
  .deep-thinking-toggle {
    margin: 0;
  }
  
  .thinking-toggle-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    font-size: 14px;
    min-width: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .toggle-text {
    display: none; /* 在小屏幕上隐藏文字 */
  }
}

.button-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--secondary-color);
  color: var(--text-color);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn.send-btn {
  background: var(--primary-color);
  color: white;
}

.action-btn.send-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 153, 225, 0.25);
}

.action-btn.stop-btn {
  background: var(--error-color);
  color: white;
}

.action-btn.stop-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.25);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-btn.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.7);
  }
}

/* 回复风格模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.style-modal {
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.style-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
}

.style-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.style-modal-header .close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-color);
  padding: 4px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.style-modal-header .close-btn:hover {
  background: var(--secondary-color);
}

.style-modal-body {
  padding: 24px;
}

.style-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.style-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-color);
}

.style-option:hover {
  border-color: var(--primary-color);
  background: var(--secondary-color);
}

.style-option.active {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.1);
}

.style-icon {
  font-size: 24px;
  margin-right: 16px;
  width: 32px;
  text-align: center;
}

.style-info {
  flex: 1;
}

.style-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.style-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 文件预览样式 */
.file-preview {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.file-preview-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--secondary-color);
  border-bottom: 1px solid var(--border-color);
}

.file-icon {
  font-size: 20px;
  margin-right: 8px;
}

.file-preview-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-color);
}

.remove-file-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: var(--error-color);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.file-preview-content {
  padding: 12px 16px;
}

.file-info p {
  margin: 4px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.preview-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 8px;
}

/* 语音识别指示器 */
.listening-indicator,
.speech-error-indicator {
  text-align: center;
  padding: 8px;
  margin-top: 8px;
  border-radius: 8px;
  font-size: 14px;
}

.listening-indicator {
  background: var(--success-color);
  color: white;
}

.speech-error-indicator {
  background: var(--error-color);
  color: white;
}

/* 语音转录样式 */
.chat-input {
  flex: 1;
  position: relative;
  min-height: 24px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-color);
  color: var(--text-color);
  cursor: text;
  outline: none;
  line-height: 1.5;
  font-size: 16px;
}

.chat-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
}

.chat-input:empty:before {
  content: attr(placeholder);
  color: var(--text-secondary);
  opacity: 0.8;
  pointer-events: none;
}

.chat-input:focus:empty:before {
  display: none;
}

/* 平板端适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .input-controls {
    gap: 10px;
    padding: 8px 14px;
  }
  
  .thinking-toggle-btn {
    padding: 5px 10px;
    font-size: 11px;
    min-width: 70px;
    gap: 5px;
  }
  
  .toggle-text {
    font-size: 11px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .input-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px;
    background: var(--bg-color);
    border-top: 1px solid var(--border-color);
    z-index: 999;
  }
  
  /* 移动端下拉菜单优化 */
  .add-dropdown {
    z-index: 1002;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
  }
  
  .input-controls {
    border-radius: 20px;
    padding: 8px 12px;
    gap: 8px;
    min-width: 0;
  }
  
  .add-btn-container {
    position: relative;
  }
  
  .add-dropdown {
    left: 0;
  }
  
  .chat-input {
    font-size: 16px; /* 防止iOS缩放 */
    min-height: 20px;
    flex: 1;
    min-width: 0;
  }
  
  .add-btn,
  .action-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
    border-radius: 8px;
    flex-shrink: 0;
    min-width: 32px;
  }
  
  .button-group {
    gap: 6px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
  
  /* 深度思考开关移动端优化 */
  .deep-thinking-toggle {
    margin: 0;
  }
  
  .thinking-toggle-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    font-size: 14px;
    min-width: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  /* 移动端禁用hover效果，避免触摸后保持蓝色 */
  .thinking-toggle-btn:hover:not(.disabled) {
    background: var(--secondary-color);
    color: var(--text-color);
    border-color: var(--border-color);
    transform: none;
    box-shadow: none;
  }
  
  .thinking-toggle-btn.active:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
  
  .toggle-text {
    display: none; /* 移动端隐藏文字，只显示图标 */
  }
}

/* 极小屏幕优化 */
@media (max-width: 360px) {
  .input-area {
    padding: 8px;
  }
  
  .input-controls {
    padding: 6px 10px;
    gap: 6px;
  }
  
  .add-btn,
  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
    min-width: 28px;
  }
  
  .button-group {
    gap: 4px;
  }
  
  /* 深度思考开关极小屏幕优化 */
  .deep-thinking-toggle {
    margin: 0;
  }
  
  .thinking-toggle-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 12px;
    min-width: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  /* 极小屏幕也禁用hover效果 */
  .thinking-toggle-btn:hover:not(.disabled) {
    background: var(--secondary-color);
    color: var(--text-color);
    border-color: var(--border-color);
    transform: none;
    box-shadow: none;
  }
  
  .thinking-toggle-btn.active:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
  

}
</style>