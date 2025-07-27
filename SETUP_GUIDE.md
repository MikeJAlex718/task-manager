# Student Task Manager - Complete Setup Guide

## 🎯 Overview

This guide explains how to properly set up the Student Task Manager to ensure your data is saved to Supabase and not just stored in mock data.

## 📊 Data Flow Explanation

### Current Issue
The application currently has extensive mock data fallbacks that can give the false impression that everything is working, when in reality data is not being saved to Supabase.

### How Data Should Flow
1. **Frontend** → Makes API calls to **Backend**
2. **Backend** → Connects to **Supabase Database**
3. **Supabase** → Stores data permanently
4. **Frontend** → Displays data from Supabase

### Current Problematic Flow
1. **Frontend** → Makes API calls to **Backend**
2. **Backend** → Fails (no .env file)
3. **Frontend** → Falls back to mock data
4. **User** → Thinks it's working, but data isn't saved

## 🔧 Step-by-Step Setup

### 1. Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 2. Create Environment File

Create a `.env` file in the `backend` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_public_key_here

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production

# OpenAI Configuration (optional for AI features)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Set Up Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-key-change-in-production';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    studentID VARCHAR(50) UNIQUE NOT NULL,
    major VARCHAR(100) NOT NULL,
    yearLevel INTEGER NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    birthday DATE,
    bio TEXT,
    profilePicture VARCHAR(500),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    userId BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    dueDate DATE,
    subject VARCHAR(100),
    assignmentType VARCHAR(100),
    estimatedHours DECIMAL(5,2),
    actualHours DECIMAL(5,2),
    grade DECIMAL(5,2),
    completedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::bigint = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::bigint = id);

CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid()::bigint = userId);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid()::bigint = userId);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid()::bigint = userId);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid()::bigint = userId);
```

### 4. Start the Backend Server

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 5. Start the Frontend

```bash
cd frontend
npm start
```

### 6. Test the Connection

Visit `http://localhost:8000/api/test` to verify your Supabase connection is working.

## 🔍 How to Verify Data is Being Saved

### 1. Check Browser Console
When the backend is properly configured, you should see:
- ✅ "Supabase connection successful" messages
- ❌ No "Backend not available" error messages

### 2. Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Check the `tasks` table for your created tasks

### 3. Test Data Persistence
1. Create a task in the frontend
2. Refresh the page
3. The task should still be there (if saved to Supabase)
4. If it disappears, data is not being saved

## 🚨 Troubleshooting

### Problem: "Backend not available" errors
**Solution:**
1. Ensure the backend server is running
2. Check that the `.env` file exists and has correct credentials
3. Verify Supabase connection at `http://localhost:8000/api/test`

### Problem: Tasks disappear on refresh
**Solution:**
1. Check that Supabase is properly configured
2. Verify RLS policies are set up correctly
3. Check browser console for authentication errors

### Problem: Authentication not working
**Solution:**
1. Ensure JWT_SECRET_KEY is set in `.env`
2. Check that user registration/login endpoints are working
3. Verify Supabase authentication is properly configured

## 🔄 Development vs Production

### Development Mode (Default)
- Uses mock data when backend is unavailable
- Provides clear error messages about missing configuration
- Allows testing UI without full backend setup

### Production Mode
- Requires full backend and Supabase setup
- All data is saved to Supabase
- No mock data fallbacks

To enable real authentication in development:
```bash
# Set this environment variable
REACT_APP_USE_REAL_AUTH=true npm start
```

## 📝 Summary

The key to ensuring your data goes to Supabase is:

1. **Proper .env configuration** with Supabase credentials
2. **Running backend server** with correct environment
3. **Database tables and RLS policies** set up in Supabase
4. **No "Backend not available" errors** in browser console

When properly configured, all task creation, updates, and deletions will be saved to your Supabase database and persist across sessions. 