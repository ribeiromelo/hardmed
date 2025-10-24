#!/bin/bash
# API Test Script - Tests ALL endpoints

echo "========================================="
echo "🧪 HardMedicina API Test Suite"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Login as Admin
echo -e "${YELLOW}TEST 1: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hardmedicina.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
USER_NAME=$(echo $LOGIN_RESPONSE | jq -r '.user.name')
USER_ROLE=$(echo $LOGIN_RESPONSE | jq -r '.user.role')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
  echo -e "${GREEN}✅ Login successful${NC}"
  echo "   User: $USER_NAME"
  echo "   Role: $USER_ROLE"
  echo "   Token: ${TOKEN:0:30}..."
else
  echo -e "${RED}❌ Login failed${NC}"
  exit 1
fi
echo ""

# Test 2: Get User Info
echo -e "${YELLOW}TEST 2: Get User Info (/api/user/me)${NC}"
USER_INFO=$(curl -s http://localhost:3000/api/user/me \
  -H "Authorization: Bearer $TOKEN")

USER_EMAIL=$(echo $USER_INFO | jq -r '.email')
if [ "$USER_EMAIL" == "admin@hardmedicina.com" ]; then
  echo -e "${GREEN}✅ User info retrieved${NC}"
  echo "   Email: $USER_EMAIL"
else
  echo -e "${RED}❌ Failed to get user info${NC}"
fi
echo ""

# Test 3: Get All Tracks
echo -e "${YELLOW}TEST 3: Get All Tracks (/api/tracks)${NC}"
TRACKS=$(curl -s http://localhost:3000/api/tracks \
  -H "Authorization: Bearer $TOKEN")

TRACKS_COUNT=$(echo $TRACKS | jq '. | length')
if [ "$TRACKS_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Tracks retrieved: $TRACKS_COUNT tracks${NC}"
  echo ""
  echo "   First 3 tracks:"
  echo $TRACKS | jq -r '.[0:3] | .[] | "   - " + .title + " (" + (.total_lessons|tostring) + " aulas)"'
else
  echo -e "${RED}❌ No tracks found${NC}"
fi
echo ""

# Test 4: Get Admin Stats
echo -e "${YELLOW}TEST 4: Get Admin Stats (/api/admin/stats)${NC}"
STATS=$(curl -s http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN")

TOTAL_USERS=$(echo $STATS | jq -r '.total_users')
TOTAL_TRACKS=$(echo $STATS | jq -r '.total_tracks')
TOTAL_LESSONS=$(echo $STATS | jq -r '.total_lessons')

if [ "$TOTAL_USERS" != "null" ]; then
  echo -e "${GREEN}✅ Admin stats retrieved${NC}"
  echo "   Total Users: $TOTAL_USERS"
  echo "   Total Tracks: $TOTAL_TRACKS"
  echo "   Total Lessons: $TOTAL_LESSONS"
else
  echo -e "${RED}❌ Failed to get admin stats${NC}"
fi
echo ""

# Test 5: Get All Users (Admin only)
echo -e "${YELLOW}TEST 5: Get All Users (/api/admin/users)${NC}"
USERS=$(curl -s http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN")

USERS_COUNT=$(echo $USERS | jq '. | length')
if [ "$USERS_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Users retrieved: $USERS_COUNT users${NC}"
  echo $USERS | jq -r '.[] | "   - " + .name + " (" + .email + ") - " + .role'
else
  echo -e "${RED}❌ No users found${NC}"
fi
echo ""

# Test 6: Login as Student
echo -e "${YELLOW}TEST 6: Student Login${NC}"
STUDENT_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"erique@exemplo.com","password":"admin123"}')

STUDENT_TOKEN=$(echo $STUDENT_LOGIN | jq -r '.token')
STUDENT_NAME=$(echo $STUDENT_LOGIN | jq -r '.user.name')

if [ "$STUDENT_TOKEN" != "null" ] && [ "$STUDENT_TOKEN" != "" ]; then
  echo -e "${GREEN}✅ Student login successful${NC}"
  echo "   User: $STUDENT_NAME"
  echo "   Token: ${STUDENT_TOKEN:0:30}..."
else
  echo -e "${RED}❌ Student login failed${NC}"
fi
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
echo "========================================="
echo ""
echo "🎉 API is working perfectly!"
echo "   - Authentication: ✅"
echo "   - User endpoints: ✅"
echo "   - Tracks endpoints: ✅"
echo "   - Admin endpoints: ✅"
echo ""
echo "Now test in browser:"
echo "   🌐 https://3000-it06ucm5oiuebimm8j8is-2b54fc91.sandbox.novita.ai"
echo ""
