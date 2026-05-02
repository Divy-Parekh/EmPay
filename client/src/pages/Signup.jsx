import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { UserPlus, Eye, EyeOff, Upload, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.companyName || !form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('companyName', form.companyName);
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('password', form.password);
    formData.append('confirmPassword', form.confirmPassword);
    if (logo) formData.append('companyLogo', logo);

    const res = await authApi.signup(formData);
    setLoading(false);

    if (res.success) {
      login(res.data);
      toast.success('Company registered successfully!');
      navigate('/dashboard/employees');
    } else {
      toast.error(res.error?.message || 'Signup failed');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at bottom, #1a1a2e 0%, #0F172A 50%, #0a0a1a 100%)',
      }}
    >
      {/* Floating orb decorations */}
      <div className="fixed top-40 right-10 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'var(--color-primary)' }} />
      <div className="fixed bottom-10 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: '#EC4899' }} />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #9333EA)',
              boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)',
            }}
          >
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EmPay</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Register your company</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Admin registration for new company</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name + Logo */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label" htmlFor="signup-company">Company Name *</label>
                <input
                  id="signup-company"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Odoo India"
                  className="input-field"
                />
              </div>
              <div className="shrink-0">
                <label className="label">Logo</label>
                <label
                  className="flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-[var(--color-primary)]"
                  style={{
                    background: logoPreview ? 'transparent' : 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={16} className="text-[var(--text-secondary)]" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="signup-logo"
                  />
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="label" htmlFor="signup-name">Full Name *</label>
              <input
                id="signup-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input-field"
              />
            </div>

            {/* Email */}
            <div>
              <label className="label" htmlFor="signup-email">Email *</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@company.com"
                className="input-field"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="label" htmlFor="signup-phone">Phone</label>
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="signup-password">Password *</label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label" htmlFor="signup-confirm">Confirm Password *</label>
              <input
                id="signup-confirm"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="input-field"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              id="signup-submit-btn"
            >
              <UserPlus size={18} />
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[var(--text-accent)] hover:text-white transition-colors font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
