# Supabase Setup Guide - Fix Data Persistence Issues

## 🚨 Current Issue
Your task data is not being saved to Supabase because the environment variables are not configured. This guide will help you fix this issue.

## 📋 Prerequisites
1. A Supabase account (free at https://supabase.com)
2. A Supabase project created
3. Your project URL and API key

## 🔧 Step-by-Step Setup

### 1. Get Your Supabase Credentials

1. Go to https://supabase.com and sign in
2. Create a new project or select an existing one
3. Go to **Settings** → **API** in your project dashboard
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 2. Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_public_key_here

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_api_key_here
```

**Replace the values:**
- `your-project-id` with your actual Supabase project ID
- `your_anon_public_key_here` with your actual anon public key
- `your_super_secret_jwt_key_change_this_in_production` with a secure random string
- `your_openai_api_key_here` with your OpenAI API key (optional for AI features)

### 3. Set Up Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL to create the required tables:

```sql
-- Student Task Manager Database Schema
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-key-change-in-production';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    studentID VARCHAR(50) UNIQUE NOT NULL,
    major VARCHAR(100) NOT NULL,
    yearLevel INTEGER NOT NULL CHECK (yearLevel >= 1 AND yearLevel <= 6),
    birthday DATE,
    bio TEXT,
    profilePicture VARCHAR(500),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    assignmentType VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    dueDate DATE,
    estimatedHours DECIMAL(5,2),
    actualHours DECIMAL(5,2),
    grade DECIMAL(5,2),
    completedAt DATE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_studentID ON users(studentID);
CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks(userId);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dueDate ON tasks(dueDate);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Create RLS policies for tasks table
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid()::text = userId::text);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid()::text = userId::text);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid()::text = userId::text);

-- For development, you can temporarily disable RLS (NOT recommended for production)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
```

### 4. Test the Connection

1. Start your backend server:
   ```bash
   cd backend
   python -m app.main
   ```

2. Test the connection by visiting:
   ```
   http://localhost:8000/api/test
   ```

3. You should see a response like:
   ```json
   {
     "message": "Supabase connection successful",
     "data": {...},
     "timestamp": "..."
   }
   ```

### 5. Create a Test User

Run the test user creation script:

```bash
cd backend
python create_test_user.py
```

This will create a test user with:
- Email: `test@example.com`
- Password: `password123`

### 6. Verify Everything Works

1. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Register or login with the test user
3. Create a new task
4. Check if the task appears in your Supabase dashboard under **Table Editor** → **tasks**

## 🔍 Troubleshooting

### Issue: "Supabase not configured" error
**Solution:** Make sure your `.env` file exists in the `backend` directory and contains the correct Supabase URL and key.

### Issue: "Database connection failed" error
**Solution:** 
1. Check your Supabase URL and key are correct
2. Make sure your Supabase project is active
3. Verify the tables were created successfully

### Issue: "RLS policy violation" error
**Solution:** 
1. Make sure you're logged in with a valid user
2. Check that the RLS policies are correctly set up
3. For development, you can temporarily disable RLS (see SQL above)

### Issue: Tasks not saving
**Solution:**
1. Check the browser console for errors
2. Verify the backend is running on the correct port
3. Ensure the frontend is connecting to the correct backend URL

## 🎯 What This Fixes

✅ **Data Persistence**: Tasks will now be saved to Supabase database
✅ **User Authentication**: User accounts will be stored and managed
✅ **Task Management**: Full CRUD operations for tasks
✅ **AI Features**: Enhanced task planning and breakdown features
✅ **Real-time Updates**: Changes will persist across sessions

## 🚀 Next Steps

After setting up Supabase:

1. **Test the AI Planning Wizard**: Create a task and use the new "Planning Wizard" button
2. **Explore Enhanced Features**: The system now provides comprehensive study plans
3. **Customize for Your Needs**: Modify the planning logic in `TaskPlanningWizard.tsx`

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase credentials
3. Test the connection using the `/api/test` endpoint
4. Check the backend logs for detailed error messages

---

**🎉 Congratulations!** Your task manager now has full data persistence and enhanced planning features to help distressed students feel more guided and supported. 