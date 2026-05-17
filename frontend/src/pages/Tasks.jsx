import { useState, useEffect } from 'react';
import KanbanColumn from '../components/KanbanColumn';
import AddTaskModal from '../components/AddTaskModal';
import { getTasks, updateTask, deleteTask } from '../services/api';

export default function Tasks() {
  const [tasks, setTasks] = useState({
    today: [],
    done: [],
    backlog: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllTasks();
  }, []);

  const loadAllTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const [todayRes, doneRes, backlogRes] = await Promise.all([
        getTasks('today'),
        getTasks('done'),
        getTasks('backlog'),
      ]);

      setTasks({
        today: todayRes.data || [],
        done: doneRes.data || [],
        backlog: backlogRes.data || [],
      });
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadAllTasks();
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      await deleteTask(taskId);
      await loadAllTasks();
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  };

  const handleTaskAdded = async () => {
    await loadAllTasks();
  };

  const allowedMoves = {
    Today: {
      Done: 'done',
      Backlog: 'backlog',
    },
    Done: {},
    Backlog: {
      Today: 'today',
    },
  };

  if (loading && Object.values(tasks).every(arr => arr.length === 0)) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Tasks</h1>
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4">
        <KanbanColumn
          title="Today"
          tasks={tasks.today}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          allowedMoves={allowedMoves}
        />
        <KanbanColumn
          title="Done"
          tasks={tasks.done}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          allowedMoves={allowedMoves}
        />
        <KanbanColumn
          title="Backlog"
          tasks={tasks.backlog}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          allowedMoves={allowedMoves}
        />
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
}