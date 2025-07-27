from pydantic import BaseModel
from datetime import datetime

class UserRegister(BaseModel):
    email: str
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
