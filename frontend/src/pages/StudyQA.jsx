import { useState, useEffect } from 'react';
import ComboboxCreatable from '../components/ComboboxCreatable';
import {
  getStudyProfile,
  getSubjects,
  getSubtopics,
  createSubject,
  createSubtopic,
} from '../services/api';
import OnboardingFlow from '../components/study/OnboardingFlow';
import QuestionSession from '../components/study/QuestionSession';
import ProgressDashboard from '../components/study/ProgressDashboard';
import DueTodayPanel from '../components/study/DueTodayPanel';

export default function StudyQA() {
  const [profile, setProfile] = useState(undefined); // undefined=loading, null=no profile
  const [subjects, setSubjects] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getStudyProfile()
      .then(res => setProfile(res.data))
      .catch(() => setProfile(null));
    getSubjects()
      .then(res => setSubjects(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      getSubtopics(selectedSubject)
        .then(res => setSubtopics(res.data || []))
        .catch(() => setSubtopics([]));
    } else {
      setSubtopics([]);
      setSelectedSubtopic('');
    }
  }, [selectedSubject]);

  // Loading state
  if (profile === undefined) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  // Onboarding
  if (!profile) {
    return <OnboardingFlow onComplete={() => {
      getStudyProfile().then(res => setProfile(res.data)).catch(() => {});
    }} />;
  }

  const handleSessionComplete = () => {
    setSessionActive(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateSubject = async (name) => {
    const res = await createSubject({ name });
    const subjectsRes = await getSubjects();
    setSubjects(subjectsRes.data || []);
    setSelectedSubject(res.data.id);
    setSelectedSubtopic('');
  };

  const handleCreateSubtopic = async (name) => {
    const res = await createSubtopic({ subject_id: selectedSubject, name });
    const subtopicsRes = await getSubtopics(selectedSubject);
    setSubtopics(subtopicsRes.data || []);
    setSelectedSubtopic(res.data.id);
  };

  return (
    <div>
      <DueTodayPanel onStartReview={() => setSessionActive(true)} />

      {sessionActive ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <QuestionSession
            subjectId={selectedSubject}
            subtopicId={selectedSubtopic}
            onSessionComplete={handleSessionComplete}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Session Starter */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h2 className="font-semibold mb-4">Start a Study Session</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <ComboboxCreatable
                    items={subjects}
                    value={selectedSubject || null}
                    onChange={(id) => {
                      setSelectedSubject(id || '');
                      setSelectedSubtopic('');
                    }}
                    onCreateNew={handleCreateSubject}
                    placeholder="Select or create subject..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic</label>
                  <ComboboxCreatable
                    items={subtopics}
                    value={selectedSubtopic || null}
                    onChange={(id) => setSelectedSubtopic(id || '')}
                    onCreateNew={handleCreateSubtopic}
                    placeholder={
                      selectedSubject ? 'Select or create subtopic...' : 'Select subject first'
                    }
                    disabled={!selectedSubject}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSessionActive(true)}
                disabled={!selectedSubject || !selectedSubtopic}
                className="px-4 py-2 bg-[#F97316] text-white rounded-md disabled:opacity-40"
              >
                Start Session (5 Questions)
              </button>
            </div>
          </div>

          {/* Right: Progress */}
          <div key={refreshKey}>
            <ProgressDashboard />
          </div>
        </div>
      )}
    </div>
  );
}
