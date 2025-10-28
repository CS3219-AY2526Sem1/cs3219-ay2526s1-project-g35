# Quick Start - Testing Admin Authentication

## 🚀 TL;DR - Run This Now

```bash
cd backend/question-service

# Quick test (recommended for first time)
./test-quick.sh

# Or comprehensive test (all 15 scenarios)
./test-admin-api.sh
```

## ⚠️ First Time Setup (One-time only)

Before running tests, make sure your user is an admin:

```bash
# 1. Find MongoDB container
docker ps | grep mongo

# 2. Connect and make yourself admin
docker exec -it <container-name> mongosh
use userdb
db.users.updateOne({email: "testneww@test.com"}, {$set: {isAdmin: true}})
exit

# 3. Run tests!
./test-quick.sh
```

## 📊 What Gets Tested

### Quick Test (5 tests - ~2 seconds)
- ✅ Login as admin
- ✅ Verify admin status
- ✅ Create question
- ✅ Read questions
- ✅ Delete question

### Comprehensive Test (15 tests - ~5 seconds)
Everything above PLUS:
- ❌ Try creating without auth (should fail)
- ✅ Register regular user
- ❌ Try creating as regular user (should fail)
- ❌ Try updating as regular user (should fail)
- ❌ Try deleting as regular user (should fail)
- ✅ Regular user can read (public access)

## 📝 Example Output

```bash
$ ./test-quick.sh

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

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| `isAdmin: false` error | Run the MongoDB commands above to make yourself admin |
| `Connection refused` | Run `docker-compose up -d` |
| `Permission denied` | Run `chmod +x test-*.sh` |
| `Route not found` | Check services are on correct ports (8000, 8001) |

## 📚 Full Documentation

See [TEST_GUIDE.md](./TEST_GUIDE.md) for:
- Manual testing with cURL commands
- Detailed test explanations
- Troubleshooting guide
- CI/CD integration

## 🔧 Configuration

Edit these variables in the scripts if needed:

```bash
USER_SERVICE_URL="http://localhost:8000"
QUESTION_SERVICE_URL="http://localhost:8001"
ADMIN_EMAIL="testneww@test.com"
ADMIN_PASSWORD="SecurePassword1!"
```

