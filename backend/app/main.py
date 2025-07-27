# JAM
# 7/5/2025
# Backend for the task manager project, provides functionality 

from fastapi import FastAPI, HTTPException, Depends, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import os
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase.client import create_client, Client
import jwt
from typing import Optional, List, Any
import uvicorn
from pydantic import BaseModel, field_validator
from enum import Enum
import bcrypt
import requests
import anthropic

# Configure logging - Reduced verbosity for production
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Dynamic Table Creation Functions - COMMENTED OUT FOR NOW
# def create_user_tasks_table(user_id: str) -> bool:
#     """Create a user-specific tasks table"""
#     try:
#         create_table_sql = f"""
#         CREATE TABLE IF NOT EXISTS user_{user_id}_tasks (
#             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#             title VARCHAR(255) NOT NULL,
#             subject VARCHAR(100) NOT NULL,
#             description TEXT,
#             due_date TIMESTAMP WITH TIME ZONE,
#             assignment_type VARCHAR(50) NOT NULL,
#             priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
#             status VARCHAR(20) NOT NULL DEFAULT 'pending',
#             estimated_hours INTEGER,
#             grade TEXT,
#             created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
#             updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
#         );
#         
#         CREATE INDEX IF NOT EXISTS idx_user_{user_id}_tasks_id ON user_{user_id}_tasks(id);
#         CREATE INDEX IF NOT EXISTS idx_user_{user_id}_tasks_status ON user_{user_id}_tasks(status);
#         CREATE INDEX IF NOT EXISTS idx_user_{user_id}_tasks_due_date ON user_{user_id}_tasks(due_date);
#         
#         ALTER TABLE user_{user_id}_tasks ENABLE ROW LEVEL SECURITY;
#         
#         CREATE POLICY "Users can manage their own tasks" ON user_{user_id}_tasks
#             FOR ALL USING (true);
#         """
#         
#         # Execute the SQL via Supabase RPC
#         result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
#         
#         logger.info(f"✅ Created table user_{user_id}_tasks")
#         return True
#         
#     except Exception as e:
#         logger.error(f"❌ Failed to create table for user {user_id}: {e}")
#         return False

# def check_user_table_exists(user_id: str) -> bool:
#     """Check if a user's tasks table exists"""
#     try:
#         # Try to select from the table - if it doesn't exist, this will fail
#         result = supabase.rpc('exec_sql', {
#             'sql': f"SELECT 1 FROM user_{user_id}_tasks LIMIT 1;"
#         }).execute()
#         return True
#     except Exception:
#         return False

# def ensure_user_table_exists(user_id: str) -> bool:
#     """Ensure a user's tasks table exists, create it if it doesn't"""
#     if not check_user_table_exists(user_id):
#         return create_user_tasks_table(user_id)
#     return True

# def get_user_tasks_table(user_id: str) -> str:
#     """Get the table name for a user's tasks"""
#     return f"user_{user_id}_tasks"

# Task Models
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
    title: str
    subject: str
    description: str
    due_date: datetime
    assignment_type: AssignmentType
    priority: Priority
    grade: Optional[float] = None

    @field_validator('due_date')
    def validate_due_date(cls, v):
        if v:
            # Make both datetimes timezone-aware for comparison
            from datetime import timezone
            now = datetime.now(timezone.utc)
            if v.tzinfo is None:
                # If v is naive, assume it's UTC
                v = v.replace(tzinfo=timezone.utc)
            if v <= now:
                raise ValueError('Due date must be in the future')
        return v

class TaskUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    assignment_type: Optional[AssignmentType] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    grade: Optional[float] = None

    @field_validator('due_date')
    def validate_due_date(cls, v):
        if v:
            # Make both datetimes timezone-aware for comparison
            from datetime import timezone
            now = datetime.now(timezone.utc)
            if v.tzinfo is None:
                # If v is naive, assume it's UTC
                v = v.replace(tzinfo=timezone.utc)
            if v <= now:
                raise ValueError('Due date must be in the future')
        return v

class TaskResponse(BaseModel):
    id: str
    title: str
    subject: str
    description: str
    due_date: datetime
    assignment_type: AssignmentType
    priority: Priority
    status: TaskStatus
    user_id: str
    estimated_hours: Optional[int] = None
    grade: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Auth Models
class UserRegister(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    student_id: str
    major: str
    year_level: int

    class Config:
        extra = "ignore"  # Ignore extra fields
        validate_assignment = True  # Validate on assignment

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    student_id: str
    major: str
    year_level: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    plan_type: Optional[str] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict  # Changed from UserResponse to dict to avoid validation issues

    class Config:
        from_attributes = True

# AI Models
class AITaskRequest(BaseModel):
    task_description: str
    subject: str
    due_date: str

class AITaskResponse(BaseModel):
    ai_suggestions: str
    subject: str
    original_task: str
    due_date: str

class AcademicAssistantRequest(BaseModel):
    task_id: str
    subject: str
    description: str
    assignment_type: str
    difficulty_level: str = "medium"  # easy, medium, hard
    due_date: Optional[str] = None  # Add due_date field

class AcademicAssistantResponse(BaseModel):
    task_id: str
    recommended_approach: str
    resources_and_tools: List[dict]
    step_by_step_guidance: List[dict]
    tips_and_strategies: List[str]
    time_management: dict
    success_metrics: List[str]
    related_skills: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Email notification models
class MilestoneNotification(BaseModel):
    email: str
    tier: str
    months_active: int
    discount_percentage: int

class DiscountActivation(BaseModel):
    email: str
    tier: str
    discount_percentage: int
    valid_until: str

# Subscription and Plan Models
class PlanType(str, Enum):
    STUDENT = "student"  # Free plan
    STUDENT_PRO = "student_pro"  # $4.99/month
    ACADEMIC_PLUS = "academic_plus"  # $9.99/month

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"

class UserSubscription(BaseModel):
    user_id: str
    plan_type: PlanType
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    trial_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PlanFeatures(BaseModel):
    plan_type: PlanType
    max_tasks: Optional[int] = None  # None = unlimited
    max_categories: int
    ai_features: bool
    advanced_analytics: bool
    export_options: List[str]
    collaboration: bool
    custom_themes: bool
    priority_support: bool
    study_session_tracking: bool
    cloud_backup: bool
    team_study_groups: bool
    lms_integration: bool
    custom_study_plans: bool
    progress_reports: bool
    white_label: bool

# Plan update model
class PlanUpdateRequest(BaseModel):
    plan_type: PlanType

# Load and validate environment variables
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
jwt_secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
anthropic_api_key = os.getenv("CLAUDE_API_KEY")

# Log configuration status
logger.info("Configuration Check:")
logger.info(f"   SUPABASE_URL: {'Set' if supabase_url else 'Missing'}")
logger.info(f"   SUPABASE_SERVICE_ROLE_KEY: {'Set' if supabase_key else 'Missing'}")
logger.info(f"   JWT_SECRET_KEY: {'Set' if jwt_secret_key else 'Missing'}")
logger.info(f"   CLAUDE_API_KEY: {'Set' if anthropic_api_key else 'Missing'}")

# Initialize Supabase with better error handling
supabase: Optional[Client] = None

if not supabase_url or not supabase_key:
    logger.warning("Missing Supabase environment variables - using fallback mode")
    supabase = None
else:
    try:
        logger.info(f"Attempting to connect to Supabase... URL: {supabase_url[:20]}...")
        supabase = create_client(supabase_url, supabase_key)
        # Test the connection
        test_result = supabase.table('users').select('count', count='exact').limit(1).execute()
        logger.info("Supabase client initialized and connection tested successfully!")
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error details: {e}")
        
        # Check if it's a DNS resolution error
        if "getaddrinfo failed" in str(e) or "11001" in str(e):
            logger.error("❌ DNS resolution failed - check your Supabase URL and internet connection")
            logger.error("💡 Try these solutions:")
            logger.error("   1. Check your internet connection")
            logger.error("   2. Verify your Supabase URL is correct")
            logger.error("   3. Try using a different network (mobile hotspot)")
            logger.error("   4. Check if your firewall is blocking the connection")
        
        logger.warning("Using fallback mode - data will not persist")
        supabase = None

# Create FastAPI app
app = FastAPI(
    title="Student Task Manager API", 
    version="1.0.0",
    description="A comprehensive API for managing student tasks and assignments"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Extended from 30 minutes to 24 hours for better user experience
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, jwt_secret_key, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, jwt_secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from token"""
    
    if not credentials:
        raise HTTPException(status_code=401, detail="No credentials provided")
    
    try:
        payload = verify_token(credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        return {"id": str(user_id)}  # Keep as string since Supabase uses UUIDs
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as e:
        logger.error(f"Token error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_user_plan_features(user_id: str) -> PlanFeatures:
    """Get user's current plan features"""
    
    # DEVELOPER MODE: Allow testing all plan features
    # Set this to True to test all features, False for normal operation
    # TODO: Set to False before production deployment
    DEVELOPER_MODE = False
    
    # DEVELOPER PLAN OVERRIDE: Set to test different plans
    # Options: "student", "student_pro", "academic_plus"
    # Set to None to use actual database plan
    DEVELOPER_PLAN_OVERRIDE = None  # Set to None to use actual user plan from database
    
    if DEVELOPER_MODE and DEVELOPER_PLAN_OVERRIDE:
        # Return specific plan for developer testing
        if DEVELOPER_PLAN_OVERRIDE == "student":
            return PlanFeatures(
                plan_type=PlanType.STUDENT,
                max_tasks=None,  # Unlimited
                max_categories=5,
                ai_features=False,  # AI features only for paid plans
                advanced_analytics=False,
                export_options=["pdf"],
                collaboration=False,
                custom_themes=False,
                priority_support=False,
                study_session_tracking=False,
                cloud_backup=False,
                team_study_groups=False,
                lms_integration=False,
                custom_study_plans=False,
                progress_reports=False,
                white_label=False
            )
        elif DEVELOPER_PLAN_OVERRIDE == "student_pro":
            return PlanFeatures(
                plan_type=PlanType.STUDENT_PRO,
                max_tasks=None,  # Unlimited
                max_categories=50,
                ai_features=True,
                advanced_analytics=True,
                export_options=["pdf", "excel", "csv"],
                collaboration=True,
                custom_themes=True,
                priority_support=True,
                study_session_tracking=True,
                cloud_backup=True,
                team_study_groups=True,
                lms_integration=False,
                custom_study_plans=False,
                progress_reports=False,
                white_label=False
            )
        elif DEVELOPER_PLAN_OVERRIDE == "academic_plus":
            return PlanFeatures(
                plan_type=PlanType.ACADEMIC_PLUS,
                max_tasks=None,  # Unlimited
                max_categories=100,
                ai_features=True,
                advanced_analytics=True,
                export_options=["pdf", "excel", "csv", "json"],
                collaboration=True,
                custom_themes=True,
                priority_support=True,
                study_session_tracking=True,
                cloud_backup=True,
                team_study_groups=True,
                lms_integration=True,
                custom_study_plans=True,
                progress_reports=True,
                white_label=True
            )
    
    # Default to free plan if no subscription found
    default_features = PlanFeatures(
        plan_type=PlanType.STUDENT,
        max_tasks=None,  # Unlimited
        max_categories=5,
        ai_features=False,  # AI features only for paid plans
        advanced_analytics=False,
        export_options=["pdf"],
        collaboration=False,
        custom_themes=False,
        priority_support=False,
        study_session_tracking=False,
        cloud_backup=False,
        team_study_groups=False,
        lms_integration=False,
        custom_study_plans=False,
        progress_reports=False,
        white_label=False
    )
    
    if not supabase:
        return default_features
    
    try:
        # First, check user's plan_type in the users table
        user_result = supabase.table('users').select('plan_type').eq('id', user_id).execute()
        
        if user_result.data and user_result.data[0].get('plan_type'):
            user_plan_type = user_result.data[0]['plan_type']
            logger.info(f"📋 User {user_id} has plan_type: {user_plan_type}")
            
            # Map the plan_type to PlanType enum
            if user_plan_type == "student_pro":
                plan_type = PlanType.STUDENT_PRO
            elif user_plan_type == "academic_plus":
                plan_type = PlanType.ACADEMIC_PLUS
            else:
                plan_type = PlanType.STUDENT
                
            # Define features for each plan
            if plan_type == PlanType.STUDENT_PRO:
                return PlanFeatures(
                    plan_type=plan_type,
                    max_tasks=None,  # Unlimited
                    max_categories=50,
                    ai_features=True,
                    advanced_analytics=True,
                    export_options=["pdf", "excel", "csv"],
                    collaboration=True,
                    custom_themes=True,
                    priority_support=True,
                    study_session_tracking=True,
                    cloud_backup=True,
                    team_study_groups=True,
                    lms_integration=False,
                    custom_study_plans=False,
                    progress_reports=False,
                    white_label=False
                )
            elif plan_type == PlanType.ACADEMIC_PLUS:
                return PlanFeatures(
                    plan_type=plan_type,
                    max_tasks=None,  # Unlimited
                    max_categories=100,
                    ai_features=True,
                    advanced_analytics=True,
                    export_options=["pdf", "excel", "csv", "json"],
                    collaboration=True,
                    custom_themes=True,
                    priority_support=True,
                    study_session_tracking=True,
                    cloud_backup=True,
                    team_study_groups=True,
                    lms_integration=True,
                    custom_study_plans=True,
                    progress_reports=True,
                    white_label=True
                )
            else:
                return default_features
        
        # Fallback: Check user's subscription (legacy method)
        logger.info(f"📋 Checking subscriptions for user {user_id}")
        subscription_result = supabase.table('user_subscriptions').select('*').eq('user_id', user_id).eq('status', 'active').execute()
        
        if not subscription_result.data:
            logger.info(f"📋 No active subscription found for user {user_id}, using default features")
            return default_features
        
        subscription = subscription_result.data[0]
        plan_type = PlanType(subscription['plan_type'])
        
        # Define features for each plan
        if plan_type == PlanType.STUDENT_PRO:
            return PlanFeatures(
                plan_type=plan_type,
                max_tasks=None,  # Unlimited
                max_categories=50,
                ai_features=True,
                advanced_analytics=True,
                export_options=["pdf", "excel", "csv"],
                collaboration=True,
                custom_themes=True,
                priority_support=True,
                study_session_tracking=True,
                cloud_backup=True,
                team_study_groups=True,
                lms_integration=False,
                custom_study_plans=False,
                progress_reports=False,
                white_label=False
            )
        elif plan_type == PlanType.ACADEMIC_PLUS:
            return PlanFeatures(
                plan_type=plan_type,
                max_tasks=None,  # Unlimited
                max_categories=100,
                ai_features=True,
                advanced_analytics=True,
                export_options=["pdf", "excel", "csv", "json"],
                collaboration=True,
                custom_themes=True,
                priority_support=True,
                study_session_tracking=True,
                cloud_backup=True,
                team_study_groups=True,
                lms_integration=True,
                custom_study_plans=True,
                progress_reports=True,
                white_label=True
            )
        else:
            return default_features
    except Exception as e:
        logger.error(f"Error getting user plan features: {e}")
        return default_features

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and log them"""
    logger.error(f"❌ Validation error: {exc}")
    logger.error(f"❌ Validation errors: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "body": str(await request.body())
        }
    )

@app.get("/")
async def root():
    return {"message": "Student Task Manager API", "status": "running", "timestamp": datetime.now().isoformat()}

@app.get("/test/connection")
async def test_connection():
    """Test endpoint to check environment variables and Supabase connection"""
    logger.info("🔍 Testing connection...")
    
    # Check environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    status = {
        "supabase_url": "Set" if supabase_url else "Missing",
        "supabase_service_role_key": "Set" if supabase_key else "Missing",
        "supabase_client": "Connected" if supabase else "Not Connected",
        "key_length": len(supabase_key) if supabase_key else 0
    }
    
    logger.info(f"📊 Connection status: {status}")
            
    return {
        "message": "Connection test",
        "status": status,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/test/register-data")
async def test_register_data(request: Request):
    """Test endpoint to see exactly what data is being sent"""
    logger.info("🔍 Testing registration data...")
    
    # Get raw body
    body = await request.body()
    logger.info(f"📝 Raw body: {body}")
    
    # Try to parse as JSON
    try:
        import json
        json_data = json.loads(body)
        logger.info(f"📝 JSON data: {json_data}")
    except:
        logger.info("📝 Not valid JSON")
    
    # Get headers
    logger.info(f"📝 Content-Type: {request.headers.get('content-type')}")
    
    return {
        "message": "Data received",
        "raw_body": str(body),
        "headers": dict(request.headers)
    }

@app.post("/test/register-debug")
async def test_register_debug(request: Request):
    """Test endpoint to debug registration data"""
    logger.info("🔍 Debugging registration data...")
    
    # Get raw body
    body = await request.body()
    logger.info(f"📝 Raw body: {body}")
    
    # Try to parse as JSON
    try:
        import json
        json_data = json.loads(body)
        logger.info(f"📝 JSON data: {json_data}")
        logger.info(f"📝 Keys: {list(json_data.keys())}")
        
        # Check if all required fields are present
        required_fields = ['email', 'username', 'password', 'full_name', 'student_id', 'major', 'year_level']
        missing_fields = [field for field in required_fields if field not in json_data]
        
        if missing_fields:
            logger.error(f"❌ Missing fields: {missing_fields}")
        else:
            logger.info("✅ All required fields present")
            
    except Exception as e:
        logger.error(f"❌ JSON parsing error: {e}")
    
    # Get headers
    logger.info(f"📝 Content-Type: {request.headers.get('content-type')}")
    
    return {
        "message": "Debug data received",
        "raw_body": str(body),
        "headers": dict(request.headers)
    }

@app.post("/auth/register")
async def register_user(
    email: str = Form(default=""),
    username: str = Form(default=""),
    password: str = Form(default=""),
    full_name: str = Form(default=""),
    student_id: str = Form(default=""),
    major: str = Form(default=""),
    year_level: int = Form(default=1)
):
    """Register a new user - REAL SUPABASE ONLY"""
    logger.info(f"🚀 Registration attempt for: {email}")
    
    # Force real Supabase - no fallbacks
    if not supabase:
        logger.error("❌ Supabase not available - registration failed")
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
            # Check if user already exists
            logger.info("🔍 Checking if user already exists...")
            existing_user = supabase.table('users').select('id').eq('email', email).execute()
                
            if existing_user.data:
                logger.warning(f"⚠️ User with email {email} already exists!")
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Hash the password
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            # Prepare user data for database insert
            user_data_dict = {
                "email": email,
                "username": username,
                "password_hash": password_hash,
                "full_name": full_name,
                "student_id": student_id,
                "major": major,
                "year_level": year_level,  # Keep as integer as per actual database
                "plan_type": "student",  # Default to free plan
                "created_at": datetime.utcnow().isoformat(),  # Explicitly set created_at
                "updated_at": datetime.utcnow().isoformat()   # Explicitly set updated_at
            }
            
            # Insert user into database
            logger.info("🔄 Inserting user into database...")
            result = supabase.table('users').insert(user_data_dict).execute()

            if result.data:
                user = result.data[0]
                user_id = user['id']
                logger.info(f"✅ User created successfully: {user_id}")
                
                # Create the user's personal tasks table - COMMENTED OUT FOR NOW
                # table_created = create_user_tasks_table(user_id)
                # if not table_created:
                #     logger.warning(f"⚠️ Failed to create tasks table for user {user_id}")
                #     # Continue with registration even if table creation fails
                #     # The table will be created when the user first creates a task
                
                # Create JWT token
                token_payload = {"sub": user_id, "email": email}
                access_token = create_access_token(token_payload)
                
                return {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": str(user_id),
                        "email": user["email"],
                        "username": user["username"],
                        "full_name": user["full_name"],
                        "student_id": user["student_id"],
                        "major": user["major"],
                        "year_level": user["year_level"],
                        "plan_type": user.get("plan_type", "student")
                    }
                }
            else:
                logger.error("❌ Insert returned no data")
                raise HTTPException(status_code=400, detail="Registration failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Registration error: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        logger.error(f"❌ Full error details: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login")
async def login_user(
    email: str = Form(...),
    password: str = Form(...)
):
    """Login with real authentication"""
    logger.info(f"🚀 Login attempt for: {email}")
    logger.info(f"📝 Password length: {len(password)}")
    
    try:
        logger.info("🔍 Checking if Supabase is available...")
        if not supabase:
            logger.warning("⚠️ Supabase not available - using fallback login")
            # Return mock data for now to keep it working
            token_payload = {"sub": 1, "email": email}
            access_token = create_access_token(token_payload)
            
            logger.info("✅ Returning fallback login data")
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": "1",
                    "email": email,
                    "username": "user",
                    "full_name": "User",
                    "student_id": "STUDENT001",
                    "major": "Computer Science",
                    "year_level": 1
                }
            }
        
        logger.info("✅ Supabase is available, proceeding with real authentication")
        
        # Find user by email
        logger.info("🔍 Looking up user...")
        user_result = supabase.table('users').select('*').eq('email', email).execute()
        logger.info(f"📝 User query result: {user_result.data}")
        
        if not user_result.data:
            logger.warning(f"⚠️ User with email {email} not found")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = user_result.data[0]
        logger.info(f"✅ User found: {user['username']}")

        # Verify password
        logger.info("🔐 Verifying password...")
        stored_password_hash = user.get('password_hash', '')
        logger.info(f"📝 Stored hash length: {len(stored_password_hash)}")
        
        if not bcrypt.checkpw(password.encode('utf-8'), stored_password_hash.encode('utf-8')):
            logger.warning("❌ Password verification failed")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        logger.info("✅ Password verified successfully")
        
        # Create JWT token
        token_payload = {"sub": user["id"], "email": email}
        access_token = create_access_token(token_payload)
        
        logger.info("✅ Login successful, returning user data")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "username": user["username"],
                "full_name": user["full_name"],
                "student_id": user["student_id"],
                "major": user["major"],
                "year_level": user["year_level"],
                "plan_type": user.get("plan_type", "student")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        # Return mock data on error to keep it working
        logger.info("🔄 Returning fallback data due to error")
        token_payload = {"sub": 1, "email": email}
        access_token = create_access_token(token_payload)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": "1",
                "email": email,
                "username": "user",
                "full_name": "User",
                "student_id": "STUDENT001",
                "major": "Computer Science",
                "year_level": 1
            }
        }

@app.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user info from token"""
    logger.info(f"🔍 Getting user info for user ID: {current_user.get('id')}")
    
    try:
        if not supabase:
            logger.warning("⚠️ Supabase not available - using fallback user info")
            # Return fallback data instead of crashing
            return {
                "id": "1",
                "email": "user@example.com",
                "username": "user",
                "full_name": "User",
                "student_id": "STUDENT001",
                "major": "Computer Science",
                "year_level": 1
            }
        
        user_id = current_user.get('id')
        if not user_id:
            logger.warning("⚠️ No user ID in token - using fallback")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database
        logger.info(f"🔍 Looking up user with ID: {user_id}")
        user_result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not user_result.data:
            logger.warning(f"⚠️ User with ID {user_id} not found - using fallback")
            # Return fallback data instead of crashing
            return {
                "id": "1",
                "email": "user@example.com",
                "username": "user",
                "full_name": "User",
                "student_id": "STUDENT001",
                "major": "Computer Science",
                "year_level": 1,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        
        user = user_result.data[0]
        logger.info(f"✅ User found: {user['username']}")
        
        # Get user's plan information
        plan_features = get_user_plan_features(str(user["id"]))
        
        # Ensure created_at is always a valid date string
        created_at = user.get("created_at")
        if not created_at:
            created_at = datetime.now().isoformat()
        elif isinstance(created_at, str):
            # If it's already a string, use it as is
            pass
        else:
            # If it's a datetime object, convert to ISO string
            created_at = created_at.isoformat() if hasattr(created_at, 'isoformat') else datetime.now().isoformat()
        
        return {
            "id": str(user["id"]),
            "email": user["email"],
            "username": user["username"],
            "full_name": user["full_name"],
            "student_id": user["student_id"],
            "major": user["major"],
            "year_level": user["year_level"],
            "bio": user.get("bio"),
            "profile_picture": user.get("profile_picture"),
            "created_at": created_at,
            "updated_at": user.get("updated_at"),
            "plan_type": plan_features.plan_type.value
        }
        
    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"❌ Get user info error: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        # Return fallback data instead of crashing
        return {
            "id": "1",
            "email": "user@example.com",
            "username": "user",
            "full_name": "User",
            "student_id": "STUDENT001",
            "major": "Computer Science",
            "year_level": 1,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

@app.get("/test/token-debug")
async def test_token_debug(request: Request, current_user: dict = Depends(get_current_user)):
    """Test endpoint to debug JWT token"""
    logger.info("🔍 Testing token debug...")
    
    # Get the raw token from headers
    auth_header = request.headers.get('authorization')
    
    return {
        "current_user": current_user,
        "auth_header": auth_header,
        "message": "Token debug info"
    }

@app.get("/test/supabase")
async def test_supabase():
    """Test Supabase connection"""
    if not supabase:
        return {
            "status": "error", 
            "message": "Supabase not configured - check environment variables",
            "url_set": bool(supabase_url),
            "key_set": bool(supabase_key)
        }
    
    try:
        # Test basic connection
        logger.info("🔍 Testing Supabase connection...")
        result = supabase.table('tasks').select('count').limit(1).execute()
        logger.info("✅ Supabase connection test successful")
        return {
            "status": "success", 
            "message": "Supabase connection working", 
            "data": result.data,
            "url_preview": supabase_url[:30] + "..." if supabase_url else "No URL",
            "key_length": len(supabase_key) if supabase_key else 0
        }
    except Exception as e:
        logger.error(f"❌ Supabase connection test failed: {e}")
        return {
            "status": "error", 
            "message": f"Supabase connection failed: {str(e)}", 
            "error_type": str(type(e)),
            "url_preview": supabase_url[:30] + "..." if supabase_url else "No URL",
            "key_length": len(supabase_key) if supabase_key else 0
        }

@app.get("/test/task-creation")
async def test_task_creation(current_user: dict = Depends(get_current_user)):
    """Test task creation functionality"""
    if not supabase:
        return {"status": "error", "message": "Supabase not configured"}
    
    try:
        # Test task creation with sample data
        test_task_data = {
            "title": "Test Task",
            "subject": "Test Subject",
            "description": "Test Description",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "assignment_type": "Exam",
            "priority": "Medium",
            "status": "pending",
            "user_id": current_user["id"],
            "estimated_hours": 0
        }
        
        result = supabase.table('tasks').insert(test_task_data).execute()
        
        if result.data:
            # Clean up test task
            task_id = result.data[0]["id"]
            supabase.table('tasks').delete().eq('id', task_id).execute()
            
            return {
                "status": "success", 
                "message": "Task creation test passed",
                "test_task_id": task_id
            }
        else:
            return {"status": "error", "message": "Task creation test failed - no data returned"}
            
    except Exception as e:
        return {"status": "error", "message": f"Task creation test failed: {str(e)}"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    
    return {
        "status": "healthy",
        "database": "connected" if supabase else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/test/auth")
async def test_auth(current_user: dict = Depends(get_current_user)):
    """Test authentication endpoint"""
    return {
        "message": "Authentication successful",
        "user_id": current_user.get("id"),
            "timestamp": datetime.now().isoformat()
    }

# Task endpoints
@app.post("/tasks/", response_model=TaskResponse)
def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    """Create a new task"""
    
    if not supabase:
        logger.error("❌ Supabase connection not available")
        # Return a mock response for testing purposes
        return TaskResponse(
            id="temp-" + str(int(datetime.now().timestamp())),
            title=task.title,
            subject=task.subject,
            description=task.description,
            due_date=task.due_date,
            assignment_type=task.assignment_type,
            priority=task.priority,
            status=TaskStatus.PENDING,
            user_id=current_user["id"],
            estimated_hours=0,
            grade=task.grade,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    try:
        # Validate all required fields
        if not task.title or not task.title.strip():
            raise HTTPException(status_code=400, detail="Task title is required and cannot be empty")
        if not task.subject or not task.subject.strip():
            raise HTTPException(status_code=400, detail="Subject is required and cannot be empty")
        # Description is optional - can be empty
        if not task.due_date:
            raise HTTPException(status_code=400, detail="Due date is required")
        
        # Validate due date is in the future
        from datetime import timezone
        now = datetime.now(timezone.utc)
        if task.due_date.tzinfo is None:
            # If due_date is naive, assume it's UTC
            task_due_date = task.due_date.replace(tzinfo=timezone.utc)
        else:
            task_due_date = task.due_date
            
        if task_due_date <= now:
            raise HTTPException(status_code=400, detail="Due date must be in the future")
        
        # Validate assignment type and priority (these should be validated by Pydantic, but double-check)
        if not task.assignment_type:
            raise HTTPException(status_code=400, detail="Assignment type is required")
        if not task.priority:
            raise HTTPException(status_code=400, detail="Priority is required")
        
        # Prepare task data for database (using snake_case to match actual schema)
        task_data = {
            "title": task.title.strip(),
            "subject": task.subject.strip(),
            "description": task.description.strip() if task.description else "",
            "due_date": task.due_date.isoformat(),
            "assignment_type": task.assignment_type.value,
            "priority": task.priority.value,
            "status": TaskStatus.PENDING.value,
            "user_id": current_user["id"],
            "estimated_hours": 0,
            "grade": task.grade
        }
        
        logger.info(f"📝 Creating task for user {current_user['id']}: {task_data['title']}")
        logger.info(f"🔍 Task data being sent to Supabase: {task_data}")
        
        # Insert task into Supabase with better error handling
        try:
            logger.info(f"🔄 Executing Supabase insert...")
            result = supabase.table('tasks').insert(task_data).execute()
            logger.info(f"✅ Supabase insert completed. Result: {result}")
            logger.info(f"🔍 Raw result data: {result.data}")
            logger.info(f"🔍 Result type: {type(result)}")
            
            if result.data and len(result.data) > 0:
                created_task = result.data[0]
                logger.info(f"✅ Task created successfully: {created_task['id']}")
                
                # Safely parse datetime fields with null checking
                due_date_str = created_task.get("due_date")
                if not due_date_str:
                    logger.error(f"❌ Missing due_date in created task: {created_task}")
                    raise HTTPException(status_code=500, detail="Task created but due_date is missing")
                
                created_at_str = created_task.get("created_at")
                if not created_at_str:
                    logger.error(f"❌ Missing created_at in created task: {created_task}")
                    raise HTTPException(status_code=500, detail="Task created but created_at is missing")
                
                updated_at_str = created_task.get("updated_at")
                if not updated_at_str:
                    logger.error(f"❌ Missing updated_at in created task: {created_task}")
                    raise HTTPException(status_code=500, detail="Task created but updated_at is missing")
                
                try:
                    parsed_due_date = datetime.fromisoformat(due_date_str)
                    parsed_created_at = datetime.fromisoformat(created_at_str)
                    parsed_updated_at = datetime.fromisoformat(updated_at_str)
                except (ValueError, TypeError) as parse_error:
                    logger.error(f"❌ Failed to parse datetime fields: {parse_error}")
                    logger.error(f"❌ due_date: {due_date_str}, created_at: {created_at_str}, updated_at: {updated_at_str}")
                    raise HTTPException(status_code=500, detail=f"Failed to parse datetime fields: {str(parse_error)}")
                
                return TaskResponse(
                    id=str(created_task["id"]),
                    title=created_task["title"],
                    subject=created_task["subject"],
                    description=created_task["description"],
                    due_date=parsed_due_date,
                    assignment_type=AssignmentType(created_task["assignment_type"]),
                    priority=Priority(created_task["priority"]),
                    status=TaskStatus(created_task["status"]),
                    user_id=created_task["user_id"],
                    estimated_hours=created_task.get("estimated_hours"),
                    grade=created_task.get("grade"),
                    created_at=parsed_created_at,
                    updated_at=parsed_updated_at
                )
            else:
                logger.error("❌ Task creation failed - no data returned from Supabase")
                raise HTTPException(status_code=500, detail="Task creation failed - database error")
                
        except Exception as db_error:
            logger.error(f"❌ Database error during task creation: {db_error}")
            logger.error(f"❌ Error type: {type(db_error)}")
            logger.error(f"❌ Error details: {str(db_error)}")
            
            # Check for specific Supabase errors
            error_str = str(db_error).lower()
            if "supabase" in error_str or "connection" in error_str:
                raise HTTPException(status_code=503, detail="Database connection failed. Please check Supabase configuration.")
            elif "table" in error_str and "does not exist" in error_str:
                raise HTTPException(status_code=500, detail="Database table 'tasks' does not exist. Please create the table in Supabase.")
            elif "column" in error_str and "does not exist" in error_str:
                raise HTTPException(status_code=500, detail="Database schema mismatch. Please check table structure in Supabase.")
            elif "foreign key" in error_str:
                raise HTTPException(status_code=500, detail="Foreign key constraint failed. User may not exist.")
            else:
                raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error during task creation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@app.get("/tasks/", response_model=List[TaskResponse])
def get_tasks(current_user: dict = Depends(get_current_user)):
    """Get all tasks for the current user"""
    
    if not supabase:
        return []
    
    try:
        # Get tasks for current user
        result = supabase.table('tasks').select('*').eq('user_id', current_user["id"]).execute()
        
        if result.data:
            tasks = []
            for task in result.data:
                tasks.append(TaskResponse(
                    id=str(task["id"]),
                    title=task["title"],
                    subject=task["subject"],
                    description=task["description"],
                    due_date=datetime.fromisoformat(task["due_date"]),
                    assignment_type=AssignmentType(task["assignment_type"]),
                    priority=Priority(task["priority"]),
                    status=TaskStatus(task["status"]),
                    user_id=str(task["user_id"]),
                    estimated_hours=task.get("estimated_hours"),
                    grade=task.get("grade"),
                    created_at=datetime.fromisoformat(task["created_at"]),
                    updated_at=datetime.fromisoformat(task["updated_at"])
                ))
            return tasks
        else:
            return []
            
    except Exception as e:
        logger.error(f"Task fetching error: {e}")
        return []

@app.get("/tasks/analytics")
def get_analytics(current_user: dict = Depends(get_current_user)):
    """Get task analytics for the current user"""
    
    if not supabase:
        return {
            "total_tasks": 0,
            "completed_tasks": 0,
            "pending_tasks": 0,
            "in_progress_tasks": 0,
            "completion_rate": 0,
            "assignment_types": {},
            "priorities": {}
        }
    
    try:
        # Get all tasks for user
        result = supabase.table('tasks').select('*').eq('user_id', current_user["id"]).execute()
        
        if result.data:
            tasks = result.data
            total_tasks = len(tasks)
            completed_tasks = len([t for t in tasks if t["status"] == "completed"])
            pending_tasks = len([t for t in tasks if t["status"] == "pending"])
            in_progress_tasks = len([t for t in tasks if t["status"] == "in_progress"])
            
            # Calculate completion rate
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Count assignment types
            assignment_types = {}
            for task in tasks:
                assignment_type = task["assignment_type"]
                assignment_types[assignment_type] = assignment_types.get(assignment_type, 0) + 1
            
            # Count priorities
            priorities = {}
            for task in tasks:
                priority = task["priority"]
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
        else:
            return {
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0,
                "in_progress_tasks": 0,
                "completion_rate": 0,
                "assignment_types": {},
                "priorities": {}
            }
            
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific task"""
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        # Get task by ID and user
        result = supabase.table('tasks').select('*').eq('id', task_id).eq('user_id', current_user["id"]).execute()
        
        if result.data:
            task = result.data[0]
            
            return TaskResponse(
                id=str(task["id"]),
                title=task["title"],
                subject=task["subject"],
                description=task["description"],
                due_date=datetime.fromisoformat(task["due_date"]),
                assignment_type=AssignmentType(task["assignment_type"]),
                priority=Priority(task["priority"]),
                status=TaskStatus(task["status"]),
                user_id=str(task["user_id"]),
                estimated_hours=task.get("estimated_hours"),
                grade=task.get("grade"),
                created_at=datetime.fromisoformat(task["created_at"]),
                updated_at=datetime.fromisoformat(task["updated_at"])
            )
        else:
            raise HTTPException(status_code=404, detail="Task not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Task fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    """Update a specific task - REAL SUPABASE"""
    logger.info(f"🔄 Updating task: {task_id}")
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        # Prepare update data
        update_data = {}
        if task_update.subject is not None:
            update_data["subject"] = task_update.subject
        if task_update.description is not None:
            update_data["description"] = task_update.description
        if task_update.due_date is not None:
            update_data["due_date"] = task_update.due_date.isoformat()
        if task_update.assignment_type is not None:
            update_data["assignment_type"] = task_update.assignment_type.value
        if task_update.priority is not None:
            update_data["priority"] = task_update.priority.value
        if task_update.status is not None:
            update_data["status"] = task_update.status.value
        if task_update.grade is not None:
            update_data["grade"] = task_update.grade
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update task
        result = supabase.table('tasks').update(update_data).eq('id', task_id).eq('user_id', current_user["id"]).execute()
        
        if result.data:
            updated_task = result.data[0]
            logger.info(f"✅ Task updated successfully: {updated_task['subject']}")
            
            return TaskResponse(
                id=str(updated_task["id"]),
                title=updated_task["title"],
                subject=updated_task["subject"],
                description=updated_task["description"],
                due_date=datetime.fromisoformat(updated_task["due_date"]),
                assignment_type=AssignmentType(updated_task["assignment_type"]),
                priority=Priority(updated_task["priority"]),
                status=TaskStatus(updated_task["status"]),
                user_id=str(updated_task["user_id"]),
                estimated_hours=updated_task.get("estimated_hours"),
                grade=updated_task.get("grade"),
                created_at=datetime.fromisoformat(updated_task["created_at"]),
                updated_at=datetime.fromisoformat(updated_task["updated_at"])
            )
        else:
            logger.warning(f"⚠️ Task not found for update: {task_id}")
            raise HTTPException(status_code=404, detail="Task not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Task update error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@app.delete("/tasks/{task_id}")
def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a specific task - REAL SUPABASE"""
    logger.info(f"🗑️ Deleting task: {task_id}")
    if not supabase:
        logger.error("❌ Supabase not available - task deletion failed")
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        # Check if task exists and belongs to user
        task_result = supabase.table('tasks').select('*').eq('id', task_id).eq('user_id', current_user["id"]).execute()
        if not task_result.data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Delete task
        result = supabase.table('tasks').delete().eq('id', task_id).eq('user_id', current_user["id"]).execute()
        logger.info(f"✅ Task deleted successfully: {task_id}")
        return {"message": "Task deleted successfully"}
    except Exception as e:
        logger.error(f"❌ Task deletion error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

@app.post("/ai/generate-academic-assistance", response_model=AcademicAssistantResponse)
async def generate_academic_assistance(request: AcademicAssistantRequest, current_user: dict = Depends(get_current_user)):
    """Generate AI-powered academic assistance for a task"""
    
    logger.info(f"🎯 Academic Assistant request received for user: {current_user.get('id')}")
    logger.info(f"📋 Request data: {request}")
    
    # Check if user has AI features enabled
    plan_features = get_user_plan_features(current_user.get('id'))
    logger.info(f"📊 Plan features: ai_features={plan_features.ai_features}, plan_type={plan_features.plan_type}")
    
    if not plan_features.ai_features:
        logger.warning(f"❌ User {current_user.get('id')} does not have AI features enabled")
        raise HTTPException(
            status_code=403, 
            detail="AI features require Student Pro or higher plan. Upgrade to access AI-powered study assistance."
        )
    
    """Generate comprehensive academic assistance based on task type"""
    logger.info(f"🤖 Generating academic assistance for task: {request.task_id}")
    logger.info(f"📝 Request data: subject={request.subject}, assignment_type={request.assignment_type}, description={request.description[:100]}...")
    
    if not anthropic_api_key:
        logger.error("❌ Claude API key not available")
        raise HTTPException(status_code=503, detail="AI service not available")
    
    try:
        # Validate required fields
        if not request.task_id or not request.subject or not request.description or not request.assignment_type:
            logger.error(f"❌ Missing required fields: task_id={request.task_id}, subject={request.subject}, assignment_type={request.assignment_type}")
            raise HTTPException(status_code=400, detail="Missing required fields: task_id, subject, description, or assignment_type")
        
        # Create Claude client
        client = anthropic.Anthropic(api_key=anthropic_api_key)
        logger.info("✅ Claude client created successfully")
        
        # Build contextual prompt based on assignment type and subject
        assignment_type = request.assignment_type.lower()
        subject = request.subject.lower()
        
        # Create subject-specific prompts
        if "exam" in assignment_type or "test" in assignment_type or "quiz" in assignment_type:
            if "math" in subject or "calculus" in subject or "algebra" in subject or "trigonometry" in subject or "precalculus" in subject:
                prompt = f"""
You are an expert math tutor specializing in {request.subject}. Create comprehensive exam preparation assistance for this math exam:

SUBJECT: {request.subject}
ASSIGNMENT TYPE: {request.assignment_type}
DESCRIPTION: {request.description}
DIFFICULTY LEVEL: {request.difficulty_level}

Provide:

1. RECOMMENDED APPROACH: Math-specific study strategy
2. RESOURCES AND TOOLS: Math practice problems, calculators, formula sheets, etc.
3. STEP-BY-STEP GUIDANCE: Math study plan from concept review to practice problems
4. TIPS AND STRATEGIES: Math study techniques, problem-solving strategies, common mistakes to avoid
5. TIME MANAGEMENT: Study schedule for math concepts
6. SUCCESS METRICS: How to measure math understanding
7. RELATED SKILLS: Math skills this exam will help develop

Format as JSON with these exact keys:
{{
    "recommended_approach": "math-specific study strategy",
    "resources_and_tools": [
        {{"name": "math resource name", "description": "what it provides", "url": "optional url"}}
    ],
    "step_by_step_guidance": [
        {{"step": "step number", "title": "step title", "description": "detailed math instructions", "estimated_time": "time needed"}}
    ],
    "tips_and_strategies": ["math tip 1", "math tip 2", "math tip 3"],
    "time_management": {{"concept_review": "time", "practice_problems": "time", "final_prep": "time"}},
    "success_metrics": ["math metric 1", "math metric 2"],
    "related_skills": ["math skill 1", "math skill 2"]
}}
"""
            elif "science" in subject or "physics" in subject or "chemistry" in subject or "biology" in subject:
                prompt = f"""
You are an expert science tutor specializing in {request.subject}. Create comprehensive exam preparation assistance:

SUBJECT: {request.subject}
ASSIGNMENT TYPE: {request.assignment_type}
DESCRIPTION: {request.description}
DIFFICULTY LEVEL: {request.difficulty_level}

Provide:

1. RECOMMENDED APPROACH: Science-specific study strategy
2. RESOURCES AND TOOLS: Lab materials, scientific calculators, reference tables, etc.
3. STEP-BY-STEP GUIDANCE: Science study plan from concept review to lab practice
4. TIPS AND STRATEGIES: Scientific method, lab techniques, common misconceptions
5. TIME MANAGEMENT: Study schedule for science concepts
6. SUCCESS METRICS: How to measure scientific understanding
7. RELATED SKILLS: Scientific skills this exam will help develop

Format as JSON with these exact keys:
{{
    "recommended_approach": "science-specific study strategy",
    "resources_and_tools": [
        {{"name": "science resource name", "description": "what it provides", "url": "optional url"}}
    ],
    "step_by_step_guidance": [
        {{"step": "step number", "title": "step title", "description": "detailed science instructions", "estimated_time": "time needed"}}
    ],
    "tips_and_strategies": ["science tip 1", "science tip 2", "science tip 3"],
    "time_management": {{"concept_review": "time", "lab_practice": "time", "final_prep": "time"}},
    "success_metrics": ["science metric 1", "science metric 2"],
    "related_skills": ["science skill 1", "science skill 2"]
}}
"""
            else:
                prompt = f"""
You are an expert study coach. Create comprehensive exam preparation assistance:

SUBJECT: {request.subject}
ASSIGNMENT TYPE: {request.assignment_type}
DESCRIPTION: {request.description}
DIFFICULTY LEVEL: {request.difficulty_level}

Provide:

1. RECOMMENDED APPROACH: Study strategy for this exam type
2. RESOURCES AND TOOLS: Study materials, practice tests, flashcards, etc.
3. STEP-BY-STEP GUIDANCE: Study plan from initial review to final practice
4. TIPS AND STRATEGIES: Study techniques, memory methods, test-taking strategies
5. TIME MANAGEMENT: Study schedule breakdown
6. SUCCESS METRICS: How to measure study progress
7. RELATED SKILLS: Skills this exam will help develop

Format as JSON with these exact keys:
{{
    "recommended_approach": "study strategy",
    "resources_and_tools": [
        {{"name": "resource name", "description": "what it provides", "url": "optional url"}}
    ],
    "step_by_step_guidance": [
        {{"step": "step number", "title": "step title", "description": "detailed instructions", "estimated_time": "time needed"}}
    ],
    "tips_and_strategies": ["tip 1", "tip 2", "tip 3"],
    "time_management": {{"review": "time", "practice": "time", "final_prep": "time"}},
    "success_metrics": ["metric 1", "metric 2"],
    "related_skills": ["skill 1", "skill 2"]
}}
"""
        elif "essay" in assignment_type or "paper" in assignment_type or "writing" in assignment_type:
            prompt = f"""
You are an expert academic writing tutor. Create comprehensive assistance for this essay/paper assignment:

SUBJECT: {request.subject}
ASSIGNMENT TYPE: {request.assignment_type}
DESCRIPTION: {request.description}
DIFFICULTY LEVEL: {request.difficulty_level}

Provide:

1. RECOMMENDED APPROACH: How to tackle this writing assignment
2. RESOURCES AND TOOLS: Writing tools, research databases, citation guides, etc.
3. STEP-BY-STEP GUIDANCE: Detailed writing process from brainstorming to final draft
4. TIPS AND STRATEGIES: Writing techniques, organization methods, common pitfalls to avoid
5. TIME MANAGEMENT: How to allocate time across different writing phases
6. SUCCESS METRICS: How to know if the essay is meeting requirements
7. RELATED SKILLS: Skills this assignment will help develop

Format as JSON with these exact keys:
{{
    "recommended_approach": "strategic approach",
    "resources_and_tools": [
        {{"name": "tool name", "description": "what it does", "url": "optional url"}}
    ],
    "step_by_step_guidance": [
        {{"step": "step number", "title": "step title", "description": "detailed instructions", "estimated_time": "time needed"}}
    ],
    "tips_and_strategies": ["tip 1", "tip 2", "tip 3"],
    "time_management": {{"research": "time", "outline": "time", "drafting": "time", "revision": "time"}},
    "success_metrics": ["metric 1", "metric 2"],
    "related_skills": ["skill 1", "skill 2"]
}}
"""
        elif "presentation" in assignment_type or "speech" in assignment_type:
            prompt = f"""
You are an expert presentation coach. Create comprehensive assistance for this presentation assignment:

SUBJECT: {request.subject}
ASSIGNMENT TYPE: {request.assignment_type}
DESCRIPTION: {request.description}
DIFFICULTY LEVEL: {request.difficulty_level}

Provide:

1. RECOMMENDED APPROACH: How to structure and deliver this presentation
2. RESOURCES AND TOOLS: Presentation software, visual aids, practice tools, etc.
3. STEP-BY-STEP GUIDANCE: Presentation development process
4. TIPS AND STRATEGIES: Public speaking techniques, visual design, audience engagement
5. TIME MANAGEMENT: Timeline for preparation and practice
6. SUCCESS METRICS: How to evaluate presentation effectiveness
7. RELATED SKILLS: Communication and presentation skills

Format as JSON with these exact keys:
{{
    "recommended_approach": "presentation strategy",
    "resources_and_tools": [
        {{"name": "tool name", "description": "what it does", "url": "optional url"}}
    ],
    "step_by_step_guidance": [
        {{"step": "step number", "title": "step title", "description": "detailed instructions", "estimated_time": "time needed"}}
    ],
    "tips_and_strategies": ["tip 1", "tip 2", "tip 3"],
    "time_management": {{"research": "time", "design": "time", "practice": "time", "rehearsal": "time"}},
    "success_metrics": ["metric 1", "metric 2"],
    "related_skills": ["skill 1", "skill 2"]
}}
"""
        elif "project" in assignment_type:
            prompt = f"""
You are an expert project management coach. Create comprehensive project assistance:

SUBJECT: {request.subject}
ASSIGNMENT TYPE: {request.assignment_type}
DESCRIPTION: {request.description}
DIFFICULTY LEVEL: {request.difficulty_level}

Provide:

1. RECOMMENDED APPROACH: Project management methodology
2. RESOURCES AND TOOLS: Project tools, collaboration platforms, research methods
3. STEP-BY-STEP GUIDANCE: Project phases from planning to completion
4. TIPS AND STRATEGIES: Project management, teamwork, problem-solving
5. TIME MANAGEMENT: Project timeline and milestones
6. SUCCESS METRICS: How to measure project success
7. RELATED SKILLS: Skills this project will develop

Format as JSON with these exact keys:
{{
    "recommended_approach": "project strategy",
    "resources_and_tools": [
        {{"name": "tool name", "description": "what it does", "url": "optional url"}}
    ],
    "step_by_step_guidance": [
        {{"step": "step number", "title": "step title", "description": "detailed instructions", "estimated_time": "time needed"}}
    ],
    "tips_and_strategies": ["tip 1", "tip 2", "tip 3"],
    "time_management": {{"planning": "time", "execution": "time", "review": "time"}},
    "success_metrics": ["metric 1", "metric 2"],
    "related_skills": ["skill 1", "skill 2"]
}}
"""
        else:
            # Generic prompt for other assignment types
            prompt = f"""
You are an expert academic tutor. Create comprehensive assistance for this assignment:

SUBJECT: {request.subject}
ASSIGNMENT TYPE: {request.assignment_type}
DESCRIPTION: {request.description}
DIFFICULTY LEVEL: {request.difficulty_level}

Provide:

1. RECOMMENDED APPROACH: How to approach this assignment
2. RESOURCES AND TOOLS: Relevant tools and materials
3. STEP-BY-STEP GUIDANCE: Detailed process to complete the assignment
4. TIPS AND STRATEGIES: Helpful techniques and strategies
5. TIME MANAGEMENT: How to allocate time effectively
6. SUCCESS METRICS: How to measure progress and success
7. RELATED SKILLS: Skills this assignment will develop

Format as JSON with these exact keys:
{{
    "recommended_approach": "strategic approach",
    "resources_and_tools": [
        {{"name": "tool name", "description": "what it does", "url": "optional url"}}
    ],
    "step_by_step_guidance": [
        {{"step": "step number", "title": "step title", "description": "detailed instructions", "estimated_time": "time needed"}}
    ],
    "tips_and_strategies": ["tip 1", "tip 2", "tip 3"],
    "time_management": {{"planning": "time", "execution": "time", "review": "time"}},
    "success_metrics": ["metric 1", "metric 2"],
    "related_skills": ["skill 1", "skill 2"]
}}
"""
        
        # Call Claude API with better error handling
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                temperature=0.7,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_content = response.content[0].text
            
            # Try to parse JSON response
            try:
                import json
                parsed_response = json.loads(response_content)
                
                # Return the academic assistance response directly (no database saving)
                return AcademicAssistantResponse(
                    task_id=request.task_id,
                    recommended_approach=parsed_response.get("recommended_approach", "Approach not available"),
                    resources_and_tools=parsed_response.get("resources_and_tools", []),
                    step_by_step_guidance=parsed_response.get("step_by_step_guidance", []),
                    tips_and_strategies=parsed_response.get("tips_and_strategies", []),
                    time_management=parsed_response.get("time_management", {}),
                    success_metrics=parsed_response.get("success_metrics", []),
                    related_skills=parsed_response.get("related_skills", []),
                    created_at=datetime.now()
                )
            except json.JSONDecodeError:
                # If JSON parsing fails, return a structured response
                return AcademicAssistantResponse(
                    task_id=request.task_id,
                    recommended_approach="AI analysis generated successfully",
                    resources_and_tools=[],
                    step_by_step_guidance=[],
                    tips_and_strategies=[],
                    time_management={},
                    success_metrics=[],
                    related_skills=[],
                    created_at=datetime.now()
                )
                
        except Exception as api_error:
            logger.error(f"Claude API error: {api_error}")
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again later.")
            
    except Exception as e:
        logger.error(f"Academic assistance generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate academic assistance: {str(e)}")

@app.get("/user/plan-features")
async def get_user_plan_features_endpoint(current_user: dict = Depends(get_current_user)):
    """Get user's current plan features"""
    logger.info(f"📋 Getting plan features for user {current_user.get('id')}")
    
    try:
        plan_features = get_user_plan_features(current_user.get('id'))
        
        return {
            "plan_type": plan_features.plan_type.value,
            "features": {
                "max_tasks": plan_features.max_tasks,
                "max_categories": plan_features.max_categories,
                "ai_features": plan_features.ai_features,
                "advanced_analytics": plan_features.advanced_analytics,
                "export_options": plan_features.export_options,
                "collaboration": plan_features.collaboration,
                "custom_themes": plan_features.custom_themes,
                "priority_support": plan_features.priority_support,
                "study_session_tracking": plan_features.study_session_tracking,
                "cloud_backup": plan_features.cloud_backup,
                "team_study_groups": plan_features.team_study_groups,
                "lms_integration": plan_features.lms_integration,
                "custom_study_plans": plan_features.custom_study_plans,
                "progress_reports": plan_features.progress_reports,
                "white_label": plan_features.white_label
            }
        }
    except Exception as e:
        logger.error(f"❌ Error getting plan features: {e}")
        # Return default free plan features on error
        return {
            "plan_type": "student",
            "features": {
                "max_tasks": None,
                "max_categories": 5,
                "ai_features": False,
                "advanced_analytics": False,
                "export_options": ["pdf"],
                "collaboration": False,
                "custom_themes": False,
                "priority_support": False,
                "study_session_tracking": False,
                "cloud_backup": False,
                "team_study_groups": False,
                "lms_integration": False,
                "custom_study_plans": False,
                "progress_reports": False,
                "white_label": False
            }
        }

@app.post("/auth/refresh-token")
async def refresh_token(request: Request):
    """Refresh the user's access token using the current token"""
    logger.info("🔄 Refreshing token...")
    
    try:
        # Get the current token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="No valid token provided")
        
        token = auth_header.split(' ')[1]
        
        # Verify the current token
        try:
            payload = jwt.decode(token, jwt_secret_key, algorithms=["HS256"])
            user_id = payload.get("sub")
            
            if user_id is None:
                raise HTTPException(status_code=401, detail="Invalid token payload")
            
            # Create a new token with extended expiration
            new_token = create_access_token(
                data={"sub": user_id},
                expires_delta=timedelta(hours=24)
            )
            
            logger.info(f"✅ Token refreshed successfully for user {user_id}")
            return {
                "access_token": new_token,
                "token_type": "bearer",
                "expires_in": 24 * 60 * 60  # 24 hours in seconds
            }
            
        except jwt.ExpiredSignatureError:
            logger.warning("❌ Token has expired")
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            logger.warning("❌ Invalid token")
            raise HTTPException(status_code=401, detail="Invalid token")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error refreshing token: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to refresh token"
        )

@app.delete("/auth/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Permanently delete user account and all associated data"""
    logger.info(f"🗑️ Deleting account for user {current_user.get('id')}")
    
    try:
        user_id = current_user.get('id')
        
        if not user_id:
            logger.error("❌ No user ID found in current_user")
            raise HTTPException(status_code=400, detail="User ID not found")
        
        logger.info(f"🗑️ Starting deletion process for user {user_id}")
        
        # Delete user's tasks first (due to foreign key constraints)
        logger.info(f"🗑️ Deleting tasks for user {user_id}")
        try:
            tasks_result = supabase.table("tasks").delete().eq("user_id", user_id).execute()
            logger.info(f"✅ Tasks deleted: {tasks_result}")
        except Exception as e:
            logger.warning(f"⚠️ Could not delete tasks: {e}")
        
        # Delete user's task analytics
        logger.info(f"🗑️ Deleting task analytics for user {user_id}")
        try:
            analytics_result = supabase.table("task_analytics").delete().eq("user_id", user_id).execute()
            logger.info(f"✅ Analytics deleted: {analytics_result}")
        except Exception as e:
            logger.warning(f"⚠️ Could not delete analytics: {e}")
        
        # Delete user's subscriptions (if any)
        logger.info(f"🗑️ Deleting subscriptions for user {user_id}")
        try:
            subscriptions_result = supabase.table("user_subscriptions").delete().eq("user_id", user_id).execute()
            logger.info(f"✅ Subscriptions deleted: {subscriptions_result}")
        except Exception as e:
            logger.warning(f"⚠️ Could not delete subscriptions: {e}")
        
        # Finally, delete the user account
        logger.info(f"🗑️ Deleting user account {user_id}")
        result = supabase.table("users").delete().eq("id", user_id).execute()
        
        if not result.data:
            logger.error(f"❌ User {user_id} not found in database")
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"✅ Account deleted successfully for user {user_id}")
        return {
            "message": "Account deleted successfully",
            "user_id": user_id
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting account: {e}")
        logger.error(f"❌ Error type: {type(e)}")
        logger.error(f"❌ Error details: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete account: {str(e)}"
        )

@app.put("/auth/update-profile")
async def update_user_profile(
    profile_update: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile information including profile picture"""
    logger.info(f"📝 Updating profile for user {current_user.get('id')}")
    
    try:
        # Prepare update data
        update_data = {
            "full_name": profile_update.get("full_name"),
            "username": profile_update.get("username"), 
            "major": profile_update.get("major"),
            "year_level": profile_update.get("year_level"),
            "bio": profile_update.get("bio"),
            "profile_picture": profile_update.get("profile_picture"),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        logger.info(f"📝 Update data: {update_data}")
        
        # Update user in database
        result = supabase.table('users').update(update_data).eq('id', current_user["id"]).execute()
        
        logger.info(f"📝 Database update result: {result.data}")
        
        if result.data:
            updated_user = result.data[0]
            logger.info(f"✅ Profile updated successfully for user {current_user['id']}")
            logger.info(f"📊 Updated user data: {updated_user}")
            return {
                "id": updated_user["id"],
                "email": updated_user["email"],
                "username": updated_user["username"],
                "full_name": updated_user["full_name"],
                "student_id": updated_user["student_id"],
                "major": updated_user["major"],
                "year_level": updated_user["year_level"],
                "bio": updated_user.get("bio"),
                "profile_picture": updated_user.get("profile_picture"),
                "created_at": updated_user["created_at"],
                "updated_at": updated_user["updated_at"],
                "plan_type": updated_user.get("plan_type")
            }
        else:
            logger.error(f"❌ User not found for profile update: {current_user['id']}")
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        logger.error(f"❌ Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@app.get("/ai/academic-assistance/{task_id}")
async def get_academic_assistance(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get existing academic assistance for a task"""
    logger.info(f"📖 Getting academic assistance for task: {task_id}")
    
    # Check if user has AI features enabled
    plan_features = get_user_plan_features(current_user.get('id'))
    logger.info(f"📊 Plan features: ai_features={plan_features.ai_features}, plan_type={plan_features.plan_type}")
    
    if not plan_features.ai_features:
        logger.warning(f"❌ User {current_user.get('id')} does not have AI features enabled")
        raise HTTPException(
            status_code=403, 
            detail="AI features require Student Pro or higher plan. Upgrade to access AI-powered study assistance."
        )
    
    # Since we're not persisting data anymore, just return a message
    return {
        "message": "Academic assistance is generated on-demand. Use POST /ai/generate-academic-assistance to create one.",
        "task_id": task_id
    }

@app.put("/user/update-plan")
async def update_user_plan(
    plan_update: PlanUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user's plan type in the database"""
    logger.info(f"📋 Updating plan for user {current_user.get('id')} to {plan_update.plan_type}")
    logger.info(f"📋 Current user data: {current_user}")
    logger.info(f"📋 Plan update request: {plan_update}")
    
    try:
        if not supabase:
            logger.error("❌ Supabase not available")
            raise HTTPException(
                status_code=503,
                detail="Database not available. Please check your Supabase connection."
            )
        
        # First, let's check if the user exists and get current data
        logger.info(f"🔍 Checking current user data in database...")
        user_result = supabase.table('users').select('*').eq('id', current_user.get('id')).execute()
        logger.info(f"📋 Current user data from DB: {user_result.data}")
        
        if not user_result.data:
            logger.error(f"❌ User {current_user.get('id')} not found in database")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user's plan_type in the users table
        logger.info(f"🔄 Updating plan_type to {plan_update.plan_type.value}")
        update_result = supabase.table('users').update({
            'plan_type': plan_update.plan_type.value,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', current_user.get('id')).execute()
        
        logger.info(f"📋 Update result: {update_result}")
        
        if not update_result.data:
            logger.error("❌ Update returned no data")
            raise HTTPException(status_code=404, detail="User not found")
        
        updated_user = update_result.data[0]
        logger.info(f"✅ Plan updated successfully for user {current_user.get('id')}")
        logger.info(f"📋 Updated user data: {updated_user}")
        
        return {
            "message": f"Plan updated to {plan_update.plan_type.value}",
            "user_id": current_user.get('id'),
            "plan_type": updated_user.get("plan_type"),
            "updated_at": updated_user.get("updated_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating plan: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update plan: {str(e)}")

@app.get("/test/user/{email}")
async def test_user_exists(email: str):
    """Test endpoint to check if a user exists and see their data"""
    logger.info(f"🔍 Testing if user exists: {email}")
    
    try:
        if not supabase:
            return {"error": "Supabase not available"}
        
        # Find user by email
        user_result = supabase.table('users').select('*').eq('email', email).execute()
        
        if not user_result.data:
            return {"error": "User not found", "email": email}
        
        user = user_result.data[0]
        return {
            "found": True,
            "user_id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "password_hash_length": len(user.get("password_hash", "")),
            "password_hash_preview": user.get("password_hash", "")[:20] + "..." if user.get("password_hash") else "None"
        }
        
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}

@app.post("/notifications/milestone")
async def send_milestone_notification(notification: MilestoneNotification):
    """Send milestone achievement email notification"""
    logger.info(f"🎉 Milestone achieved: {notification.email} reached {notification.tier} tier")
    
    # In a real app, you'd integrate with an email service like SendGrid, Mailgun, etc.
    # For now, just log the notification
    years_active = notification.months_active / 12
    email_content = f"""
    🎉 Congratulations! You've reached {notification.tier} tier!
    
    You've been a member for {years_active:.1f} years and earned a {notification.discount_percentage}% discount!
    
    Your loyalty discount is now available for 1 month.
    Login to your account to claim your reward!
    
    Thank you for being a valued member of our community!
    """
    
    logger.info(f"📧 Email notification content:\n{email_content}")
    
    return {
        "message": "Milestone notification sent",
        "tier": notification.tier,
        "discount": notification.discount_percentage
    }

@app.post("/notifications/discount-activation")
async def send_discount_activation(discount: DiscountActivation):
    """Send discount activation email notification"""
    logger.info(f"🎁 Discount activated: {discount.email} - {discount.discount_percentage}% off")
    
    # In a real app, you'd integrate with an email service
    email_content = f"""
    🎁 Your {discount.tier} Member Discount is Now Active!
    
    You've earned a {discount.discount_percentage}% discount on your Pro Plan subscription.
    
    Valid until: {discount.valid_until}
    Applied to: Pro Plan subscription
    
    Thank you for your loyalty!
    """
    
    logger.info(f"📧 Discount activation email content:\n{email_content}")
    
    return {
        "message": "Discount activation notification sent",
        "tier": discount.tier,
        "discount": discount.discount_percentage,
        "valid_until": discount.valid_until
        }

# Development server
if __name__ == "__main__":
    logger.info("🚀 Starting Student Task Manager API...")
    if supabase is None:
        logger.warning("⚠️ WARNING: Supabase not connected - using fallback mode!")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")