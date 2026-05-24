import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import KanbanColumn from '../components/KanbanColumn';
import AddTaskModal from '../components/AddTaskModal';
import TaskCard from '../components/TaskCard';
import { deleteTask } from '../services/api';
import useAppStore from '../store/useAppStore';

const DRAG_MOVES = {
  today: ['done', 'backlog'],
  backlog: ['today'],
  done: [],
};

function findTaskLocation(tasks, taskId) {
  for (const status of ['today', 'done', 'backlog']) {
    const task = tasks[status].find((t) => String(t.id) === String(taskId));
    if (task) return { task, status };
  }
  return null;
}

export default function Tasks() {
  const tasks = useAppStore((state) => state.tasks);
  const fetchTasks = useAppStore((state) => state.fetchTasks);
  const setTasks = useAppStore((state) => state.setTasks);
  const loading = useAppStore((state) => state.tasksLoading);
  const error = useAppStore((state) => state.tasksError);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);

  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [localError, setLocalError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const loadAllTasks = useCallback(async (signal) => {
    await fetchTasks(null, { signal });
  }, [fetchTasks]);

  useEffect(() => {
    const controller = new AbortController();
    loadAllTasks(controller.signal);
    return () => controller.abort();
  }, [loadAllTasks]);

  const handleDragStart = (event) => {
    const located = findTaskLocation(tasks, event.active.id);
    if (located) setActiveTask(located.task);
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const targetStatus = over.id;

    const located = findTaskLocation(tasks, taskId);
    if (!located) return;

    const { status: sourceStatus } = located;
    if (sourceStatus === targetStatus) return;
    if (!DRAG_MOVES[sourceStatus]?.includes(targetStatus)) return;

    try {
      await updateTaskStatus(taskId, targetStatus);
    } catch (err) {
      setLocalError('Failed to update task');
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      setLocalError('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      await deleteTask(taskId);
      await fetchTasks(null, { force: true });
    } catch (err) {
      setLocalError('Failed to delete task');
      console.error(err);
    }
  };

  const handleTaskAdded = async () => {
    await fetchTasks(null, { force: true });
  };

  const allowedMoves = {
    Today: {
      Done: 'done',
      Backlog: 'backlog',
    },
    Done: {
      Today: 'today',
    },
    Backlog: {
      Today: 'today',
    },
  };

  const displayError = localError || error;

  if (loading && Object.values(tasks).every((arr) => arr.length === 0)) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Tasks</h1>
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          + Add Task
        </button>
      </div>

      {displayError && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {displayError}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4">
          <KanbanColumn
            title="Today"
            columnStatus="today"
            tasks={tasks.today}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            allowedMoves={allowedMoves}
          />
          <KanbanColumn
            title="Done"
            columnStatus="done"
            tasks={tasks.done}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            allowedMoves={allowedMoves}
          />
          <KanbanColumn
            title="Backlog"
            columnStatus="backlog"
            tasks={tasks.backlog}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            allowedMoves={allowedMoves}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="scale-105 cursor-grabbing">
              <TaskCard
                task={activeTask}
                isDragOverlay
                allowedMoves={{}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddTaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
}
