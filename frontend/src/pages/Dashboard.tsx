import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { Task, TaskAnalytics } from '../types';
import { Calendar, Clock, TrendingUp, BookOpen, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]); // Changed type to any[] as AISuggestion is removed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fix #3: Optimize useEffect - combine related effects
  useEffect(() => {
    loadDashboardData();
  }, []); // ✅ Only run once on mount, not on every render

  // ✅ Extract event handlers (Fix #5: Inline Event Handlers)
  const handleTaskClick = (taskId: number) => {
    // Navigate to task details or edit
    console.log('Task clicked:', taskId);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedSuggestions] = await Promise.all([
        taskAPI.getTasks(),
        taskAPI.getAISuggestions()
      ]);
      setTasks(fetchedTasks);
      setAiSuggestions(fetchedSuggestions);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status: string) => {
    return tasks.filter(task => task.status === status).length;
  };

  const getPriorityCount = (priority: string) => {
    return tasks.filter(task => task.priority === priority).length;
  };

  const getRecentTasks = () => {
    return tasks
      .filter(task => task.status !== 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

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
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // Calculate statistics from local tasks data
  const calculateStatistics = () => {
    const totalTasks = tasks.length;
    const completedTasks = getStatusCount('completed');
    const inProgressTasks = getStatusCount('in_progress');
    const pendingTasks = getStatusCount('pending');
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate
    };
  };

  const calculatePriorityDistribution = () => {
    const highPriority = getPriorityCount('High');
    const mediumPriority = getPriorityCount('Medium');
    const lowPriority = getPriorityCount('Low');
    const total = tasks.length;

    return {
      high: { count: highPriority, percentage: total > 0 ? (highPriority / total) * 100 : 0 },
      medium: { count: mediumPriority, percentage: total > 0 ? (mediumPriority / total) * 100 : 0 },
      low: { count: lowPriority, percentage: total > 0 ? (lowPriority / total) * 100 : 0 }
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your academic tasks and progress</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{getStatusCount('completed')}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{getStatusCount('in_progress')}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{getStatusCount('pending')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Progress Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Completion Rate</span>
              <span>{calculateStatistics().completionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateStatistics().completionRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{calculateStatistics().totalTasks}</p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{calculateStatistics().completedTasks}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{calculateStatistics().inProgressTasks}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{calculateStatistics().pendingTasks}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-6 text-gray-800">Priority Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
            <div className="text-3xl font-bold text-red-600 mb-1">{calculatePriorityDistribution().high.count}</div>
            <div className="text-base font-semibold text-red-700 mb-1">High Priority</div>
            <div className="text-xs font-medium text-red-600 bg-red-200 px-2 py-0.5 rounded-full inline-block">
              {calculatePriorityDistribution().high.percentage.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{calculatePriorityDistribution().medium.count}</div>
            <div className="text-base font-semibold text-yellow-700 mb-1">Medium Priority</div>
            <div className="text-xs font-medium text-yellow-600 bg-yellow-200 px-2 py-0.5 rounded-full inline-block">
              {calculatePriorityDistribution().medium.percentage.toFixed(1)}%
            </div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">{calculatePriorityDistribution().low.count}</div>
            <div className="text-base font-semibold text-green-700 mb-1">Low Priority</div>
            <div className="text-xs font-medium text-green-600 bg-green-200 px-2 py-0.5 rounded-full inline-block">
              {calculatePriorityDistribution().low.percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      {tasks.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Active Tasks</h3>
          {getRecentTasks().length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active tasks found.</p>
          ) : (
            <div className="space-y-3">
              {getRecentTasks().map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {task.subject}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.subject && (
                        <span className="text-xs text-gray-500">• {task.subject}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-purple-600">🤖</span>
            AI Suggestions
          </h3>
          <div className="space-y-4">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {suggestion.category?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(suggestion.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 