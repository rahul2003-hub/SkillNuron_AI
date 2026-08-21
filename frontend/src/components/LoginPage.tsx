import { useState } from 'react';
import { Brain, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { UserType } from '../App';
import { supabase } from '../services/supabase';
import { syncUserWithBackend } from '../services/api';

interface LoginPageProps {
  onLogin: (type: UserType, name: string, email: string, id: string) => void;
  onBackToLanding: () => void;
  initialUserType: UserType;
}

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
      if (isLogin) {
        // Supabase Auth Sign In
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        if (!data.user) {
          setError('Failed to authenticate with Supabase');
          return;
        }

        const metadata = data.user.user_metadata || {};
        const name = metadata.name || formData.name || data.user.email?.split('@')[0] || 'User';
        const role = (metadata.user_type as UserType) || userType || 'jobseeker';

        // Sync with backend PostgreSQL database
        await syncUserWithBackend(name, role);

        onLogin(role, name, data.user.email || formData.email, data.user.id);
      } else {
        // Supabase Auth Sign Up
        const { data, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              user_type: userType,
            },
          },
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        if (!data.user) {
          setError('Registration failed. Please try again.');
          return;
        }

        const name = formData.name;
        const role = userType || 'jobseeker';

        if (data.session) {
          await syncUserWithBackend(name, role);
          onLogin(role, name, data.user.email || formData.email, data.user.id);
        } else {
          setError('Account created! Please check your email to verify your account or proceed to login.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Cannot connect to server. Please try again.');
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
              className={`flex-1 py-2 rounded-lg text-sm transition-all ${userType === 'jobseeker'
                  ? 'bg-white shadow text-purple-700 font-medium'
                  : 'text-gray-600'
                }`}
            >
              Job Seeker
            </button>
            <button
              onClick={() => setUserType('recruiter')}
              className={`flex-1 py-2 rounded-lg text-sm transition-all ${userType === 'recruiter'
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
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${isLogin ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${!isLogin ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
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
                {error}
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