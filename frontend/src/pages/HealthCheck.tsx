import { useState, useEffect } from 'react';
import { checkHealth } from '../services/health';
import type { HealthStatus } from '../services/health';

const HealthCheck = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '健康检查失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>系统健康检查</h1>
      
      {loading && (
        <div style={styles.loading}>
          <span>检查中...</span>
        </div>
      )}
      
      {error && (
        <div style={styles.error}>
          <span>❌ 错误: {error}</span>
        </div>
      )}
      
      {health && !loading && (
        <div style={styles.card}>
          <div style={styles.statusRow}>
            <span style={styles.label}>状态:</span>
            <span style={{
              ...styles.value,
              color: health.status === 'ok' ? '#10b981' : '#ef4444'
            }}>
              {health.status === 'ok' ? '✅ 正常' : '❌ 异常'}
            </span>
          </div>
          <div style={styles.statusRow}>
            <span style={styles.label}>服务:</span>
            <span style={styles.value}>{health.service}</span>
          </div>
          <div style={styles.statusRow}>
            <span style={styles.label}>时间:</span>
            <span style={styles.value}>
              {new Date(health.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      )}
      
      <button onClick={fetchHealth} style={styles.button}>
        刷新
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: 'var(--text-primary)',
  },
  loading: {
    fontSize: '1.2rem',
    color: '#64748b',
  },
  error: {
    padding: '1rem 2rem',
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
    color: '#dc2626',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '2rem',
    minWidth: '320px',
    boxShadow: 'var(--glass-shadow)',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid #2d3748',
  },
  label: {
    color: '#94a3b8',
    fontWeight: 500,
  },
  value: {
    color: '#ffffff',
    fontWeight: 600,
  },
  button: {
    marginTop: '2rem',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    backgroundColor: 'var(--accent-primary)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default HealthCheck;
