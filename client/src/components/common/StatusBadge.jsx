export default function StatusBadge({ status }) {
  const config = {
    present: { label: 'Present', className: 'badge-success' },
    absent: { label: 'Absent', className: 'badge-warning' },
    on_leave: { label: 'On Leave', className: 'badge-info' },
    half_day: { label: 'Half Day', className: 'badge-warning' },
    pending: { label: 'Pending', className: 'badge-pending' },
    approved: { label: 'Approved', className: 'badge-success' },
    rejected: { label: 'Rejected', className: 'badge-danger' },
    draft: { label: 'Draft', className: 'badge-info' },
    computed: { label: 'Computed', className: 'badge-warning' },
    validated: { label: 'Done', className: 'badge-success' },
    cancelled: { label: 'Cancelled', className: 'badge-danger' },
  };

  const c = config[status] || { label: status || '—', className: 'badge-info' };

  return <span className={`badge ${c.className}`}>{c.label}</span>;
}
