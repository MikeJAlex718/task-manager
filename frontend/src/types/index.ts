export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  student_id: string;
  major: string;
  year_level: number;
  bio?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
  plan_type?: string;
  plan_status?: string;
  subscription_end?: string; // ISO date string when subscription ends
}

export interface PlanFeatures {
  plan_type: string;
  features: {
    max_tasks: number | null;
    max_categories: number;
    ai_features: boolean;
    advanced_analytics: boolean;
    export_options: string[];
    collaboration: boolean;
    custom_themes: boolean;
    priority_support: boolean;
    study_session_tracking: boolean;
    cloud_backup: boolean;
    team_study_groups: boolean;
    lms_integration: boolean;
    custom_study_plans: boolean;
    progress_reports: boolean;
    white_label: boolean;
  };
}

export interface Task {
  id: number;
  title: string;
  subject: string;
  description: string;
  due_date: string;
  assignment_type: 'Exam' | 'Presentation' | 'Homework' | 'Project' | 'Quiz' | 'Assignment' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  status: 'pending' | 'in_progress' | 'completed';
  user_id: number;
  estimated_hours?: number;
  grade?: number;  // Add grade field
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  task_id: string;
  start_time: string;
  end_time?: string;
  notes?: string;
}

export interface AcademicProfile {
  gpa: number;
  total_credits: number;
  major: string;
  year_level: number;
  academic_standing: string;
}

export interface AISuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  category?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  student_id: string;
  major: string;
  year_level: number;
}

export interface CreateTaskRequest {
  title: string;
  subject: string;
  description: string;
  due_date: string;
  assignment_type: 'Exam' | 'Presentation' | 'Homework' | 'Project' | 'Quiz' | 'Assignment' | 'Other';
  priority: 'Low' | 'Medium' | 'High';
  grade?: number;  // Add optional grade field
}

export interface UpdateTaskRequest {
  subject?: string;
  description?: string;
  due_date?: string;
  assignment_type?: 'Exam' | 'Presentation' | 'Homework' | 'Project' | 'Quiz' | 'Assignment' | 'Other';
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'pending' | 'in_progress' | 'completed';
  grade?: number;  // Add grade field for updates
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface TaskAnalytics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  assignment_types: Record<string, number>;
  priorities: Record<string, number>;
  grade_stats?: {
    average_grade: number;
    total_graded_tasks: number;
    grade_distribution: Record<string, number>;
  };
} 