# DeepSeek API 接口规范文档

> 基于实际测试验证（2026-04-19）

## 1. API 配置

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://api.deepseek.com"
)
```

## 2. 流式输出 Chunk 结构

### 2.1 普通模式 (deepseek-chat)

**请求示例：**
```python
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "你好"}],
    stream=True
)
```

**Chunk 结构：**

```json
// 第一个 Chunk（包含 role）
{
  "id": "8e0cc083-51af-451c-86ee-3c2a58692a88",
  "model": "deepseek-chat",
  "object": "chat.completion.chunk",
  "created": 1776601572,
  "choices": [{
    "index": 0,
    "delta": {
      "role": "assistant",
      "content": ""
    },
    "finish_reason": null
  }]
}

// 中间 Chunk（包含内容）
{
  "id": "8e0cc083-51af-451c-86ee-3c2a58692a88",
  "model": "deepseek-chat",
  "object": "chat.completion.chunk",
  "created": 1776601572,
  "choices": [{
    "index": 0,
    "delta": {
      "content": "你好"
    },
    "finish_reason": null
  }]
}

// 最后一个 Chunk
{
  "id": "8e0cc083-51af-451c-86ee-3c2a58692a88",
  "model": "deepseek-chat",
  "object": "chat.completion.chunk",
  "created": 1776601572,
  "choices": [{
    "index": 0,
    "delta": {},
    "finish_reason": "stop"
  }]
}
```

### 2.2 思考模式 (thinking enabled)

**请求示例：**
```python
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "9.11和9.8哪个大？"}],
    stream=True,
    extra_body={"thinking": {"type": "enabled"}}
)
```

**Chunk 结构：**

```json
// 思考过程 Chunk（先输出）
{
  "id": "xxx",
  "model": "deepseek-chat",
  "object": "chat.completion.chunk",
  "choices": [{
    "index": 0,
    "delta": {
      "reasoning_content": "我们被问到..."
    },
    "finish_reason": null
  }]
}

// 最终回答 Chunk（后输出）
{
  "id": "xxx",
  "model": "deepseek-chat",
  "object": "chat.completion.chunk",
  "choices": [{
    "index": 0,
    "delta": {
      "content": "9.8 更大..."
    },
    "finish_reason": null
  }]
}
```

**关键发现：**
- `reasoning_content` 和 `content` **不会同时出现**在同一个 chunk
- 流式响应顺序：**先输出所有 reasoning_content → 再输出所有 content → finish_reason="stop"**
- 思考模式下 chunks 数量明显更多（测试中：reasoning 247 chunks + content 78 chunks = 325+ chunks）

## 3. delta 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `role` | string | 角色，仅第一个 chunk 包含，值为 `"assistant"` |
| `content` | string | 最终回答内容片段 |
| `reasoning_content` | string | 思考过程内容片段（仅思考模式） |

## 4. Python 处理示例

```python
async def stream_chat_with_thinking(messages: list, enable_thinking: bool = True):
    """带思考模式的流式对话"""
    
    extra_body = {}
    if enable_thinking:
        extra_body["thinking"] = {"type": "enabled"}
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        extra_body=extra_body if extra_body else None
    )
    
    for chunk in response:
        if not chunk.choices:
            continue
            
        delta = chunk.choices[0].delta
        finish_reason = chunk.choices[0].finish_reason
        
        # 思考过程
        if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
            yield {
                "type": "reasoning",
                "content": delta.reasoning_content
            }
        
        # 最终回答
        if delta.content:
            yield {
                "type": "content", 
                "content": delta.content
            }
        
        # 完成
        if finish_reason == "stop":
            yield {"type": "done"}
```

## 5. 后端 SSE 响应格式

```
data: {"type": "reasoning", "content": "我们被问到..."}

data: {"type": "reasoning", "content": "这看起来很简单..."}

data: {"type": "content", "content": "9.8"}

data: {"type": "content", "content": " 更大"}

data: {"type": "done"}

data: [DONE]
```

## 6. 前端 TypeScript 类型定义

```typescript
// SSE 数据块类型
interface StreamChunk {
  type: 'reasoning' | 'content' | 'done';
  content?: string;
}

// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;  // 仅 assistant 消息
  timestamp: Date;
  isStreaming?: boolean;
}

// 聊天请求
interface ChatRequest {
  conversation_id: number;
  content: string;
  enable_thinking?: boolean;
}
```

## 7. 测试结果统计

| 测试项 | 结果 |
|--------|------|
| 普通流式输出 | ✅ 通过（约 17-28 chunks） |
| 思考模式流式输出 | ✅ 通过（约 300-800+ chunks） |
| 多轮对话 | ✅ 通过 |
| reasoning_content 字段 | ✅ 存在，格式正确 |

## 8. 注意事项

1. **模型选择**：统一使用 `deepseek-chat`，通过 `extra_body` 开启思考模式
2. **思考模式开启**：`extra_body={"thinking": {"type": "enabled"}}`
3. **流式处理**：需要检查 `hasattr(delta, 'reasoning_content')` 因为普通模式不包含该字段
4. **错误码**：
   - 401: API Key 无效
   - 402: 余额不足
   - 429: 请求频率限制
