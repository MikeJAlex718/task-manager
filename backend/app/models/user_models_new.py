from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: str
    fullName: str
    studentID: str
    major: str
    yearLevel: int

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    fullName: str
    studentID: str
    major: str
    yearLevel: int
    createdAt: datetime 