import { useState, useEffect } from 'react';
import { generateQuestions, submitAttempt } from '../../services/api';

export default function QuestionSession({ subjectId, subtopicId, onSessionComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    generateQuestions(subjectId, subtopicId)
      .then(res => setQuestions(res.data || []))
      .catch(() => setError('Failed to generate questions'))
      .finally(() => setLoading(false));
  }, [subjectId, subtopicId]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await submitAttempt({
        question_id: questions[currentIdx].id,
        user_answer: answer,
      });
      const fb = res.data;
      setFeedback(fb);
      setResults(prev => [...prev, { question: questions[currentIdx].question_text, ...fb }]);
    } catch {
      setError('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setSessionDone(true);
    } else {
      setCurrentIdx(prev => prev + 1);
      setAnswer('');
      setFeedback(null);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Generating questions...</div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>;
  if (questions.length === 0) return <div className="text-center py-12 text-gray-500">No questions generated.</div>;

  if (sessionDone) {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const correct = results.filter(r => r.is_correct).length;
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Session Complete</h2>
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded">✓ {correct}/{results.length} correct</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">Avg score: {(totalScore * 100).toFixed(0)}%</span>
        </div>
        <div className="space-y-3 mt-4">
          {results.map((r, i) => (
            <div key={i} className={`p-3 rounded border ${r.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-sm font-medium">{i + 1}. {r.question}</p>
              <p className="text-xs text-gray-600 mt-1">{r.feedback}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onSessionComplete?.(results)}
          className="mt-4 px-4 py-2 bg-[#0F172A] text-white rounded-md"
        >
          Done
        </button>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Question {currentIdx + 1} of {questions.length}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          q.difficulty_level === 'beginner' ? 'bg-green-100 text-green-700' :
          q.difficulty_level === 'advanced' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>{q.difficulty_level}</span>
      </div>

      <p className="text-base font-medium">{q.question_text}</p>

      {!feedback ? (
        <>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={4}
            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !answer.trim()}
            className="px-4 py-2 bg-[#F97316] text-white rounded-md disabled:opacity-40"
          >
            {submitting ? 'Evaluating...' : 'Submit Answer'}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className={`p-3 rounded border ${feedback.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold ${feedback.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                {feedback.is_correct ? '✓ Correct' : '✗ Incorrect'}
              </span>
              <span className="text-xs text-gray-500">Score: {(feedback.score * 100).toFixed(0)}%</span>
            </div>
            <p className="text-sm text-gray-700">{feedback.feedback}</p>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-[#0F172A] text-white rounded-md"
          >
            {currentIdx + 1 >= questions.length ? 'View Summary' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
}
