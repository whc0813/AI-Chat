import axios from 'axios';
import OpenAI from 'openai';

// GLM-4-Flash 配置
const GLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const GLM_API_KEY = "e36c9c358fb245e0812dfa05454c83fd.MOrtGyscJ5tH6s0D";

// DeepSeek 配置
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-5d5ac47824ef4d889d5bb1849040182f', 
  dangerouslyAllowBrowser: true
});

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

export const streamWithGLM = async (messages, onChunk) => {
  let abortController = null;
  let tokenStats = { input: 0, output: 0, total: 0 };
  
  try {
    abortController = new AbortController();
    cancelTokenSources.glm = abortController;

    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${GLM_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: messages,
        stream: true,
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
export const streamWithDeepSeek = async (messages, model, onChunk) => {
  let tokenStats = { input: 0, output: 0, total: 0 };
  
  try {
    // 创建AbortController
    cancelTokenSources.deepseek = new AbortController();
    
    const stream = await deepseek.chat.completions.create({
      messages: messages,
      model: model,
      stream: true,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 8192
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

export const summarizeTitle = async (messages) => {
  try {
    const response = await deepseek.chat.completions.create({
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

// 统一流式调用方法
export const chatWithAI = async (messages, model, onChunk) => {
  if (model.startsWith('glm-')) {
    return await streamWithGLM(messages, onChunk);
  } else {
    return await streamWithDeepSeek(messages, model, onChunk);
  }
};