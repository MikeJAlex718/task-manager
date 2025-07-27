# Student Task Manager API

A FastAPI backend for managing student tasks with authentication and comprehensive task management features.

## 🚀 Features

- **User Authentication**: Register and login with secure password hashing
- **Task Management**: Full CRUD operations for tasks
- **Task Organization**: Categories, priorities, due dates, and status tracking
- **Statistics**: Task completion rates and progress tracking
- **Modern Architecture**: Clean separation of concerns with services and routers

## 📁 Project Structure

```
backend/
├── app/
│   ├── models/           # Pydantic models
│   │   ├── user_models.py
│   │   └── task_models.py
│   ├── routers/          # API endpoints
│   │   ├── auth_router.py
│   │   └── task_router.py
│   ├── services/         # Business logic
│   │   ├── auth_service.py
│   │   └── task_service.py
│   └── main.py          # FastAPI application
├── database_schema.sql   # Database setup
├── requirements.txt      # Python dependencies
└── README.md           # This file
```

## 🛠️ Setup Instructions

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 2. Database Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the contents of `database_schema.sql` to create the required tables

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Application

```bash
python -m app.main
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Task Endpoints

- `GET /api/tasks` - Get all tasks (with optional status filter)
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{task_id}` - Get specific task
- `PUT /api/tasks/{task_id}` - Update a task
- `DELETE /api/tasks/{task_id}` - Delete a task
- `PATCH /api/tasks/{task_id}/status` - Update task status
- `GET /api/tasks/statistics/summary` - Get task statistics

## 🎯 Task Features

### Task Status
- `pending` - Task not started
- `in_progress` - Task being worked on
- `completed` - Task finished
- `cancelled` - Task cancelled

### Task Priority
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent priority

### Task Properties
- **Title**: Required task name
- **Description**: Optional detailed description
- **Category**: Optional task category
- **Due Date**: Optional deadline
- **Estimated Hours**: Optional time estimate
- **Priority**: Task importance level
- **Status**: Current task state

## 🔧 Example Usage

### Register a User
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securepassword",
    "username": "student123",
    "fullName": "John Doe",
    "studentID": "2024001",
    "major": "Computer Science",
    "yearLevel": 2
  }'
```

### Create a Task
```bash
curl -X POST "http://localhost:8000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete Project Report",
    "description": "Write the final project report for CS101",
    "priority": "high",
    "dueDate": "2024-12-15",
    "category": "Academic",
    "estimatedHours": 8.0
  }'
```

### Get Task Statistics
```bash
curl -X GET "http://localhost:8000/api/tasks/statistics/summary"
```

## 🏗️ Architecture Benefits

1. **Separation of Concerns**: Models, services, and routers are clearly separated
2. **Maintainability**: Easy to add new features and modify existing ones
3. **Testability**: Services can be easily unit tested
4. **Scalability**: Clean architecture supports growth
5. **Type Safety**: Full type hints and Pydantic validation

## 🔒 Security Features

- Password hashing with bcrypt
- Input validation with Pydantic
- CORS protection
- Database constraints and validation
- Row Level Security (RLS) policies

## 🚀 Next Steps

1. **JWT Authentication**: Add proper JWT token-based authentication
2. **Email Verification**: Add email verification for new accounts
3. **Password Reset**: Implement password reset functionality
4. **Task Reminders**: Add notification system for due dates
5. **Team Features**: Add task sharing and collaboration
6. **File Attachments**: Allow file uploads for tasks
7. **Task Templates**: Predefined task templates for common activities

## 🐛 Troubleshooting

- **Database Connection**: Ensure your Supabase credentials are correct
- **CORS Issues**: Check that your frontend URL is in the allowed origins
- **Missing Tables**: Run the database schema SQL in Supabase
- **Port Conflicts**: Change the port in `main.py` if 8000 is in use 