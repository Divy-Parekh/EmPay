import { useState } from 'react';
import { employeeApi } from '../../api/employee.api';
import { formatDate } from '../../utils/formatters';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrivateInfoTab({ employee, canEdit, onUpdate }) {
  const [form, setForm] = useState({
    date_of_birth: employee.date_of_birth?.split('T')[0] || '',
    address: employee.address || '',
    nationality: employee.nationality || '',
    gender: employee.gender || '',
    marital_status: employee.marital_status || '',
    date_of_joining: employee.date_of_joining?.split('T')[0] || '',
    bank_acc_number: employee.bank_acc_number || '',
    bank_name: employee.bank_name || '',
    ifsc_code: employee.ifsc_code || '',
    pan_number: employee.pan_number || '',
    uan_number: employee.uan_number || '',
    emp_code: employee.emp_code || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    const res = await employeeApi.updatePrivateInfo(employee.id, form);
    setSaving(false);
    if (res.success) { toast.success('Private info updated'); onUpdate(); }
    else toast.error('Failed to update');
  };

  const Field = ({ label, name, type = 'text', options }) => (
    <div>
      <label className="label">{label}</label>
      {options ? (
        <select name={name} value={form[name]} onChange={handleChange} disabled={!canEdit} className="select-field">
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input name={name} type={type} value={form[name]} onChange={handleChange} disabled={!canEdit} className="input-field" />
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Personal Info */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-accent)] uppercase tracking-wider">Personal Information</h3>
        <Field label="Date of Birth" name="date_of_birth" type="date" />
        <Field label="Address" name="address" />
        <Field label="Nationality" name="nationality" />
        <Field label="Gender" name="gender" options={['Male', 'Female', 'Other']} />
        <Field label="Marital Status" name="marital_status" options={['Single', 'Married', 'Divorced', 'Widowed']} />
        <Field label="Date of Joining" name="date_of_joining" type="date" />
      </div>

      {/* Bank Details */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-accent)] uppercase tracking-wider">Bank & ID Details</h3>
        <Field label="Account Number" name="bank_acc_number" />
        <Field label="Bank Name" name="bank_name" />
        <Field label="IFSC Code" name="ifsc_code" />
        <Field label="PAN Number" name="pan_number" />
        <Field label="UAN Number" name="uan_number" />
        <Field label="Employee Code" name="emp_code" />
      </div>

      {canEdit && (
        <div className="lg:col-span-2">
          <button onClick={handleSave} disabled={saving} className={`btn-primary flex items-center gap-2 ${saving ? 'opacity-50' : ''}`} id="private-info-save">
            <Save size={16} />{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
