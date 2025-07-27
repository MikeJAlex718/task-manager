#!/usr/bin/env python3
"""
Script to fix plan_type column issue in Supabase database
Run this to add the missing plan_type column and test plan updates
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def fix_plan_type_column():
    """Add plan_type column to users table if it doesn't exist"""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        print("Please check your .env file has SUPABASE_URL and SUPABASE_KEY")
        return False
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        print("🔍 Checking if plan_type column exists...")
        
        # First, let's check the current table structure
        result = supabase.table('users').select('*').limit(1).execute()
        
        if not result.data:
            print("❌ No users found in database")
            return False
        
        user = result.data[0]
        print(f"📋 Current user columns: {list(user.keys())}")
        
        if 'plan_type' in user:
            print("✅ plan_type column already exists!")
            return True
        else:
            print("❌ plan_type column missing!")
            print("\n📝 Please run this SQL in your Supabase SQL Editor:")
            print("=" * 60)
            print("""
-- Add plan_type column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'student' CHECK (plan_type IN ('student', 'student_pro', 'academic_plus'));

-- Update existing users to have the default plan_type
UPDATE users 
SET plan_type = 'student' 
WHERE plan_type IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
            """)
            print("=" * 60)
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_plan_update():
    """Test the plan update functionality"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase environment variables")
        return False
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        print("\n🧪 Testing plan update functionality...")
        
        # Get a test user
        result = supabase.table('users').select('*').limit(1).execute()
        
        if not result.data:
            print("❌ No users found to test with")
            return False
        
        test_user = result.data[0]
        user_id = test_user['id']
        current_plan = test_user.get('plan_type', 'student')
        
        print(f"📋 Testing with user ID: {user_id}")
        print(f"📋 Current plan: {current_plan}")
        
        # Test updating to student_pro
        new_plan = 'student_pro'
        print(f"🔄 Updating plan to: {new_plan}")
        
        update_result = supabase.table('users').update({
            'plan_type': new_plan,
            'updated_at': '2024-01-01T00:00:00Z'
        }).eq('id', user_id).execute()
        
        if update_result.data:
            updated_user = update_result.data[0]
            print(f"✅ Plan updated successfully!")
            print(f"📋 New plan: {updated_user.get('plan_type')}")
            
            # Revert back to original plan
            print(f"🔄 Reverting back to: {current_plan}")
            supabase.table('users').update({
                'plan_type': current_plan,
                'updated_at': '2024-01-01T00:00:00Z'
            }).eq('id', user_id).execute()
            
            print("✅ Test completed successfully!")
            return True
        else:
            print("❌ Plan update failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing plan update: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Fixing plan_type column issue...")
    print("=" * 50)
    
    # Step 1: Check if plan_type column exists
    if fix_plan_type_column():
        # Step 2: Test plan update functionality
        test_plan_update()
    else:
        print("\n📝 Please run the SQL script in your Supabase SQL Editor first!")
        print("Then run this script again to test the functionality.") 