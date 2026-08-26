import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login, getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, fullName, role);
      const { access_token } = await login(email, password);
      useAuthStore.getState().setAuth(null as any, access_token);
      const user = await getMe();
      setAuth(user, access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account');
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Join LoopBack</h1>
          <p style={{ margin: '8px 0 0', color: '#737373', fontSize: 14 }}>Track your applications, completely stress-free.</p>
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'rgba(80,0,0,.4)', border: '1px solid #7f1d1d', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 8, fontWeight: 500 }}>Full Name</label>
            <input
              type="text" required
              value={fullName} onChange={e => setFullName(e.target.value)}
              className="input-base" placeholder="Jane Doe"
            />
          </div>

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

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 8, fontWeight: 500 }}>I am a...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                onClick={() => setRole('candidate')}
                style={{
                  padding: '12px', borderRadius: 8,
                  background: role === 'candidate' ? '#fff' : 'transparent',
                  color: role === 'candidate' ? '#000' : '#737373',
                  border: `1px solid ${role === 'candidate' ? '#fff' : '#262626'}`,
                  cursor: 'pointer', fontWeight: 500, fontSize: 13,
                  transition: 'all .15s'
                }}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('recruiter')}
                style={{
                  padding: '12px', borderRadius: 8,
                  background: role === 'recruiter' ? '#fff' : 'transparent',
                  color: role === 'recruiter' ? '#000' : '#737373',
                  border: `1px solid ${role === 'recruiter' ? '#fff' : '#262626'}`,
                  cursor: 'pointer', fontWeight: 500, fontSize: 13,
                  transition: 'all .15s'
                }}
              >
                Recruiter
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', marginTop: 8 }}
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: '#737373' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#fff', fontWeight: 500, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};
