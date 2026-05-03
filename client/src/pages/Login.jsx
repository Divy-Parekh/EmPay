import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { LogIn, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const payload = loginId.includes('@')
      ? { email: loginId, password }
      : { login_id: loginId, password };

    try {
      const res = await authApi.login(payload);
      if (res.success) {
        login(res.data);
        toast.success('Welcome back to EmPay!');
        // Small delay to ensure state is committed before redirect
        setTimeout(() => navigate('/dashboard/employees'), 100);
      } else {
        toast.error(res.error?.message || 'Login failed');
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
          background: 'linear-gradient(135deg, #1e3a8a 0%, #10b981 100%)',
        }}
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-300 blur-[100px]" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <Zap size={48} className="text-white fill-emerald-400" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">
            EmPay <span className="text-emerald-300">Smart HRMS</span>
          </h1>
          <p className="text-blue-50 text-xl leading-relaxed font-medium opacity-90">
            Next-generation enterprise ERP for modern workforce management. High density, pro-rata intelligence, and role-aware security.
          </p>
        </div>

        {/* Feature badges */}
        <div className="absolute bottom-12 left-12 right-12 flex justify-center gap-6">
          <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" /> Enterprise Grade
          </div>
          <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/80 text-xs font-semibold flex items-center gap-2">
            <Zap size={14} className="text-blue-400" /> Real-time Analytics
          </div>
        </div>
      </div>

      {/* Right Pane — The Login Form Side */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 lg:p-16 bg-[#111827]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-emerald-500/20 shadow-xl">
              <Zap size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">EmPay HRMS</h2>
          </div>

          <div className="mb-10 text-left">
            <h2 className="text-3xl font-bold text-white mb-3">Sign In</h2>
            <p className="text-[#9ca3af] text-lg font-medium">Access your enterprise dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#f9fafb] ml-1 uppercase tracking-wider" htmlFor="login-id">
                Login ID
              </label>
              <div className="relative group">
                <input
                  id="login-id"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="EMP-1024 or Email"
                  className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#6b7280]"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#f9fafb] ml-1 uppercase tracking-wider" htmlFor="login-password">
                Password
              </label>
              <div className="relative group">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1f2937] border border-[#374151] text-white rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all duration-200 placeholder:text-[#6b7280]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-3 transform active:scale-[0.98]
                ${loading ? 'opacity-70 cursor-not-allowed grayscale' : ''}
              `}
              id="login-submit-btn"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={22} />
              )}
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Quick Access Grid */}
          <div className="mt-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] flex-1 bg-[#374151]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7280]">Role-Based Access</span>
              <div className="h-[1px] flex-1 bg-[#374151]" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'Admin', email: 'admin@odoo.com', color: '#10b981' },
                { role: 'HR', email: 'ananya.hr@odoo.com', color: '#3b82f6' },
                { role: 'Payroll', email: 'rohan.payroll@odoo.com', color: '#f59e0b' },
                { role: 'Employee', email: 'priya.dev@odoo.com', color: '#ef4444' }
              ].map(q => (
                <button
                  key={q.role}
                  type="button"
                  onClick={() => {
                    setLoginId(q.email);
                    setPassword('Password@123');
                  }}
                  className="group flex flex-col items-start p-4 rounded-xl bg-[#1f2937] border border-[#374151] hover:border-[#10b981] transition-all duration-300 text-left hover:shadow-xl hover:shadow-black/20"
                >
                  <span className="text-xs font-bold mb-1 group-hover:text-white transition-colors" style={{ color: q.color }}>{q.role}</span>
                  <span className="text-[10px] text-[#6b7280] truncate w-full group-hover:text-[#9ca3af]">{q.email}</span>
                </button>
              ))}
            </div>
          </div>
          
          <p className="mt-10 text-center text-[#6b7280] text-sm font-medium">
            Don&apos;t have an account? <Link to="/signup" className="text-[#10b981] hover:underline font-bold">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
