import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print(f"Supabase URL: {supabase_url}")
print(f"Supabase Key (first 10 chars): {supabase_key[:10]}...")

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

# Test 1: Try to read from users table
print("\n=== Testing READ access ===")
try:
    result = supabase.table('users').select('*').limit(1).execute()
    print(f"✅ READ successful: {len(result.data)} rows")
except Exception as e:
    print(f"❌ READ failed: {e}")

# Test 2: Try to insert a test user
print("\n=== Testing INSERT access ===")
test_user = {
    "email": "debug_test@example.com",
    "username": "debug_test",
    "password_hash": "test_hash",
    "full_name": "Debug Test",
    "student_id": "DEBUG001",
    "major": "Computer Science",
    "year_level": 1
}

try:
    result = supabase.table('users').insert(test_user).execute()
    print(f"✅ INSERT successful: {result.data}")
except Exception as e:
    print(f"❌ INSERT failed: {e}")

# Test 3: Check if we can delete the test user
print("\n=== Testing DELETE access ===")
try:
    result = supabase.table('users').delete().eq('email', 'debug_test@example.com').execute()
    print(f"✅ DELETE successful: {result.data}")
except Exception as e:
    print(f"❌ DELETE failed: {e}")

print("\n=== Summary ===")
print("If INSERT failed with RLS error, your policy needs fixing.")
print("If INSERT succeeded, the backend should work.") 