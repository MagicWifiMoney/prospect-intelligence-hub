#!/bin/bash

# Market Trends API Test Script
# Usage: ./test-market-trends.sh [SESSION_TOKEN]
#
# This script tests the /api/trends endpoints for the Prospect Intelligence Hub
# Prerequisites:
#   1. Server running on http://localhost:3000
#   2. Valid NextAuth session token

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
SESSION_TOKEN="${1:-}"
RESULTS_FILE="agent-10-test-results.json"

# Check if session token provided
if [ -z "$SESSION_TOKEN" ]; then
    echo -e "${RED}ERROR: Session token required${NC}"
    echo "Usage: $0 SESSION_TOKEN"
    echo ""
    echo "To get a session token:"
    echo "  1. Login to http://localhost:3000"
    echo "  2. Open browser DevTools > Application > Cookies"
    echo "  3. Copy the value of 'next-auth.session-token'"
    exit 1
fi

# Test results array
declare -A TEST_RESULTS

# Function to print test header
print_test() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}TEST: $1${NC}"
    echo -e "${BLUE}======================================${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
}

# Function to print failure
print_failure() {
    echo -e "${RED}✗ FAIL:${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
}

# Function to make authenticated request
auth_request() {
    local method=$1
    local endpoint=$2
    local cookie="next-auth.session-token=$SESSION_TOKEN"

    if [ "$method" = "GET" ]; then
        curl -s -w "\n%{http_code}" -H "Cookie: $cookie" "${BASE_URL}${endpoint}"
    elif [ "$method" = "POST" ]; then
        curl -s -w "\n%{http_code}" -X POST -H "Cookie: $cookie" "${BASE_URL}${endpoint}"
    fi
}

# Function to validate JSON response
validate_json() {
    echo "$1" | jq empty 2>/dev/null
    return $?
}

# Start testing
echo -e "${GREEN}Starting Market Trends API Tests${NC}"
echo "Base URL: $BASE_URL"
echo "Session Token: ${SESSION_TOKEN:0:20}..."
echo ""

# =====================================
# TEST 1: Fetch All Trends
# =====================================
print_test "TEST-1: Fetch All Trends (GET /api/trends)"

RESPONSE=$(auth_request "GET" "/api/trends")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "HTTP 200 OK"
    TEST_RESULTS["TEST-1-STATUS"]="PASS"

    # Validate JSON
    if validate_json "$BODY"; then
        print_success "Valid JSON response"

        # Check for trends array
        TRENDS_COUNT=$(echo "$BODY" | jq '.trends | length' 2>/dev/null)
        if [ -n "$TRENDS_COUNT" ]; then
            print_success "Found $TRENDS_COUNT trends"
            TEST_RESULTS["TEST-1-COUNT"]=$TRENDS_COUNT

            # Validate first trend structure
            if [ "$TRENDS_COUNT" -gt 0 ]; then
                FIRST_TREND=$(echo "$BODY" | jq '.trends[0]')

                # Check required fields
                HAS_ID=$(echo "$FIRST_TREND" | jq 'has("id")')
                HAS_TITLE=$(echo "$FIRST_TREND" | jq 'has("title")')
                HAS_CATEGORY=$(echo "$FIRST_TREND" | jq 'has("category")')
                HAS_SUMMARY=$(echo "$FIRST_TREND" | jq 'has("summary")')
                HAS_IMPACT=$(echo "$FIRST_TREND" | jq 'has("impact")')
                HAS_DIRECTION=$(echo "$FIRST_TREND" | jq 'has("trend_direction")')
                HAS_DATE=$(echo "$FIRST_TREND" | jq 'has("date")')

                if [ "$HAS_ID" = "true" ] && [ "$HAS_TITLE" = "true" ] && [ "$HAS_CATEGORY" = "true" ] && \
                   [ "$HAS_SUMMARY" = "true" ] && [ "$HAS_IMPACT" = "true" ] && \
                   [ "$HAS_DIRECTION" = "true" ] && [ "$HAS_DATE" = "true" ]; then
                    print_success "All required fields present"
                    TEST_RESULTS["TEST-1-STRUCTURE"]="PASS"
                else
                    print_failure "Missing required fields"
                    TEST_RESULTS["TEST-1-STRUCTURE"]="FAIL"
                fi

                # Validate field values
                CATEGORY=$(echo "$FIRST_TREND" | jq -r '.category')
                IMPACT=$(echo "$FIRST_TREND" | jq -r '.impact')
                DIRECTION=$(echo "$FIRST_TREND" | jq -r '.trend_direction')

                if [[ "$CATEGORY" =~ ^(service_business|general_market|industry_news)$ ]]; then
                    print_success "Valid category: $CATEGORY"
                else
                    print_failure "Invalid category: $CATEGORY"
                fi

                if [[ "$IMPACT" =~ ^(high|medium|low)$ ]]; then
                    print_success "Valid impact: $IMPACT"
                else
                    print_failure "Invalid impact: $IMPACT"
                fi

                if [[ "$DIRECTION" =~ ^(up|down|stable)$ ]]; then
                    print_success "Valid trend direction: $DIRECTION"
                else
                    print_failure "Invalid trend direction: $DIRECTION"
                fi
            else
                print_warning "No trends in database to validate structure"
                TEST_RESULTS["TEST-1-STRUCTURE"]="NO_DATA"
            fi
        else
            print_failure "No trends array in response"
            TEST_RESULTS["TEST-1-COUNT"]=0
        fi
    else
        print_failure "Invalid JSON response"
        TEST_RESULTS["TEST-1-STATUS"]="FAIL"
    fi
elif [ "$HTTP_CODE" = "401" ]; then
    print_failure "Unauthorized - check session token"
    TEST_RESULTS["TEST-1-STATUS"]="FAIL_AUTH"
else
    print_failure "HTTP $HTTP_CODE"
    TEST_RESULTS["TEST-1-STATUS"]="FAIL"
fi

# =====================================
# TEST 2: Fetch Trends with Category Filter
# =====================================
print_test "TEST-2: Fetch Trends by Category (service_business)"

RESPONSE=$(auth_request "GET" "/api/trends?category=service_business&limit=10")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "HTTP 200 OK"
    TEST_RESULTS["TEST-2-STATUS"]="PASS"

    TRENDS_COUNT=$(echo "$BODY" | jq '.trends | length' 2>/dev/null)
    print_success "Found $TRENDS_COUNT trends (limit: 10)"
    TEST_RESULTS["TEST-2-COUNT"]=$TRENDS_COUNT

    # Validate limit
    if [ "$TRENDS_COUNT" -le 10 ]; then
        print_success "Limit parameter working correctly"
    else
        print_failure "Limit exceeded: $TRENDS_COUNT > 10"
    fi

    # Validate category filter (if trends exist)
    if [ "$TRENDS_COUNT" -gt 0 ]; then
        CATEGORY_CHECK=$(echo "$BODY" | jq '[.trends[].category] | unique | length')
        if [ "$CATEGORY_CHECK" = "1" ]; then
            CATEGORY=$(echo "$BODY" | jq -r '.trends[0].category')
            if [ "$CATEGORY" = "service_business" ]; then
                print_success "Category filter working: all trends are service_business"
                TEST_RESULTS["TEST-2-FILTER"]="PASS"
            else
                print_warning "Note: Category filter may not be working (all trends have category: $CATEGORY)"
                TEST_RESULTS["TEST-2-FILTER"]="UNEXPECTED"
            fi
        else
            print_warning "Multiple categories found - filter may not be working"
            TEST_RESULTS["TEST-2-FILTER"]="FAIL"
        fi
    fi
else
    print_failure "HTTP $HTTP_CODE"
    TEST_RESULTS["TEST-2-STATUS"]="FAIL"
fi

# =====================================
# TEST 3: Test Category Filter - General Market
# =====================================
print_test "TEST-3: Category Filter (general_market)"

RESPONSE=$(auth_request "GET" "/api/trends?category=general_market")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "HTTP 200 OK"
    TRENDS_COUNT=$(echo "$BODY" | jq '.trends | length' 2>/dev/null)
    print_success "Found $TRENDS_COUNT trends"
    TEST_RESULTS["TEST-3-COUNT"]=$TRENDS_COUNT
else
    print_failure "HTTP $HTTP_CODE"
fi

# =====================================
# TEST 4: Test Category Filter - Industry News
# =====================================
print_test "TEST-4: Category Filter (industry_news)"

RESPONSE=$(auth_request "GET" "/api/trends?category=industry_news")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "HTTP 200 OK"
    TRENDS_COUNT=$(echo "$BODY" | jq '.trends | length' 2>/dev/null)
    print_success "Found $TRENDS_COUNT trends"
    TEST_RESULTS["TEST-4-COUNT"]=$TRENDS_COUNT
else
    print_failure "HTTP $HTTP_CODE"
fi

# =====================================
# TEST 5: Test Unauthorized Access
# =====================================
print_test "TEST-5: Unauthorized Access"

RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/api/trends")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "401" ]; then
    print_success "HTTP 401 Unauthorized (expected)"
    TEST_RESULTS["TEST-5-STATUS"]="PASS"

    if echo "$BODY" | jq -e '.error' >/dev/null 2>&1; then
        ERROR_MSG=$(echo "$BODY" | jq -r '.error')
        print_success "Error message: $ERROR_MSG"
    fi
else
    print_failure "Expected HTTP 401, got $HTTP_CODE"
    TEST_RESULTS["TEST-5-STATUS"]="FAIL"
fi

# =====================================
# TEST 6: Check ABACUSAI_API_KEY Configuration
# =====================================
print_test "TEST-6: Check ABACUSAI_API_KEY Configuration"

if [ -f ".env" ]; then
    if grep -q "ABACUSAI_API_KEY=" .env && ! grep -q "^#.*ABACUSAI_API_KEY=" .env; then
        API_KEY=$(grep "ABACUSAI_API_KEY=" .env | cut -d '=' -f2 | tr -d ' ')
        if [ -n "$API_KEY" ]; then
            print_success "ABACUSAI_API_KEY is configured"
            TEST_RESULTS["ABACUSAI-CONFIGURED"]="true"
            ABACUSAI_CONFIGURED=true
        else
            print_warning "ABACUSAI_API_KEY exists but is empty"
            TEST_RESULTS["ABACUSAI-CONFIGURED"]="false"
            ABACUSAI_CONFIGURED=false
        fi
    else
        print_warning "ABACUSAI_API_KEY not found in .env"
        TEST_RESULTS["ABACUSAI-CONFIGURED"]="false"
        ABACUSAI_CONFIGURED=false
    fi
else
    print_warning ".env file not found"
    TEST_RESULTS["ABACUSAI-CONFIGURED"]="false"
    ABACUSAI_CONFIGURED=false
fi

# =====================================
# TEST 7: Generate New Trends (Conditional)
# =====================================
print_test "TEST-7: Generate New Trends (POST /api/trends)"

if [ "$ABACUSAI_CONFIGURED" = true ]; then
    print_warning "Attempting to generate trends with AI..."
    echo "This may take 10-30 seconds..."

    RESPONSE=$(auth_request "POST" "/api/trends")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "HTTP Status: $HTTP_CODE"

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "HTTP 200 OK"
        TEST_RESULTS["TEST-7-STATUS"]="PASS"

        if validate_json "$BODY"; then
            print_success "Valid JSON response"

            SUCCESS=$(echo "$BODY" | jq -r '.success')
            TRENDS_COUNT=$(echo "$BODY" | jq '.trends | length' 2>/dev/null)

            if [ "$SUCCESS" = "true" ]; then
                print_success "Success flag is true"
            fi

            if [ -n "$TRENDS_COUNT" ]; then
                print_success "Generated $TRENDS_COUNT trends"
                TEST_RESULTS["TEST-7-GENERATED"]=$TRENDS_COUNT

                if [ "$TRENDS_COUNT" = "5" ]; then
                    print_success "Expected count: 5 trends"
                else
                    print_warning "Expected 5 trends, got $TRENDS_COUNT"
                fi

                # Check if trends have source='AI Generated'
                FIRST_TREND=$(echo "$BODY" | jq '.trends[0]')
                SOURCE=$(echo "$FIRST_TREND" | jq -r '.source')

                if [ "$SOURCE" = "AI Generated" ]; then
                    print_success "Trends marked as AI Generated"
                else
                    print_warning "Expected source='AI Generated', got '$SOURCE'"
                fi
            fi
        else
            print_failure "Invalid JSON response"
        fi
    elif [ "$HTTP_CODE" = "500" ]; then
        print_failure "HTTP 500 - Server error"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        TEST_RESULTS["TEST-7-STATUS"]="FAIL"
    else
        print_failure "HTTP $HTTP_CODE"
        TEST_RESULTS["TEST-7-STATUS"]="FAIL"
    fi
else
    print_warning "ABACUSAI_API_KEY not configured - skipping trend generation test"
    TEST_RESULTS["TEST-7-STATUS"]="NOT_CONFIGURED"
fi

# =====================================
# Generate Summary Report
# =====================================
print_test "TEST SUMMARY"

echo ""
echo -e "${GREEN}Test Execution Complete${NC}"
echo ""

# Count passes/fails
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for key in "${!TEST_RESULTS[@]}"; do
    value="${TEST_RESULTS[$key]}"
    if [[ "$value" == "PASS" ]]; then
        ((PASS_COUNT++))
    elif [[ "$value" == "FAIL"* ]]; then
        ((FAIL_COUNT++))
    elif [[ "$value" == "NOT_CONFIGURED" ]] || [[ "$value" == "NO_DATA" ]]; then
        ((SKIP_COUNT++))
    fi
done

echo "Results:"
echo -e "${GREEN}  Passed: $PASS_COUNT${NC}"
echo -e "${RED}  Failed: $FAIL_COUNT${NC}"
echo -e "${YELLOW}  Skipped: $SKIP_COUNT${NC}"
echo ""

# Generate JSON report
echo "Generating JSON report..."

cat > "$RESULTS_FILE" <<EOF
{
  "agent": "Agent-10-MarketTrends",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "abacusAIConfigured": ${ABACUSAI_CONFIGURED:-false},
  "testResults": {
EOF

# Add test results to JSON
FIRST=true
for key in "${!TEST_RESULTS[@]}"; do
    if [ "$FIRST" = false ]; then
        echo "," >> "$RESULTS_FILE"
    fi
    FIRST=false
    echo -n "    \"$key\": \"${TEST_RESULTS[$key]}\"" >> "$RESULTS_FILE"
done

cat >> "$RESULTS_FILE" <<EOF

  },
  "summary": {
    "passed": $PASS_COUNT,
    "failed": $FAIL_COUNT,
    "skipped": $SKIP_COUNT,
    "total": $((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
  }
}
EOF

echo ""
print_success "Test report saved to: $RESULTS_FILE"
echo ""

# Exit with appropriate code
if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
else
    exit 0
fi
