import axios from 'axios';
import { 
  User, 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest,
  RegisterRequest, 
  LoginRequest, 
  AuthResponse,
  TaskAnalytics,
  PlanFeatures
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests (optional - fallback if no token)
api.interceptors.request.use((config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
});

// Add response interceptor to handle 401 errors gracefully
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('🔍 API Error:', error.response?.status, error.message);
    
    // Prevent infinite loops by checking if this is already a retry
    if (error.response?.status === 401 && !error.config._retry) {
      console.log('🔐 401 Unauthorized - Token may be expired');
      
      // Mark this request as retried to prevent infinite loops
      error.config._retry = true;
      
      // Try to refresh the token
      try {
        // Direct API call to avoid circular dependency
        const refreshResponse = await api.post('/auth/refresh-token');
        localStorage.setItem('access_token', refreshResponse.data.access_token);
        
        // Retry the original request with the new token
        const originalRequest = error.config;
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed - redirecting to login');
        // Save current path before redirecting
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.setItem('intendedPath', currentPath);
        }
        // Clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Task endpoints for main.py
export const taskAPI = {
  createTask: async (taskData: CreateTaskRequest): Promise<Task> => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/');
    return response.data;
  },

  getTask: async (taskId: number): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId.toString()}`);
    return response.data;
  },

  updateTask: async (taskId: number, updates: UpdateTaskRequest): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId.toString()}`, updates);
    return response.data;
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId.toString()}`);
  },

  getAnalytics: async (): Promise<TaskAnalytics> => {
    const response = await api.get('/tasks/analytics');
    return response.data;
  },

  getTaskAnalytics: async (): Promise<TaskAnalytics> => {
    const response = await api.get('/tasks/analytics');
    return response.data;
  },

  // Additional methods for Dashboard
  getTaskStatistics: async (): Promise<any> => {
    const response = await api.get('/tasks/analytics');
    return response.data;
  },

  getAISuggestions: async (): Promise<any[]> => {
    // For now, return empty array until AI features are implemented
    return [];
  },
};

// AI Academic Assistance API
export const aiAPI = {
  generateAcademicAssistance: async (taskData: {
    task_id: string;
    subject: string;
    description: string;
    assignment_type: string;
    difficulty_level?: string;
    due_date?: string; // Add due_date field
  }): Promise<any> => {
    const response = await api.post('/ai/generate-academic-assistance', taskData);
    return response.data;
  },

  getAcademicAssistance: async (taskId: string): Promise<any> => {
    const response = await api.get(`/ai/academic-assistance/${taskId}`);
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  sendMilestoneNotification: async (data: {
    email: string;
    tier: string;
    months_active: number;
    discount_percentage: number;
  }): Promise<any> => {
    const response = await api.post('/notifications/milestone', data);
    return response.data;
  },

  sendDiscountActivation: async (data: {
    email: string;
    tier: string;
    discount_percentage: number;
    valid_until: string;
  }): Promise<any> => {
    const response = await api.post('/notifications/discount-activation', data);
    return response.data;
  },
};

// Plan Features API
export const planAPI = {
  getPlanFeatures: async (): Promise<PlanFeatures> => {
    const response = await api.get('/user/plan-features');
    return response.data;
  },

  updatePlan: async (planType: string): Promise<any> => {
    const response = await api.put('/user/update-plan', {
      plan_type: planType
    });
    return response.data;
  },
};

// Test function to debug FormData
export const testFormData = async () => {
  const formData = new FormData();
  formData.append('email', 'test@test.com');
  formData.append('username', 'testuser');
  formData.append('password', 'testpass');
  formData.append('full_name', 'Test User');
  formData.append('student_id', 'TEST001');
  formData.append('major', 'Computer Science');
  formData.append('year_level', '1');
  
  const response = await api.post('/test/raw-request', formData);
  return response.data;
};

export const authAPI = {
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    console.log('🔍 Making registration request to backend...');
    // Send as form data to match backend expectations
    const formData = new FormData();
    formData.append('email', userData.email);
    formData.append('username', userData.username);
    formData.append('password', userData.password);
    formData.append('full_name', userData.full_name);
    formData.append('student_id', userData.student_id);
    formData.append('major', userData.major);
    formData.append('year_level', userData.year_level.toString());
    
    const response = await api.post('/auth/register', formData);
    console.log('✅ Registration response received:', response.data);
    return response.data;
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    console.log('🔍 Making login request to backend...');
    const formData = new FormData();
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await api.post('/auth/login', formData);
    console.log('✅ Login response received:', response.data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    console.log('🔍 Making getCurrentUser request to backend...');
    const response = await api.get('/auth/me');
    console.log('✅ getCurrentUser response received:', response.data);
    return response.data;
  },

  deleteAccount: async (): Promise<{ message: string; user_id: string }> => {
    console.log('🗑️ Making delete account request to backend...');
    const response = await api.delete('/auth/delete-account');
    console.log('✅ Delete account response received:', response.data);
    return response.data;
  },

  refreshToken: async (): Promise<{ access_token: string; token_type: string; expires_in: number }> => {
    console.log('🔄 Refreshing token...');
    const response = await api.post('/auth/refresh-token');
    console.log('✅ Token refresh response received:', response.data);
    return response.data;
  },

  updateProfile: async (profileData: {
    full_name?: string;
    username?: string;
    major?: string;
    year_level?: number;
    bio?: string;
    profile_picture?: string;
  }): Promise<User> => {
    console.log('📝 Making profile update request to backend...');
    const response = await api.put('/auth/update-profile', profileData);
    console.log('✅ Profile update response received:', response.data);
    return response.data;
  },
};

export default api; 