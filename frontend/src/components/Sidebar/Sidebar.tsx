import { useState } from 'react';
import { 
  MessageSquarePlus, 
  MessageSquare, 
  Settings, 
  LogOut,
  Trash2,
  Edit2,
  Check,
  X,
  Menu,
  ChevronLeft
} from 'lucide-react';
import styles from './Sidebar.module.css';

export interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

interface SidebarProps {
  conversations: Conversation[];
  currentId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onSettings: () => void;
  onLogout: () => void;
  username?: string;
}

const Sidebar = ({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onSettings,
  onLogout,
  username = '用户',
}: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* 折叠按钮 */}
      <button 
        className={styles.collapseButton}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
      </button>

      {!collapsed && (
        <>
          {/* 新建会话按钮 */}
          <button className={styles.newButton} onClick={onNew}>
            <MessageSquarePlus size={18} />
            <span>新建对话</span>
          </button>

          {/* 会话列表 */}
          <div className={styles.conversationList}>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${
                  conv.id === currentId ? styles.active : ''
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare size={16} />
                
                {editingId === conv.id ? (
                  <input
                    className={styles.editInput}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                ) : (
                  <span className={styles.title}>{conv.title}</span>
                )}

                <div className={styles.actions}>
                  {editingId === conv.id ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}>
                        <Check size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}>
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleStartEdit(conv); }}>
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className={styles.deleteButton}
                        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 底部菜单 */}
          <div className={styles.footer}>
            <button className={styles.footerButton} onClick={onSettings}>
              <Settings size={18} />
              <span>设置</span>
            </button>
            
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{username.charAt(0).toUpperCase()}</div>
              <span className={styles.username}>{username}</span>
              <button className={styles.logoutButton} onClick={onLogout}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
