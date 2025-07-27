import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the key
key = os.getenv("SUPABASE_KEY")
print(f"Key starts with: {key[:50]}...")

# Check if it's anon or service role
if "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" in key:
    print("✅ Key format looks correct")
else:
    print("❌ Key format looks wrong")

# Test if it's anon key (should be shorter)
if len(key) < 400:
    print("🔑 This looks like an anon key")
else:
    print("🔑 This looks like a service role key")

print(f"Key length: {len(key)} characters") 