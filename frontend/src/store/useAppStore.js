import { create } from 'zustand';
import { getTasks, getProjects, getSubjects, getPlatforms, updateTask } from '../services/api';
import { getSettledData, hasSettledFailure } from '../services/asyncUtils';

const useAppStore = create((set, get) => ({
  // --- Tasks State ---
  tasks: {
    today: [],
    done: [],
    backlog: [],
  },
  tasksLoading: false,
  tasksError: null,
  tasksLastFetched: null,

  fetchTasks: async (status = null, config = {}) => {
    const { tasksLoading, tasksLastFetched } = get();

    // Prevent redundant fetches if recently fetched (within 10s) 
    // unless forced or status-specific.
    // Only block on tasksLoading if a prior fetch succeeded (tasksLastFetched != null),
    // allowing valid retry after StrictMode abort where no data was committed.
    if (!config.force && !status) {
      if (tasksLoading && tasksLastFetched) return;
      if (tasksLastFetched && Date.now() - tasksLastFetched < 10000) return;
    }

    set({ tasksLoading: true, tasksError: null });
    try {
      if (status) {
        const res = await getTasks(status, config);
        if (config.signal?.aborted) return;
        set((state) => ({
          tasks: { ...state.tasks, [status]: res.data || [] },
        }));
      } else {
        const results = await Promise.allSettled([
          getTasks('today', config),
          getTasks('done', config),
          getTasks('backlog', config),
        ]);

        if (config.signal?.aborted) return;

        const currentTasks = get().tasks;
        set({
          tasks: {
            today: getSettledData(results[0], currentTasks.today),
            done: getSettledData(results[1], currentTasks.done),
            backlog: getSettledData(results[2], currentTasks.backlog),
          },
          tasksError: hasSettledFailure(results) ? 'Some task columns failed to load' : null,
          tasksLastFetched: Date.now(),
        });
      }
    } catch (err) {
      if (config.signal?.aborted || err.name === 'CanceledError' || err.name === 'AbortError') return;
      set({ tasksError: 'Failed to load tasks' });
      console.error(err);
    } finally {
      // Always clear loading to prevent stale state blocking subsequent fetches
      set({ tasksLoading: false });
    }
  },

  setTasks: (newTasks) => set({ tasks: newTasks }),

  updateTaskStatus: async (taskId, newStatus) => {
    const { tasks } = get();
    const snapshot = { ...tasks };

    // Find the task and its current status
    let taskToUpdate = null;
    let sourceStatus = null;

    for (const [status, list] of Object.entries(tasks)) {
      const found = list.find((t) => String(t.id) === String(taskId));
      if (found) {
        taskToUpdate = found;
        sourceStatus = status;
        break;
      }
    }

    if (!taskToUpdate || sourceStatus === newStatus) return;

    // Optimistic update
    const updatedTasks = {
      ...tasks,
      [sourceStatus]: tasks[sourceStatus].filter((t) => String(t.id) !== String(taskId)),
      [newStatus]: [...tasks[newStatus], { ...taskToUpdate, status: newStatus }],
    };

    set({ tasks: updatedTasks });

    try {
      const res = await updateTask(taskId, { status: newStatus });
      // Reconcile optimistic state with server response
      const updatedTask = res.data;
      set((state) => ({
        tasks: {
          ...state.tasks,
          [newStatus]: state.tasks[newStatus].map((t) =>
            String(t.id) === String(taskId) ? updatedTask : t
          ),
        },
      }));
    } catch (err) {
      console.error('Failed to update task status:', err);
      set({ tasks: snapshot, tasksError: 'Failed to sync task update' });
      throw err;
    }
  },

  // --- Reference Data State ---
  referenceData: {
    projects: [],
    subjects: [],
    platforms: [],
  },
  refLoading: false,
  refError: null,
  refLastFetched: null,

  fetchReferenceData: async (config = {}) => {
    const { refLoading, refLastFetched } = get();
    if (refLoading && !config.force) return;

    // TTL: skip if fetched within 5 minutes unless forced
    if (!config.force && refLastFetched && Date.now() - refLastFetched < 300_000) return;

    set({ refLoading: true, refError: null });
    try {
      const results = await Promise.allSettled([
        getProjects(config),
        getSubjects(config),
        getPlatforms(config),
      ]);

      if (config.signal?.aborted) return;

      set({
        referenceData: {
          projects: getSettledData(results[0], []),
          subjects: getSettledData(results[1], []),
          platforms: getSettledData(results[2], []),
        },
        refError: hasSettledFailure(results) ? 'Some reference data failed to load' : null,
        refLastFetched: Date.now(),
      });
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      set({ refError: 'Failed to load reference data' });
      console.error(err);
    } finally {
      set({ refLoading: false });
    }
  },

  // Helpers to update individual reference lists without full refetch
  addProject: (project) => set((state) => ({
    referenceData: { ...state.referenceData, projects: [...state.referenceData.projects, project] }
  })),
  addSubject: (subject) => set((state) => ({
    referenceData: { ...state.referenceData, subjects: [...state.referenceData.subjects, subject] }
  })),
  addPlatform: (platform) => set((state) => ({
    referenceData: { ...state.referenceData, platforms: [...state.referenceData.platforms, platform] }
  })),

  // Auth-boundary reset: clears all user-scoped cached state on session change
  resetUserData: () => set({
    tasks: { today: [], done: [], backlog: [] },
    tasksLoading: false,
    tasksError: null,
    tasksLastFetched: null,
    referenceData: { projects: [], subjects: [], platforms: [] },
    refLoading: false,
    refError: null,
    refLastFetched: null,
  }),
}));

export default useAppStore;
