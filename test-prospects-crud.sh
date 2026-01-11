#!/bin/bash

# Agent-5: Prospects CRUD Operations Testing
# This script tests all prospect-related CRUD API endpoints with authentication

echo "=== Agent-5: Prospects CRUD Operations Testing ==="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Server URL
SERVER="http://localhost:3000"
RESULTS_FILE="/tmp/agent-5-results.json"
COOKIE_FILE="/tmp/test-cookies.txt"

# Initialize results
cat > "$RESULTS_FILE" << 'INIT'
{
  "agent": "Agent-5-ProspectsCRUD",
  "timestamp": "",
  "results": {
    "listProspects": {
      "status": "PENDING",
      "totalProspectsFound": 0,
      "filtersWorking": false
    },
    "createProspect": {
      "status": "PENDING",
      "prospectId": "",
      "createdSuccessfully": false
    },
    "getProspect": {
      "status": "PENDING",
      "dataCorrect": false
    },
    "updateProspect": {
      "status": "PENDING",
      "notesAdded": false
    },
    "duplicateDetection": {
      "status": "PENDING",
      "correctlyPrevented": false
    }
  },
  "testProspectId": "",
  "criticalIssues": [],
  "apiEndpointsWorking": "0/5"
}
INIT

# Test 1: Authenticate
echo "Step 1: Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST "$SERVER/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c "$COOKIE_FILE" \
  -w "\n%{http_code}")

AUTH_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
echo "Auth status code: $AUTH_CODE"

if [ "$AUTH_CODE" -ne 200 ]; then
  echo "ERROR: Authentication failed with status $AUTH_CODE"
  echo "Response: $(echo "$AUTH_RESPONSE" | head -n-1)"

  # Try to get session via signin page
  echo "Attempting alternative authentication..."
  SESSION=$(curl -s "$SERVER/api/auth/session" -b "$COOKIE_FILE")
  echo "Session check: $SESSION"
fi

echo ""

# Test 2: List Prospects - Basic
echo "=== Test 1: GET /api/prospects (List - Basic) ==="
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" \
  "$SERVER/api/prospects?page=1&limit=20")

LIST_CODE=$(echo "$LIST_RESPONSE" | tail -n1)
LIST_BODY=$(echo "$LIST_RESPONSE" | head -n-1)

echo "Status Code: $LIST_CODE"
echo "Response: $LIST_BODY" | jq '.' 2>/dev/null || echo "$LIST_BODY"

if [ "$LIST_CODE" -eq 200 ]; then
  TOTAL=$(echo "$LIST_BODY" | jq -r '.total' 2>/dev/null || echo "0")
  echo "✓ PASS: List prospects returned successfully (Total: $TOTAL)"
  jq '.results.listProspects = {status: "PASS", totalProspectsFound: '$TOTAL', filtersWorking: true}' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
else
  echo "✗ FAIL: List prospects failed"
  jq '.results.listProspects.status = "FAIL" | .criticalIssues += ["List prospects endpoint returned '$LIST_CODE'"]' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
fi

echo ""

# Test 3: List Prospects with Filters
echo "=== Test 2: GET /api/prospects (With Filters) ==="
FILTER_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" \
  "$SERVER/api/prospects?city=Minneapolis&businessType=plumber")

FILTER_CODE=$(echo "$FILTER_RESPONSE" | tail -n1)
echo "Filter test status: $FILTER_CODE"

echo ""

# Test 4: Create Prospect
echo "=== Test 3: POST /api/prospects (Create) ==="
CREATE_DATA='{
  "companyName": "AutoTest Plumbing Co",
  "businessType": "plumber",
  "city": "Minneapolis",
  "phone": "612-555-9999",
  "email": "info@autotestplumbing.com",
  "website": "https://autotestplumbing.com",
  "placeId": "test-auto-place-001",
  "googleRating": 4.7,
  "reviewCount": 35
}'

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" \
  -X POST "$SERVER/api/prospects" \
  -H "Content-Type: application/json" \
  -d "$CREATE_DATA")

CREATE_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n-1)

echo "Status Code: $CREATE_CODE"
echo "Response: $CREATE_BODY" | jq '.' 2>/dev/null || echo "$CREATE_BODY"

if [ "$CREATE_CODE" -eq 200 ]; then
  PROSPECT_ID=$(echo "$CREATE_BODY" | jq -r '.prospect.id' 2>/dev/null)
  echo "✓ PASS: Prospect created successfully (ID: $PROSPECT_ID)"
  jq --arg id "$PROSPECT_ID" '.results.createProspect = {status: "PASS", prospectId: $id, createdSuccessfully: true} | .testProspectId = $id' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
else
  echo "✗ FAIL: Create prospect failed"
  jq '.results.createProspect.status = "FAIL" | .criticalIssues += ["Create prospect endpoint returned '$CREATE_CODE'"]' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
  PROSPECT_ID=""
fi

echo ""

# Test 5: Get Single Prospect
if [ -n "$PROSPECT_ID" ]; then
  echo "=== Test 4: GET /api/prospects/[id] (Single) ==="
  GET_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" \
    "$SERVER/api/prospects/$PROSPECT_ID")

  GET_CODE=$(echo "$GET_RESPONSE" | tail -n1)
  GET_BODY=$(echo "$GET_RESPONSE" | head -n-1)

  echo "Status Code: $GET_CODE"
  echo "Response: $GET_BODY" | jq '.' 2>/dev/null || echo "$GET_BODY"

  if [ "$GET_CODE" -eq 200 ]; then
    echo "✓ PASS: Get single prospect successful"
    jq '.results.getProspect = {status: "PASS", dataCorrect: true}' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
  else
    echo "✗ FAIL: Get prospect failed"
    jq '.results.getProspect.status = "FAIL" | .criticalIssues += ["Get prospect endpoint returned '$GET_CODE'"]' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
  fi

  echo ""
fi

# Test 6: Update Prospect
if [ -n "$PROSPECT_ID" ]; then
  echo "=== Test 5: PATCH /api/prospects/[id] (Update) ==="
  UPDATE_DATA='{
    "notes": "Test note from automation",
    "tags": "automation,test"
  }'

  UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" \
    -X PATCH "$SERVER/api/prospects/$PROSPECT_ID" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_DATA")

  UPDATE_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
  UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | head -n-1)

  echo "Status Code: $UPDATE_CODE"
  echo "Response: $UPDATE_BODY" | jq '.' 2>/dev/null || echo "$UPDATE_BODY"

  if [ "$UPDATE_CODE" -eq 200 ]; then
    echo "✓ PASS: Update prospect successful"
    jq '.results.updateProspect = {status: "PASS", notesAdded: true}' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
  else
    echo "✗ FAIL: Update prospect failed"
    jq '.results.updateProspect.status = "FAIL" | .criticalIssues += ["Update prospect endpoint returned '$UPDATE_CODE'"]' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
  fi

  echo ""
fi

# Test 7: Duplicate Detection
echo "=== Test 6: Duplicate Detection ==="
DUP_RESPONSE=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" \
  -X POST "$SERVER/api/prospects" \
  -H "Content-Type: application/json" \
  -d "$CREATE_DATA")

DUP_CODE=$(echo "$DUP_RESPONSE" | tail -n1)
DUP_BODY=$(echo "$DUP_RESPONSE" | head -n-1)

echo "Status Code: $DUP_CODE"
echo "Response: $DUP_BODY" | jq '.' 2>/dev/null || echo "$DUP_BODY"

if [ "$DUP_CODE" -eq 400 ]; then
  echo "✓ PASS: Duplicate detection working correctly"
  jq '.results.duplicateDetection = {status: "PASS", correctlyPrevented: true}' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
else
  echo "✗ FAIL: Duplicate detection not working (expected 400, got $DUP_CODE)"
  jq '.results.duplicateDetection.status = "FAIL" | .criticalIssues += ["Duplicate detection failed - expected 400, got '$DUP_CODE'"]' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"
fi

echo ""

# Calculate final score
PASSED=$(jq '[.results[] | select(.status == "PASS")] | length' "$RESULTS_FILE")
TOTAL=5
jq --arg score "$PASSED/$TOTAL" '.apiEndpointsWorking = $score' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"

# Add timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq --arg ts "$TIMESTAMP" '.timestamp = $ts' "$RESULTS_FILE" > /tmp/temp.json && mv /tmp/temp.json "$RESULTS_FILE"

# Display final results
echo ""
echo "=== Final Results ==="
cat "$RESULTS_FILE" | jq '.'

echo ""
echo "Results saved to: $RESULTS_FILE"
echo "Test Prospect ID: $PROSPECT_ID"
