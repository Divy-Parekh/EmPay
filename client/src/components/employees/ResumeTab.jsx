import { useState } from 'react';
import { employeeApi } from '../../api/employee.api';
import { Plus, X, Award, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResumeTab({ employee, canEdit, onUpdate }) {
  const [about, setAbout] = useState(employee.about || '');
  const [job_love, setJobLove] = useState(employee.job_love || '');
  const [interests, setInterests] = useState(employee.interests || '');
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [addingCert, setAddingCert] = useState(false);

  const handleSaveResume = async () => {
    setSaving(true);
    const res = await employeeApi.updateResume(employee.id, { about, job_love, interests });
    setSaving(false);
    if (res.success) toast.success('Resume updated');
    else toast.error('Failed to update');
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    const res = await employeeApi.addSkill(employee.id, { name: newSkill });
    if (res.success) { setNewSkill(''); setAddingSkill(false); onUpdate(); toast.success('Skill added'); }
    else toast.error('Failed to add skill');
  };

  const handleRemoveSkill = async (skillId) => {
    const res = await employeeApi.removeSkill(employee.id, skillId);
    if (res.success) { onUpdate(); toast.success('Skill removed'); }
  };

  const handleAddCert = async () => {
    if (!newCert.trim()) return;
    const res = await employeeApi.addCertification(employee.id, { name: newCert });
    if (res.success) { setNewCert(''); setAddingCert(false); onUpdate(); toast.success('Certification added'); }
    else toast.error('Failed to add certification');
  };

  const handleRemoveCert = async (certId) => {
    const res = await employeeApi.removeCertification(employee.id, certId);
    if (res.success) { onUpdate(); toast.success('Certification removed'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — About */}
      <div className="space-y-4">
        <div className="card p-5">
          <label className="label">About</label>
          <textarea value={about} onChange={e => setAbout(e.target.value)} disabled={!canEdit} rows={3} className="input-field resize-none" placeholder="Tell us about yourself..." />
        </div>
        <div className="card p-5">
          <label className="label">What I Love About My Job</label>
          <textarea value={job_love} onChange={e => setJobLove(e.target.value)} disabled={!canEdit} rows={3} className="input-field resize-none" placeholder="What motivates you..." />
        </div>
        <div className="card p-5">
          <label className="label">My Interests & Hobbies</label>
          <textarea value={interests} onChange={e => setInterests(e.target.value)} disabled={!canEdit} rows={3} className="input-field resize-none" placeholder="Your interests..." />
        </div>
        {canEdit && (
          <button onClick={handleSaveResume} disabled={saving} className={`btn-primary w-full ${saving ? 'opacity-50' : ''}`} id="resume-save-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Right — Skills & Certs */}
      <div className="space-y-6">
        {/* Skills */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><BookOpen size={16} className="text-[var(--color-primary)]" />Skills</h3>
            {canEdit && <button onClick={() => setAddingSkill(true)} className="text-[var(--text-accent)] text-xs hover:text-white transition-colors flex items-center gap-1"><Plus size={14} />Add</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {(employee.skills || []).map(s => (
              <span key={s.id} className="badge badge-info flex items-center gap-1.5">
                {s.name}
                {canEdit && <button onClick={() => handleRemoveSkill(s.id)}><X size={12} /></button>}
              </span>
            ))}
            {(!employee.skills || employee.skills.length === 0) && <p className="text-xs text-[var(--text-secondary)]">No skills added yet</p>}
          </div>
          {addingSkill && (
            <div className="flex gap-2 mt-3">
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)} className="input-field text-sm flex-1" placeholder="Skill name" onKeyDown={e => e.key === 'Enter' && handleAddSkill()} />
              <button onClick={handleAddSkill} className="btn-primary text-sm px-3">Add</button>
              <button onClick={() => setAddingSkill(false)} className="btn-secondary text-sm px-3">Cancel</button>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Award size={16} className="text-[var(--color-primary)]" />Certifications</h3>
            {canEdit && <button onClick={() => setAddingCert(true)} className="text-[var(--text-accent)] text-xs hover:text-white transition-colors flex items-center gap-1"><Plus size={14} />Add</button>}
          </div>
          <div className="space-y-2">
            {(employee.certifications || []).map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-body)]">
                <span className="text-sm">{c.name}</span>
                {canEdit && <button onClick={() => handleRemoveCert(c.id)} className="text-[var(--text-secondary)] hover:text-[var(--color-danger)]"><X size={14} /></button>}
              </div>
            ))}
            {(!employee.certifications || employee.certifications.length === 0) && <p className="text-xs text-[var(--text-secondary)]">No certifications added yet</p>}
          </div>
          {addingCert && (
            <div className="flex gap-2 mt-3">
              <input value={newCert} onChange={e => setNewCert(e.target.value)} className="input-field text-sm flex-1" placeholder="Certification name" onKeyDown={e => e.key === 'Enter' && handleAddCert()} />
              <button onClick={handleAddCert} className="btn-primary text-sm px-3">Add</button>
              <button onClick={() => setAddingCert(false)} className="btn-secondary text-sm px-3">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
