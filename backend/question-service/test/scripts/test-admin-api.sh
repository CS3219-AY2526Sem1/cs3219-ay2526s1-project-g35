#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
USER_SERVICE_URL="http://localhost:8000"
QUESTION_SERVICE_URL="http://localhost:8001"
ADMIN_EMAIL="testneww@test.com"
ADMIN_PASSWORD="SecurePassword1!"
COOKIES_FILE="test-cookies.txt"
REGULAR_COOKIES_FILE="test-cookies-regular.txt"

# Test counters
PASSED=0
FAILED=0

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}Cleaning up test files...${NC}"
    rm -f $COOKIES_FILE $REGULAR_COOKIES_FILE
}

# Trap to cleanup on exit
trap cleanup EXIT

# Function to print test header
print_test() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}TEST $1: $2${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    # Small delay to avoid rate limiting
    sleep 0.5
}

# Function to check HTTP status code
check_status() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$actual" -eq "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name (HTTP $actual)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name (Expected HTTP $expected, got $actual)"
        ((FAILED++))
        return 1
    fi
}

# Function to check if response contains a string
check_contains() {
    local response=$1
    local search_string=$2
    local test_name=$3
    
    if echo "$response" | grep -q "$search_string"; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name (Contains: $search_string)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name (Missing: $search_string)"
        echo -e "${YELLOW}Response: $response${NC}"
        ((FAILED++))
        return 1
    fi
}

# Start tests
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Question Service Admin Authentication Tests         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

# Test 1: Admin Login
print_test "1" "Admin Login"
response=$(curl -s -w "\n%{http_code}" -X POST $USER_SERVICE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
    -c $COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
check_status 200 "$status" "Admin login successful"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 2: Verify Admin Status
print_test "2" "Verify Admin Status"
response=$(curl -s -w "\n%{http_code}" -X GET $USER_SERVICE_URL/auth/verify-token \
    -b $COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
check_status 200 "$status" "Token verification"
check_contains "$body" '"isAdmin":true' "User is admin"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 3: Create Question (Admin - Should Success)
print_test "3" "Create Question (Admin)"
response=$(curl -s -w "\n%{http_code}" -X POST $QUESTION_SERVICE_URL/api/questions \
    -H "Content-Type: application/json" \
    -b $COOKIES_FILE \
    -d '{
        "title": "Test Question - Reverse String",
        "description": "Write a function that reverses a string. The input string is given as an array of characters.",
        "difficulty": "Easy",
        "topics": ["String", "Two Pointers"],
        "tags": ["test", "leetcode"],
        "testCases": [
            {
                "input": "[\"h\",\"e\",\"l\",\"l\",\"o\"]",
                "expectedOutput": "[\"o\",\"l\",\"l\",\"e\",\"h\"]",
                "explanation": "Reverse the string hello",
                "type": "Sample"
            }
        ],
        "constraints": ["1 <= s.length <= 10^5"]
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
check_status 201 "$status" "Admin can create question"
check_contains "$body" '"success":true' "Response indicates success"

# Extract question ID for later tests
QUESTION_ID=$(echo "$body" | jq -r '.data._id' 2>/dev/null)
echo -e "${YELLOW}Created Question ID: $QUESTION_ID${NC}"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 4: Get All Questions (Public - No Auth)
print_test "4" "Get All Questions (Public)"
response=$(curl -s -w "\n%{http_code}" -X GET $QUESTION_SERVICE_URL/api/questions)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
check_status 200 "$status" "Public can get all questions"
check_contains "$body" '"success":true' "Response indicates success"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 5: Get Question by ID (Public)
print_test "5" "Get Question by ID (Public)"
if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET $QUESTION_SERVICE_URL/api/questions/$QUESTION_ID)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    check_status 200 "$status" "Public can get question by ID"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ SKIP - No question ID available${NC}"
fi

# Test 6: Update Question (Admin - Should Success)
print_test "6" "Update Question (Admin)"
if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT $QUESTION_SERVICE_URL/api/questions/$QUESTION_ID \
        -H "Content-Type: application/json" \
        -b $COOKIES_FILE \
        -d '{
            "title": "Test Question - Reverse String (UPDATED)",
            "difficulty": "Medium"
        }')
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    check_status 200 "$status" "Admin can update question"
    check_contains "$body" '"success":true' "Response indicates success"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ SKIP - No question ID available${NC}"
fi

# Test 7: Create Question WITHOUT Auth (Should Fail)
print_test "7" "Create Question Without Authentication"
response=$(curl -s -w "\n%{http_code}" -X POST $QUESTION_SERVICE_URL/api/questions \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Should Fail",
        "description": "No authentication",
        "difficulty": "Easy",
        "topics": ["Test"],
        "testCases": [{"input": "test", "expectedOutput": "test", "type": "Sample"}]
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
check_status 401 "$status" "Unauthenticated user cannot create"
check_contains "$body" '"error":"AUTHENTICATION_REQUIRED"' "Proper error message"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 8: Register Regular User
print_test "8" "Register Regular User"

# First, delete the user if they exist (cleanup from previous runs)
curl -s -X POST $USER_SERVICE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "regular@test.com", "password": "SecurePassword1!"}' \
    -c $REGULAR_COOKIES_FILE > /dev/null 2>&1

# Now register the user
response=$(curl -s -w "\n%{http_code}" -X POST $USER_SERVICE_URL/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testregular_'$(date +%s)'",
        "email": "regular_'$(date +%s)'@test.com",
        "password": "SecurePassword1!"
    }' \
    -c $REGULAR_COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# If user exists, just login instead
if [ "$status" -eq 409 ] || echo "$body" | grep -q "exists"; then
    echo -e "${YELLOW}User exists, logging in instead${NC}"
    response=$(curl -s -w "\n%{http_code}" -X POST $USER_SERVICE_URL/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "regular@test.com",
            "password": "SecurePassword1!"
        }' \
        -c $REGULAR_COOKIES_FILE)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    check_status 200 "$status" "Regular user login"
else
    check_status 201 "$status" "Regular user registration"
fi

echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Verify cookies were saved
if [ -f "$REGULAR_COOKIES_FILE" ] && [ -s "$REGULAR_COOKIES_FILE" ]; then
    echo -e "${GREEN}✓ Cookies saved successfully${NC}"
else
    echo -e "${RED}✗ WARNING: Cookies file empty or missing${NC}"
fi

# Test 9: Verify Regular User is NOT Admin
print_test "9" "Verify Regular User Status"
response=$(curl -s -w "\n%{http_code}" -X GET $USER_SERVICE_URL/auth/verify-token \
    -b $REGULAR_COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
check_status 200 "$status" "Token verification"
check_contains "$body" '"isAdmin":false' "User is not admin"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 10: Try to Create Question as Regular User (Should Fail)
print_test "10" "Create Question as Regular User"

# Debug: Check if cookies exist
if [ -f "$REGULAR_COOKIES_FILE" ]; then
    echo -e "${YELLOW}Cookie file contents:${NC}"
    cat "$REGULAR_COOKIES_FILE" | grep -v "^#" | head -3
else
    echo -e "${RED}ERROR: Cookie file not found!${NC}"
fi

response=$(curl -s -w "\n%{http_code}" -X POST $QUESTION_SERVICE_URL/api/questions \
    -H "Content-Type: application/json" \
    -b $REGULAR_COOKIES_FILE \
    -v \
    -d '{
        "title": "Should Fail - Regular User",
        "description": "Regular user trying to create",
        "difficulty": "Easy",
        "topics": ["Test"],
        "testCases": [{"input": "test", "expectedOutput": "test", "type": "Sample"}]
    }' 2>&1)
status=$(echo "$response" | grep "< HTTP" | tail -n1 | awk '{print $3}')
body=$(echo "$response" | sed -n '/^{/,/^}/p' | tail -1)

# Accept either 401 (no valid token) or 403 (not admin) as both indicate proper blocking
if [ "$status" -eq 403 ] || [ "$status" -eq 401 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Regular user blocked from creating (HTTP $status)"
    ((PASSED++))
    if [ "$status" -eq 403 ]; then
        check_contains "$body" '"error":"INSUFFICIENT_PRIVILEGES"' "Proper error message"
    else
        check_contains "$body" '"error":"AUTHENTICATION_REQUIRED"' "Authentication required"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Expected 403 or 401, got $status"
    ((FAILED++))
fi
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 11: Regular User Can Read Questions (Public)
print_test "11" "Regular User Can Read Questions"
response=$(curl -s -w "\n%{http_code}" -X GET $QUESTION_SERVICE_URL/api/questions \
    -b $REGULAR_COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
check_status 200 "$status" "Regular user can read questions"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 12: Try to Update as Regular User (Should Fail)
print_test "12" "Update Question as Regular User"
if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT $QUESTION_SERVICE_URL/api/questions/$QUESTION_ID \
        -H "Content-Type: application/json" \
        -b $REGULAR_COOKIES_FILE \
        -d '{"title": "Should Fail"}')
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Accept either 401 (no valid token) or 403 (not admin) as both indicate proper blocking
    if [ "$status" -eq 403 ] || [ "$status" -eq 401 ]; then
        echo -e "${GREEN}✓ PASS${NC} - Regular user blocked from updating (HTTP $status)"
        ((PASSED++))
        if [ "$status" -eq 403 ]; then
            check_contains "$body" '"error":"INSUFFICIENT_PRIVILEGES"' "Proper error message"
        else
            check_contains "$body" '"error":"AUTHENTICATION_REQUIRED"' "Authentication required"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} - Expected 403 or 401, got $status"
        ((FAILED++))
    fi
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ SKIP - No question ID available${NC}"
fi

# Test 13: Try to Delete as Regular User (Should Fail)
print_test "13" "Delete Question as Regular User"
if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE $QUESTION_SERVICE_URL/api/questions/$QUESTION_ID \
        -b $REGULAR_COOKIES_FILE)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Accept either 401 (no valid token) or 403 (not admin) as both indicate proper blocking
    if [ "$status" -eq 403 ] || [ "$status" -eq 401 ]; then
        echo -e "${GREEN}✓ PASS${NC} - Regular user blocked from deleting (HTTP $status)"
        ((PASSED++))
        if [ "$status" -eq 403 ]; then
            check_contains "$body" '"error":"INSUFFICIENT_PRIVILEGES"' "Proper error message"
        else
            check_contains "$body" '"error":"AUTHENTICATION_REQUIRED"' "Authentication required"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} - Expected 403 or 401, got $status"
        ((FAILED++))
    fi
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ SKIP - No question ID available${NC}"
fi

# Test 14: Get Random Question (Public)
print_test "14" "Get Random Question (Public)"
response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/random?topic=String&difficulty=Easy")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
# Can be 200 (found) or 404 (not found) - both are valid
if [ "$status" -eq 200 ] || [ "$status" -eq 404 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Public can access random question endpoint (HTTP $status)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Unexpected status code (Expected 200 or 404, got $status)"
    ((FAILED++))
fi
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Test 15: Delete Question as Admin (Cleanup)
print_test "15" "Delete Question as Admin (Cleanup)"
if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE $QUESTION_SERVICE_URL/api/questions/$QUESTION_ID \
        -b $COOKIES_FILE)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    check_status 200 "$status" "Admin can delete question"
    check_contains "$body" '"success":true' "Response indicates success"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ SKIP - No question ID available${NC}"
fi

# Print summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                    TEST SUMMARY                        ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "${BLUE}Total Tests: $TOTAL${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ALL TESTS PASSED! 🎉                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "\n${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              SOME TESTS FAILED ❌                      ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

