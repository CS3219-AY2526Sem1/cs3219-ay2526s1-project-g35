#!/bin/bash

# Test JWT Authentication for Question Service
# This script verifies that all endpoints require JWT authentication

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
QUESTION_SERVICE_URL=${QUESTION_SERVICE_URL:-"http://localhost:8001"}
USER_SERVICE_URL=${USER_SERVICE_URL:-"http://localhost:8000"}

# Test users
REGULAR_EMAIL="testuser@test.com"
REGULAR_USERNAME="testuser"
REGULAR_PASSWORD="SecurePassword1!"

ADMIN_EMAIL="testneww@test.com"
ADMIN_PASSWORD="SecurePassword1!"

COOKIES_FILE=$(mktemp)
REGULAR_COOKIES_FILE=$(mktemp)
trap "rm -f $COOKIES_FILE $REGULAR_COOKIES_FILE" EXIT

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Question Service JWT Authentication Test            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Counter for tests
PASSED=0
FAILED=0
TOTAL=0

# Helper function to print test name
print_test() {
    echo -e "\n${BLUE}[Test $1]${NC} $2"
    echo "---"
    ((TOTAL++))
}

# Helper function to check status code
check_status() {
    expected=$1
    actual=$2
    test_name=$3
    
    if [ "$expected" -eq "$actual" ]; then
        echo -e "${GREEN}✓ PASS${NC} - HTTP $actual"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - Expected $expected, got $actual: $test_name"
        ((FAILED++))
        return 1
    fi
}

sleep_short() {
    sleep 0.5
}

echo -e "${YELLOW}Part 1: Testing Unauthenticated Access (Should Fail)${NC}\n"

# Test 1: Try to access questions without authentication
print_test "1" "GET /api/questions without JWT (Should 401)"

response=$(curl -s -w "\n%{http_code}" -X GET $QUESTION_SERVICE_URL/api/questions)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 401 "$status" "Unauthenticated access blocked"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 2: Try to get random question without authentication
print_test "2" "GET /api/questions/random without JWT (Should 401)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/random?topic=Arrays&difficulty=Easy")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 401 "$status" "Random question access blocked"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

echo -e "\n${YELLOW}Part 2: Testing Regular User Access${NC}\n"

# Test 3: Register regular user (if not exists)
print_test "3" "Register Regular User"

UNIQUE_SUFFIX=$(date +%s)
REGULAR_USERNAME="testuser_${UNIQUE_SUFFIX}"
REGULAR_EMAIL="testuser_${UNIQUE_SUFFIX}@test.com"

response=$(curl -s -w "\n%{http_code}" -X POST $USER_SERVICE_URL/auth/register \
    -H "Content-Type: application/json" \
    -c $REGULAR_COOKIES_FILE \
    -d '{
        "username": "'"$REGULAR_USERNAME"'",
        "email": "'"$REGULAR_EMAIL"'",
        "password": "'"$REGULAR_PASSWORD"'"
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$status" -eq 201 ] || [ "$status" -eq 200 ]; then
    echo -e "${GREEN}✓ User registered/logged in${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Registration failed${NC}"
    ((FAILED++))
fi
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 4: Access questions as regular user (Should Work)
print_test "4" "GET /api/questions as Regular User (Should Work)"

response=$(curl -s -w "\n%{http_code}" -X GET $QUESTION_SERVICE_URL/api/questions \
    -b $REGULAR_COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Regular user can access questions"
echo "$body" | jq '{success, count}' 2>/dev/null || echo "$body"

sleep_short

# Test 5: Get random question as regular user (Should Work)
print_test "5" "GET /api/questions/random as Regular User (Should Work)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/random?topic=Arrays&difficulty=Easy" \
    -b $REGULAR_COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Regular user can get random question"
QUESTION_ID=$(echo "$body" | jq -r '.questionId' 2>/dev/null)
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 6: Get specific question as regular user (Should Work)
print_test "6" "GET /api/questions/:id as Regular User (Should Work)"

if [ ! -z "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/$QUESTION_ID" \
        -b $REGULAR_COOKIES_FILE)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    check_status 200 "$status" "Regular user can get question by ID"
    echo "$body" | jq '{success, cached, title: .data.title}' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ Skipping (no question ID available)${NC}"
fi

sleep_short

# Test 7: Try to create question as regular user (Should Fail)
print_test "7" "POST /api/questions as Regular User (Should 403)"

response=$(curl -s -w "\n%{http_code}" -X POST $QUESTION_SERVICE_URL/api/questions \
    -H "Content-Type: application/json" \
    -b $REGULAR_COOKIES_FILE \
    -d '{
        "title": "Should Fail - Regular User",
        "description": "Regular user trying to create",
        "difficulty": "Easy",
        "topics": ["Test"],
        "testCases": [{"input": "test", "expectedOutput": "test", "type": "Sample"}]
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 403 "$status" "Regular user blocked from creating"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

echo -e "\n${YELLOW}Part 3: Testing Admin User Access${NC}\n"

# Test 8: Login as admin
print_test "8" "Login as Admin"

response=$(curl -s -w "\n%{http_code}" -X POST $USER_SERVICE_URL/auth/login \
    -H "Content-Type: application/json" \
    -c $COOKIES_FILE \
    -d '{
        "email": "'"$ADMIN_EMAIL"'",
        "password": "'"$ADMIN_PASSWORD"'"
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Admin login"
echo "$body" | jq '{message, user: .data.user | {username, isAdmin}}' 2>/dev/null || echo "$body"

sleep_short

# Test 9: Access questions as admin (Should Work)
print_test "9" "GET /api/questions as Admin (Should Work)"

response=$(curl -s -w "\n%{http_code}" -X GET $QUESTION_SERVICE_URL/api/questions \
    -b $COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Admin can access questions"
echo "$body" | jq '{success, count}' 2>/dev/null || echo "$body"

sleep_short

# Test 10: Create question as admin (Should Work)
print_test "10" "POST /api/questions as Admin (Should Work)"

response=$(curl -s -w "\n%{http_code}" -X POST $QUESTION_SERVICE_URL/api/questions \
    -H "Content-Type: application/json" \
    -b $COOKIES_FILE \
    -d '{
        "title": "JWT Auth Test Question",
        "description": "Testing JWT authentication for question service",
        "difficulty": "Easy",
        "topics": ["Arrays", "Testing"],
        "tags": ["jwt-test"],
        "testCases": [
            {
                "input": "test_input",
                "expectedOutput": "test_output",
                "type": "Sample"
            }
        ],
        "constraints": ["Test constraint"]
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 201 "$status" "Admin can create question"
NEW_QUESTION_ID=$(echo "$body" | jq -r '.data._id' 2>/dev/null)
echo "$body" | jq '{success, message, id: .data._id}' 2>/dev/null || echo "$body"

sleep_short

# Test 11: Update question as admin (Should Work)
print_test "11" "PUT /api/questions/:id as Admin (Should Work)"

if [ ! -z "$NEW_QUESTION_ID" ] && [ "$NEW_QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT "$QUESTION_SERVICE_URL/api/questions/$NEW_QUESTION_ID" \
        -H "Content-Type: application/json" \
        -b $COOKIES_FILE \
        -d '{
            "title": "JWT Auth Test Question - UPDATED",
            "difficulty": "Medium"
        }')
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    check_status 200 "$status" "Admin can update question"
    echo "$body" | jq '{success, message}' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ Skipping (no question ID available)${NC}"
fi

sleep_short

# Test 12: Delete question as admin (Should Work)
print_test "12" "DELETE /api/questions/:id as Admin (Should Work)"

if [ ! -z "$NEW_QUESTION_ID" ] && [ "$NEW_QUESTION_ID" != "null" ]; then
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$QUESTION_SERVICE_URL/api/questions/$NEW_QUESTION_ID" \
        -b $COOKIES_FILE)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    check_status 200 "$status" "Admin can delete question"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${YELLOW}⚠ Skipping (no question ID available)${NC}"
fi

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Summary                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo -e "Total Tests:  ${TOTAL}"
echo -e "${GREEN}Passed:       ${PASSED}${NC}"
if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}Failed:       ${FAILED}${NC}"
else
    echo -e "Failed:       ${FAILED}"
fi
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

if [ "$FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All JWT authentication tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above.${NC}\n"
    exit 1
fi

