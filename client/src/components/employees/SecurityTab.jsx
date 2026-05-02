import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityTab({ employee }) {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSelf = user?.id === employee?.user_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSelf && !oldPassword) { toast.error('Enter current password'); return; }
    if (!newPassword || newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setSaving(true);
    const payload = isSelf
      ? { oldPassword, newPassword, confirmPassword }
      : { userId: employee.user_id, newPassword };
    const res = await authApi.changePassword(payload);
    setSaving(false);

    if (res.success) {
      toast.success('Password changed successfully');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } else toast.error(res.error?.message || 'Failed to change password');
  };

  return (
    <div className="max-w-md">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold">Change Password</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Login ID</label>
            <input value={employee.login_id || ''} disabled className="input-field opacity-60" />
          </div>
          {isSelf && (
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="input-field pr-10" />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field pr-10" placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" />
          </div>
          <button type="submit" disabled={saving} className={`btn-primary w-full ${saving ? 'opacity-50' : ''}`} id="security-save">
            {saving ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
