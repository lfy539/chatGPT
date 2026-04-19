import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
}

const ChatInput = ({
  onSend,
  onStop,
  disabled = false,
  isGenerating = false,
  placeholder = '输入消息...',
}: ChatInputProps) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (value.trim() && !disabled && !isGenerating) {
      onSend(value.trim());
      setValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        
        {isGenerating ? (
          <button
            className={`${styles.button} ${styles.stopButton}`}
            onClick={onStop}
            title="停止生成"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            className={styles.button}
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            title="发送消息 (Enter)"
          >
            <Send size={18} />
          </button>
        )}
      </div>
      
      <p className={styles.hint}>
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>
  );
};

export default ChatInput;
