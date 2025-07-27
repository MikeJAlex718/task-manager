import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { BookOpen, Brain, Clock, CheckCircle, AlertCircle, Target, Lightbulb, TrendingUp, Users, XCircle } from 'lucide-react';

interface AcademicAssistantProps {
  taskId: string;
  subject: string;
  description: string;
  assignmentType: string;
  dueDate: string; // Add missing due date
  onClose: () => void;
}

interface AssistantData {
  task_id: string;
  recommended_approach: string;
  resources_and_tools: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
  step_by_step_guidance: Array<{
    step: number;
    title: string;
    description: string;
    estimated_time: string;
  }>;
  tips_and_strategies: string[];
  time_management: {
    total_estimated_time: string;
    recommended_schedule: string;
    break_suggestions: string;
  };
  success_metrics: string[];
  related_skills: string[];
  created_at: string;
}

const AcademicAssistant: React.FC<AcademicAssistantProps> = ({
  taskId,
  subject,
  description,
  assignmentType,
  dueDate,
  onClose
}) => {
  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [activeTab, setActiveTab] = useState('overview');

  const generateAcademicAssistance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🤖 Generating AI assistance with data:', {
        task_id: taskId,
        subject,
        description,
        assignment_type: assignmentType,
        difficulty_level: difficultyLevel,
        due_date: dueDate
      });
      
      const data = await aiAPI.generateAcademicAssistance({
        task_id: taskId,
        subject,
        description,
        assignment_type: assignmentType,
        difficulty_level: difficultyLevel,
        due_date: dueDate // Add due_date to the request
      });
      
      console.log('✅ AI assistance generated:', data);
      setAssistantData(data);
    } catch (err: any) {
      console.error('❌ AI assistance failed:', err);
      setError(err.message || 'Failed to generate academic assistance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Academic Assistant</h2>
                <p className="text-gray-600">Get personalized study guidance, resources, and strategies for your specific task</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {!assistantData ? (
          <div className="space-y-8 p-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                How Academic Assistant Works
              </h3>
              <p className="text-green-700 mb-3">
                Unlike the AI Task Wizard (which breaks down tasks into subtasks), the Academic Assistant provides 
                personalized study guidance, learning resources, and strategies to help you understand and complete your work.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-800 mb-1">What You'll Get:</h4>
                  <ul className="text-green-700 space-y-1">
                    <li>• Personalized study strategies</li>
                    <li>• Subject-specific resources</li>
                    <li>• Step-by-step guidance</li>
                    <li>• Time management tips</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Perfect For:</h4>
                  <ul className="text-green-700 space-y-1">
                    <li>• Understanding concepts</li>
                    <li>• Finding study resources</li>
                    <li>• Learning strategies</li>
                    <li>• Skill development</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Difficulty Level</label>
                <p className="text-xs text-gray-500 mb-2">How challenging is this assignment for you?</p>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Easy - I understand the concepts well</option>
                  <option value="medium">Medium - Some concepts are challenging</option>
                  <option value="hard">Hard - This is very challenging for me</option>
                </select>
              </div>

              <button
                onClick={generateAcademicAssistance}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    <span>Generate Academic Assistance</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
                      <div className="space-y-8">
              {/* Navigation Tabs */}
              <div className="border-b border-gray-200 px-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: Target },
                  { id: 'steps', name: 'Step-by-Step', icon: CheckCircle },
                  { id: 'resources', name: 'Resources', icon: BookOpen },
                  { id: 'tips', name: 'Tips & Strategies', icon: Lightbulb },
                  { id: 'time', name: 'Time Management', icon: Clock },
                  { id: 'skills', name: 'Skills Development', icon: TrendingUp }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8 px-6">
                                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <div className="flex items-center space-x-2 mb-6">
                      <Target className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">Task Analysis</h3>
                    </div>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{assistantData.recommended_approach}</div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <div className="flex items-center space-x-2 mb-6">
                      <Brain className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-semibold text-gray-900">Recommended Approach</h3>
                    </div>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{assistantData.recommended_approach}</div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <div className="flex items-center space-x-2 mb-6">
                      <Users className="w-6 h-6 text-purple-600" />
                      <h3 className="text-xl font-semibold text-gray-900">Success Metrics</h3>
                    </div>
                    <ul className="space-y-3">
                      {assistantData.success_metrics.map((metric, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="text-purple-600 mt-1">•</span>
                          <span className="text-gray-700">{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mx-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Step-by-Step Guidance</h3>
                </div>
                <div className="space-y-4">
                  {assistantData.step_by_step_guidance.map((step, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500">Step {step.step}</span>
                        <span className="text-sm text-gray-500">{step.estimated_time}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-gray-700">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mx-6">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Resources & Tools</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assistantData.resources_and_tools.map((resource, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{resource.name}</h4>
                      <p className="text-gray-700 mb-3">{resource.description}</p>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Visit Resource →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mx-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Tips & Strategies</h3>
                </div>
                <ul className="space-y-3">
                  {assistantData.tips_and_strategies.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-yellow-600 mt-1">💡</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'time' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mx-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Time Management</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(assistantData.time_management).map(([phase, time]) => (
                    <div key={phase} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 capitalize mb-2">{phase.replace('_', ' ')}</h4>
                      <p className="text-gray-700">{time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mx-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Skills Development</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assistantData.related_skills.map((skill, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-800 font-medium">{skill}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3 px-6 pb-6">
              <button
                onClick={() => setAssistantData(null)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Generate New Assistance
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicAssistant; 