import os
from dotenv import load_dotenv
from supabase.client import create_client

# Load environment variables
load_dotenv()

def check_users():
    """Check what users exist in the database"""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        # Get all users
        result = supabase.table('users').select('*').execute()
        
        print("🔍 Users in database:")
        print("=" * 50)
        
        if not result.data:
            print("❌ No users found in database")
            return
        
        for i, user in enumerate(result.data, 1):
            print(f"\nUser {i}:")
            print(f"  ID: {user.get('id')}")
            print(f"  Email: {user.get('email')}")
            print(f"  Username: {user.get('username')}")
            print(f"  Full Name: {user.get('fullName')}")
            print(f"  Student ID: {user.get('studentID')}")
            print(f"  Major: {user.get('major')}")
            print(f"  Year Level: {user.get('yearLevel')}")
            print(f"  Password Hash: {user.get('passwordHash', 'No hash')}")
            print(f"  Created At: {user.get('createdAt')}")
        
        print("\n" + "=" * 50)
        print("💡 To test login, use one of the emails above with password 'password123'")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_users() 