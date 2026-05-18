import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// ==================== Tasks ====================

export const getTasks = (status) => 
  api.get('/tasks', { params: status ? { status } : {} });

export const createTask = (data) => 
  api.post('/tasks', data);

export const updateTask = (id, data) => 
  api.patch(`/tasks/${id}`, data);

export const deleteTask = (id) => 
  api.delete(`/tasks/${id}`);

// ==================== Reference Data ====================

export const getSubjects = () => 
  api.get('/reference/subjects');

export const getSubtopics = (subjectId) => 
  api.get('/reference/subtopics', { params: { subject_id: subjectId } });

export const getPlatforms = () => 
  api.get('/reference/platforms');

export const getProjects = () => 
  api.get('/reference/projects');

export const createSubject = (data) =>
  api.post('/reference/subjects', data);

export const createSubtopic = (data) =>
  api.post('/reference/subtopics', data);

export const createPlatform = (data) =>
  api.post('/reference/platforms', data);

export const createProject = (data) =>
  api.post('/reference/projects', data);

// ==================== Daily Logs ====================

export const getLog = (date) =>
  api.get(`/logs/${date}`);

export const getLogs = (page = 1, limit = 10) =>
  api.get('/logs', { params: { page, limit } });

export const createLog = (data) =>
  api.post('/logs', data);

export const updateLog = (date, data) =>
  api.patch(`/logs/${date}`, data);

export const searchLogs = (query) =>
  api.get('/logs/search', { params: { q: query } });

// ==================== Jobs ====================

export const getJobs = (status) =>
  api.get('/jobs', { params: status ? { status } : {} });

export const createJob = (data) =>
  api.post('/jobs', data);

export const updateJob = (id, data) =>
  api.patch(`/jobs/${id}`, data);

export const deleteJob = (id) =>
  api.delete(`/jobs/${id}`);

export const getJobStats = () =>
  api.get('/jobs/stats');

export const getFollowUps = () =>
  api.get('/jobs/followup');

// ==================== Study ====================

export const getStudyProfile = () =>
  api.get('/study/profile');

export const createStudyProfile = (data) =>
  api.post('/study/profile', data);

export const generateQuestions = (subjectId, subtopicId) =>
  api.get('/study/questions/generate', { params: { subject_id: subjectId, subtopic_id: subtopicId } });

export const submitAttempt = (data) =>
  api.post('/study/attempts', data);

export const getTopicLevels = () =>
  api.get('/study/levels');

export const getStudyStats = () =>
  api.get('/study/stats');

export const getDueToday = () =>
  api.get('/study/due-today');

export default api;