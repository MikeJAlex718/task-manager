import bcrypt
import os
from dotenv import load_dotenv
from supabase.client import create_client

# Load environment variables
load_dotenv()

def create_debug2_user():
    """Create debug2 user with proper password hash"""
    
    # User credentials
    email = "debug2@example.com"
    password = "debug123"
    username = "debug2"
    full_name = "Debug User"
    student_id = "DEBUG002"
    major = "Computer Science"
    year_level = 1
    
    # Hash the password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    print(f"Creating debug2 user:")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Username: {username}")
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        print("Please set SUPABASE_URL and SUPABASE_KEY in your .env file")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        # Create the user
        result = supabase.table('users').insert({
            'email': email,
            'username': username,
            'passwordHash': password_hash,
            'fullName': full_name,
            'studentID': student_id,
            'major': major,
            'yearLevel': year_level
        }).execute()
        
        if result.data:
            print("✅ Debug2 user created successfully!")
            print(f"\nYou can now login with:")
            print(f"Email: {email}")
            print(f"Password: {password}")
        else:
            print("❌ Failed to create user")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nManual SQL to create debug2 user:")
        print(f"INSERT INTO users (email, username, password_hash, full_name, student_id, major, year_level) VALUES ('{email}', '{username}', '{password_hash}', '{full_name}', '{student_id}', '{major}', {year_level});")

if __name__ == "__main__":
    create_debug2_user() 