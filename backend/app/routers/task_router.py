from fastapi import APIRouter, Depends, HTTPException, status as http_status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from ..models.task_models import TaskCreate, TaskUpdate, TaskResponse
from ..services.task_service import task_service
import jwt
import os

router = APIRouter()
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extract user information from JWT token"""
    try:
        secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        payload = jwt.decode(credentials.credentials, secret_key, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": int(user_id)}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new task"""
    try:
        return task_service.create_task(task, current_user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}"
        )

@router.get("/", response_model=List[TaskResponse])
def get_tasks(current_user: dict = Depends(get_current_user)):
    """Get all tasks for the current user"""
    try:
        return task_service.get_user_tasks(current_user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tasks: {str(e)}"
        )

@router.get("/analytics")
def get_analytics(current_user: dict = Depends(get_current_user)):
    """Get task analytics for the current user"""
    try:
        return task_service.get_task_analytics(current_user["id"])
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific task"""
    try:
        task = task_service.get_task_by_id(task_id, current_user["id"])
        if not task:
            raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get task: {str(e)}"
        )

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a specific task"""
    try:
        task = task_service.update_task(task_id, task_update, current_user["id"])
        if not task:
            raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}"
        )

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific task"""
    try:
        success = task_service.delete_task(task_id, current_user["id"])
        if not success:
            raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Task not found"
                )
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}"
        ) 