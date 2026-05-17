const STATUS_STYLES = {
  Applied: 'bg-blue-50 text-blue-700',
  Screening: 'bg-yellow-50 text-yellow-700',
  Interview: 'bg-purple-50 text-purple-700',
  Offer: 'bg-green-50 text-green-700',
  Rejected: 'bg-red-50 text-red-500',
};

const STATUSES = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function JobCard({ job, onStatusChange, onDelete }) {
  const handleDelete = () => {
    if (!confirm(`Delete application for ${job.company_name}?`)) return;
    onDelete(job.id);
  };

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3 md:gap-4 md:flex-nowrap hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-[140px]">
        <p className="font-medium text-stone-800">{job.company_name}</p>
        <p className="text-sm text-stone-500">{job.role}</p>
      </div>

      {job.platform && (
        <span className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600 shrink-0">
          {job.platform}
        </span>
      )}

      {job.resume_version && (
        <span className="text-xs text-stone-400 shrink-0 hidden sm:block">
          {job.resume_version}
        </span>
      )}

      <span className="text-xs text-stone-500 shrink-0">{formatDate(job.date_applied)}</span>

      <span
        className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${
          STATUS_STYLES[job.status] || STATUS_STYLES.Applied
        }`}
      >
        {job.status}
      </span>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <select
          value={job.status}
          onChange={(e) => onStatusChange(job.id, e.target.value)}
          className="text-xs border border-[#E7E5E4] rounded-md px-2 py-1.5 text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          aria-label={`Update status for ${job.company_name}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleDelete}
          className="text-stone-400 hover:text-red-600 transition-colors p-1"
          title="Delete application"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
