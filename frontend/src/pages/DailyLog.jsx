import { useState, useEffect, useCallback } from 'react';
import LogEditor from '../components/LogEditor';
import LogJournal from '../components/LogJournal';
import { getLog } from '../services/api';
import { isAbortError } from '../services/asyncUtils';
import useAppStore from '../store/useAppStore';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayISO() {
  return toISODate(new Date());
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function formatDisplayDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DailyLog() {
  const tasks = useAppStore((state) => state.tasks);
  const fetchTasks = useAppStore((state) => state.fetchTasks);
  const tasksLoading = useAppStore((state) => state.tasksLoading);
  const tasksError = useAppStore((state) => state.tasksError);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);

  const today = getTodayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentLog, setCurrentLog] = useState(null);
  const [view, setView] = useState('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logDirty, setLogDirty] = useState(false);

  useEffect(() => {
    if (view !== 'editor') return;

    const controller = new AbortController();
    let active = true;

    const loadLog = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getLog(selectedDate, { signal: controller.signal });
        if (!active) return;
        setCurrentLog(res.data);
      } catch (err) {
        if (!active || isAbortError(err)) return;
        if (err.response?.status === 404) {
          setCurrentLog(null);
        } else {
          setError('Failed to load log');
          console.error(err);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLog();
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedDate, view]);

  useEffect(() => {
    if (view !== 'editor' || selectedDate !== today) return;

    const controller = new AbortController();
    fetchTasks(null, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [view, selectedDate, today, fetchTasks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleLogSaved = useCallback(async () => {
    try {
      const res = await getLog(selectedDate);
      setCurrentLog(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setCurrentLog(null);
      }
    }
  }, [selectedDate]);

  const confirmNavigation = () => {
    if (logDirty) {
      return confirm('You have unsaved changes. Discard them?');
    }
    return true;
  };

  const handleJournalDateSelect = (date) => {
    if (!confirmNavigation()) return;
    setSelectedDate(date);
    setView('editor');
  };

  const goToToday = () => {
    if (!confirmNavigation()) return;
    setSelectedDate(today);
    setView('editor');
  };

  const goPrevDay = () => {
    if (!confirmNavigation()) return;
    setSelectedDate(addDays(selectedDate, -1));
  };

  const goNextDay = () => {
    if (!confirmNavigation()) return;
    const next = addDays(selectedDate, 1);
    if (next <= today) {
      setSelectedDate(next);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'today' : 'done';
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      // Error handled by store
    }
  };

  const canGoNext = selectedDate < today;

  const viewButtonClass = (active) =>
    `px-3 py-1.5 text-sm rounded-md transition-colors ${
      active
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Daily Log</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goToToday}
            className={viewButtonClass(view === 'editor')}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setView('journal')}
            className={viewButtonClass(view === 'journal')}
          >
            Journal
          </button>
          <button
            type="button"
            onClick={() => setView('search')}
            className={viewButtonClass(view === 'search')}
          >
            Search
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
      )}

      {view === 'editor' && (
        <div>
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={goPrevDay}
              className="w-9 h-9 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              aria-label="Previous day"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold text-gray-800 min-w-[240px] text-center">
              {formatDisplayDate(selectedDate)}
            </h2>
            <button
              type="button"
              onClick={goNextDay}
              disabled={!canGoNext}
              className="w-9 h-9 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition-colors"
              aria-label="Next day"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {selectedDate === today ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-fit">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Today&apos;s Tasks</h3>
                  {tasksLoading && tasks.today.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading tasks...</p>
                  ) : tasksError ? (
                    <p className="text-sm text-red-600">{tasksError}</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        {tasks.today.length === 0 ? (
                          <p className="text-sm text-gray-500">No active tasks</p>
                        ) : (
                          <ul className="space-y-1">
                            {tasks.today.map((task) => (
                              <li key={task.id} className="text-sm text-gray-700 flex items-center gap-2 group">
                                <button
                                  onClick={() => handleToggleTask(task.id, 'today')}
                                  className="text-gray-300 hover:text-blue-500 transition-colors"
                                  title="Mark as done"
                                >
                                  ○
                                </button>
                                <span>{task.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Completed</h4>
                        {tasks.done.length === 0 ? (
                          <p className="text-sm text-gray-400">None</p>
                        ) : (
                          <ul className="space-y-1">
                            {tasks.done.map((task) => (
                              <li key={task.id} className="text-sm text-stone-400 flex items-center gap-2 group">
                                <button
                                  onClick={() => handleToggleTask(task.id, 'done')}
                                  className="text-blue-500 hover:text-gray-400 transition-colors"
                                  title="Move back to today"
                                >
                                  ✓
                                </button>
                                <span className="line-through">{task.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E7E5E4] p-4 text-center">
                  <p className="text-xs text-stone-400">
                    Task history not available for past dates
                  </p>
                </div>
              )}
            </div>

            <div>
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading log...</div>
              ) : (
                <LogEditor
                  date={selectedDate}
                  existingLog={currentLog}
                  onSaved={handleLogSaved}
                  onDirtyChange={setLogDirty}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'journal' && (
        <LogJournal searchQuery="" onDateSelect={handleJournalDateSelect} />
      )}

      {view === 'search' && (
        <div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search your logs..."
            className="w-full mb-4 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <LogJournal searchQuery={searchQuery} onDateSelect={handleJournalDateSelect} />
        </div>
      )}
    </div>
  );
}
