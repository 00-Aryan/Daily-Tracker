import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

export default function KanbanColumn({
  title,
  columnStatus,
  tasks,
  onDelete,
  onStatusChange,
  allowedMoves = {},
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnStatus });

  const bgColor = {
    Today: 'bg-blue-50',
    Done: 'bg-green-50',
    Backlog: 'bg-gray-50',
  }[title] || 'bg-gray-50';

  const borderColor = {
    Today: 'border-blue-200',
    Done: 'border-green-200',
    Backlog: 'border-gray-200',
  }[title] || 'border-gray-200';

  const titleColor = {
    Today: 'text-blue-700',
    Done: 'text-green-700',
    Backlog: 'text-gray-700',
  }[title] || 'text-gray-700';

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 border rounded-lg p-4 min-h-screen transition-colors duration-150 ${
        isOver
          ? 'border-[#F97316] bg-[#FFF7ED]'
          : `${bgColor} ${borderColor}`
      }`}
    >
      <div className={`font-bold text-lg mb-4 pb-2 border-b ${titleColor}`}>
        {title} ({tasks.length})
      </div>

      {tasks.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm">No tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              allowedMoves={allowedMoves[title] || {}}
              isDraggable={columnStatus !== 'done'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
