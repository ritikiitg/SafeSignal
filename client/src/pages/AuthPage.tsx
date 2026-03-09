import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { useSound } from '../hooks/useSound';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const play = useSound();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    play('click');
    try {
      const res = isLogin
        ? await api.login(email, password)
        : await api.register(email, password, name);
      setAuth(res.token, res.user);
      play('send');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <img src="/assets/logo.png" alt="SafeSignal" className={styles.logo} />
          <h1>Sense safety before<br />you think it.</h1>
          <p>Track your body's pre-conscious sense of safety vs danger, and recover before overload.</p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.formCard}>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className={styles.subtext}>{isLogin ? 'Log in to your SafeSignal dashboard' : 'Start your neuroception journey'}</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className={styles.field}>
                <label>Name</label>
                <input className="input" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className={styles.field}>
              <label>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className={styles.switch}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button className={styles.switchBtn} onClick={() => { setIsLogin(!isLogin); setError(''); play('click'); }}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
