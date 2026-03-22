import { useState } from 'react';
import { Brain, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { UserType } from '../App';

interface LoginPageProps {
  onLogin: (type: UserType, name: string, email: string, id: string) => void;
  onBackToLanding: () => void;
  initialUserType: UserType;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function LoginPage({ onLogin, onBackToLanding, initialUserType }: LoginPageProps) {
  const [userType, setUserType] = useState<UserType>(initialUserType || 'jobseeker');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async () => {
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && !formData.name) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password, user_type: userType }
        : { name: formData.name, email: formData.email, password: formData.password, user_type: userType };

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Something went wrong. Please try again.');
        return;
      }

      // Store token in localStorage for future use
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user.id);

      // Pass user info up to App
      onLogin(data.user.user_type, data.user.name, data.user.email, data.user.id);

    } catch (err) {
      setError('Cannot connect to server. Make sure your backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-purple-600" />
            <span className="text-2xl text-purple-900">SkillNuron AI</span>
          </div>

          {/* User Type Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setUserType('jobseeker')}
              className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                userType === 'jobseeker'
                  ? 'bg-white shadow text-purple-700 font-medium'
                  : 'text-gray-600'
              }`}
            >
              Job Seeker
            </button>
            <button
              onClick={() => setUserType('recruiter')}
              className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                userType === 'recruiter'
                  ? 'bg-white shadow text-purple-700 font-medium'
                  : 'text-gray-600'
              }`}
            >
              Recruiter
            </button>
          </div>

          {/* Login / Register Toggle */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                isLogin ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                !isLogin ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Register
            </button>
          </div>

          <div className="space-y-4">
            {/* Name field — only for register */}
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Panchal"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-400 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}