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
          @send-message="handleSendMessage"
          @delete-message="handleDeleteMessage"
          @clear-chat="clearCurrentChat"
          @model-changed="updateModel"
          @theme-changed="handleThemeChange"
          @update-title="handleUpdateTitle"
          @toggle-sidebar="toggleSidebar"
          @generating-changed="handleGeneratingChanged"
          ref="chatContainer"
        />
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
      isSettingsModalVisible: false
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
  },
  beforeDestroy() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
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
      if (this.$refs.chatContainer && this.$refs.chatContainer.isSpeechRecognizing) {
        this.$refs.chatContainer.stopVoiceInput();
      }
      this.currentConversationIndex = index;
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
        case 'pdf':
          this.exportToPdf(currentConv, baseFileName);
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

    async exportToPdf(conversation) {
      try {
        // 动态导入库
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
          import('jspdf'),
          import('html2canvas')
        ]);

        // 获取HTML内容
        const markdownRenderer = this.$refs.chatContainer?.markdownRenderer;
        if (!markdownRenderer) {
          alert('Markdown渲染器未准备就绪，请稍后再试');
          return;
        }

        // 创建临时容器
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        tempDiv.style.width = '800px';
        tempDiv.style.padding = '20px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        tempDiv.style.lineHeight = '1.6';
        tempDiv.style.color = '#333';

        // 生成内容
        let content = `<div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">`;
        content += `<h1 style="margin: 0 0 15px 0;">${conversation.title}</h1>`;
        content += `<p><strong>创建时间:</strong> ${new Date(conversation.createdAt).toLocaleString()}</p>`;
        content += `<p><strong>更新时间:</strong> ${new Date(conversation.updatedAt).toLocaleString()}</p>`;
        content += `<p><strong>模型:</strong> ${conversation.model}</p>`;
        content += `</div>`;

        conversation.messages.forEach(message => {
          const bgColor = message.role === 'user' ? '#f0f9ff' : '#f9fafb';
          const borderColor = message.role === 'user' ? '#0ea5e9' : '#10b981';
          const roleText = message.role === 'user' ? '用户' : 'AI助手';
          
          content += `<div style="margin-bottom: 30px; padding: 20px; border-radius: 8px; background-color: ${bgColor}; border-left: 4px solid ${borderColor};">`;
          content += `<div style="font-weight: bold; margin-bottom: 10px; color: #374151;">${roleText}</div>`;
          
          if (message.role === 'assistant' && message.type === 'combined' && message.thinking) {
            content += `<div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">`;
            content += `<div style="font-weight: bold; margin-bottom: 8px; color: #92400e;">思考过程:</div>`;
            content += `<div>${markdownRenderer.render(message.thinking)}</div>`;
            content += `</div>`;
          }
          
          content += `<div>${markdownRenderer.render(message.content)}</div>`;
          content += `</div>`;
        });

        tempDiv.innerHTML = content;
        document.body.appendChild(tempDiv);

        // 使用html2canvas生成图片
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // 移除临时元素
        document.body.removeChild(tempDiv);

        // 创建PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4宽度
        const pageHeight = 295; // A4高度
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // 添加第一页
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // 如果内容超过一页，添加更多页面
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // 下载PDF
         const safeTitle = conversation.title.replace(/[<>:"/\\|?*]/g, '_').trim();
         const fileName = safeTitle || 'untitled_chat';
         pdf.save(`${fileName}.pdf`);

      } catch (error) {
        console.error('PDF导出失败:', error);
        alert('PDF导出失败，请稍后再试');
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
    }
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
  min-width: 0; /* 修复 flex 布局的宽度计算问题 */
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
</style>