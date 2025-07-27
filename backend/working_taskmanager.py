from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
import os
from dotenv import load_dotenv
from supabase.client import create_client, Client
from uuid import UUID
import uvicorn

# Load environment variables
load_dotenv()

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file")

# Initialize Supabase
supabase: Client = create_client(supabase_url, supabase_key)

# Pydantic models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    assignmentType: Optional[str] = None
    priority: str = "medium"
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None

class TaskResponse(BaseModel):
    id: str
    userID: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    dueDate: Optional[str] = None
    subject: Optional[str] = None
    assignmentType: Optional[str] = None
    actualHours: Optional[float] = None
    estimatedHours: Optional[float] = None
    grade: Optional[float] = None
    completedAt: Optional[str] = None
    createdAt: str
    updatedAt: str

# Create FastAPI app
app = FastAPI(title="Student Task Manager", version="1.0.0")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test user ID (in production, this would come from authentication)
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

@app.get("/")
async def root():
    return {"message": "Student Task Manager API", "status": "running"}

@app.get("/api/tasks")
async def get_tasks():
    """Get all tasks for the test user"""
    try:
        result = supabase.table('tasks').select('*').eq('userID', TEST_USER_ID).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks")
async def create_task(task_data: TaskCreate):
    """Create a new task"""
    try:
        task_dict = {
            'userID': TEST_USER_ID,
            'title': task_data.title,
            'description': task_data.description,
            'status': 'pending',
            'priority': task_data.priority,
            'dueDate': task_data.dueDate,
            'subject': task_data.subject,
            'assignmentType': task_data.assignmentType,
            'estimatedHours': task_data.estimatedHours,
            'createdAt': date.today().isoformat(),
            'updatedAt': date.today().isoformat()
        }
        
        result = supabase.table('tasks').insert(task_dict).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create task")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/tasks/{task_id}/status")
async def update_task_status(task_id: str, status: str):
    """Update task status"""
    try:
        update_data = {
            'status': status,
            'updatedAt': date.today().isoformat()
        }
        
        if status == 'completed':
            update_data['completedAt'] = date.today().isoformat()
        
        result = supabase.table('tasks').update(update_data).eq('id', task_id).eq('userID', TEST_USER_ID).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise HTTPException(status_code=404, detail="Task not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    try:
        result = supabase.table('tasks').delete().eq('id', task_id).eq('userID', TEST_USER_ID).execute()
        
        if result.data:
            return {"message": "Task deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Task not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/statistics/summary")
async def get_statistics():
    """Get task statistics"""
    try:
        result = supabase.table('tasks').select('*').eq('userID', TEST_USER_ID).execute()
        tasks = result.data
        
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
        pending_tasks = len([t for t in tasks if t.get('status') == 'pending'])
        in_progress_tasks = len([t for t in tasks if t.get('status') == 'in_progress'])
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return {
            "totalTasks": total_tasks,
            "completedTasks": completed_tasks,
            "pendingTasks": pending_tasks,
            "inProgressTasks": in_progress_tasks,
            "completionRate": round(completion_rate, 1)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting Student Task Manager...")
    print(f"Supabase URL: {supabase_url}")
    print("Server will be available at: http://localhost:8001")
    print("HTML interface should connect automatically")
    uvicorn.run(app, host="0.0.0.0", port=8001) 