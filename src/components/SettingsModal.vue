<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>API 密钥配置</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="input-group">
          <label for="deepseek-key">DeepSeek API Key:</label>
          <input 
            id="deepseek-key"
            type="password" 
            v-model="deepseekKey" 
            placeholder="请输入 DeepSeek API Key"
            class="api-input"
          />
        </div>
        
        <div class="input-group">
          <label for="glm-key">GLM API Key:</label>
          <input 
            id="glm-key"
            type="password" 
            v-model="glmKey" 
            placeholder="请输入 GLM API Key"
            class="api-input"
          />
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button class="save-btn" @click="saveKeys">保存</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsModal',
  data() {
    return {
      deepseekKey: '',
      glmKey: ''
    }
  },
  mounted() {
    // 从 localStorage 读取已保存的密钥
    this.deepseekKey = localStorage.getItem('deepseek_api_key') || '';
    this.glmKey = localStorage.getItem('glm_api_key') || '';
  },
  methods: {
    saveKeys() {
      // 保存密钥到 localStorage
      localStorage.setItem('deepseek_api_key', this.deepseekKey);
      localStorage.setItem('glm_api_key', this.glmKey);
      
      // 关闭模态框
      this.closeModal();
    },
    closeModal() {
      this.$emit('close');
    }
  }
}
</script>

<style scoped>
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

.modal-container {
  background: var(--card-bg, #ffffff);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--secondary-color, #f3f4f6);
  color: var(--text-color, #1f2937);
}

.modal-body {
  padding: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #1f2937);
  font-size: 14px;
}

.api-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  background: var(--input-bg, #ffffff);
  color: var(--text-color, #1f2937);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.api-input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background: var(--secondary-bg, #f9fafb);
}

.cancel-btn, .save-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-btn {
  background: var(--secondary-color, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

.cancel-btn:hover {
  background: var(--border-color, #e5e7eb);
}

.save-btn {
  background: var(--primary-color, #3b82f6);
  color: white;
}

.save-btn:hover {
  background: var(--primary-hover, #2563eb);
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: var(--card-bg, #1f2937);
  }
  
  .modal-header h3 {
    color: var(--text-color, #f9fafb);
  }
  
  .close-btn {
    color: var(--text-secondary, #9ca3af);
  }
  
  .close-btn:hover {
    background: var(--secondary-color, #374151);
    color: var(--text-color, #f9fafb);
  }
  
  .input-group label {
    color: var(--text-color, #f9fafb);
  }
  
  .api-input {
    background: var(--input-bg, #374151);
    border-color: var(--border-color, #4b5563);
    color: var(--text-color, #f9fafb);
  }
  
  .modal-footer {
    background: var(--secondary-bg, #111827);
  }
  
  .cancel-btn {
    background: var(--secondary-color, #374151);
    color: var(--text-secondary, #9ca3af);
  }
  
  .cancel-btn:hover {
    background: var(--border-color, #4b5563);
  }
}
</style>