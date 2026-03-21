import { useState } from 'react';
import { Brain, Mail, Lock, Eye, EyeOff, UserCircle, Briefcase, ArrowLeft } from 'lucide-react';
import { UserType } from '../App';

interface LoginPageProps {
  onLogin: (type: UserType, name: string, email: string) => void;
  onBackToLanding: () => void;
  initialUserType?: UserType;
}

export function LoginPage({ onLogin, onBackToLanding, initialUserType = null }: LoginPageProps) {
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (isSignUp && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (isSignUp && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && userType) {
      const displayName = isSignUp ? formData.name : formData.email.split('@')[0];
      onLogin(userType, displayName, formData.email);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          {/* Back Button */}
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-600 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="w-12 h-12 text-purple-600" />
              <span className="text-4xl text-purple-900">SkillNuron AI</span>
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Choose how you want to continue</p>
          </div>

          {/* User Type Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Job Seeker Card */}
            <button
              onClick={() => setUserType('jobseeker')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-600 group text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UserCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl text-gray-900 mb-3">Job Seeker</h3>
              <p className="text-gray-600 mb-4">
                Find your dream job, analyze skill gaps, and plan your career path with AI-powered recommendations.
              </p>
              <div className="flex items-center gap-2 text-purple-600 group-hover:gap-3 transition-all">
                <span>Continue as Job Seeker</span>
                <span>→</span>
              </div>
            </button>

            {/* Recruiter Card */}
            <button
              onClick={() => setUserType('recruiter')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-pink-600 group text-left"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-2xl text-gray-900 mb-3">Recruiter</h3>
              <p className="text-gray-600 mb-4">
                Post jobs, discover top talent, and find the perfect candidates with AI-powered matching algorithms.
              </p>
              <div className="flex items-center gap-2 text-pink-600 group-hover:gap-3 transition-all">
                <span>Continue as Recruiter</span>
                <span>→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isJobSeeker = userType === 'jobseeker';
  const primaryColor = isJobSeeker ? 'purple' : 'pink';
  const gradientFrom = isJobSeeker ? 'from-purple-600' : 'from-pink-600';
  const gradientTo = isJobSeeker ? 'to-purple-700' : 'to-pink-700';
  const hoverColor = isJobSeeker ? 'hover:bg-purple-50' : 'hover:bg-pink-50';
  const focusRing = isJobSeeker ? 'focus:ring-purple-600' : 'focus:ring-pink-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={() => setUserType(null)}
          className="flex items-center gap-2 text-gray-700 hover:text-purple-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Change User Type</span>
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="w-10 h-10 text-purple-600" />
              <span className="text-3xl text-purple-900">SkillNuron AI</span>
            </div>
            <h2 className="text-2xl text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignUp ? 'Sign up' : 'Sign in'} as a{' '}
              <span className={`text-${primaryColor}-600`}>
                {isJobSeeker ? 'Job Seeker' : 'Recruiter'}
              </span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 ${focusRing} transition-all`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${focusRing} transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${focusRing} transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full pl-10 pr-12 py-3 border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 ${focusRing} transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Forgot Password Link (Login Only) */}
            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  className={`text-sm text-${primaryColor}-600 hover:underline`}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white py-3 rounded-lg hover:shadow-lg transition-all`}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Social Login Options */}
          <div className="space-y-3">
            <button
              type="button"
              className={`w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-300 rounded-lg ${hoverColor} transition-colors`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700">Continue with Google</span>
            </button>

            <button
              type="button"
              className={`w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-300 rounded-lg ${hoverColor} transition-colors`}
            >
              <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-gray-700">Continue with LinkedIn</span>
            </button>
          </div>

          {/* Toggle Sign In/Sign Up */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({ name: '', email: '', password: '', confirmPassword: '' });
                }}
                className={`text-${primaryColor}-600 hover:underline`}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Terms and Privacy */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-purple-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-purple-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
