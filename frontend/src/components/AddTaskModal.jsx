import { useState, useEffect } from 'react';
import { getProjects, getSubjects, getSubtopics, getPlatforms, createTask } from '../services/api';

export default function AddTaskModal({ isOpen, onClose, onTaskAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    task_type: 'general',
    priority: 3,
    deadline: '',
    project_id: '',
    subject_id: '',
    subtopic_id: '',
    platform_id: '',
    problem_name: '',
  });

  const [projects, setProjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch reference data on mount
  useEffect(() => {
    if (isOpen) {
      loadReferenceData();
    } else {
      // Reset form when modal closes (cancel or after submit)
      setFormData({
        title: '',
        task_type: 'general',
        priority: 3,
        deadline: '',
        project_id: '',
        subject_id: '',
        subtopic_id: '',
        platform_id: '',
        problem_name: '',
      });
      setError('');
    }
  }, [isOpen]);

  // Load subtopics when subject changes
  useEffect(() => {
    if (formData.subject_id) {
      loadSubtopics(formData.subject_id);
    } else {
      setSubtopics([]);
      setFormData(prev => ({ ...prev, subtopic_id: '' }));
    }
  }, [formData.subject_id]);

  const loadReferenceData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsRes, subjectsRes, platformsRes] = await Promise.all([
        getProjects(),
        getSubjects(),
        getPlatforms(),
      ]);
      setProjects(projectsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setPlatforms(platformsRes.data || []);
    } catch (err) {
      setError('Failed to load reference data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubtopics = async (subjectId) => {
    try {
      const res = await getSubtopics(subjectId);
      setSubtopics(res.data || []);
    } catch (err) {
      console.error('Failed to load subtopics', err);
      setSubtopics([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      task_type: type,
      subject_id: '',
      subtopic_id: '',
      platform_id: '',
      problem_name: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.task_type === 'study' && !formData.subject_id) {
      setError('Subject is required for study tasks');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        task_type: formData.task_type,
        priority: parseInt(formData.priority),
        deadline: formData.deadline || null,
        project_id: formData.project_id || null,
        status: 'today',
      };

      if (formData.task_type === 'study') {
        payload.subject_id = formData.subject_id || null;
        payload.subtopic_id = formData.subtopic_id || null;
        payload.platform_id = formData.platform_id || null;
        payload.problem_name = formData.problem_name || null;
      }

      await createTask(payload);
      onTaskAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-bold mb-4">Add Task</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task title"
            />
          </div>

          {/* Task Type Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTaskTypeChange('general')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  formData.task_type === 'general'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                General
              </button>
              <button
                type="button"
                onClick={() => handleTaskTypeChange('study')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  formData.task_type === 'study'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Study
              </button>
            </div>
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>P1 - Highest</option>
              <option value={2}>P2 - High</option>
              <option value={3}>P3 - Medium</option>
              <option value={4}>P4 - Low</option>
              <option value={5}>P5 - Lowest</option>
            </select>
          </div>

          {/* Deadline */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline (optional)
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Study Task Fields */}
          {formData.task_type === 'study' && (
            <>
              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <select
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Subtopic */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtopic
                </label>
                <select
                  name="subtopic_id"
                  value={formData.subtopic_id}
                  onChange={handleChange}
                  disabled={!formData.subject_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select subtopic...</option>
                  {subtopics.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  name="platform_id"
                  value={formData.platform_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select platform...</option>
                  {platforms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Problem Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Name
                </label>
                <input
                  type="text"
                  name="problem_name"
                  value={formData.problem_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Two Sum"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
