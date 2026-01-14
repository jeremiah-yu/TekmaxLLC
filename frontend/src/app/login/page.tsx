'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'restaurant_owner') {
        router.push('/restaurant/dashboard');
      } else if (user.role === 'rider') {
        router.push('/rider/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { role: 'Admin', email: 'admin@tekmax.com', password: 'admin123' },
    { role: 'Owner', email: 'owner@restaurant.com', password: 'owner123' },
    { role: 'Rider', email: 'rider@tekmax.com', password: 'rider123' },
  ];

  const fillTestAccount = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Header */}
        <header className="login-header">
          <div className="header-logo">
            <div className="logo-icon">T</div>
            <span className="logo-text">TekMax LLC</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="login-main">
          <div className="login-content">
            <h1 className="login-title">Login</h1>

            {error && (
              <div className="error-message">
                <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-input"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="form-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? (
                      <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <span className="button-loading">
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="signin-link">
              <p>Have an account? <a href="#">Sign in</a></p>
            </div>

            {/* Test Accounts */}
            <div className="test-accounts">
              <h3 className="test-accounts-title">Quick Login - Test Accounts</h3>
              <div className="test-accounts-grid">
                {testAccounts.map((account, index) => (
                  <div key={index} className="test-account-card">
                    <div className="test-account-header">
                      <div className="test-account-icon">{account.role[0]}</div>
                      <div className="test-account-info">
                        <p className="test-account-role">{account.role}</p>
                        <p className="test-account-email">{account.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillTestAccount(account.email, account.password)}
                      className="test-account-button"
                    >
                      Click to fill
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Branding */}
            <div className="login-footer">
              <div className="footer-logo">tekmax</div>
              <h2 className="footer-title">TekMax Delivery Platform</h2>
              <p className="footer-tagline">Streamline your delivery operations with our comprehensive management system</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
