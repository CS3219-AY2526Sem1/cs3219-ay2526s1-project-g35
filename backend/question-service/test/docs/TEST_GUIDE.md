# Question Service Admin Authentication Testing Guide

This guide explains how to test the admin authentication functionality of the Question Service.

## Prerequisites

Before running the tests, ensure:

1. **Docker services are running:**
   ```bash
   docker-compose up -d
   ```

2. **Your user has admin privileges:**
   
   First, check your admin status:
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "testneww@test.com", "password": "SecurePassword1!"}' \
     -c cookies.txt
   
   curl -X GET http://localhost:8000/auth/verify-token -b cookies.txt
   ```
   
   Look for `"isAdmin": true` in the response. If it's `false`, make yourself admin:
   
   ```bash
   # Find your MongoDB container
   docker ps | grep mongo
   
   # Connect to MongoDB (replace <container-name> with actual name)
   docker exec -it <container-name> mongosh
   
   # In MongoDB shell:
   use userdb
   db.users.updateOne(
     { email: "testneww@test.com" },
     { $set: { isAdmin: true } }
   )
   exit
   ```

3. **Required tools installed:**
   - `curl` (for making HTTP requests)
   - `jq` (for JSON formatting) - Optional but recommended
     ```bash
     # macOS
     brew install jq
     
     # Linux
     sudo apt-get install jq
     ```

## Test Scripts

### 1. Quick Test (`test-quick.sh`)

**Purpose:** Fast validation of core admin functionality (5 tests)

**What it tests:**
- ✅ Admin login
- ✅ Admin status verification
- ✅ Create question (admin only)
- ✅ Read questions (public)
- ✅ Delete question (cleanup)

**Run it:**
```bash
cd backend/question-service
./test-quick.sh
```

**Expected output:**
```
Quick Admin Auth Test

1. Logging in as admin...
✓ Login successful

2. Verifying admin status...
✓ User is admin

3. Testing question creation (admin only)...
✓ Question created successfully
Question ID: 507f1f77bcf86cd799439011

4. Testing public read access...
✓ Questions retrieved successfully
Total questions: 5

5. Cleaning up test question...
✓ Test question deleted

╔════════════════════════════════════╗
║   QUICK TEST COMPLETED! ✓          ║
╚════════════════════════════════════╝
```

### 2. Comprehensive Test (`test-admin-api.sh`)

**Purpose:** Full test suite covering all admin authentication scenarios (15 tests)

**What it tests:**
1. ✅ Admin login
2. ✅ Admin status verification
3. ✅ Create question (admin)
4. ✅ Get all questions (public)
5. ✅ Get question by ID (public)
6. ✅ Update question (admin)
7. ❌ Create without authentication (should fail with 401)
8. ✅ Register regular user
9. ✅ Verify regular user status (not admin)
10. ❌ Create as regular user (should fail with 403)
11. ✅ Read as regular user (public access)
12. ❌ Update as regular user (should fail with 403)
13. ❌ Delete as regular user (should fail with 403)
14. ✅ Get random question (public)
15. ✅ Delete question as admin (cleanup)

**Run it:**
```bash
cd backend/question-service
./test-admin-api.sh
```

**Expected output:**
```
╔════════════════════════════════════════════════════════╗
║   Question Service Admin Authentication Tests         ║
╚════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Admin Login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ PASS - Admin login successful (HTTP 200)

[... more tests ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Passed: 28
✗ Failed: 0
Total Tests: 28

╔════════════════════════════════════════════════════════╗
║              ALL TESTS PASSED! 🎉                      ║
╚════════════════════════════════════════════════════════╝
```

## Manual Testing with cURL

If you prefer manual testing or need to debug specific endpoints:

### Setup: Login and Save Cookies

```bash
# Admin login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testneww@test.com",
    "password": "SecurePassword1!"
  }' \
  -c cookies.txt -v
```

### Test Admin Operations

#### Create Question (Admin Only)
```bash
curl -X POST http://localhost:8001/api/questions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Two Sum",
    "description": "Given an array of integers, return indices of two numbers that add up to target",
    "difficulty": "Easy",
    "topics": ["Array", "Hash Table"],
    "testCases": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "expectedOutput": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9",
        "type": "Sample"
      }
    ],
    "constraints": ["2 <= nums.length <= 10^4"]
  }' | jq '.'
```

#### Update Question (Admin Only)
```bash
# Replace <question-id> with actual ID
curl -X PUT http://localhost:8001/api/questions/<question-id> \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Two Sum (Updated)",
    "difficulty": "Medium"
  }' | jq '.'
```

#### Delete Question (Admin Only)
```bash
curl -X DELETE http://localhost:8001/api/questions/<question-id> \
  -b cookies.txt | jq '.'
```

### Test Public Operations

#### Get All Questions (No Auth Required)
```bash
curl http://localhost:8001/api/questions | jq '.'
```

#### Get Random Question (No Auth Required)
```bash
curl "http://localhost:8001/api/questions/random?topic=Array&difficulty=Easy" | jq '.'
```

### Test Authentication Failures

#### Try Create Without Auth (Should get 401)
```bash
curl -X POST http://localhost:8001/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Should Fail",
    "description": "No auth",
    "difficulty": "Easy",
    "topics": ["Test"],
    "testCases": [{"input": "test", "expectedOutput": "test", "type": "Sample"}]
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "AUTHENTICATION_REQUIRED",
  "message": "Access token is required. Please log in."
}
```

## Port Configuration

- **User Service**: `http://localhost:8000` (Authentication)
- **Question Service**: `http://localhost:8001` (Questions)
- **Frontend**: `http://localhost:3000`
- **Collaboration Service**: `http://localhost:8002`
- **Matching Service**: `http://localhost:8003`

## Troubleshooting

### Problem: "isAdmin": false

**Solution:** Your user needs to be promoted to admin in the database.

```bash
docker exec -it <mongo-container> mongosh
use userdb
db.users.updateOne({email: "testneww@test.com"}, {$set: {isAdmin: true}})
```

### Problem: Route not found (404)

**Solution:** Check you're using the correct port:
- User Service: port 8000
- Question Service: port 8001

### Problem: Connection refused

**Solution:** Ensure Docker services are running:
```bash
docker-compose up -d
docker-compose ps
```

### Problem: Script permission denied

**Solution:** Make scripts executable:
```bash
chmod +x test-admin-api.sh test-quick.sh
```

## Configuration

To change test credentials, edit the scripts:

```bash
# In test-admin-api.sh or test-quick.sh
ADMIN_EMAIL="your-email@test.com"
ADMIN_PASSWORD="YourPassword123!"
```

## CI/CD Integration

To use in CI/CD pipelines:

```bash
# Run quick test
./test-quick.sh || exit 1

# Or run comprehensive test
./test-admin-api.sh || exit 1
```

The scripts exit with code 0 on success, 1 on failure.

## Need Help?

- Check Docker logs: `docker-compose logs question-service`
- Check test cookies: `cat test-cookies.txt`
- Verify admin status: `curl -X GET http://localhost:8000/auth/verify-token -b cookies.txt`

