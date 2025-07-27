from pydantic import BaseModel, validator
from datetime import datetime
from enum import Enum
from typing import Optional

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class AssignmentType(str, Enum):
    EXAM = "Exam"
    PRESENTATION = "Presentation"
    HOMEWORK = "Homework"
    PROJECT = "Project"
    QUIZ = "Quiz"
    ASSIGNMENT = "Assignment"
    OTHER = "Other"

class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class TaskCreate(BaseModel):
    subject: str
    description: str
    due_date: datetime
    assignment_type: AssignmentType
    priority: Priority

    @validator('due_date')
    def validate_due_date(cls, v):
        if v <= datetime.now():
            raise ValueError('Due date must be in the future')
            return v

class TaskUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assignment_type: Optional[AssignmentType] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    grade: Optional[float] = None  # Add grade field for updates

    @validator('due_date')
    def validate_due_date(cls, v):
        if v and v <= datetime.now():
            raise ValueError('Due date must be in the future')
            return v

    @validator('grade')
    def validate_grade(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Grade must be between 0 and 100')
        return v

class TaskResponse(BaseModel):
    id: int
    subject: str
    description: str
    due_date: datetime
    assignment_type: AssignmentType
    priority: Priority
    status: TaskStatus
    user_id: int
    estimated_hours: Optional[int] = None
    grade: Optional[float] = None  # Add grade field to response
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
