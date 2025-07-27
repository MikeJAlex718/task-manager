# Complete Supabase Setup Guide

## 🎯 Problem
Your user registration is not saving to Supabase because the backend is not properly configured. This guide will fix this issue.

## 🔧 Step-by-Step Solution

### Step 1: Set Up Supabase Project

1. **Create Supabase Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get Your Credentials**
   - Go to **Settings** → **API** in your project dashboard
   - Copy the **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - Copy the **anon public** key (starts with `eyJ...`)

### Step 2: Create Environment File

Run this command in the `backend` directory:

```bash
cd backend
python create_env.py
```

This will prompt you for your Supabase credentials and create a `.env` file.

### Step 3: Set Up Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL:

```sql
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
```

### Step 4: Start the Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Step 5: Test the Setup

```bash
cd backend
python test_setup.py
```

This will test:
- ✅ Backend server is running
- ✅ Supabase connection is working
- ✅ Authentication endpoints are accessible

### Step 6: Start the Frontend

```bash
cd frontend
npm start
```

## 🔍 How to Verify It's Working

### Check Browser Console
When you register a new user, you should see:
- ✅ "Backend available, using real authentication"
- ✅ "Registration successful, saving token and user"
- ❌ No "mock registration" messages

### Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **users**
3. You should see your registered user in the table

### Test User Registration
1. Go to the registration page
2. Fill out the form with your details
3. Submit the registration
4. Check the browser console for success messages
5. Check Supabase dashboard for the new user

## 🚨 Troubleshooting

### Problem: Still seeing "mock registration" messages
**Solution:**
1. Ensure the backend server is running on port 8000
2. Check that the `.env` file has correct Supabase credentials
3. Verify the health endpoint returns `"database": "connected"`

### Problem: Registration fails with errors
**Solution:**
1. Check browser console for specific error messages
2. Verify Supabase credentials are correct
3. Ensure database tables are created
4. Check that the backend server is running

### Problem: Users not appearing in Supabase
**Solution:**
1. Check that the database tables are created correctly
2. Verify the user table structure matches the expected schema
3. Check backend logs for database errors

## 📊 Expected Behavior

### Before Setup (Mock Authentication)
- ✅ Registration appears to work
- ❌ Users not saved to Supabase
- ❌ Data doesn't persist across sessions

### After Setup (Real Authentication)
- ✅ Registration saves users to Supabase
- ✅ Users persist across sessions
- ✅ Tasks are saved to database
- ✅ All data is properly secured

## 🎉 Success Indicators

When real authentication is working, you'll see:
1. **Browser Console**: "Backend available, using real authentication"
2. **Registration**: "Registration successful, saving token and user"
3. **Supabase Dashboard**: New users appear in the users table
4. **Task Creation**: Tasks are saved to the tasks table
5. **Data Persistence**: Data survives page refreshes and browser restarts

## 🔧 Quick Commands

```bash
# Set up environment
cd backend
python create_env.py

# Test setup
python test_setup.py

# Start backend
python -m uvicorn app.main:app --reload

# Start frontend (in another terminal)
cd frontend
npm start
```

The key difference is that with real authentication, your data will actually be saved to Supabase and persist across sessions! 