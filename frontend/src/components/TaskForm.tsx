import React from 'react';
import { CreateTaskRequest } from '../types';
import { Loader2, Plus, Wand2 } from 'lucide-react';

interface TaskFormProps {
  formData: CreateTaskRequest;
  setFormData: (data: CreateTaskRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAIBreakdown: () => void;
  onPlanningWizard: () => void;
  loading: boolean;
  aiLoading: boolean;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onAIBreakdown,
  onPlanningWizard,
  loading,
  aiLoading,
  onCancel
}) => {
  // ✅ Extract event handlers (Fix #5: Inline Event Handlers)
  const handleInputChange = (field: keyof CreateTaskRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={handleInputChange('subject')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mathematics, Computer Science"
              required
            />
          </div>

          {/* Assignment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Type *
            </label>
            <select
              value={formData.assignment_type}
              onChange={handleInputChange('assignment_type')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select assignment type</option>
              <option value="Exam">Exam</option>
              <option value="Presentation">Presentation</option>
              <option value="Homework">Homework</option>
              <option value="Project">Project</option>
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={onAIBreakdown}
                disabled={aiLoading || !formData.subject}
                className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded text-sm hover:bg-purple-200 disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
                AI Breakdown
              </button>
              
              <button
                type="button"
                onClick={onPlanningWizard}
                disabled={aiLoading || !formData.subject}
                className="flex items-center gap-1 bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
              >
                <Wand2 className="w-3 h-3" />
                Study Planner
              </button>
            </div>
            <textarea
              value={formData.description}
              onChange={handleInputChange('description')}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your task or let AI help you break it down..."
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={handleInputChange('priority')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={handleInputChange('due_date')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm; 