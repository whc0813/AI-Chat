import axios from 'axios';
import OpenAI from 'openai';

// GLM-4-Flash 配置
const GLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

// DeepSeek 客户端生成函数
const getDeepSeekClient = (apiKey) => {
  return new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
};

// 创建取消令牌源
const cancelTokenSources = {
  glm: null,
  deepseek: null
};

// 取消所有请求
export const cancelAllRequests = () => {
  if (cancelTokenSources.glm) {
    cancelTokenSources.glm.abort();
    cancelTokenSources.glm = null;
  }
  if (cancelTokenSources.deepseek) {
    cancelTokenSources.deepseek.abort();
    cancelTokenSources.deepseek = null;
  }
};

export const streamWithGLM = async (messages, onChunk, apiKey) => {
  let abortController = null;
  let tokenStats = { input: 0, output: 0, total: 0 };
  
  // 从localStorage读取用户自定义参数
  const maxTokens = parseInt(localStorage.getItem('ai_max_tokens')) || 8192;
  const temperature = parseFloat(localStorage.getItem('ai_temperature')) || 0.7;
  const topP = parseFloat(localStorage.getItem('ai_top_p')) || 0.9;
  const systemPrompt = localStorage.getItem('ai_system_prompt') || '';
  
  // 如果有系统提示词，添加到消息开头
  let processedMessages = [...messages];
  if (systemPrompt.trim()) {
    processedMessages = [
      { role: 'system', content: systemPrompt.trim() },
      ...messages
    ];
  }
  
  try {
    abortController = new AbortController();
    cancelTokenSources.glm = abortController;

    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${apiKey.replace(/[^\x00-\x7F]/g, '')}`,
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: processedMessages,
        stream: true,
        temperature: temperature,
        top_p: topP,
        max_tokens: maxTokens,
      }),
      signal: abortController.signal // 使用正确的 AbortSignal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data:') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.substring(5).trim());
            
            // 收集Token统计信息
            if (data.usage) {
              tokenStats = {
                input: data.usage.prompt_tokens || 0,
                output: data.usage.completion_tokens || 0,
                total: data.usage.total_tokens || 0
              };
            }
            
            if (data.choices?.[0]?.delta?.content) {
              onChunk(data.choices[0].delta.content, 'answer');
            }
          } catch (e) {
            console.error('解析GLM流数据出错:', e);
          }
        }
      }
    }
    
    return { tokens: tokenStats };
  } catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消');
    // 不再发送"请求已被取消"的消息，因为内容已经保存
  } else {
    console.error("API调用失败:", error);
    onChunk("抱歉，我暂时无法处理您的请求。", 'error');
  }
  return { tokens: tokenStats };
} finally {
    if (cancelTokenSources.glm === abortController) {
      cancelTokenSources.glm = null;
    }
  }
};

// DeepSeek 流式调用
export const streamWithDeepSeek = async (messages, model, onChunk, apiKey) => {
  let tokenStats = { input: 0, output: 0, total: 0 };
  
  // 从localStorage读取用户自定义参数
  const maxTokens = parseInt(localStorage.getItem('ai_max_tokens')) || 8192;
  const temperature = parseFloat(localStorage.getItem('ai_temperature')) || 0.7;
  const topP = parseFloat(localStorage.getItem('ai_top_p')) || 0.9;
  const systemPrompt = localStorage.getItem('ai_system_prompt') || '';
  
  // 如果有系统提示词，添加到消息开头
  let processedMessages = [...messages];
  if (systemPrompt.trim()) {
    processedMessages = [
      { role: 'system', content: systemPrompt.trim() },
      ...messages
    ];
  }
  
  try {
    // 创建AbortController
    cancelTokenSources.deepseek = new AbortController();
    
    const deepseekClient = getDeepSeekClient(apiKey);
    
    const stream = await deepseekClient.chat.completions.create({
      messages: processedMessages,
      model: model,
      stream: true,
      temperature: temperature,
      top_p: topP,
      max_tokens: maxTokens
    }, {
      signal: cancelTokenSources.deepseek.signal // 添加取消信号
    });

    for await (const chunk of stream) {
      // 收集Token统计信息
      if (chunk.usage) {
        tokenStats = {
          input: chunk.usage.prompt_tokens || 0,
          output: chunk.usage.completion_tokens || 0,
          total: chunk.usage.total_tokens || 0
        };
      }
      
      if (model === 'deepseek-reasoner' && chunk.choices[0].delta.reasoning_content) {
        onChunk(chunk.choices[0].delta.reasoning_content, 'thinking');
      } else if (chunk.choices[0].delta.content) {
        onChunk(chunk.choices[0].delta.content, 'answer');
      }
    }
    
    return { tokens: tokenStats };
  } catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消');
  } else {
    console.error("API调用失败:", error);
    onChunk("抱歉，我暂时无法处理您的请求。", 'error');
  }
  return { tokens: tokenStats };
} finally {
    cancelTokenSources.deepseek = null;
  }
};

export const summarizeTitle = async (messages, apiKey) => {
  try {
    const deepseekClient = getDeepSeekClient(apiKey);
    const response = await deepseekClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "你是一个专业的对话标题总结助手。请仔细分析对话的核心主题和关键内容，生成一个准确、简洁的标题。\n\n要求：\n1. 标题应准确反映对话的主要内容或问题\n2. 优先提取用户的具体问题、需求或讨论的主题\n3. 避免使用模糊的词汇，如'问题'、'咨询'、'讨论'等\n4. 长度控制在8-15个字之间\n5. 使用中文，语言简洁明了\n6. 只返回标题文本，不要包含引号或其他符号"
        },
        {
          role: "user",
          content: `请为以下对话生成标题:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
        }
      ],
      model: "deepseek-chat",
      temperature: 0.2,
      max_tokens: 50
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("标题总结失败:", error);
    return null;
  }
};

// 获取回复风格的系统提示
// 统一流式调用方法
export const chatWithAI = async (messages, model, onChunk, apiKeys) => {
  if (model.startsWith('glm-')) {
    return await streamWithGLM(messages, onChunk, apiKeys.glm);
  } else {
    return await streamWithDeepSeek(messages, model, onChunk, apiKeys.deepseek);
  }
};