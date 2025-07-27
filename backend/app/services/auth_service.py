import bcrypt
from datetime import datetime, timedelta
from fastapi import HTTPException
from supabase.client import Client
from app.models.user_models import UserRegister, UserLogin, UserResponse
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def create_access_token(self, data: dict, expires_delta: timedelta = None) -> str:
        """Create JWT access token"""
        from app.main import create_access_token
        return create_access_token(data, expires_delta)

    async def register_user(self, user_data: UserRegister) -> Dict[str, Any]:
        """Register a new user"""
        try:
            # Check if Supabase is connected
            if self.supabase is None:
                logger.error("Cannot register user: Supabase not connected")
                raise HTTPException(
                    status_code=503, 
                    detail="Database not available. Please check your Supabase connection."
                )

            # Check if user already exists
            existing_user = self.supabase.table('users').select('id').eq('email', user_data.email).execute()
            
            if existing_user.data:
                raise HTTPException(
                    status_code=400,
                    detail="User with this email already exists"
                )

            # Hash password
            hashed_password = self.hash_password(user_data.password)
            
            # Create user data
            user_dict = {
                'email': user_data.email,
                'username': user_data.username,
                'fullName': user_data.fullName,
                'studentID': user_data.studentID,
                'major': user_data.major,
                'yearLevel': user_data.yearLevel,
                'passwordHash': hashed_password,
                'createdAt': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }

            logger.info(f"Registering user with data: {user_dict}")
            
            # Insert user into database
            result = self.supabase.table('users').insert(user_dict).execute()
            
            if not result.data:
                logger.error("Failed to insert user into database")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create user account"
                )

            user = result.data[0]
            logger.info(f"User registered successfully with ID: {user['id']}")

            # Create access token
            access_token = self.create_access_token(
                data={"sub": str(user['id']), "email": user['email']},
                expires_delta=timedelta(hours=24)
            )

            return {
                "message": "User registered successfully",
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "username": user['username'],
                    "fullName": user['fullName'],
                    "studentID": user['studentID'],
                    "major": user['major'],
                    "yearLevel": user['yearLevel']
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration error: {e}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error during registration"
            )

    async def login_user(self, user_data: UserLogin) -> Dict[str, Any]:
        """Login a user"""
        try:
            # Check if Supabase is connected
            if self.supabase is None:
                logger.error("Cannot login user: Supabase not connected")
                raise HTTPException(
                    status_code=503, 
                    detail="Database not available. Please check your Supabase connection."
                )

            # Find user by email
            result = self.supabase.table('users').select('*').eq('email', user_data.email).execute()
            
            if not result.data:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )

            user = result.data[0]

            # Verify password
            if not self.verify_password(user_data.password, user['passwordHash']):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password"
                )

            # Create access token
            access_token = self.create_access_token(
                data={"sub": str(user['id']), "email": user['email']},
                expires_delta=timedelta(hours=24)
            )

            logger.info(f"User {user['email']} logged in successfully")

            return {
                "message": "Login successful",
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "username": user['username'],
                    "fullName": user['fullName'],
                    "studentID": user['studentID'],
                    "major": user['major'],
                    "yearLevel": user['yearLevel']
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login error: {e}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error during login"
            ) 