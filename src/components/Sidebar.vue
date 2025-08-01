<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <button class="collapse-btn" @click="toggleCollapse">
        {{ isCollapsed ? '>' : '<' }}
      </button>
      <button v-if="!isCollapsed" class="new-chat-btn" @click="newChat" :disabled="isGenerating">
        <span>+ 新建对话</span>
      </button>
    </div>

    <div class="conversation-list" v-if="!isCollapsed">
      <div 
        v-for="(conv, index) in conversations" 
        :key="conv.id"
        :class="{
          active: currentConversationIndex === conv.originalIndex,
          disabled: isGenerating
        }"
        @click="handleConversationSwitch(conv.originalIndex)"
        class="conversation-item"
      >
        <div class="conv-title">{{ conv.title }}</div>
        <div class="conv-meta">
          <span class="conv-time">{{ formatTime(conv.updatedAt || conv.createdAt) }}</span>
          <button class="delete-btn" @click.stop="deleteConversation(conv.originalIndex)" :disabled="isGenerating">×</button>
        </div>
      </div>
    </div>

    <div class="sidebar-footer" v-if="!isCollapsed">
      <button @click="exportChats" :disabled="isGenerating">导出所有对话</button>
      <button @click="exportCurrentChat" :disabled="isGenerating">导出当前对话</button>
      <button @click="clearAllChats" :disabled="isGenerating">清空所有对话</button>
    </div>

    <div class="collapsed-info" v-if="isCollapsed">
      <div class="conversation-count">{{ conversations.length }}</div>
      <button class="new-chat-btn" @click="newChat" :disabled="isGenerating">
        <span>+</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    conversations: Array,
    currentConversationIndex: Number,
    isGenerating: Boolean
  },
  data() {
    return {
      isCollapsed: JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false')
    };
  },
  mounted() {
    this.$el.addEventListener('transitionend', this.handleTransitionEnd);
  },
  beforeDestroy() {
  this.$el.removeEventListener('transitionend', this.handleTransitionEnd);
  },
  methods: {
    handleConversationSwitch(index) {
      if (this.isGenerating) {
        alert('请等待当前对话生成完成后再切换');
        return;
      }
      this.$emit('switch-conversation', index);
    },
    formatTime(isoString) {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebarCollapsed', this.isCollapsed);
    this.$nextTick(() => {
      // 强制重绘以解决过渡问题
      this.$el.offsetHeight;
    });
  },
    newChat() {
      this.$emit('new-chat');
    },
    switchConversation(index) {
      this.$emit('switch-conversation', index);
    },
    deleteConversation(index) {
      this.$emit('delete-conversation', index);
      
    },
    exportChats() {
      this.$emit('export-chats');
    },
    clearAllChats() {
      this.$emit('clear-all-chats');
      localStorage.removeItem('conversations');
    },
    exportCurrentChat() {
      this.$emit('export-current-chat');
    },
    handleTransitionEnd() {
      // 处理过渡动画结束事件
      // 可以在这里添加动画完成后的逻辑
    }
  }
};
</script>

<style scoped>
.sidebar {
  width: 300px;
  min-width: 300px;
  height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.03);
  will-change: width, min-width;
}



.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 18px;
  background: linear-gradient(135deg, var(--secondary-color) 0%, var(--sidebar-bg) 100%);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.collapse-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: var(--card-bg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  color: var(--text-color);
  font-weight: bold;
}

.collapse-btn:hover {
  background: var(--primary-color);
  color: white;
}

.new-chat-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: var(--card-bg);
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  flex-grow: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.new-chat-btn:hover {
  background: var(--primary-color);
  color: white;
}

.new-chat-btn span {
  margin-left: 8px;
}

.conversation-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
  transition: opacity 0.2s ease;
}

.conversation-list::-webkit-scrollbar {
  width: 6px;
}

.conversation-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-list::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

.conversation-item {
  padding: 14px 16px;
  margin: 6px 0;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  transform: translateX(0);
}

.conversation-item:hover {
  background: var(--secondary-color);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.15);
}

.conversation-item.active {
  background: var(--secondary-color);
  border-left: 3px solid var(--primary-color);
}

.conv-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color);
}

.conv-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.7;
}

.conv-time {
  opacity: 0.8;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--text-color);
  opacity: 0.5;
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
}

.delete-btn:hover {
  color: #e53e3e;
  opacity: 1;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--card-bg);
  transition: opacity 0.2s ease;
}

.sidebar-footer button {
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: var(--text-color);
  display: flex;
  align-items: center;
}

.sidebar-footer button:hover {
  background: var(--secondary-color);
  color: var(--primary-color);
}

.sidebar-footer button::before {
  content: "→";
  margin-right: 8px;
  opacity: 0.6;
}

/* 折叠状态下的样式 */
.collapsed-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  transition: opacity 0.2s ease;
}

.conversation-count {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.collapsed .new-chat-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 0;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, var(--primary-color) 0%, #0284c7 100%);
  color: white;
}



.collapsed .new-chat-btn span {
  margin-left: 0;
}
.conversation-item.disabled {
  opacity: 0.6;
  pointer-events: none;
  cursor: not-allowed;
}

.conversation-item.disabled:hover {
  background: var(--card-bg);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}

.delete-btn:disabled {
  opacity: 0.3;
}

.conversation-item.disabled {
  opacity: 0.7;
  pointer-events: none;
  cursor: not-allowed;
}

.conversation-item.disabled:hover {
  background: var(--card-bg);
}
</style>