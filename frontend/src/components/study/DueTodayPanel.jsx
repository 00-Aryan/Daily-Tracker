import { useState, useEffect, useCallback } from 'react';
import { getDueToday } from '../../services/api';
import { isAbortError } from '../../services/asyncUtils';

export default function DueTodayPanel({ onStartReview }) {
  const [dueQuestions, setDueQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDue = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const res = await getDueToday({ signal });
      if (signal?.aborted) return;
      setDueQuestions(res.data || []);
    } catch (err) {
      if (isAbortError(err)) return;
      setError('Failed to load due questions');
      setDueQuestions([]);
      console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDue(controller.signal);
    return () => controller.abort();
  }, [loadDue]);

  if (loading) return null;

  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-red-700 mb-2">{error}</p>
        <button
          type="button"
          onClick={() => {
            const controller = new AbortController();
            loadDue(controller.signal);
          }}
          className="px-3 py-1 text-xs bg-[#F97316] text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (dueQuestions.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm text-orange-800">
          📅 {dueQuestions.length} question{dueQuestions.length > 1 ? 's' : ''} due for review
        </h3>
        <button
          type="button"
          onClick={() => onStartReview?.(dueQuestions)}
          className="px-3 py-1 text-xs bg-[#F97316] text-white rounded-md"
        >
          Start Review
        </button>
      </div>
      <ul className="space-y-1">
        {dueQuestions.slice(0, 3).map((q) => (
          <li key={q.id || q.question_id} className="text-xs text-gray-600 truncate">
            • {q.question_text}
          </li>
        ))}
        {dueQuestions.length > 3 && (
          <li className="text-xs text-gray-400">+{dueQuestions.length - 3} more</li>
        )}
      </ul>
    </div>
  );
}
