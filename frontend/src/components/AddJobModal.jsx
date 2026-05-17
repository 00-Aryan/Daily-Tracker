import { useState } from 'react';
import { createJob } from '../services/api';

const STATUSES = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

function getTodayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const initialForm = () => ({
  company_name: '',
  role: '',
  jd_link: '',
  date_applied: getTodayISO(),
  platform: '',
  resume_version: '',
  status: 'Applied',
  notes: '',
});

export default function AddJobModal({ isOpen, onClose, onAdded }) {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.role.trim()) {
      setError('Company name and role are required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createJob({
        company_name: formData.company_name.trim(),
        role: formData.role.trim(),
        jd_link: formData.jd_link.trim() || null,
        date_applied: formData.date_applied,
        platform: formData.platform.trim() || null,
        resume_version: formData.resume_version.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      });
      setFormData(initialForm());
      onClose();
      onAdded?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add application');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(initialForm());
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#F97316]';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E7E5E4]">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Add Application</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Role *
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              JD Link
            </label>
            <input
              type="text"
              name="jd_link"
              value={formData.jd_link}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Date Applied
            </label>
            <input
              type="date"
              name="date_applied"
              value={formData.date_applied}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Platform
            </label>
            <input
              type="text"
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              placeholder="Wellfound / Internshala / LinkedIn"
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Resume Version
            </label>
            <input
              type="text"
              name="resume_version"
              value={formData.resume_version}
              onChange={handleChange}
              placeholder="ML_Resume_v2"
              className={inputClass}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-[#F97316] hover:bg-[#EA6C00] text-white rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
