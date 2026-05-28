import { useState, useEffect } from 'react';
import { createLog, updateLog } from '../services/api';

export default function LogEditor({ date, existingLog, onSaved, onDirtyChange }) {
  const [whatIDid, setWhatIDid] = useState('');
  const [blockers, setBlockers] = useState('');
  const [tomorrowIntention, setTomorrowIntention] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (existingLog) {
      setWhatIDid(existingLog.what_i_did || '');
      setBlockers(existingLog.blockers || '');
      setTomorrowIntention(existingLog.tomorrow_intention || '');
    } else {
      setWhatIDid('');
      setBlockers('');
      setTomorrowIntention('');
    }
    setError('');
    setSaved(false);
    setIsDirty(false);
  }, [date, existingLog]);

  // Warn before browser unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
    setIsDirty(true);
    onDirtyChange?.(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      what_i_did: whatIDid || null,
      blockers: blockers || null,
      tomorrow_intention: tomorrowIntention || null,
    };

    try {
      if (existingLog) {
        await updateLog(date, payload);
      } else {
        await createLog({ log_date: date, ...payload });
      }
      setSaved(true);
      setIsDirty(false);
      onDirtyChange?.(false);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save log');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error?.message || String(error) || 'Unknown error'}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What I did today
        </label>
        <textarea
          value={whatIDid}
          onChange={handleFieldChange(setWhatIDid)}
          placeholder="What did you accomplish?"
          rows={4}
          className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Blockers / How I felt
        </label>
        <textarea
          value={blockers}
          onChange={handleFieldChange(setBlockers)}
          placeholder="Any blockers or how did you feel?"
          rows={3}
          className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tomorrow&apos;s intention
        </label>
        <textarea
          value={tomorrowIntention}
          onChange={handleFieldChange(setTomorrowIntention)}
          placeholder="What will you focus on tomorrow?"
          rows={3}
          className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md text-sm transition-colors"
        >
          {saving ? 'Saving...' : 'Save Log'}
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
      </div>
    </form>
  );
}
