import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, CheckCircle, AlertCircle, X } from 'lucide-react';
import { taskAPI } from '../services/api';
import { Task } from '../types';
import { useNavigate } from 'react-router-dom';

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskAPI.getTasks();
      setTasks(fetchedTasks);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.log('🔐 Authentication required - redirecting to login');
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      // Only show non-completed tasks in the calendar
      return taskDate.toDateString() === date.toDateString() && task.status !== 'completed';
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-red-500';
      case 'Medium': return 'border-yellow-500';
      default: return 'border-green-500';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedTask(null);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleStatusChange = async (taskId: number, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      await taskAPI.updateTask(taskId, { status: newStatus });
      await loadTasks(); // Reload tasks to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage your tasks in a calendar format</p>
        </div>
        <button
          onClick={() => navigate('/tasks')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Task
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {formatDate(currentDate)}
            </h2>
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date());
              }}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300 transition-colors"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {daysInMonth.map((date, index) => {
            const tasksForDate = date ? getTasksForDate(date) : [];
            const isToday = date ? date.toDateString() === new Date().toDateString() : false;
            const isSelected = selectedDate && date ? date.toDateString() === selectedDate.toDateString() : false;
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  isToday ? 'bg-blue-50 border-blue-300' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                  date ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-100'
                }`}
                onClick={() => date && handleDateClick(date)}
              >
                {date && (
                  <>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {tasksForDate.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded border-l-4 ${getPriorityColor(task.priority)} ${
                            task.status === 'completed' ? 'opacity-60' : ''
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="text-gray-500 truncate">{task.subject}</div>
                        </div>
                      ))}
                      {tasksForDate.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{tasksForDate.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Task Details</h3>
                <button
                  onClick={closeTaskModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Task Header */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedTask.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium">{selectedTask.subject}</span>
                    <span>•</span>
                    <span>{selectedTask.assignment_type}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedTask.description}</p>
                </div>

                {/* Task Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Due Date</h5>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedTask.due_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(selectedTask.due_date).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Priority</h5>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.priority === 'High' ? 'bg-red-100 text-red-800' :
                      selectedTask.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Type</h5>
                    <p className="text-sm text-gray-600">{selectedTask.assignment_type}</p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Created</h5>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedTask.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Points</h5>
                    <p className="text-sm text-gray-600">
                      {selectedTask.grade !== undefined && selectedTask.grade !== null 
                        ? `${selectedTask.grade} pts` 
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTask.id, selectedTask.status === 'completed' ? 'pending' : 'completed');
                      closeTaskModal();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedTask.status === 'completed'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {selectedTask.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                  </button>
                  
                  <button
                    onClick={() => {
                      closeTaskModal();
                      navigate('/tasks');
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    View All Tasks
                  </button>
                  
                  <button
                    onClick={closeTaskModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Date Tasks */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tasks for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          {getTasksForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500">No tasks scheduled for this date.</p>
          ) : (
            <div className="space-y-3">
              {getTasksForDate(selectedDate).map(task => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg ${getPriorityColor(task.priority)} ${
                    task.status === 'completed' ? 'opacity-60' : ''
                  } cursor-pointer hover:bg-gray-50 transition-colors`}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.subject}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.due_date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed');
                        }}
                        className={`p-2 rounded-lg ${
                          task.status === 'completed' 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                      >
                        {task.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar; 