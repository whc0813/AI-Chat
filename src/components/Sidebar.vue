<template>
  <div>
    <!-- 移动端遮罩层 -->
    <div v-if="!isCollapsed" class="mobile-overlay" @click="toggleCollapse"></div>
    
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
         <button class="collapse-btn" @click="toggleCollapse">
           <span class="collapse-icon" :class="{ 'is-open': !isCollapsed }">{{ isCollapsed ? '☰' : '✕' }}</span>
         </button>
        <button v-if="!isCollapsed" class="new-chat-btn" @click="newChat" :disabled="isGenerating">
          <span>+ 新建对话</span>
        </button>
      </div>

    <div v-if="!isCollapsed" class="search-container">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索对话..."
        class="search-input"
      />
    </div>

    <div class="conversation-list" v-if="!isCollapsed">
      <div 
        v-for="(conv, index) in filteredConversations" 
        :key="conv.id"
        :class="{
          active: currentConversationIndex === conv.originalIndex,
          disabled: isGenerating
        }"
        @click="handleConversationSwitch(conv.originalIndex)"
        class="conversation-item"
      >
        <div class="conv-content">
          <div v-if="renamingIndex !== conv.originalIndex" class="conv-title">{{ conv.title }}</div>
          <input 
            v-else 
            v-model="newTitle"
            @keyup.enter="saveRename(conv.originalIndex)"
            @blur="saveRename(conv.originalIndex)"
            @click.stop
            class="rename-input"
            ref="renameInput"
            maxlength="50"
          />
        </div>
        <div class="conv-actions">
          <button 
            v-if="renamingIndex !== conv.originalIndex"
            class="rename-btn" 
            @click.stop="startRename(conv.originalIndex, conv.title)" 
            :disabled="isGenerating"
            title="重命名"
          >✏️</button>
          <button class="delete-btn" @click.stop="deleteConversation(conv.originalIndex)" :disabled="isGenerating" title="删除">×</button>
        </div>
        <div class="conv-meta">
          <span class="conv-time">{{ formatTime(conv.updatedAt || conv.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div class="sidebar-footer" v-if="!isCollapsed">
      <button @click="openSettings" :disabled="isGenerating">⚙️ 设置</button>
      <button @click="exportChats" :disabled="isGenerating">导出所有对话</button>
      <button @click="clearAllChats" :disabled="isGenerating">清空所有对话</button>
    </div>

    <div class="collapsed-info" v-if="isCollapsed">
      <div class="conversation-count">{{ conversations.length }}</div>
      <button class="new-chat-btn" @click="newChat" :disabled="isGenerating">
        <span>+</span>
      </button>
    </div>
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
      isCollapsed: JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false'),
      searchQuery: '',
      renamingIndex: null,
      newTitle: ''
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
      
      // 移动端切换对话后自动关闭侧边栏
      if (window.innerWidth <= 768) {
        this.isCollapsed = true;
        localStorage.setItem('sidebarCollapsed', this.isCollapsed);
      }
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
      // 触发主内容区域重新计算布局
      this.$emit('sidebar-toggle', this.isCollapsed);
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

    openSettings() {
      this.$emit('open-settings');
    },
    handleTransitionEnd() {
      // 处理过渡动画结束事件
      // 可以在这里添加动画完成后的逻辑
    },
    startRename(index, currentTitle) {
      this.renamingIndex = index;
      this.newTitle = currentTitle;
      this.$nextTick(() => {
        const input = this.$refs.renameInput;
        if (input) {
          // 如果是数组，取第一个元素；如果是单个元素，直接使用
          const inputElement = Array.isArray(input) ? input[0] : input;
          if (inputElement && inputElement.focus) {
            inputElement.focus();
            inputElement.select();
          }
        }
      });
    },
    saveRename(index) {
      if (this.newTitle.trim() && this.newTitle.trim() !== this.conversations[index].title) {
        this.$emit('rename-conversation', { index, newTitle: this.newTitle.trim() });
      }
      this.renamingIndex = null;
      this.newTitle = '';
    },

  },
  computed: {
    filteredConversations() {
      if (!this.searchQuery) return this.conversations;
      const query = this.searchQuery.toLowerCase();
      return this.conversations.filter(conv => 
        conv.title.toLowerCase().includes(query)
      );
    }
  },
};
</script>

<style scoped>
.sidebar {
  width: 300px;
  min-width: 300px;
  height: 100%;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
  padding-bottom: 20px; /* 为不支持env()的旧浏览器提供一个回退值 */
  padding-bottom: env(safe-area-inset-bottom, 20px);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.03);
  will-change: width, min-width;
  transform: translateZ(0); /* 启用硬件加速 */
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
  padding: 8px 70px 8px 16px;
  margin: 4px 0;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  transform: translateX(0);
  position: relative;
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

.conv-content {
  flex: 1;
  min-width: 0;
}

.conv-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-color);
}

.rename-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
  outline: none;
}

.conv-actions {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  display: flex;
  gap: 8px;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.rename-btn {
  background: none;
  border: none;
  color: var(--text-color);
  opacity: 0.7;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.rename-btn:hover {
  background: var(--secondary-color);
  opacity: 1;
}

.conv-meta {
  display: flex;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.7;
}

.conv-time {
  display: none;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--text-color);
  opacity: 0.7;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: var(--secondary-color);
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
.search-container {
  padding: 12px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 14px;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

/* 移动端遮罩层 */
.mobile-overlay {
  display: none;
}

/* 移动端响应式设计 - 类似Gemini/ChatGPT风格 */
@media (max-width: 768px) {
  .mobile-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    backdrop-filter: blur(4px);
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100%;
    z-index: 1000;
    padding-bottom: 20px; /* 为不支持env()的旧浏览器提供一个回退值 */
    padding-bottom: env(safe-area-inset-bottom, 20px);
    background: var(--bg-color);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    border-radius: 0;
    box-shadow: none;
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
    width: 100vw;
  }

  .sidebar-header {
    padding: 20px 24px;
    background: var(--card-bg);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .collapse-btn {
     width: 44px;
     height: 44px;
     border-radius: 50%;
     background: var(--secondary-color);
     border: none;
     display: flex;
     align-items: center;
     justify-content: center;
     font-size: 18px;
     color: var(--text-color);
     margin-right: 0;
     order: 2;
     cursor: pointer;
   }

   .collapse-icon {
     transition: transform 0.3s ease;
   }

   .collapse-icon {
     font-family: Arial, sans-serif;
     font-weight: bold;
     display: inline-block;
   }

   .collapse-icon.is-open {
     transform: rotate(90deg);
   }

  .new-chat-btn {
    padding: 14px 24px;
    font-size: 16px;
    border-radius: 25px;
    background: var(--primary-color);
    color: white;
    border: none;
    font-weight: 500;
    flex: 1;
    margin-right: 16px;
    order: 1;
  }

  .search-container {
    padding: 20px 24px;
    background: var(--card-bg);
    border-bottom: 1px solid var(--border-color);
  }

  .search-input {
    padding: 16px 20px;
    font-size: 16px;
    border-radius: 25px;
    background: var(--bg-color);
    border: 1px solid var(--border-color);
  }

  .conversation-list {
    padding: 16px 24px; /* 移除多余的底部空白 */
    flex: 1;
    overflow-y: auto;
  }

  .conversation-item {
    padding: 12px 50px 12px 12px;
    margin: 8px 0;
    border-radius: 16px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;
  }

  .conversation-item:hover {
    transform: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .conv-title {
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
  }

  .conv-meta {
    font-size: 14px;
    margin-top: 12px;
  }

  .conv-actions {
    position: absolute;
    top: 50%;
    right: 12px;
    transform: translateY(-50%);
    display: flex;
    gap: 8px;
  }

  .rename-btn {
    font-size: 20px;
    padding: 8px;
    border-radius: 50%;
    background: var(--secondary-color);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-btn {
    font-size: 24px;
    padding: 8px;
    border-radius: 50%;
    background: var(--secondary-color);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar-footer {
    padding: 24px; /* 移除多余的底部空白 */
    background: var(--card-bg);
    border-top: 1px solid var(--border-color);
    position: sticky;
    bottom: 0;
  }

  .sidebar-footer button {
    padding: 16px 20px;
    font-size: 16px;
    border-radius: 12px;
    margin: 6px 0;
    background: var(--secondary-color);
    font-weight: 500;
  }



  .collapsed-info {
    display: none;
  }
}

/* 小屏幕设备进一步优化 - 保持全屏抽屉式设计 */
@media (max-width: 480px) {
  .sidebar-header {
    padding: 16px 20px;
  }

  .collapse-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .new-chat-btn {
    padding: 12px 20px;
    font-size: 15px;
    margin-right: 12px;
  }

  .search-container {
    padding: 16px 20px;
  }

  .search-input {
    padding: 14px 18px;
    font-size: 15px;
  }

  .conversation-list {
    padding: 12px 20px; /* 移除多余的底部空白 */
  }

  .conversation-item {
    padding: 18px;
    margin: 10px 0;
    border-radius: 14px;
  }

  .conv-title {
    font-size: 15px;
  }

  .conv-meta {
    font-size: 13px;
    margin-top: 10px;
  }

  .conv-actions {
    right: 10px;
    gap: 6px;
  }

  .rename-btn {
    font-size: 18px;
    width: 32px;
    height: 32px;
    padding: 6px;
  }

  .delete-btn {
    font-size: 20px;
    width: 32px;
    height: 32px;
    padding: 6px;
  }

  .sidebar-footer {
    padding: 20px; /* 移除多余的底部空白 */
  }

  .sidebar-footer button {
    padding: 14px 18px;
    font-size: 15px;
    margin: 4px 0;
  }
}
</style>