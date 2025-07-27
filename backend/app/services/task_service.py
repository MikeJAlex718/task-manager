from supabase import create_client, Client
import os
from ..models.task_models import TaskCreate, TaskUpdate, TaskResponse, TaskStatus
from typing import List, Optional
from datetime import datetime

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set")

supabase: Client = create_client(url, key)

class TaskService:
    def __init__(self):
        self.supabase = supabase

    def create_task(self, task_data: TaskCreate, user_id: int) -> TaskResponse:
        """Create a new task"""
        try:
            # Convert to snake_case for database
            task_dict = {
                "subject": task_data.subject,
                "description": task_data.description,
                "due_date": task_data.due_date.isoformat(),
                "assignment_type": task_data.assignment_type.value,
                "priority": task_data.priority.value,
                "status": TaskStatus.PENDING.value,
                "user_id": user_id,
                "estimated_hours": 0,  # Default value
                "grade": None,  # Default grade value
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

            result = self.supabase.table("tasks").insert(task_dict).execute()
            
            if result.data:
                task_record = result.data[0]
                return TaskResponse(
                    id=task_record["id"],
                    subject=task_record["subject"],
                    description=task_record["description"],
                    due_date=datetime.fromisoformat(task_record["due_date"].replace('Z', '+00:00')),
                    assignment_type=task_record["assignment_type"],
                    priority=task_record["priority"],
                    status=task_record["status"],
                    user_id=task_record["user_id"],
                    estimated_hours=task_record.get("estimated_hours"),
                    grade=task_record.get("grade"),  # Include grade in response
                    created_at=datetime.fromisoformat(task_record["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(task_record["updated_at"].replace('Z', '+00:00'))
                )
            else:
                raise Exception("Failed to create task")
                
        except Exception as e:
            print(f"Error creating task: {e}")
            raise Exception(f"Failed to create task: {str(e)}")

    def get_user_tasks(self, user_id: int) -> List[TaskResponse]:
        """Get all tasks for a user"""
        try:
            result = self.supabase.table("tasks").select("*").eq("user_id", user_id).execute()
            
            tasks = []
            for task_data in result.data:
                task = TaskResponse(
                    id=task_data["id"],
                    subject=task_data["subject"],
                    description=task_data["description"],
                    due_date=datetime.fromisoformat(task_data["due_date"].replace('Z', '+00:00')),
                    assignment_type=task_data["assignment_type"],
                    priority=task_data["priority"],
                    status=task_data["status"],
                    user_id=task_data["user_id"],
                    estimated_hours=task_data.get("estimated_hours"),
                    grade=task_data.get("grade"),  # Include grade in response
                    created_at=datetime.fromisoformat(task_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(task_data["updated_at"].replace('Z', '+00:00'))
                )
                tasks.append(task)
            
            return tasks
            
        except Exception as e:
            print(f"Error getting user tasks: {e}")
            raise Exception(f"Failed to get tasks: {str(e)}")

    def get_task_by_id(self, task_id: int, user_id: int) -> Optional[TaskResponse]:
        """Get a specific task by ID"""
        try:
            result = self.supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
            
            if result.data:
                task_data = result.data[0]
                return TaskResponse(
                    id=task_data["id"],
                    subject=task_data["subject"],
                    description=task_data["description"],
                    due_date=datetime.fromisoformat(task_data["due_date"].replace('Z', '+00:00')),
                    assignment_type=task_data["assignment_type"],
                    priority=task_data["priority"],
                    status=task_data["status"],
                    user_id=task_data["user_id"],
                    estimated_hours=task_data.get("estimated_hours"),
                    created_at=datetime.fromisoformat(task_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(task_data["updated_at"].replace('Z', '+00:00'))
                )
            return None
            
        except Exception as e:
            print(f"Error getting task: {e}")
            raise Exception(f"Failed to get task: {str(e)}")

    def update_task(self, task_id: int, task_data: TaskUpdate, user_id: int) -> Optional[TaskResponse]:
        """Update a task"""
        try:
            # Build update dictionary with only provided fields
            update_dict = {}
            if task_data.subject is not None:
                update_dict["subject"] = task_data.subject
            if task_data.description is not None:
                update_dict["description"] = task_data.description
            if task_data.due_date is not None:
                update_dict["due_date"] = task_data.due_date.isoformat()
            if task_data.assignment_type is not None:
                update_dict["assignment_type"] = task_data.assignment_type.value
            if task_data.priority is not None:
                update_dict["priority"] = task_data.priority.value
            if task_data.status is not None:
                update_dict["status"] = task_data.status.value
            if task_data.grade is not None:  # Add grade update
                update_dict["grade"] = task_data.grade
            
            update_dict["updated_at"] = datetime.now().isoformat()
            
            result = self.supabase.table("tasks").update(update_dict).eq("id", task_id).eq("user_id", user_id).execute()
            
            if result.data:
                task_data = result.data[0]
                return TaskResponse(
                    id=task_data["id"],
                    subject=task_data["subject"],
                    description=task_data["description"],
                    due_date=datetime.fromisoformat(task_data["due_date"].replace('Z', '+00:00')),
                    assignment_type=task_data["assignment_type"],
                    priority=task_data["priority"],
                    status=task_data["status"],
                    user_id=task_data["user_id"],
                    estimated_hours=task_data.get("estimated_hours"),
                    grade=task_data.get("grade"),  # Include grade in response
                    created_at=datetime.fromisoformat(task_data["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(task_data["updated_at"].replace('Z', '+00:00'))
                )
            return None
            
        except Exception as e:
            print(f"Error updating task: {e}")
            raise Exception(f"Failed to update task: {str(e)}")

    def delete_task(self, task_id: int, user_id: int) -> bool:
        """Delete a task"""
        try:
            result = self.supabase.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
            return len(result.data) > 0
            
        except Exception as e:
            print(f"Error deleting task: {e}")
            raise Exception(f"Failed to delete task: {str(e)}")

    def get_task_analytics(self, user_id: int) -> dict:
        """Get task analytics for a user"""
        try:
            result = self.supabase.table("tasks").select("*").eq("user_id", user_id).execute()
            
            tasks = result.data
            total_tasks = len(tasks)
            completed_tasks = len([t for t in tasks if t["status"] == "completed"])
            pending_tasks = len([t for t in tasks if t["status"] == "pending"])
            in_progress_tasks = len([t for t in tasks if t["status"] == "in_progress"])
            
            # Calculate completion rate
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Count by assignment type
            assignment_types = {}
            for task in tasks:
                assignment_type = task.get("assignment_type", "Other")
                assignment_types[assignment_type] = assignment_types.get(assignment_type, 0) + 1
            
            # Count by priority
            priorities = {}
            for task in tasks:
                priority = task.get("priority", "Medium")
                priorities[priority] = priorities.get(priority, 0) + 1
            
            return {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "pending_tasks": pending_tasks,
                "in_progress_tasks": in_progress_tasks,
                "completion_rate": round(completion_rate, 1),
                "assignment_types": assignment_types,
                "priorities": priorities
            }
            
        except Exception as e:
            print(f"Error getting analytics: {e}")
            raise Exception(f"Failed to get analytics: {str(e)}")

# Create a singleton instance
task_service = TaskService() 