import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// Request interceptor for attaching auth token
api.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==================== Tasks ====================

export const getTasks = (status, config = {}) =>
  api.get('/tasks', { params: status ? { status } : {}, ...config });

export const createTask = (data, config = {}) =>
  api.post('/tasks', data, config);

export const updateTask = (id, data, config = {}) =>
  api.patch(`/tasks/${id}`, data, config);

export const deleteTask = (id, config = {}) =>
  api.delete(`/tasks/${id}`, config);

// ==================== Reference Data ====================

export const getSubjects = (config = {}) =>
  api.get('/reference/subjects', config);

export const getSubtopics = (subjectId, config = {}) =>
  api.get('/reference/subtopics', { params: { subject_id: subjectId }, ...config });

export const getPlatforms = (config = {}) =>
  api.get('/reference/platforms', config);

export const getProjects = (config = {}) =>
  api.get('/reference/projects', config);

export const createSubject = (data, config = {}) =>
  api.post('/reference/subjects', data, config);

export const createSubtopic = (data, config = {}) =>
  api.post('/reference/subtopics', data, config);

export const createPlatform = (data, config = {}) =>
  api.post('/reference/platforms', data, config);

export const createProject = (data, config = {}) =>
  api.post('/reference/projects', data, config);

// ==================== Daily Logs ====================

export const getLog = (date, config = {}) =>
  api.get(`/logs/${date}`, config);

export const getLogs = (page = 1, limit = 10, config = {}) =>
  api.get('/logs', { params: { page, limit }, ...config });

export const createLog = (data, config = {}) =>
  api.post('/logs', data, config);

export const updateLog = (date, data, config = {}) =>
  api.patch(`/logs/${date}`, data, config);

export const searchLogs = (query, config = {}) =>
  api.get('/logs/search', { params: { q: query }, ...config });

// ==================== Jobs ====================

export const getJobs = (status, config = {}) =>
  api.get('/jobs', { params: status ? { status } : {}, ...config });

export const createJob = (data, config = {}) =>
  api.post('/jobs', data, config);

export const updateJob = (id, data, config = {}) =>
  api.patch(`/jobs/${id}`, data, config);

export const deleteJob = (id, config = {}) =>
  api.delete(`/jobs/${id}`, config);

export const getJobStats = (config = {}) =>
  api.get('/jobs/stats', config);

export const getFollowUps = (config = {}) =>
  api.get('/jobs/followup', config);

// ==================== Study ====================

export const getStudyProfile = (config = {}) =>
  api.get('/study/profile', config);

export const createStudyProfile = (data, config = {}) =>
  api.post('/study/profile', data, config);

export const generateQuestions = (subjectId, subtopicId, config = {}) =>
  api.get('/study/questions/generate', {
    params: { subject_id: subjectId, subtopic_id: subtopicId },
    ...config,
  });

export const submitAttempt = (data, config = {}) =>
  api.post('/study/attempts', data, config);

export const getTopicLevels = (config = {}) =>
  api.get('/study/levels', config);

export const getStudyStats = (config = {}) =>
  api.get('/study/stats', config);

export const getDueToday = (config = {}) =>
  api.get('/study/due-today', config);

export default api;
