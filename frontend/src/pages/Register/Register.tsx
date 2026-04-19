import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuthStore } from '../../stores';
import styles from './Register.module.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 2) {
      newErrors.username = '用户名至少2位';
    }
    
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
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validate()) return;
    
    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
        
        <h1 className={styles.title}>创建账户</h1>
        <p className={styles.subtitle}>注册开始您的AI对话之旅</p>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={styles.success}>
            注册成功！正在跳转到登录页面...
          </div>
        )}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="用户名"
            type="text"
            placeholder="您的昵称"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={errors.username}
            fullWidth
          />
          
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
          
          <Input
            label="确认密码"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            fullWidth
          />
          
          <Button type="submit" fullWidth loading={isLoading}>
            注册
          </Button>
        </form>
        
        <p className={styles.footer}>
          已有账户？<Link to="/login">立即登录</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
