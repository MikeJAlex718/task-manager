import bcrypt
import os
from dotenv import load_dotenv
from supabase.client import create_client

# Load environment variables
load_dotenv()

def create_test_user():
    """Create a test user with proper bcrypt password hash"""
    
    # Test credentials
    email = "test@example.com"
    password = "password123"  # Plain text password
    username = "testuser"
    full_name = "Test User"
    student_id = "TEST001"
    major = "Computer Science"
    year_level = 2
    
    # Hash the password with bcrypt
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    print(f"Creating test user:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Username: {username}")
    print(f"Hashed password: {password_hash}")
    
    # Try to connect to Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        print("Please set SUPABASE_URL and SUPABASE_KEY in your .env file")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        # Check if user already exists
        existing = supabase.table('users').select('*').eq('email', email).execute()
        
        if existing.data:
            print("⚠️ User already exists, updating password...")
            # Update the password hash
            supabase.table('users').update({
                'passwordHash': password_hash
            }).eq('email', email).execute()
            print("✅ Password updated successfully")
        else:
            print("📝 Creating new test user...")
            # Create new user
            supabase.table('users').insert({
                'email': email,
                'username': username,
                'passwordHash': password_hash,
                'fullName': full_name,
                'studentID': student_id,
                'major': major,
                'yearLevel': year_level
            }).execute()
            print("✅ Test user created successfully")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nManual SQL to run in Supabase SQL Editor:")
        print(f"UPDATE users SET password_hash = '{password_hash}' WHERE email = '{email}';")
        print("OR")
        print(f"INSERT INTO users (email, username, password_hash, full_name, student_id, major, year_level) VALUES ('{email}', '{username}', '{password_hash}', '{full_name}', '{student_id}', '{major}', {year_level});")

if __name__ == "__main__":
    create_test_user() 