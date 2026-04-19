import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuthStore } from '../../stores';
import styles from './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validate()) return;
    
    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      navigate('/chat');
    } catch {
      // 错误已经在 store 中处理
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Bot size={48} />
        </div>
        
        <h1 className={styles.title}>欢迎回来</h1>
        <p className={styles.subtitle}>登录您的账户继续对话</p>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="邮箱"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            fullWidth
          />
          
          <Input
            label="密码"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            fullWidth
          />
          
          <Button type="submit" fullWidth loading={isLoading}>
            登录
          </Button>
        </form>
        
        <p className={styles.footer}>
          还没有账户？<Link to="/register">立即注册</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
