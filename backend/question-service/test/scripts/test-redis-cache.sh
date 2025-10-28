#!/bin/bash

# Test Redis Caching for Question Service
# This script verifies that Redis caching is working correctly

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
QUESTION_SERVICE_URL=${QUESTION_SERVICE_URL:-"http://localhost:8001"}
ADMIN_EMAIL="${ADMIN_EMAIL:-testneww@test.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-SecurePassword1!}"
USER_SERVICE_URL=${USER_SERVICE_URL:-"http://localhost:8000"}

COOKIES_FILE=$(mktemp)
trap "rm -f $COOKIES_FILE" EXIT

echo -e "${BLUE}=== Question Service Redis Cache Test ===${NC}\n"

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

# Helper function to check if response contains string
check_contains() {
    content=$1
    expected=$2
    description=$3
    
    if echo "$content" | grep -q "$expected"; then
        echo -e "${GREEN}✓ Contains:${NC} $description"
        return 0
    else
        echo -e "${RED}✗ Missing:${NC} $description"
        return 1
    fi
}

# Sleep to avoid rate limiting
sleep_short() {
    sleep 0.3
}

echo -e "${YELLOW}Setup: Logging in as admin...${NC}"
# Login as admin
response=$(curl -s -w "\n%{http_code}" -X POST $USER_SERVICE_URL/auth/login \
    -H "Content-Type: application/json" \
    -c $COOKIES_FILE \
    -d '{
        "email": "'"$ADMIN_EMAIL"'",
        "password": "'"$ADMIN_PASSWORD"'"
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$status" -eq 200 ]; then
    echo -e "${GREEN}✓ Admin logged in successfully${NC}"
else
    echo -e "${RED}✗ Admin login failed (HTTP $status)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    exit 1
fi

sleep_short

# Test 1: Create a Test Question
print_test "1" "Create Test Question"

response=$(curl -s -w "\n%{http_code}" -X POST $QUESTION_SERVICE_URL/api/questions \
    -H "Content-Type: application/json" \
    -b $COOKIES_FILE \
    -d '{
        "title": "Redis Cache Test Question",
        "description": "This question is for testing Redis caching functionality",
        "difficulty": "Easy",
        "topics": ["Arrays", "Testing"],
        "tags": ["cache-test"],
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

check_status 201 "$status" "Create question"
QUESTION_ID=$(echo "$body" | jq -r '.data._id')
echo "Question ID: $QUESTION_ID"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 2: Get Question (First time - Cache MISS)
print_test "2" "Get Question - First Request (Cache MISS)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/$QUESTION_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Get question"
check_contains "$body" '"cached":false' "Should be cache MISS (cached: false)"
check_contains "$body" '"title":"Redis Cache Test Question"' "Correct question returned"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 3: Get Same Question (Second time - Cache HIT)
print_test "3" "Get Same Question - Second Request (Cache HIT)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/$QUESTION_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Get question"
check_contains "$body" '"cached":true' "Should be cache HIT (cached: true)"
check_contains "$body" '"title":"Redis Cache Test Question"' "Correct question returned"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 4: Get Random Question (First time - Cache MISS)
print_test "4" "Get Random Question - First Request (Cache MISS)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/random?topic=Arrays&difficulty=Easy")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Get random question"
check_contains "$body" '"cached":false' "Should be cache MISS"
RANDOM_QUESTION_ID=$(echo "$body" | jq -r '.questionId')
echo "Random Question ID: $RANDOM_QUESTION_ID"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 5: Get Same Random Question (Cache HIT)
print_test "5" "Get Random Question - Second Request (Cache HIT)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/random?topic=Arrays&difficulty=Easy")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Get random question"
check_contains "$body" '"cached":true' "Should be cache HIT"
CACHED_RANDOM_ID=$(echo "$body" | jq -r '.questionId')

if [ "$RANDOM_QUESTION_ID" == "$CACHED_RANDOM_ID" ]; then
    echo -e "${GREEN}✓ Same question ID returned from cache${NC}"
else
    echo -e "${YELLOW}⚠ Different question ID (random cache may have expired)${NC}"
fi

echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 6: Retrieve Cached Random Question by ID
print_test "6" "Get Full Question Details (Should be cached)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/$RANDOM_QUESTION_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Get question details"
check_contains "$body" '"cached":true' "Question details should be cached"
echo "$body" | jq '.data | {title, difficulty, topics}' 2>/dev/null || echo "$body"

sleep_short

# Test 7: Update Question (Cache should be updated)
print_test "7" "Update Question (Cache Update)"

response=$(curl -s -w "\n%{http_code}" -X PUT "$QUESTION_SERVICE_URL/api/questions/$QUESTION_ID" \
    -H "Content-Type: application/json" \
    -b $COOKIES_FILE \
    -d '{
        "title": "Redis Cache Test Question - UPDATED",
        "description": "This question has been updated",
        "difficulty": "Medium",
        "topics": ["Arrays", "Testing", "Cache"],
        "testCases": [
            {
                "input": "updated_input",
                "expectedOutput": "updated_output",
                "type": "Sample"
            }
        ]
    }')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Update question"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 8: Get Updated Question (Should get fresh cached data)
print_test "8" "Get Updated Question (Fresh Cache)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/$QUESTION_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Get updated question"
check_contains "$body" '"cached":true' "Should be cached"
check_contains "$body" '"title":"Redis Cache Test Question - UPDATED"' "Should have updated title"
check_contains "$body" '"difficulty":"Medium"' "Should have updated difficulty"
echo "$body" | jq '.data | {title, difficulty}' 2>/dev/null || echo "$body"

sleep_short

# Test 9: Delete Question (Cache should be cleared)
print_test "9" "Delete Question (Cache Invalidation)"

response=$(curl -s -w "\n%{http_code}" -X DELETE "$QUESTION_SERVICE_URL/api/questions/$QUESTION_ID" \
    -b $COOKIES_FILE)
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 200 "$status" "Delete question"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

sleep_short

# Test 10: Try to Get Deleted Question (Should 404)
print_test "10" "Get Deleted Question (Should 404)"

response=$(curl -s -w "\n%{http_code}" -X GET "$QUESTION_SERVICE_URL/api/questions/$QUESTION_ID")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

check_status 404 "$status" "Get deleted question"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}         Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests:  ${TOTAL}"
echo -e "${GREEN}Passed:       ${PASSED}${NC}"
if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}Failed:       ${FAILED}${NC}"
else
    echo -e "Failed:       ${FAILED}"
fi
echo -e "${BLUE}========================================${NC}"

if [ "$FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All Redis cache tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above.${NC}\n"
    exit 1
fi

