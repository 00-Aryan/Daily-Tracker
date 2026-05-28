import { useState, useEffect, useCallback } from 'react';
import { getTopicLevels } from '../../services/api';
import { isAbortError } from '../../services/asyncUtils';

export default function ProgressDashboard() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLevels = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const res = await getTopicLevels({ signal });
      if (signal?.aborted) return;
      setLevels(res.data || []);
    } catch (err) {
      if (isAbortError(err)) return;
      setError('Failed to load progress');
      setLevels([]);
      console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadLevels(controller.signal);
    return () => controller.abort();
  }, [loadLevels]);

  if (loading) return <div className="text-sm text-gray-500">Loading progress...</div>;

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => {
            const controller = new AbortController();
            loadLevels(controller.signal);
          }}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (levels.length === 0) {
    return <div className="text-sm text-gray-500">No progress yet. Start a session!</div>;
  }

  const grouped = {};
  for (const lvl of levels) {
    const key = lvl.subject_name || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(lvl);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-800">Progress</h3>
      {Object.entries(grouped).map(([subject, subtopics]) => {
        const avgScore = subtopics.reduce((s, l) => s + l.numerical_score, 0) / subtopics.length;
        return (
          <div key={subject} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{subject}</span>
              <span className="text-xs text-gray-500">{avgScore.toFixed(1)}/10</span>
            </div>
            <div className="space-y-2">
              {subtopics.map((lvl) => {
                const pct = (lvl.numerical_score / 10) * 100;
                const accuracy = lvl.attempt_count > 0
                  ? ((lvl.correct_count / lvl.attempt_count) * 100).toFixed(0)
                  : 0;
                return (
                  <div key={lvl.subtopic_id}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{lvl.subtopic_name || 'Subtopic'}</span>
                      <span>{lvl.numerical_score.toFixed(1)} · {accuracy}% acc · 🔥{lvl.streak}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct >= 70 ? '#22c55e' : pct >= 40 ? '#F97316' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
