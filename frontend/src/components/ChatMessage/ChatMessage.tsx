import { useState } from 'react';
import { User, Bot, Copy, Check, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import styles from './ChatMessage.module.css';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.messageWrapper} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.avatar}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      
      <div className={styles.content}>
        {/* 思考过程区域 */}
        {message.reasoningContent && (
          <div className={styles.thinkingWrapper}>
            <button 
              className={styles.thinkingToggle}
              onClick={() => setShowThinking(!showThinking)}
            >
              <Brain size={16} />
              <span>思考过程</span>
              {showThinking ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showThinking && (
              <div className={styles.thinkingContent}>
                <MarkdownRenderer content={message.reasoningContent} />
              </div>
            )}
          </div>
        )}
        
        {/* 消息内容 */}
        <div className={styles.messageContent}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          
          {message.isStreaming && (
            <span className={styles.cursor}>▊</span>
          )}
        </div>
        
        {/* 操作按钮 */}
        {!isUser && !message.isStreaming && (
          <div className={styles.actions}>
            <button 
              className={styles.actionButton}
              onClick={handleCopy}
              title="复制"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
