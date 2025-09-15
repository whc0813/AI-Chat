<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>设置</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- API 密钥配置区域 -->
        <div class="settings-section">
          <h4 class="section-title">API 密钥配置</h4>
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

        <!-- AI 参数配置区域 -->
        <div class="settings-section">
          <h4 class="section-title">AI 参数配置</h4>
          <div class="input-group">
            <label for="max-tokens">Max Tokens:</label>
            <input 
              id="max-tokens"
              type="number" 
              v-model.number="maxTokens" 
              placeholder="最大输出token数量"
              class="api-input"
              min="1"
              max="64000"
            />
            <small class="input-hint">控制AI回复的最大长度。GLM默认4K最大8K，DeepSeek默认4K最大8K(chat模式)或32K最大64K(reasoner模式)</small>
          </div>
          
          <div class="input-group">
            <label for="temperature">Temperature:</label>
            <input 
              id="temperature"
              type="number" 
              v-model.number="temperature" 
              placeholder="创造性程度"
              class="api-input"
              min="0.01"
              max="2.0"
              step="0.01"
            />
            <small class="input-hint">控制回复的随机性和创造性。值越高越有创造性，值越低越确定性 (0.01-2.0，推荐0.7)</small>
          </div>
          
          <div class="input-group">
            <label for="top-p">Top P:</label>
            <input 
              id="top-p"
              type="number" 
              v-model.number="topP" 
              placeholder="核采样参数"
              class="api-input"
              min="0.01"
              max="0.99"
              step="0.01"
            />
            <small class="input-hint">控制词汇选择的多样性。值越高考虑的词汇越多，值越低越聚焦 (0.01-0.99，推荐0.9)</small>
          </div>
          
          <div class="input-group">
            <label for="system-prompt">系统提示词:</label>
            <textarea 
              id="system-prompt"
              v-model="systemPrompt" 
              placeholder="请输入自定义系统提示词，用于指导AI的行为和回复风格"
              class="api-input system-prompt-textarea"
              rows="4"
            ></textarea>
            <small class="input-hint">自定义系统提示词可以指导AI的行为、回复风格和专业领域。留空则使用默认设置</small>
            
            <!-- 系统提示词模板 -->
            <div class="prompt-templates">
              <label class="templates-label">快速模板:</label>
              <div class="template-buttons">
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="applyTemplate('assistant')"
                  title="通用助手模式"
                >
                  📝 通用助手
                </button>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="applyTemplate('programmer')"
                  title="编程专家模式"
                >
                  💻 编程专家
                </button>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="applyTemplate('translator')"
                  title="翻译专家模式"
                >
                  🌐 翻译专家
                </button>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="applyTemplate('writer')"
                  title="写作助手模式"
                >
                  ✍️ 写作助手
                </button>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="applyTemplate('teacher')"
                  title="教学助手模式"
                >
                  🎓 教学助手
                </button>
                <button 
                  type="button" 
                  class="template-btn" 
                  @click="applyTemplate('clear')"
                  title="清空系统提示词"
                >
                  🗑️ 清空
                </button>
              </div>
            </div>
          </div>
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
      glmKey: '',
      maxTokens: 8192,
      temperature: 0.7,
      topP: 0.9,
      systemPrompt: ''
    }
  },
  mounted() {
    // 从 localStorage 读取已保存的密钥
    this.deepseekKey = localStorage.getItem('deepseek_api_key') || '';
    this.glmKey = localStorage.getItem('glm_api_key') || '';
    
    // 从 localStorage 读取已保存的AI参数
    this.maxTokens = parseInt(localStorage.getItem('ai_max_tokens')) || 8192;
    this.temperature = parseFloat(localStorage.getItem('ai_temperature')) || 0.7;
    this.topP = parseFloat(localStorage.getItem('ai_top_p')) || 0.9;
    this.systemPrompt = localStorage.getItem('ai_system_prompt') || '';
  },
  methods: {
    saveKeys() {
      // 保存密钥到 localStorage
      localStorage.setItem('deepseek_api_key', this.deepseekKey);
      localStorage.setItem('glm_api_key', this.glmKey);
      
      // 保存AI参数到 localStorage
      localStorage.setItem('ai_max_tokens', this.maxTokens.toString());
      localStorage.setItem('ai_temperature', this.temperature.toString());
      localStorage.setItem('ai_top_p', this.topP.toString());
      localStorage.setItem('ai_system_prompt', this.systemPrompt);
      
      // 关闭模态框
      this.closeModal();
    },
    closeModal() {
      this.$emit('close');
    },
    applyTemplate(type) {
      const templates = {
        assistant: '你是一个友善、专业的AI助手。请用简洁明了的语言回答用户的问题，提供准确有用的信息。如果不确定答案，请诚实说明。',
        programmer: '你是一位经验丰富的编程专家。请提供清晰、高质量的代码解决方案，包含详细的注释和最佳实践建议。优先考虑代码的可读性、性能和安全性。',
        translator: '你是一位专业的翻译专家。请提供准确、自然、符合目标语言习惯的翻译。保持原文的语调和风格，必要时提供文化背景解释。',
        writer: '你是一位专业的写作助手。请帮助用户改进文本的结构、语法和表达方式。提供建设性的修改建议，保持原文的核心意思和个人风格。',
        teacher: '你是一位耐心的教学助手。请用循序渐进的方式解释概念，提供具体例子，鼓励学习者思考。根据用户的理解程度调整解释的深度。',
        clear: ''
      };
      
      this.systemPrompt = templates[type] || '';
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
  max-height: 60vh;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  padding-bottom: 8px;
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

.system-prompt-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.5;
}

.prompt-templates {
  margin-top: 12px;
}

.templates-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color, #1f2937);
  font-size: 14px;
}

.template-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--secondary-color, #f3f4f6);
  color: var(--text-color, #1f2937);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.template-btn:hover {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

.template-btn:active {
  transform: translateY(1px);
}

.input-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
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
  
  .section-title {
    color: var(--text-color, #f9fafb);
    border-bottom-color: var(--border-color, #4b5563);
  }
  
  .input-group label {
    color: var(--text-color, #f9fafb);
  }
  
  .input-hint {
    color: var(--text-secondary, #9ca3af);
  }
  
  .api-input {
    background: var(--input-bg, #374151);
    border-color: var(--border-color, #4b5563);
    color: var(--text-color, #f9fafb);
  }
  
  .system-prompt-textarea {
    background: var(--input-bg, #374151);
    border-color: var(--border-color, #4b5563);
    color: var(--text-color, #f9fafb);
  }
  
  .templates-label {
    color: var(--text-color, #f9fafb);
  }
  
  .template-btn {
    background: var(--secondary-color, #374151);
    border-color: var(--border-color, #4b5563);
    color: var(--text-secondary, #9ca3af);
  }
  
  .template-btn:hover {
    background: var(--primary-color, #3b82f6);
    color: white;
    border-color: var(--primary-color, #3b82f6);
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