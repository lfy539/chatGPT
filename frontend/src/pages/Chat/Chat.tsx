import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import type { Conversation } from '../../components/Sidebar';
import ChatMessage from '../../components/ChatMessage';
import type { Message } from '../../components/ChatMessage';
import ChatInput from '../../components/ChatInput';
import { useAuthStore } from '../../stores';
import {
  fetchConversations,
  fetchConversation,
  updateConversation,
  deleteConversation,
  type ApiMessage,
} from '../../services/conversation';
import { streamChatCompletion } from '../../services/chat';
import { getChatPrefs, loadUiSettings, saveUiSettings } from '../../utils/settings';
import styles from './Chat.module.css';

function mapApiMessage(m: ApiMessage): Message {
  return {
    id: String(m.id),
    role: m.role as 'user' | 'assistant',
    content: m.content,
    reasoningContent: m.reasoning_content ?? undefined,
    timestamp: new Date(m.created_at),
  };
}

const Chat = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [enableThinking, setEnableThinking] = useState(
    () => loadUiSettings().enableThinking !== false
  );
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    saveUiSettings({ enableThinking });
  }, [enableThinking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const refreshSidebar = useCallback(async () => {
    const list = await fetchConversations();
    setConversations(
      list.map((c) => ({
        id: String(c.id),
        title: c.title,
        updatedAt: new Date(c.updated_at),
      }))
    );
  }, []);

  const loadMessagesFor = useCallback(async (convIdStr: string) => {
    const detail = await fetchConversation(Number(convIdStr));
    setMessages(detail.messages.map(mapApiMessage));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchConversations();
        if (cancelled) return;
        const mapped = list.map((c) => ({
          id: String(c.id),
          title: c.title,
          updatedAt: new Date(c.updated_at),
        }));
        setConversations(mapped);
        if (mapped.length > 0) {
          const first = mapped[0];
          setCurrentConvId(first.id);
          await loadMessagesFor(first.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMessagesFor]);

  const handleSendMessage = async (content: string) => {
    const convNum = currentConvId ? Number(currentConvId) : undefined;
    const userLocalId = `u-${Date.now()}`;

    const userMessage: Message = {
      id: userLocalId,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const asstLocalId = `a-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: asstLocalId,
      role: 'assistant',
      content: '',
      reasoningContent: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsGenerating(true);

    const ac = new AbortController();
    abortRef.current = ac;

    const { model } = getChatPrefs();

    await streamChatCompletion({
      conversationId: convNum,
      content,
      model,
      enableThinking,
      signal: ac.signal,
      onMeta: ({ conversation_id, user_message_id }) => {
        setCurrentConvId(String(conversation_id));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userLocalId ? { ...m, id: String(user_message_id) } : m
          )
        );
        void refreshSidebar();
      },
      onReasoning: (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstLocalId
              ? { ...m, reasoningContent: (m.reasoningContent || '') + chunk }
              : m
          )
        );
      },
      onContent: (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstLocalId ? { ...m, content: m.content + chunk } : m
          )
        );
      },
      onDone: ({ conversation_id, assistant_message_id }) => {
        setCurrentConvId(String(conversation_id));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstLocalId
              ? { ...m, id: String(assistant_message_id), isStreaming: false }
              : m
          )
        );
        void refreshSidebar();
      },
      onError: (msg) => {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== asstLocalId);
          return [
            ...filtered,
            {
              id: `err-${Date.now()}`,
              role: 'assistant' as const,
              content: `请求失败：${msg}`,
              timestamp: new Date(),
            },
          ];
        });
      },
    });

    setIsGenerating(false);
    abortRef.current = null;
  };

  const handleStopGenerate = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  };

  const handleNewConversation = () => {
    setCurrentConvId(undefined);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(Number(id));
      const next = conversations.filter((c) => c.id !== id);
      setConversations(next);
      if (currentConvId === id) {
        if (next[0]) {
          setCurrentConvId(next[0].id);
          await loadMessagesFor(next[0].id);
        } else {
          setCurrentConvId(undefined);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      await updateConversation(Number(id), title);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setCurrentConvId(id);
    try {
      await loadMessagesFor(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <Sidebar
        conversations={conversations}
        currentId={currentConvId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        onSettings={handleSettings}
        onLogout={handleLogout}
        username={user?.username || '用户'}
      />

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <label className={styles.thinkingToggle}>
            <input
              type="checkbox"
              checked={enableThinking}
              disabled={isGenerating}
              onChange={(e) => setEnableThinking(e.target.checked)}
            />
            <span>思考模式（DeepSeek）</span>
          </label>
        </div>

        {initialLoading ? (
          <div className={styles.welcome}>
            <p className={styles.muted}>加载会话…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.welcome}>
            <Bot size={64} className={styles.welcomeIcon} />
            <h1>有什么可以帮助你的？</h1>
            <p>开始输入消息，或使用「新建对话」开启新会话</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStopGenerate}
          isGenerating={isGenerating}
          disabled={initialLoading}
        />
      </main>
    </div>
  );
};

export default Chat;
