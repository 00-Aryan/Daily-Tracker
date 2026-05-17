import { useState, useEffect, useCallback } from 'react';
import LogEditor from '../components/LogEditor';
import LogJournal from '../components/LogJournal';
import { getLog, getTasks } from '../services/api';

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
  const today = getTodayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentLog, setCurrentLog] = useState(null);
  const [view, setView] = useState('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [todayTasks, setTodayTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState('');
  const [logDirty, setLogDirty] = useState(false);

  const loadLogForDate = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await getLog(date);
      setCurrentLog(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setCurrentLog(null);
      } else {
        setError('Failed to load log');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'editor') {
      loadLogForDate(selectedDate);
    }
  }, [selectedDate, view, loadLogForDate]);

  useEffect(() => {
    if (view !== 'editor') return;

    const loadTasks = async () => {
      setTasksLoading(true);
      setTasksError('');
      try {
        const res = await getTasks('today');
        setTodayTasks(res.data || []);
      } catch (err) {
        setTasksError('Failed to load tasks');
        console.error(err);
      } finally {
        setTasksLoading(false);
      }
    };

    loadTasks();
  }, [view]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleLogSaved = () => {
    loadLogForDate(selectedDate);
  };

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

          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Today&apos;s Tasks</h3>
            {tasksLoading ? (
              <p className="text-sm text-gray-500">Loading tasks...</p>
            ) : tasksError ? (
              <p className="text-sm text-red-600">{tasksError}</p>
            ) : todayTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks for today</p>
            ) : (
              <ul className="space-y-1">
                {todayTasks.map((task) => (
                  <li key={task.id} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className={task.status === 'done' ? 'text-green-600' : 'text-gray-300'}>
                      {task.status === 'done' ? '✓' : '○'}
                    </span>
                    <span className={task.status === 'done' ? 'line-through text-gray-400' : ''}>
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
