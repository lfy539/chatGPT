/** 与设置页共用的 localStorage 键 */
const STORAGE_KEY = 'settings';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ChatModelId = 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';

export type UiSettings = {
  theme?: ThemeMode;
  model?: ChatModelId;
  apiKey?: string;
  /** 仅对 deepseek-chat / deepseek-coder 生效；reasoner 自带推理链 */
  enableThinking?: boolean;
};

export function loadUiSettings(): UiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UiSettings;
  } catch {
    return {};
  }
}

export function saveUiSettings(partial: Partial<UiSettings>): void {
  const prev = loadUiSettings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...partial }));
}

/** 启动时应用主题到 document */
export function applyStoredTheme(): void {
  const { theme } = loadUiSettings();
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    return;
  }
  if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    return;
  }
  document.documentElement.setAttribute('data-theme', 'dark');
}

/** 发起对话时读取模型与思考开关 */
export function getChatPrefs(): {
  model: ChatModelId;
  enableThinking: boolean;
} {
  const s = loadUiSettings();
  const model = (s.model as ChatModelId) || 'deepseek-chat';
  const enableThinking = s.enableThinking !== false;
  return { model, enableThinking };
}
