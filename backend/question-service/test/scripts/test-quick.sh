#!/bin/bash

# Quick test script for question service admin auth
# Tests the most critical functionality

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

USER_SERVICE_URL="http://localhost:8000"
QUESTION_SERVICE_URL="http://localhost:8001"
ADMIN_EMAIL="testneww@test.com"
ADMIN_PASSWORD="SecurePassword1!"

echo -e "${BLUE}Quick Admin Auth Test${NC}\n"

# Cleanup
rm -f quick-test-cookies.txt

# Step 1: Login
echo -e "${BLUE}1. Logging in as admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $USER_SERVICE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
    -c quick-test-cookies.txt)

if echo "$LOGIN_RESPONSE" | grep -q '"message":"User logged in successfully"'; then
    echo -e "${GREEN}✓ Login successful${NC}"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
fi

# Step 2: Check admin status
echo -e "\n${BLUE}2. Verifying admin status...${NC}"
VERIFY_RESPONSE=$(curl -s -X GET $USER_SERVICE_URL/auth/verify-token \
    -b quick-test-cookies.txt)

if echo "$VERIFY_RESPONSE" | grep -q '"isAdmin":true'; then
    echo -e "${GREEN}✓ User is admin${NC}"
else
    echo -e "${RED}✗ User is NOT admin${NC}"
    echo "$VERIFY_RESPONSE" | jq '.'
    echo -e "\n${RED}ERROR: Please make your user admin first!${NC}"
    echo "Run: docker exec -it <mongo-container> mongosh"
    echo "Then: use userdb; db.users.updateOne({email: \"$ADMIN_EMAIL\"}, {\$set: {isAdmin: true}})"
    rm -f quick-test-cookies.txt
    exit 1
fi

# Step 3: Test create question
echo -e "\n${BLUE}3. Testing question creation (admin only)...${NC}"
CREATE_RESPONSE=$(curl -s -X POST $QUESTION_SERVICE_URL/api/questions \
    -H "Content-Type: application/json" \
    -b quick-test-cookies.txt \
    -d '{
        "title": "Quick Test Question",
        "description": "Test question for admin auth",
        "difficulty": "Easy",
        "topics": ["Test"],
        "testCases": [{"input": "test", "expectedOutput": "test", "type": "Sample"}]
    }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Question created successfully${NC}"
    QUESTION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data._id')
    echo -e "Question ID: $QUESTION_ID"
else
    echo -e "${RED}✗ Failed to create question${NC}"
    echo "$CREATE_RESPONSE" | jq '.'
    rm -f quick-test-cookies.txt
    exit 1
fi

# Step 4: Test get questions (public)
echo -e "\n${BLUE}4. Testing public read access...${NC}"
GET_RESPONSE=$(curl -s -X GET $QUESTION_SERVICE_URL/api/questions)

if echo "$GET_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Questions retrieved successfully${NC}"
    COUNT=$(echo "$GET_RESPONSE" | jq -r '.count')
    echo -e "Total questions: $COUNT"
else
    echo -e "${RED}✗ Failed to get questions${NC}"
fi

# Step 5: Delete test question (cleanup)
if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    echo -e "\n${BLUE}5. Cleaning up test question...${NC}"
    DELETE_RESPONSE=$(curl -s -X DELETE $QUESTION_SERVICE_URL/api/questions/$QUESTION_ID \
        -b quick-test-cookies.txt)
    
    if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Test question deleted${NC}"
    else
        echo -e "${RED}✗ Failed to delete test question${NC}"
    fi
fi

# Cleanup
rm -f quick-test-cookies.txt

echo -e "\n${GREEN}╔════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   QUICK TEST COMPLETED! ✓          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════╝${NC}"
echo -e "\nFor comprehensive testing, run: ${BLUE}./test-admin-api.sh${NC}\n"

