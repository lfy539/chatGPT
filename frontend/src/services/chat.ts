import { useAuthStore } from '../stores/authStore';

export interface ChatMeta {
  conversation_id: number;
  user_message_id: number;
}

export interface ChatDone {
  conversation_id: number;
  assistant_message_id: number;
}

export async function streamChatCompletion(params: {
  conversationId?: number | null;
  content: string;
  /** deepseek-chat | deepseek-coder | deepseek-reasoner */
  model?: string;
  enableThinking: boolean;
  onMeta: (meta: ChatMeta) => void;
  onReasoning: (chunk: string) => void;
  onContent: (chunk: string) => void;
  onDone: (data: ChatDone) => void;
  onError: (message: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const token = useAuthStore.getState().token;

  const res = await fetch('/api/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      conversation_id: params.conversationId ?? null,
      content: params.content,
      enable_thinking: params.enableThinking,
      model: params.model ?? 'deepseek-chat',
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail ?? j);
    } catch {
      try {
        msg = await res.text();
      } catch {
        /* ignore */
      }
    }
    params.onError(msg || `HTTP ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    params.onError('无法读取响应流');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const block of parts) {
        const lines = block.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const obj = JSON.parse(payload) as Record<string, unknown>;
            const t = obj.type as string;
            if (t === 'meta') {
              params.onMeta({
                conversation_id: obj.conversation_id as number,
                user_message_id: obj.user_message_id as number,
              });
            } else if (t === 'reasoning') {
              params.onReasoning(String(obj.content ?? ''));
            } else if (t === 'content') {
              params.onContent(String(obj.content ?? ''));
            } else if (t === 'done') {
              params.onDone({
                conversation_id: obj.conversation_id as number,
                assistant_message_id: obj.assistant_message_id as number,
              });
            } else if (t === 'error') {
              params.onError(String(obj.message ?? '未知错误'));
            }
          } catch {
            /* 跳过无法解析的行 */
          }
        }
      }
    }
  } catch (e: unknown) {
    const err = e as Error;
    if (err.name === 'AbortError') {
      return;
    }
    params.onError(err.message || '流式读取失败');
  }
}
