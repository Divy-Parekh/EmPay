import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { UserPlus, Eye, EyeOff, Upload, Zap, ShieldCheck, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({
    company_name: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
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

    if (!form.company_name || !form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('company_name', form.company_name);
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('password', form.password);
    formData.append('confirm_password', form.confirm_password);
    if (logo) formData.append('companyLogo', logo);

    try {
      const res = await authApi.signup(formData);
      if (res.success) {
        login(res.data);
        toast.success('Company registered successfully!');
        navigate('/dashboard/employees');
      } else {
        toast.error(res.error?.message || 'Signup failed');
      }
    } catch (err) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#111827]">
      {/* Left Pane — The Visual Brand Side */}
      <div 
        className="hidden md:flex w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #10b981 100%)', // Matching Login page emerald gradient
        }}
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-300 blur-[100px]" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <UserPlus size={48} className="text-white fill-emerald-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">
            Join <span className="text-emerald-300">EmPay</span>
          </h1>
          <p className="text-blue-50 text-xl leading-relaxed font-medium opacity-90">
            Launch your company on the world's most intelligent HRMS platform. Automate payroll, attendance, and employee insights in minutes.
          </p>
        </div>

        {/* Feature badges */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-center gap-6">
          <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-semibold flex items-center gap-2">
            <Globe size={14} className="text-emerald-400" /> Multi-region Compliant
          </div>
          <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" /> AES-256 Encryption
          </div>
        </div>
      </div>

      {/* Right Pane — The Signup Form Side */}
      <div className="w-full md:w-1/2 flex flex-col justify-start md:justify-center items-center p-6 lg:p-12 bg-[#111827] overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-emerald-500/20 shadow-xl">
              <Zap size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">EmPay HRMS</h2>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-3xl font-bold text-white mb-3">Create Company</h2>
            <p className="text-[#9ca3af] text-lg font-medium">Register your organization to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Section */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280] ml-1">Organization Name *</label>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Odoo India"
                  className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#4b5563] text-sm"
                />
              </div>
              <div className="shrink-0 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280] ml-1">Brand Logo</label>
                <label className="flex items-center justify-center w-[58px] h-[58px] rounded-xl cursor-pointer overflow-hidden bg-[#1f2937] border border-[#374151] hover:border-[#10b981] transition-all group">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={20} className="text-[#6b7280] group-hover:text-emerald-400" />
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Admin Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280] ml-1">Admin Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#4b5563] text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280] ml-1">Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765..."
                  className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#4b5563] text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280] ml-1">Work Email Address *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@company.com"
                className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#4b5563] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280] ml-1">Password *</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars"
                    className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#4b5563] text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b5563] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280] ml-1">Confirm *</label>
                <input
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter"
                  className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#4b5563] text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-3 transform active:scale-[0.98] mt-6
                ${loading ? 'opacity-70 cursor-not-allowed grayscale' : ''}
              `}
              id="signup-submit-btn"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={22} />
              )}
              {loading ? 'Initializing...' : 'Create My Company'}
            </button>
          </form>

          <p className="mt-10 text-center text-[#6b7280] text-sm font-medium">
            Already have an account? <Link to="/login" className="text-[#10b981] hover:underline font-bold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
