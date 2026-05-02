import { useState, useEffect } from 'react';
import { settingsApi } from '../api/settings.api';
import { useAuth } from '../hooks/useAuth';
import { Building2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyDetails() {
  const { company } = useAuth();
  const [form, setForm] = useState({ name: '', prefix: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.getCompany().then(res => {
      if (res.success && res.data) setForm({ name: res.data.name || '', prefix: res.data.prefix || '' });
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

  if (loading) return <div className="card p-12 text-center text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Building2 size={24} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">Company Details</h1>
      </div>

      <div className="card p-6 max-w-lg space-y-4">
        <div>
          <label className="label">Company Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Prefix (used in Login ID)</label>
          <input value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })} className="input-field" maxLength={10} />
        </div>
        <button onClick={handleSave} disabled={saving} className={`btn-primary flex items-center gap-2 ${saving ? 'opacity-50' : ''}`} id="company-save">
          <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
