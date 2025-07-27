import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, CreateTaskRequest, UpdateTaskRequest, PlanFeatures } from '../types';
import { taskAPI, planAPI, aiAPI } from '../services/api';
import { Brain, Loader2, Plus, Edit3, Trash2, CheckCircle, XCircle, Wand2, BookOpen } from 'lucide-react';
import TaskPlanningWizard from '../components/TaskPlanningWizard';
import AcademicAssistant from '../components/AIReviewGuide';
import { useAuth } from '../contexts/AuthContext';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showReviewGuide, setShowReviewGuide] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [showPlanningWizard, setShowPlanningWizard] = useState(false);
  const [wizardTaskData, setWizardTaskData] = useState<CreateTaskRequest | null>(null);
  const [isEditingWithWizard, setIsEditingWithWizard] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Form state
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    subject: '',
    description: '',
    priority: 'Medium',
    assignment_type: 'Other',
    due_date: '',
    grade: undefined  // Add grade field
  });

  useEffect(() => {
    loadTasks();
    // Load plan features in background, don't block UI
    loadPlanFeatures().catch(err => {
      console.error('Plan features failed to load:', err);
    });
  }, []);

  // Add effect to reload plan features when user plan changes
  useEffect(() => {
    if (user?.plan_type) {
      console.log('🔄 User plan changed, reloading plan features:', user.plan_type);
      loadPlanFeatures().catch(err => {
        console.error('Plan features failed to reload:', err);
      });
    }
  }, [user?.plan_type]); // Only depend on plan_type, not the entire user object

  const loadPlanFeatures = async () => {
    try {
      console.log('🔄 Loading plan features...');
      const features = await planAPI.getPlanFeatures();
      console.log('✅ Plan features loaded:', features);
      console.log('🔍 AI features enabled:', features?.features?.ai_features);
      setPlanFeatures(features);
    } catch (err) {
      console.error('Failed to load plan features:', err);
      // Set default features for free plan
      setPlanFeatures({
        plan_type: 'student',
        features: {
          max_tasks: null,
          max_categories: 5,
          ai_features: false,  // AI features only for paid plans
          advanced_analytics: false,
          export_options: ['pdf'],
          collaboration: false,
          custom_themes: false,
          priority_support: false,
          study_session_tracking: false,
          cloud_backup: false,
          team_study_groups: false,
          lms_integration: false,
          custom_study_plans: false,
          progress_reports: false,
          white_label: false
        }
      });
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading tasks...');
      const fetchedTasks = await taskAPI.getTasks();
      console.log('✅ Tasks loaded:', fetchedTasks);
      setTasks(fetchedTasks);
      setError(null);
    } catch (err: any) {
      console.error('❌ Failed to load tasks:', err);
      if (err.response?.status === 401) {
        console.log('🔐 Authentication required - redirecting to login');
        // Clear any stale auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      } else {
      setError(err.message || 'Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Comprehensive validation for all required fields
    const errors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
    }
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    // Description is optional - can be empty
    if (!formData.due_date) {
      errors.due_date = 'Due date is required';
    }
    if (!formData.priority) {
      errors.priority = 'Priority is required';
    }
    if (!formData.assignment_type) {
      errors.assignment_type = 'Assignment type is required';
    }
    
    // Check if due date is in the future
    if (formData.due_date) {
      const selectedDate = new Date(formData.due_date);
      const now = new Date();
      if (selectedDate <= now) {
        errors.due_date = 'Due date must be in the future';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      console.log('📝 Creating task with data:', formData);
      const newTask = await taskAPI.createTask(formData);
      console.log('✅ Task created successfully:', newTask);
      
      // Reload tasks from database to ensure persistence
      await loadTasks();
      
      setShowCreateForm(false);
      setFormData({
        title: '',
        subject: '',
        description: '',
        priority: 'Medium',
        assignment_type: 'Other',
        due_date: '',
        grade: undefined
      });
      setValidationErrors({});
    } catch (err: any) {
      console.error('❌ Task creation failed:', err);
      console.error('❌ Error response:', err.response?.data);
      if (err.response?.status === 401) {
        setError('Please log in to create tasks');
      } else {
      setError(err.message || 'Failed to create task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: number, updates: UpdateTaskRequest) => {
    try {
      setLoading(true);
      const updatedTask = await taskAPI.updateTask(taskId, updates);
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
      setEditingTask(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      await taskAPI.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      setLoading(true);
      await taskAPI.updateTask(taskId, { status: newStatus as any });
      await loadTasks(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewGuide = (task: Task) => {
    setSelectedTaskForReview(task);
    setShowReviewGuide(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'grade' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
      <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {planFeatures?.features?.ai_features 
              ? "AI-powered task management with intelligent planning"
              : "Organize and track your academic tasks efficiently"}
            {planFeatures?.plan_type === 'academic_plus' && (
              <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                🔧 Developer Mode - Full Features
              </span>
            )}
          </p>
        </div>
                <div className="flex gap-3">
          {planFeatures?.features?.ai_features && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              AI Task Wizard
            </button>
          )}
        <button
          onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
            <Plus className="h-5 w-5" />
            Add Task
        </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            {error.includes('log in') && (
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Create Task Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Task</h2>
            <div className="flex gap-2">
              {planFeatures?.features?.ai_features && (
            <button
                  type="button"
                  onClick={() => {
                    setWizardTaskData(formData);
                    setIsEditingWithWizard(false);
                    setShowPlanningWizard(true);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    planFeatures?.features?.ai_features 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={planFeatures?.features?.ai_features 
                    ? "AI Task Wizard: Break down your task into detailed subtasks with study schedule" 
                    : "AI Task Wizard available with Student Pro plan"
                  }
                  disabled={!planFeatures?.features?.ai_features}
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Task Wizard</span>
            </button>
              )}
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> All fields marked with * are required. Complete tasks help you track progress better!
            </p>
          </div>
          <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
                <input
                  type="text"
                name="title"
                  value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter a descriptive title for your task"
                  required
                />
              {validationErrors.title && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
              )}
              </div>
            
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
                <input
                  type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.subject ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                  placeholder="e.g., Mathematics, Computer Science"
                  required
                />
              {validationErrors.subject && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.subject}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your task in detail (optional)"
              />
              {validationErrors.description && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Type *
                </label>
                <select
                  name="assignment_type"
                  value={formData.assignment_type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.assignment_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="Other">Other</option>
                  <option value="Exam">Exam</option>
                  <option value="Presentation">Presentation</option>
                  <option value="Homework">Homework</option>
                  <option value="Project">Project</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                </select>
                {validationErrors.assignment_type && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.assignment_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.priority ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                {validationErrors.priority && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.priority}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.due_date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.due_date && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.due_date}</p>
                )}
              </div>
            </div>

            {/* Points Input - Optional */}
                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points (Optional)
              </label>
              <input
                type="number"
                name="grade"
                min="0"
                step="0.1"
                value={formData.grade || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter total points for this assignment (e.g., 25)"
              />
              <p className="text-xs text-gray-500 mt-1">How many points is this assignment worth? (e.g., 5, 10, 25)</p>
                </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Task</h2>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateTask(editingTask.id, {
              subject: editingTask.subject,
              description: editingTask.description || '',
              due_date: new Date(editingTask.due_date).toISOString(),
              assignment_type: editingTask.assignment_type as any,
              priority: editingTask.priority as any,
              grade: editingTask.grade || undefined
            });
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a descriptive title for your task"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={editingTask.subject}
                onChange={(e) => setEditingTask({...editingTask, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics, Computer Science"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              {planFeatures?.features?.ai_features && (
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWizardTaskData({
                        title: editingTask.title,
                        subject: editingTask.subject,
                        description: editingTask.description || '',
                        assignment_type: editingTask.assignment_type,
                        priority: editingTask.priority,
                        due_date: editingTask.due_date,
                        grade: editingTask.grade
                      });
                      setIsEditingWithWizard(true);
                      setShowPlanningWizard(true);
                    }}
                    disabled={!editingTask.subject}
                    className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded text-sm hover:bg-purple-200 disabled:opacity-50"
                    title={planFeatures?.features?.ai_features
                      ? "AI Task Wizard: Break down your task into detailed subtasks with study schedule"
                      : "AI Task Wizard available with Student Pro plan"}
                  >
                    <Wand2 className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Task Wizard</span>
                  </button>
                </div>
              )}
              <textarea
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your task in detail (optional)"
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Type *
                </label>
                <select
                  value={editingTask.assignment_type}
                  onChange={(e) => setEditingTask({...editingTask, assignment_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Other">Other</option>
                  <option value="Exam">Exam</option>
                  <option value="Presentation">Presentation</option>
                  <option value="Homework">Homework</option>
                  <option value="Project">Project</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Points Input - Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={editingTask.grade || ''}
                onChange={(e) => setEditingTask({...editingTask, grade: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter total points for this assignment (e.g., 25)"
              />
              <p className="text-xs text-gray-500 mt-1">How many points is this assignment worth? (e.g., 5, 10, 25)</p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Update Task'}
              </button>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="grid gap-4">
        {tasks.filter(task => task.status !== 'completed').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No active tasks found. Create your first task!
          </div>
        ) : (
          <>
            {tasks.filter(task => task.status !== 'completed').map((task) => (
              <div key={task.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{task.title || task.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">
                      <span className="font-medium">Subject:</span> {task.subject}
                    </p>
                    {task.description && (
                      <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">{task.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    <p>Type: {task.assignment_type}</p>
                    {task.grade !== undefined && task.grade !== null && (
                      <p className="font-medium text-green-600">Points: {task.grade}</p>
                    )}
                  </div>
                </div>
                
                {/* All buttons on the same level */}
                <div className="flex items-center justify-between mt-3">
                  {/* Status Change Buttons - Left side */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(task.id, 'pending')}
                      disabled={task.status === 'pending'}
                      className={`px-2 py-1 rounded text-xs font-medium border ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-600 border-yellow-300 cursor-not-allowed' : 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'}`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                      disabled={task.status === 'in_progress'}
                      className={`px-2 py-1 rounded text-xs font-medium border ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-600 border-blue-300 cursor-not-allowed' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      disabled={task.status === 'completed'}
                      className={`px-2 py-1 rounded text-xs font-medium border ${task.status === 'completed' ? 'bg-green-100 text-green-600 border-green-300 cursor-not-allowed' : 'bg-white text-green-700 border-green-300 hover:bg-green-50'}`}
                    >
                      Completed
                    </button>
                  </div>
                  
                  {/* Action Icons - Right side, same level as status buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      title="Edit task"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleOpenReviewGuide(task)}
                      className={`p-2 rounded-lg ${
                        planFeatures?.features?.ai_features 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={planFeatures?.features?.ai_features 
                        ? "Academic Assistant: Get personalized study guidance and learning strategies for this task" 
                        : "Academic Assistant available with Student Pro plan"
                      }
                      disabled={!planFeatures?.features?.ai_features}
                    >
                      <Brain className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      title="Delete task"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
              </div>
            ))}
          </>
        )}
      </div>

      {/* AI Planning Wizard Modal */}
      {showPlanningWizard && wizardTaskData && (
        <TaskPlanningWizard
          taskData={{
            title: wizardTaskData.title,
            subject: wizardTaskData.subject,
            description: wizardTaskData.description,
            assignment_type: wizardTaskData.assignment_type,
            due_date: wizardTaskData.due_date
          }}
          onApplyPlan={async (plan) => {
            try {
              console.log('Applied plan:', plan);
              
              // Create a comprehensive AI-generated description with all planning data
              const stepsDescription = plan.steps.map((step, index) => 
                `📋 **Step ${index + 1}: ${step.title}**\n${step.description}`
              ).join('\n\n');
              
              const fullDescription = `${wizardTaskData.description}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🎯 **AI TASK PLANNING WIZARD RESULTS**\n\n📚 **Subject:** ${plan.subject}\n📅 **Due Date:** ${new Date(plan.due_date).toLocaleDateString()}\n📝 **Assignment Type:** ${plan.assignment_type}\n\n📋 **DETAILED ACTION PLAN:**\n\n${stepsDescription}\n\n💡 **Study Tips:**\n• Break down each step into smaller 30-minute sessions\n• Set specific deadlines for each step\n• Review your progress daily\n• Don't hesitate to ask for help if you get stuck\n\n🎯 **Success Metrics:**\n• Complete each step before moving to the next\n• Review your work before submission\n• Submit on time with confidence\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
              
              if (isEditingWithWizard && editingTask) {
                // Update the existing task with the AI-generated steps in description
                await handleUpdateTask(editingTask.id, {
                  description: fullDescription,
                  subject: plan.subject,
                  assignment_type: plan.assignment_type as 'Exam' | 'Presentation' | 'Homework' | 'Project' | 'Quiz' | 'Assignment' | 'Other',
                  priority: 'Medium', // Default priority since plan doesn't have one
                  due_date: plan.due_date
                });
                
                // Close the edit modal
                setEditingTask(null);
              } else {
                // Create a single task with all the AI-generated steps in the description
                const taskData = {
                  title: wizardTaskData.title,
                  subject: wizardTaskData.subject,
                  description: fullDescription,
                  due_date: wizardTaskData.due_date,
                  assignment_type: wizardTaskData.assignment_type,
                  priority: 'Medium' as 'Low' | 'Medium' | 'High'
                };
                
                await taskAPI.createTask(taskData);
              }
              
              // Reload tasks to show the updated/new tasks
              await loadTasks();
              
              setShowPlanningWizard(false);
              setWizardTaskData(null);
              setIsEditingWithWizard(false);
            } catch (error) {
              console.error('Failed to apply AI plan:', error);
              setError('Failed to apply AI plan. Please try again.');
            }
          }}
          onClose={() => {
            setShowPlanningWizard(false);
            setWizardTaskData(null);
            setIsEditingWithWizard(false);
          }}
        />
      )}

      {/* Academic Assistant Modal */}
      {showReviewGuide && selectedTaskForReview && (
        <AcademicAssistant
          taskId={selectedTaskForReview.id.toString()}
          subject={selectedTaskForReview.subject}
          description={selectedTaskForReview.description}
          assignmentType={selectedTaskForReview.assignment_type}
          dueDate={selectedTaskForReview.due_date}
          onClose={() => {
            setShowReviewGuide(false);
            setSelectedTaskForReview(null);
          }}
        />
      )}
    </div>
  );
};

export default Tasks; 