import bcrypt
import os
from dotenv import load_dotenv
from supabase.client import create_client

# Load environment variables
load_dotenv()

def reset_debug2_password():
    """Reset password for debug2 user"""
    
    # New password for debug2 user
    email = "debug2@example.com"  # Adjust if the email is different
    new_password = "debug123"  # New plain text password
    
    # Hash the password with bcrypt
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
    
    print(f"Resetting password for debug2 user:")
    print(f"Email: {email}")
    print(f"New Password: {new_password}")
    print(f"New Hashed Password: {password_hash}")
    
    # Try to connect to Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        print("Please set SUPABASE_URL and SUPABASE_KEY in your .env file")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        # First, let's see what users exist
        print("\n🔍 Checking existing users...")
        users = supabase.table('users').select('email, username, password_hash').execute()
        print("Existing users:")
        for user in users.data:
            print(f"  - {user.get('email', 'No email')} ({user.get('username', 'No username')})")
            print(f"    Password hash: {user.get('password_hash', 'No hash')[:20]}...")
        
        # Try to find debug2 user
        debug2_user = supabase.table('users').select('*').eq('email', email).execute()
        
        if debug2_user.data:
            print(f"\n✅ Found debug2 user, updating password...")
            print(f"Current password hash: {debug2_user.data[0].get('password_hash', 'No hash')}")
            # Update the password hash
            supabase.table('users').update({
                'passwordHash': password_hash
            }).eq('email', email).execute()
            print("✅ Password updated successfully")
            print(f"\nYou can now login with:")
            print(f"Email: {email}")
            print(f"Password: {new_password}")
        else:
            print(f"\n❌ User with email '{email}' not found")
            print("Available users:")
            for user in users.data:
                print(f"  - {user.get('email', 'No email')}")
            
            # Try to find by username
            debug2_by_username = supabase.table('users').select('*').eq('username', 'debug2').execute()
            if debug2_by_username.data:
                actual_email = debug2_by_username.data[0].get('email', 'Unknown')
                current_hash = debug2_by_username.data[0].get('password_hash', 'No hash')
                print(f"\nFound user with username 'debug2' and email '{actual_email}'")
                print(f"Current password hash: {current_hash}")
                print("Updating password...")
                supabase.table('users').update({
                    'passwordHash': password_hash
                }).eq('username', 'debug2').execute()
                print("✅ Password updated successfully")
                print(f"\nYou can now login with:")
                print(f"Email: {actual_email}")
                print(f"Password: {new_password}")
            else:
                print("\nNo debug2 user found by email or username")
                print("Manual SQL to create debug2 user:")
                print(f"INSERT INTO users (email, username, password_hash, full_name, student_id, major, year_level) VALUES ('{email}', 'debug2', '{password_hash}', 'Debug User', 'DEBUG002', 'Computer Science', 1);")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nManual SQL to update password:")
        print(f"UPDATE users SET password_hash = '{password_hash}' WHERE email = '{email}';")

if __name__ == "__main__":
    reset_debug2_password() 