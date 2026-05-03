import { useState, useEffect } from 'react';
import { settingsApi } from '../api/settings.api';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, 
  Save, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Activity,
  Globe,
  Mail,
  Phone
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

// Mock growth data for the visual dashboard
const GROWTH_DATA = [
  { year: '2022', employees: 12, revenue: 1.2 },
  { year: '2023', employees: 45, revenue: 2.8 },
  { year: '2024', employees: 89, revenue: 5.4 },
  { year: '2025', employees: 142, revenue: 9.1 },
];

export default function CompanyDetails() {
  const { company: authCompany } = useAuth();
  const [form, setForm] = useState({ 
    name: '', 
    prefix: '', 
    email: 'contact@empay.corp',
    phone: '+91 98765 43210',
    website: 'www.empay.corp',
    address: 'Tech Park, Mumbai, India',
    logo_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Derive Server URL for images
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const SERVER_URL = API_URL.replace('/api', '');

  useEffect(() => {
    settingsApi.getCompany().then(res => {
      if (res.success && res.data) {
        setForm(prev => ({ 
          ...prev,
          name: res.data.name || '', 
          prefix: res.data.prefix || '',
          logo_url: res.data.logo_url || ''
        }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await settingsApi.updateCompany(form);
    setSaving(false);
    if (res.success) toast.success('Company details updated');
    else toast.error('Failed to update');
  };

  if (loading) return <div className="card p-12 text-center text-[var(--text-secondary)]">Analyzing Company Architecture...</div>;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
            {form.logo_url ? (
              <img 
                src={`${SERVER_URL}${form.logo_url}`} 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <Building2 size={28} className="text-emerald-500" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)]">Company Profile</h1>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">Enterprise Intelligence — {form.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Core Profile Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-8">
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-6">Core Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Company Legal Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">System ID Prefix</label>
                <input 
                  value={form.prefix} 
                  onChange={e => setForm({ ...form, prefix: e.target.value })} 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  maxLength={10} 
                />
              </div>
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Mail size={16} className="text-blue-500" /> {form.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Phone size={16} className="text-emerald-500" /> {form.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <Globe size={16} className="text-purple-500" /> {form.website}
                </div>
              </div>

              <button 
                onClick={handleSave} 
                disabled={saving} 
                className={`w-full btn-primary flex items-center justify-center gap-2 py-4 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] ${saving ? 'opacity-50' : ''}`}
              >
                <Save size={18} /> {saving ? 'Syncing Intelligence...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          <div className="card p-8 border-t-2 border-emerald-500">
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-6 italic">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)]">ESTABLISHED</span>
                <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tighter">OCT 2022</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)]">LOCATIONS</span>
                <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tighter">3 GLOBAL HUBS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6b7280]">STATUS</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-black uppercase">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Company Intelligence Dashboard */}
        <div className="lg:col-span-2 space-y-8">
          {/* Intelligence KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={20} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Annual Growth</span>
              </div>
              <h4 className="text-3xl font-black text-[var(--text-primary)]">+142%</h4>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">Exceeding sector avg by 12%</p>
            </div>
            
            <div className="card p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 mb-4">
                <Users size={20} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Retention</span>
              </div>
              <h4 className="text-3xl font-black text-[var(--text-primary)]">94.2%</h4>
              <p className="text-[10px] text-blue-500 font-bold mt-1">LTM Average (Industry: 82%)</p>
            </div>

            <div className="card p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 mb-4">
                <Activity size={20} className="text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Efficiency</span>
              </div>
              <h4 className="text-3xl font-black text-[var(--text-primary)]">8.2k</h4>
              <p className="text-[10px] text-purple-500 font-bold mt-1">Employee output score (Avg)</p>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)]">Growth Projection Intelligence</h3>
                <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Headcount & Resource Velocity (2022 - 2025)</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">HEADCOUNT</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GROWTH_DATA}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-modal)',
                      color: 'var(--text-primary)'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="employees" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#growthGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Departmental Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Compliance Status</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">ALL HUB LOCATIONS VERIFIED</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-500 uppercase">100% SECURE</span>
              </div>
            </div>
            
            <div className="card p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Activity size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">System Health</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">LATENCY: 14ms (OPTIMIZED)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-blue-500 uppercase">OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
