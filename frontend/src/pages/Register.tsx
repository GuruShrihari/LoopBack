import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, login, getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, User, Briefcase, Loader2, ArrowRight } from 'lucide-react';

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
      // 1. Register the user
      await register(email, password, fullName, role);
      // 2. Automatically log them in
      const { access_token } = await login(email, password);
      useAuthStore.getState().setAuth(null as any, access_token);
      // 3. Fetch their profile
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-950 to-gray-950"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Join LoopBack</h1>
          <p className="text-gray-400">Track your applications, completely stress-free.</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white transition-all outline-none"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    role === 'candidate' 
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                      : 'bg-gray-950/50 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    role === 'recruiter' 
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                      : 'bg-gray-950/50 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                  }`}
                >
                  <Briefcase className="h-5 w-5" />
                  <span className="text-sm font-medium">Recruiter</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
