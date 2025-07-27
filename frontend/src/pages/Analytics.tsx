import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Clock, AlertCircle, TrendingUp, BookOpen, Calendar, Target } from 'lucide-react';
import { taskAPI } from '../services/api';

interface AnalyticsData {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  assignment_types: Record<string, number>;
  priorities: Record<string, number>;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await taskAPI.getTaskAnalytics();
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">Error Loading Analytics</h2>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={loadAnalytics}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
            <p className="text-gray-600">Start creating tasks to see your analytics here!</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    total_tasks,
    completed_tasks,
    pending_tasks,
    in_progress_tasks,
    completion_rate,
    assignment_types,
    priorities
  } = analyticsData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your academic progress and study patterns</p>
      </div>
      
        {/* Overview Cards - Full Width Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{total_tasks}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completed_tasks}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600">{in_progress_tasks}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-red-600">{pending_tasks}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>
        </div>

        {/* Progress Overview - Full Width */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-7 w-7 text-purple-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Progress Overview</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-medium text-gray-700">Completion Rate</span>
                <span className="text-2xl font-bold text-purple-600">{completion_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${completion_rate}%` }}
                ></div>
              </div>
            </div>

            {total_tasks > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round((completed_tasks / total_tasks) * 100)}%
                  </div>
                  <div className="text-sm text-green-700 font-medium">Completion Rate</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {Math.round((in_progress_tasks / total_tasks) * 100)}%
                  </div>
                  <div className="text-sm text-yellow-700 font-medium">In Progress</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {Math.round((pending_tasks / total_tasks) * 100)}%
                  </div>
                  <div className="text-sm text-red-700 font-medium">Pending</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section - Full Width Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assignment Types Breakdown - Full Width */}
          {Object.keys(assignment_types).length > 0 && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="h-7 w-7 text-green-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Assignment Types</h2>
              </div>
              
              <div className="space-y-4">
                {Object.entries(assignment_types).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 capitalize">{type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(count / total_tasks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Breakdown - Full Width */}
          {Object.keys(priorities).length > 0 && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-7 w-7 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Task Priorities</h2>
              </div>
              
              <div className="space-y-4">
                {Object.entries(priorities).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        priority === 'high' ? 'bg-red-500' : 
                        priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span className="font-medium text-gray-900 capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            priority === 'high' ? 'bg-red-500' : 
                            priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(count / total_tasks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 min-w-[2rem] text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {Object.keys(assignment_types).length === 0 && Object.keys(priorities).length === 0 && (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-6">Create some tasks with different types and priorities to see analytics here!</p>
            <button 
              onClick={() => window.location.href = '/tasks'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Tasks
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics; 