export default function TaskCard({ task, onDelete, onStatusChange, allowedMoves = {} }) {
  const priorityColors = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-blue-100 text-blue-800',
    5: 'bg-gray-100 text-gray-800',
  };

  const priorityLabels = {
    1: 'P1',
    2: 'P2',
    3: 'P3',
    4: 'P4',
    5: 'P5',
  };

  const formatDeadline = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Due: ${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: Title + Delete Button */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800 flex-1 text-sm">{task.title}</h3>
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-400 hover:text-red-600 transition-colors ml-2"
          title="Delete task"
        >
          🗑
        </button>
      </div>

      {/* Priority & Task Type Badges */}
      <div className="flex gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority] || priorityColors[5]}`}>
          {priorityLabels[task.priority] || 'P5'}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          task.task_type === 'study'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {task.task_type === 'study' ? 'Study' : 'General'}
        </span>
      </div>

      {/* Study Task Details */}
      {task.task_type === 'study' && (
        <div className="mb-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          {task.subject_name && task.subtopic_name && (
            <p className="mb-1">
              <strong>{task.subject_name}</strong> → <strong>{task.subtopic_name}</strong>
              {task.problem_name && <> → {task.problem_name}</>}
            </p>
          )}
          {task.platform_name && <p>Platform: {task.platform_name}</p>}
        </div>
      )}

      {/* Deadline */}
      {task.deadline && (
        <p className="text-xs text-blue-600 mb-3">{formatDeadline(task.deadline)}</p>
      )}

      {/* Project */}
      {task.project_name && (
        <p className="text-xs text-gray-500 mb-3">📁 {task.project_name}</p>
      )}

      {/* Move Buttons */}
      {Object.keys(allowedMoves).length > 0 && (
        <div className="flex gap-2">
          {Object.entries(allowedMoves).map(([columnName, status]) => (
            <button
              key={columnName}
              onClick={() => onStatusChange(task.id, status)}
              className="flex-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
            >
              → {columnName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
