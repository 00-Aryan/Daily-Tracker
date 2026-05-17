import { useState, useEffect } from 'react';
import { getSubjects, createStudyProfile } from '../../services/api';

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [confidence, setConfidence] = useState({});
  const [weaknesses, setWeaknesses] = useState('');
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSubjects().then(res => setSubjects(res.data || [])).catch(() => {});
  }, []);

  const toggleSubject = (id) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const strengths = selectedSubjects
        .filter(id => (confidence[id] || 5) >= 7)
        .map(id => subjects.find(s => s.id === id)?.name)
        .filter(Boolean);
      const weakAreas = selectedSubjects
        .filter(id => (confidence[id] || 5) <= 4)
        .map(id => subjects.find(s => s.id === id)?.name)
        .filter(Boolean);

      await createStudyProfile({
        strengths,
        weaknesses: [...weakAreas, ...weaknesses.split(',').map(w => w.trim()).filter(Boolean)],
        learning_style: 'adaptive',
        current_goals: goals.split(',').map(g => g.trim()).filter(Boolean),
      });
      onComplete();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12">
      <h1 className="text-2xl font-bold mb-2">Study Profile Setup</h1>
      <p className="text-sm text-gray-500 mb-6">Step {step} of 4</p>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

      {step === 1 && (
        <div>
          <h2 className="font-semibold mb-3">What subjects are you studying?</h2>
          {subjects.length === 0 ? (
            <p className="text-sm text-gray-500">No subjects found. Create subjects in the Tasks module first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    selectedSubjects.includes(s.id)
                      ? 'bg-[#F97316] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={selectedSubjects.length === 0}
            className="mt-6 px-4 py-2 bg-[#0F172A] text-white rounded-md disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-semibold mb-3">Rate your confidence per subject (1-10)</h2>
          <div className="space-y-4">
            {selectedSubjects.map(id => {
              const name = subjects.find(s => s.id === id)?.name;
              return (
                <div key={id}>
                  <label className="text-sm font-medium text-gray-700">{name}: {confidence[id] || 5}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={confidence[id] || 5}
                    onChange={(e) => setConfidence(prev => ({ ...prev, [id]: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-6">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 rounded-md">← Back</button>
            <button type="button" onClick={() => setStep(3)} className="px-4 py-2 bg-[#0F172A] text-white rounded-md">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-semibold mb-3">What are your weak areas?</h2>
          <textarea
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
            placeholder="e.g. SQL window functions, probability, feature engineering"
            rows={3}
            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
          <div className="flex gap-2 mt-6">
            <button type="button" onClick={() => setStep(2)} className="px-4 py-2 bg-gray-200 rounded-md">← Back</button>
            <button type="button" onClick={() => setStep(4)} className="px-4 py-2 bg-[#0F172A] text-white rounded-md">Next →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="font-semibold mb-3">What's your learning goal?</h2>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="e.g. Get DS job, Clear ML interviews, Master SQL"
            rows={3}
            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
          <div className="flex gap-2 mt-6">
            <button type="button" onClick={() => setStep(3)} className="px-4 py-2 bg-gray-200 rounded-md">← Back</button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-[#F97316] text-white rounded-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
