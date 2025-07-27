import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Award, TrendingUp, Filter, Search, ArrowUpDown } from 'lucide-react';
import { taskAPI } from '../services/api';
import { Task } from '../types';

const TaskHistory: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'points' | 'subject'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  const loadCompletedTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await taskAPI.getTasks();
      const completed = allTasks.filter(task => task.status === 'completed');
      setCompletedTasks(completed);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load completed tasks:', err);
      setError(err.message || 'Failed to load task history');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = completedTasks
    .filter(task => {
      const matchesSearch = task.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || task.assignment_type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'points':
          const pointsA = a.grade || 0;
          const pointsB = b.grade || 0;
          comparison = pointsA - pointsB;
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getPointsColor = (points: number | undefined) => {
    if (!points) return 'text-gray-500';
    if (points >= 25) return 'text-green-600';
    if (points >= 15) return 'text-blue-600';
    if (points >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPointsBadge = (points: number | undefined) => {
    if (!points) return null;
    if (points >= 25) return 'High';
    if (points >= 15) return 'Med';
    if (points >= 10) return 'Low';
    return 'Min';
  };

  const getPointsBadgeColor = (points: number | undefined) => {
    if (!points) return 'bg-gray-100 text-gray-600';
    if (points >= 25) return 'bg-green-100 text-green-800';
    if (points >= 15) return 'bg-blue-100 text-blue-800';
    if (points >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const calculateStats = () => {
    const tasksWithPoints = completedTasks.filter(task => task.grade !== undefined && task.grade !== null);
    const averagePoints = tasksWithPoints.length > 0 
      ? tasksWithPoints.reduce((sum, task) => sum + (task.grade || 0), 0) / tasksWithPoints.length 
      : 0;
    
    return {
      totalCompleted: completedTasks.length,
      totalWithPoints: tasksWithPoints.length,
      averagePoints: Math.round(averagePoints * 10) / 10,
      highestPoints: Math.max(...tasksWithPoints.map(t => t.grade || 0), 0)
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your task history...</p>
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
              <div className="h-6 w-6 text-red-600">⚠️</div>
              <h2 className="text-xl font-semibold text-red-900">Error Loading Task History</h2>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={loadCompletedTasks}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task History</h1>
          <p className="text-gray-600">View all your completed tasks and academic achievements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Completed</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalCompleted}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks with Points</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalWithPoints}</p>
              </div>
              <Award className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Points</p>
                <p className="text-3xl font-bold text-purple-600">{stats.averagePoints}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Points</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.highestPoints}</p>
              </div>
              <div className="h-10 w-10 text-yellow-600">🏆</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks by subject or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter by Assignment Type */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Exam">Exams</option>
                <option value="Presentation">Presentations</option>
                <option value="Homework">Homework</option>
                <option value="Project">Projects</option>
                <option value="Quiz">Quizzes</option>
                <option value="Assignment">Assignments</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'points' | 'subject')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="points">Points</option>
                <option value="subject">Subject</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {completedTasks.length === 0 ? 'No Completed Tasks Yet' : 'No Tasks Match Your Filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {completedTasks.length === 0 
                  ? 'Complete your first task to see your academic history here!'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {completedTasks.length === 0 && (
                <button 
                  onClick={() => window.location.href = '/tasks'}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Tasks
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedTasks.map((task) => (
              <div key={task.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-semibold text-gray-900">{task.subject}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {task.assignment_type}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Completed: {new Date(task.updated_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {task.grade !== undefined && task.grade !== null ? (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getPointsColor(task.grade)}`}>
                          {task.grade} pts
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPointsBadgeColor(task.grade)}`}>
                          {getPointsBadge(task.grade)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-gray-400 text-sm">No Points</div>
                        <div className="text-xs text-gray-400">Not specified</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskHistory; 