import { useState, useEffect, useMemo, useCallback } from 'react';
import AddJobModal from '../components/AddJobModal';
import JobCard from '../components/JobCard';
import {
  getJobs,
  getJobStats,
  getFollowUps,
  updateJob,
  deleteJob,
} from '../services/api';
import { hasSettledFailure, isAbortError } from '../services/asyncUtils';

const STATUSES = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function JobTracker() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partialError, setPartialError] = useState('');

  const loadData = useCallback(async (signal) => {
    setError('');
    setPartialError('');

    const results = await Promise.allSettled([
      getJobs(undefined, { signal }),
      getJobStats({ signal }),
      getFollowUps({ signal }),
    ]);

    if (signal?.aborted) return;

    const [jobsResult, statsResult, followUpsResult] = results;

    if (jobsResult.status === 'fulfilled') {
      setJobs(jobsResult.value.data || []);
    } else if (!isAbortError(jobsResult.reason)) {
      setJobs([]);
      setError('Failed to load applications');
    }

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.data || null);
    } else if (!isAbortError(statsResult.reason)) {
      setStats(null);
    }

    if (followUpsResult.status === 'fulfilled') {
      setFollowUps(followUpsResult.value.data || []);
    } else if (!isAbortError(followUpsResult.reason)) {
      setFollowUps([]);
    }

    const jobsOk = jobsResult.status === 'fulfilled';
    const statsOk = statsResult.status === 'fulfilled';
    const followUpsOk = followUpsResult.status === 'fulfilled';

    if (jobsOk && (!statsOk || !followUpsOk) && hasSettledFailure(results)) {
      const failed = [];
      if (!statsOk) failed.push('stats');
      if (!followUpsOk) failed.push('follow-ups');
      setPartialError(`Some sections failed to load (${failed.join(', ')}).`);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const init = async () => {
      setLoading(true);
      await loadData(controller.signal);
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    };

    init();
    return () => controller.abort();
  }, [loadData]);

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    if (statusFilter) {
      list = list.filter((j) => j.status === statusFilter);
    }
    list.sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied));
    return list;
  }, [jobs, statusFilter]);

  const resumePerformance = stats?.resume_performance || [];
  const showResumeSection = resumePerformance.length > 0;
  const allRatesZero =
    showResumeSection && resumePerformance.every((r) => r.response_rate === 0);
  const bestRate = showResumeSection
    ? Math.max(...resumePerformance.map((r) => r.response_rate))
    : 0;

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateJob(id, { status: newStatus });
      await loadData();
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJob(id);
      await loadData();
    } catch (err) {
      setError('Failed to delete application');
      console.error(err);
    }
  };

  const handleMarkFollowUp = async (id) => {
    try {
      await updateJob(id, { follow_up_sent: true });
      await loadData();
    } catch (err) {
      setError('Failed to mark follow-up as sent');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-stone-500 py-12 text-sm">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}
      {!error && partialError && (
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
          {partialError}
        </div>
      )}

      {/* Section 1 — Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', value: stats?.total_applied ?? 0 },
          { label: 'In Screening', value: stats?.in_screening ?? 0 },
          { label: 'Interviews', value: stats?.interviews ?? 0 },
          { label: 'Rejected', value: stats?.rejected ?? 0 },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg p-4 border border-[#E7E5E4]"
          >
            <p className="text-2xl font-bold text-[#F97316]">{item.value}</p>
            <p className="text-xs text-stone-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Section 2 — Follow-ups */}
      {followUps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-900 mb-3">
            ⏰ {followUps.length} application(s) need follow-up
          </p>
          <ul className="space-y-2">
            {followUps.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-amber-900"
              >
                <span>
                  <strong>{job.company_name}</strong> — {job.role} (applied{' '}
                  {formatDate(job.date_applied)})
                </span>
                <button
                  type="button"
                  onClick={() => handleMarkFollowUp(job.id)}
                  className="px-3 py-1 text-xs bg-white border border-amber-300 rounded-md hover:bg-amber-100 transition-colors"
                >
                  Mark Sent
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 3 — Applications */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-stone-800">Applications</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-[#E7E5E4] rounded-md px-3 py-2 text-stone-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm bg-[#F97316] hover:bg-[#EA6C00] text-white rounded-md transition-colors"
            >
              Add Application
            </button>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <p className="text-center text-stone-500 py-8 text-sm">No applications yet</p>
        ) : (
          <div className="space-y-2">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 4 — Resume Performance */}
      {showResumeSection && (
        <div>
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Resume Performance</h2>
          {allRatesZero ? (
            <p className="text-sm text-stone-500">Not enough data yet</p>
          ) : (
            <div className="bg-white border border-[#E7E5E4] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E7E5E4] bg-stone-50">
                    <th className="text-left px-4 py-3 font-medium text-stone-600">
                      Resume name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-stone-600">
                      Total sent
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-stone-600">
                      Responses
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-stone-600">
                      Response rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resumePerformance.map((row) => {
                    const isBest =
                      row.response_rate === bestRate && bestRate > 0;
                    return (
                      <tr
                        key={row.resume_version}
                        className={`border-b border-[#E7E5E4] last:border-0 ${
                          isBest ? 'bg-green-50' : ''
                        }`}
                      >
                        <td
                          className={`px-4 py-3 ${
                            isBest ? 'text-green-800 font-medium' : 'text-stone-800'
                          }`}
                        >
                          {row.resume_version === 'none'
                            ? 'Unspecified'
                            : row.resume_version}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {row.total_applications}
                        </td>
                        <td className="px-4 py-3 text-stone-600">
                          {row.total_responses}
                        </td>
                        <td
                          className={`px-4 py-3 ${
                            isBest ? 'text-green-700 font-medium' : 'text-stone-600'
                          }`}
                        >
                          {row.response_rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AddJobModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdded={loadData}
      />
    </div>
  );
}
