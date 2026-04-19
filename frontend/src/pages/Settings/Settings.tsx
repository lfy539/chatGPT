import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Monitor } from 'lucide-react';
import Button from '../../components/Button';
import { loadUiSettings, saveUiSettings, type ChatModelId, type ThemeMode } from '../../utils/settings';
import styles from './Settings.module.css';

const Settings = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [model, setModel] = useState<ChatModelId>('deepseek-chat');
  const [enableThinking, setEnableThinking] = useState(true);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const s = loadUiSettings();
    if (s.theme) setTheme(s.theme);
    if (s.model) setModel(s.model);
    setEnableThinking(s.enableThinking !== false);
    if (s.apiKey) setApiKey(s.apiKey);
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (newTheme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else if (newTheme === 'light' || newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const handleSave = () => {
    saveUiSettings({ theme, model, apiKey, enableThinking });
    navigate('/chat');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/chat')}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <h1>设置</h1>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>主题</h2>
          <div className={styles.themeOptions}>
            <button
              type="button"
              className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <Sun size={24} />
              <span>亮色</span>
            </button>
            <button
              type="button"
              className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon size={24} />
              <span>暗色</span>
            </button>
            <button
              type="button"
              className={`${styles.themeOption} ${theme === 'system' ? styles.active : ''}`}
              onClick={() => handleThemeChange('system')}
            >
              <Monitor size={24} />
              <span>跟随系统</span>
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>AI 模型</h2>
          <div className={styles.modelOptions}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="model"
                value="deepseek-chat"
                checked={model === 'deepseek-chat'}
                onChange={() => setModel('deepseek-chat')}
              />
              <div className={styles.radioContent}>
                <span className={styles.radioTitle}>DeepSeek Chat</span>
                <span className={styles.radioDesc}>通用对话；可配合下方「思考模式」</span>
              </div>
            </label>

            <label className={styles.radioOption}>
              <input
                type="radio"
                name="model"
                value="deepseek-coder"
                checked={model === 'deepseek-coder'}
                onChange={() => setModel('deepseek-coder')}
              />
              <div className={styles.radioContent}>
                <span className={styles.radioTitle}>DeepSeek Coder</span>
                <span className={styles.radioDesc}>代码场景；可配合思考模式</span>
              </div>
            </label>

            <label className={styles.radioOption}>
              <input
                type="radio"
                name="model"
                value="deepseek-reasoner"
                checked={model === 'deepseek-reasoner'}
                onChange={() => setModel('deepseek-reasoner')}
              />
              <div className={styles.radioContent}>
                <span className={styles.radioTitle}>DeepSeek Reasoner (R1)</span>
                <span className={styles.radioDesc}>内置推理链；后端不再叠加额外 thinking 参数</span>
              </div>
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>对话偏好</h2>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={enableThinking}
              onChange={(e) => setEnableThinking(e.target.checked)}
            />
            <span>启用思考模式（对 Chat / Coder 生效；与对话页工具栏同步）</span>
          </label>
          <p className={styles.hint}>关闭后仅输出正文，流式更快；Reasoner 模型不受此项影响。</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>API 配置（可选）</h2>
          <div className={styles.apiInput}>
            <label>浏览器端预留（当前请求仍走后端配置的 Key）</label>
            <input
              type="password"
              placeholder="仅作本地备忘，可不填"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className={styles.hint}>
              生产环境请在服务器环境变量 <code>DEEPSEEK_API_KEY</code> 中配置
            </p>
          </div>
        </section>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/chat')}>
            取消
          </Button>
          <Button onClick={handleSave}>保存设置</Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
