<template>
  <div id="app" :class="{'dark-mode': isDarkMode}">
    <div class="app-container">
      <Sidebar
        :conversations="sortedConversations"
        :currentConversationIndex="currentConversationIndex"
        :isGenerating="$refs.chatContainer?.isGenerating || false"
        @update-conversations="updateConversations"
        @new-chat="newChat"
        @switch-conversation="switchConversation"
        @delete-conversation="deleteConversation"
        @export-chats="exportChats"
        @clear-all-chats="clearAllChats"
        @export-current-chat="exportCurrentChat"
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
          @update-title-stream="handleUpdateTitleStream"
          @update-title="handleUpdateTitle"
          ref="chatContainer"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import ChatContainer from './components/ChatContainer.vue';

export default {
  name: 'App',
  components: {
    Sidebar,
    ChatContainer
  },
  data() {
    const savedConversations = JSON.parse(localStorage.getItem('conversations'));
    return {
      isDarkMode: false,
      conversations: savedConversations || [{
        id: this.generateId(),
        title: '新对话',
        messages: [], // messages 数组现在会包含带有 attachment 的对象
        model: 'deepseek-chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      currentConversationIndex: 0
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
      return [...this.conversations].map((conv, index) => ({
        ...conv,
        originalIndex: index
      })).sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt;
        const timeB = b.updatedAt || b.createdAt;
        return new Date(timeB) - new Date(timeA);
      });
    }
  },
  watch: {
    conversations: {
      handler(newVal) {
        localStorage.setItem('conversations', JSON.stringify(newVal));
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
  methods: {
    handleUpdateTitleStream(streamingTitle) {
      const currentConv = this.conversations[this.currentConversationIndex];
      if(currentConv) {
        currentConv.title = streamingTitle;
        currentConv.updatedAt = new Date().toISOString();
      }
    },
    handleUpdateTitle(finalTitle) {
      const currentConv = this.conversations[this.currentConversationIndex];
      if(currentConv) {
        currentConv.title = finalTitle;
        currentConv.updatedAt = new Date().toISOString();
        this.$forceUpdate();
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
    exportCurrentChat() {
      const currentConv = this.conversations[this.currentConversationIndex];
      const dataStr = JSON.stringify([currentConv], null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `chat_export_${new Date().toISOString().slice(0,10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
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

/* 隐藏HTML外侧滚动条 */
html, body {
  overflow: hidden;
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
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0; /* 修复 flex 布局的宽度计算问题 */
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
</style>