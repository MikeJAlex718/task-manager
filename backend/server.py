from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase.client import create_client, Client
import jwt
from typing import Optional
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
jwt_secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")

if not supabase_url or not supabase_key:
    logger.error("Missing required environment variables")
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

# Initialize Supabase client
try:
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    raise

# Pydantic models for authentication
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: str
    full_name: str
    student_id: str
    major: str
    year_level: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    student_id: str
    major: str
    year_level: int
    created_at: datetime

app = FastAPI(
    title="Student Task Manager API", 
    version="1.0.0",
    description="A comprehensive API for managing student tasks and assignments",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Configuration
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, jwt_secret_key, algorithm="HS256")
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(credentials.credentials, jwt_secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current user ID from JWT token"""
    payload = verify_token(credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Authentication helper functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        # Fallback to simple hash if bcrypt fails
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    try:
        return pwd_context.verify(password, hashed)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        # Fallback verification
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest() == hashed

@app.get("/")
async def root():
    return {
        "message": "Student Task Manager API", 
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "auth": "/api/auth",
            "tasks": "/api/tasks",
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Supabase connection
        result = supabase.table('users').select('count').limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.get("/api/test")
async def test_connection():
    """Test database connection"""
    try:
        # Test Supabase connection
        result = supabase.table('users').select('count').limit(1).execute()
        return {
            "message": "Supabase connection successful", 
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return {
            "message": "Supabase connection failed", 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Authentication endpoints
@app.post("/api/auth/register")
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = supabase.table('users').select('*').eq('email', user_data.email).execute()
        
        if existing_user.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Create new user
        new_user = supabase.table('users').insert({
            'email': user_data.email,
            'username': user_data.username,
            'password_hash': hashed_password,
            'full_name': user_data.full_name,
            'student_id': user_data.student_id,
            'major': user_data.major,
            'year_level': user_data.year_level,
            'created_at': datetime.utcnow().isoformat()
        }).execute()
        
        if new_user.data:
            user = new_user.data[0]
            
            # Create access token
            access_token_expires = timedelta(minutes=30)
            access_token = create_access_token(
                data={"sub": str(user['id'])}, expires_delta=access_token_expires
            )
            
            user_response = UserResponse(
                id=user['id'],
                email=user['email'],
                username=user['username'],
                full_name=user['full_name'],
                student_id=user['student_id'],
                major=user['major'],
                year_level=user['year_level'],
                created_at=datetime.fromisoformat(user['created_at'])
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_response
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login_user(user_data: UserLogin):
    """Login a user"""
    try:
        # Find user by email
        user = supabase.table('users').select('*').eq('email', user_data.email).execute()
        
        if not user.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(user_data.password, user.data[0]['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_info = user.data[0]
        
        # Create access token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": str(user_info['id'])}, expires_delta=access_token_expires
        )
        
        user_response = UserResponse(
            id=user_info['id'],
            email=user_info['email'],
            username=user_info['username'],
            full_name=user_info['full_name'],
            student_id=user_info['student_id'],
            major=user_info['major'],
            year_level=user_info['year_level'],
            created_at=datetime.fromisoformat(user_info['created_at'])
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """Get current user information"""
    try:
        # Get user from database
        result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = result.data[0]
        return UserResponse(
            id=user['id'],
            email=user['email'],
            username=user['username'],
            full_name=user['full_name'],
            student_id=user['student_id'],
            major=user['major'],
            year_level=user['year_level'],
            created_at=datetime.fromisoformat(user['created_at'])
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Student Task Manager API...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info") 