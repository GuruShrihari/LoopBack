import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { access_token } = await login(email, password);
      useAuthStore.getState().setAuth(null as any, access_token);
      
      const user = await getMe();
      setAuth(user, access_token);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 360 }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 40, height: 40, margin: '0 auto 20px',
            background: '#fff', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 20, color: '#000', letterSpacing: '-0.04em'
          }}>L</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Welcome Back</h1>
          <p style={{ margin: '8px 0 0', color: '#737373', fontSize: 14 }}>Sign in to continue your journey.</p>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'rgba(80,0,0,.4)', border: '1px solid #7f1d1d', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 8, fontWeight: 500 }}>Email Address</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="input-base" placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 8, fontWeight: 500 }}>Password</label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="input-base" placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', marginTop: 8 }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: '#737373' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#fff', fontWeight: 500, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};
