import { useState, useEffect } from 'react';
import { getDueToday } from '../../services/api';

export default function DueTodayPanel({ onStartReview }) {
  const [dueQuestions, setDueQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDueToday()
      .then(res => setDueQuestions(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
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
        {dueQuestions.slice(0, 3).map((q, i) => (
          <li key={i} className="text-xs text-gray-600 truncate">
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
