import React from 'react';
import { Task } from '../types';
import { Edit3, Trash2, CheckCircle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onStatusChange: (taskId: number, newStatus: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading,
  onStatusChange,
  onEditTask,
  onDeleteTask
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // ✅ Extract event handlers (Fix #5: Inline Event Handlers)
  const handleStatusChange = (taskId: number) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(taskId, e.target.value);
  };

  const handleEditClick = (task: Task) => () => {
    onEditTask(task);
  };

  const handleDeleteClick = (taskId: number) => () => {
    onDeleteTask(taskId);
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">No tasks found. Create your first task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Proper keys (Fix #1: Keys in Lists) */}
      {tasks.map((task) => (
        <div key={task.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{task.subject}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              
              {task.description && (
                <p className="text-gray-600 mb-3 whitespace-pre-wrap">{task.description}</p>
              )}
              
              {task.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Task completed! Consider dismissing it to clean up your task list.</span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                {task.subject && <div>Subject: {task.subject}</div>}
                {task.assignment_type && <div>Type: {task.assignment_type}</div>}
                {task.due_date && <div>Due Date: {new Date(task.due_date).toLocaleDateString()}</div>}
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={task.status}
                onChange={handleStatusChange(task.id)}
                disabled={loading}
                className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <button
                onClick={handleEditClick(task)}
                disabled={loading}
                className="flex items-center gap-1 bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
              
              {task.status === 'completed' ? (
                <button
                  onClick={handleDeleteClick(task.id)}
                  disabled={loading}
                  className="flex items-center gap-1 bg-green-100 text-green-600 px-3 py-1 rounded text-sm hover:bg-green-200 disabled:opacity-50"
                  title="Dismiss completed task"
                >
                  <CheckCircle className="w-3 h-3" />
                  Dismiss
                </button>
              ) : (
                <button
                  onClick={handleDeleteClick(task.id)}
                  disabled={loading}
                  className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList; 