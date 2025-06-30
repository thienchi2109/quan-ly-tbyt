import React, { useState } from 'react';
import { Activity, Mail, Lock, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('admin@clinic.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage.code === 'en' 
      ? { code: 'vi' as const, name: 'Tiếng Việt' }
      : { code: 'en' as const, name: 'English' };
    setLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-8 py-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MedClinic</h1>
            <p className="text-primary-100 mt-2">Medical Clinic Management System</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
              <p className="text-xs text-gray-600">Email: admin@clinic.com</p>
              <p className="text-xs text-gray-600">Password: admin123</p>
            </div>

            {/* Language Toggle */}
            <div className="mt-6 text-center">
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Globe className="h-4 w-4 mr-1" />
                {currentLanguage.code === 'en' ? 'Tiếng Việt' : 'English'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};