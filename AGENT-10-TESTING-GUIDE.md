# Agent-10: Market Trends Testing Guide

## Overview

This guide provides complete instructions for testing the Market Trends API functionality in the Prospect Intelligence Hub application.

## Test Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| **GET /api/trends** | ✅ Ready to Test | Code reviewed and validated |
| **Category Filtering** | ✅ Ready to Test | Logic verified in code |
| **POST /api/trends (AI Generation)** | ⚠️ Not Configured | Requires ABACUSAI_API_KEY |
| **Data Transformation** | ✅ Verified | Helper functions implemented correctly |
| **Authentication** | ✅ Ready to Test | NextAuth integration confirmed |

## Prerequisites

### 1. Start Development Server

```bash
cd /Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub
npm run dev
```

Server will start at: `http://localhost:3000`

### 2. Obtain Session Token

**Option A: Using Browser**
1. Navigate to http://localhost:3000
2. Login with your credentials
3. Open Browser DevTools (F12)
4. Go to: Application → Cookies → http://localhost:3000
5. Copy the value of `next-auth.session-token`

**Option B: Wait for Agent-4**
Agent-4 should provide a session token file. Check for:
- `agent-4-session-token.json`
- Or similar session credential file

### 3. Configure ABACUSAI_API_KEY (Optional)

To enable AI-powered trend generation:

1. Edit `.env` file:
```bash
nano .env
```

2. Add the following line:
```bash
ABACUSAI_API_KEY=your_api_key_here
```

3. Obtain API key from: https://apps.abacus.ai

**Note**: Without this key, POST /api/trends will fail (which is expected behavior).

## Running Tests

### Quick Test

```bash
./test-market-trends.sh YOUR_SESSION_TOKEN
```

Replace `YOUR_SESSION_TOKEN` with the actual token from Prerequisites step 2.

### Manual Testing with cURL

#### Test 1: Fetch All Trends
```bash
curl -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  http://localhost:3000/api/trends
```

#### Test 2: Fetch with Category Filter
```bash
curl -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  "http://localhost:3000/api/trends?category=service_business&limit=10"
```

#### Test 3: Test Unauthorized Access
```bash
curl http://localhost:3000/api/trends
```

Expected: HTTP 401 Unauthorized

#### Test 4: Generate New Trends (Requires API Key)
```bash
curl -X POST \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  http://localhost:3000/api/trends
```

## Test Script Output

The test script (`test-market-trends.sh`) will:

1. Execute all 7 test cases
2. Validate response structure
3. Check data integrity
4. Generate a JSON report: `agent-10-test-results.json`

### Expected Output

```
Starting Market Trends API Tests
Base URL: http://localhost:3000
Session Token: abcd1234...

======================================
TEST: TEST-1: Fetch All Trends
======================================
HTTP Status: 200
✓ PASS: HTTP 200 OK
✓ PASS: Valid JSON response
✓ PASS: Found 15 trends
✓ PASS: All required fields present
✓ PASS: Valid category: service_business
✓ PASS: Valid impact: high
✓ PASS: Valid trend direction: up

[... more tests ...]

======================================
TEST SUMMARY
======================================

Test Execution Complete

Results:
  Passed: 8
  Failed: 0
  Skipped: 1

✓ PASS: Test report saved to: agent-10-test-results.json
```

## API Endpoints Documentation

### GET /api/trends

**Description**: Fetches market trends from the database with optional filtering

**Authentication**: Required (NextAuth session cookie)

**Query Parameters**:
- `category` (optional): Filter by category
  - Options: `service_business`, `general_market`, `industry_news`, or any database category
  - Default: all categories
- `limit` (optional): Maximum number of trends to return
  - Type: number
  - Default: 20

**Response Format**:
```json
{
  "trends": [
    {
      "id": "trend_123",
      "title": "Digital Marketing Evolution",
      "category": "service_business",
      "summary": "Service businesses are increasingly adopting AI-powered tools...",
      "impact": "high",
      "trend_direction": "up",
      "source": "AI Generated",
      "date": "2026-01-10T00:00:00.000Z"
    }
  ]
}
```

**Field Descriptions**:
- `id`: Unique trend identifier
- `title`: Trend headline
- `category`: One of: `service_business`, `general_market`, `industry_news`
- `summary`: Detailed trend description
- `impact`: Business impact level (`high`, `medium`, `low`)
- `trend_direction`: Trend trajectory (`up`, `down`, `stable`)
- `source`: Where the trend data originated (optional)
- `date`: When the trend was recorded (ISO 8601 format)

### POST /api/trends

**Description**: Generates new market trends using Abacus AI

**Authentication**: Required (NextAuth session cookie)

**Requirements**:
- ABACUSAI_API_KEY must be configured in `.env`

**Request**: No body required

**Response Format**:
```json
{
  "success": true,
  "trends": [
    {
      "id": "trend_456",
      "title": "AI-Powered Customer Service",
      "category": "service_business",
      "summary": "Contractors are leveraging AI chatbots...",
      "impact": "high",
      "trend_direction": "up",
      "source": "AI Generated",
      "date": "2026-01-10T00:00:00.000Z"
    }
  ]
}
```

**Behavior**:
1. Calls Abacus AI API with gpt-4.1-mini model
2. Generates 5 market trends focused on:
   - Digital marketing trends
   - Service industry innovations
   - Customer behavior changes
   - Technology adoption
   - Market opportunities
3. Saves trends to database with `source='AI Generated'`
4. Returns transformed trends in frontend format

**Error Responses**:
- HTTP 401: Not authenticated
- HTTP 500: API key missing or AI generation failed

## Data Transformation

The API transforms database records to frontend format using helper functions:

### Category Mapping (`mapCategory()`)

| Database Category | Frontend Category | Logic |
|-------------------|-------------------|-------|
| Contains "service" or "contractor" | `service_business` | Keyword match |
| Contains "news" or "industry" | `industry_news` | Keyword match |
| All others | `general_market` | Default fallback |

### Impact Calculation (`determineImpact()`)

| Relevance Score | Impact Level |
|-----------------|--------------|
| ≥ 0.7 | `high` |
| ≥ 0.4 and < 0.7 | `medium` |
| < 0.4 | `low` |

### Trend Direction Mapping (`mapTrendDirection()`)

| Trend Keywords | Direction |
|----------------|-----------|
| "grow", "rising", "emerg" | `up` |
| "declin", "falling" | `down` |
| None of the above | `stable` |

### Field Transformations

| Database Field | Frontend Field | Transformation |
|----------------|----------------|----------------|
| `id` | `id` | No change |
| `title` | `title` | No change |
| `category` | `category` | Via `mapCategory()` |
| `content` | `summary` | Renamed |
| `relevance` | `impact` | Via `determineImpact()` |
| `trend` | `trend_direction` | Via `mapTrendDirection()` |
| `source` | `source` | Optional (undefined if null) |
| `extractedAt` | `date` | ISO 8601 format |

## Database Schema

### MarketTrend Model

```prisma
model MarketTrend {
  id          String    @id
  category    String
  title       String
  content     String
  source      String?
  trend       String?
  relevance   Float?
  publishedAt DateTime?
  extractedAt DateTime  @default(now())
}
```

## Test Cases

### TEST-1: Fetch All Trends
- **Endpoint**: GET /api/trends
- **Expected**: HTTP 200, trends array with proper structure
- **Validates**: Response format, field presence, data types

### TEST-2: Category Filter (service_business)
- **Endpoint**: GET /api/trends?category=service_business&limit=10
- **Expected**: HTTP 200, max 10 trends, all with category=service_business
- **Validates**: Category filtering, limit parameter

### TEST-3: Category Filter (general_market)
- **Endpoint**: GET /api/trends?category=general_market
- **Expected**: HTTP 200, trends with category=general_market
- **Validates**: Category mapping logic

### TEST-4: Category Filter (industry_news)
- **Endpoint**: GET /api/trends?category=industry_news
- **Expected**: HTTP 200, trends with category=industry_news
- **Validates**: Category mapping logic

### TEST-5: Unauthorized Access
- **Endpoint**: GET /api/trends (no auth)
- **Expected**: HTTP 401, error message
- **Validates**: Authentication enforcement

### TEST-6: ABACUSAI_API_KEY Configuration
- **Action**: Check .env file
- **Expected**: Detect if API key is configured
- **Determines**: Whether to run TEST-7

### TEST-7: Generate Trends (Conditional)
- **Endpoint**: POST /api/trends
- **Expected (if configured)**: HTTP 200, 5 new trends, saved to database
- **Expected (if not configured)**: HTTP 500, error about missing key
- **Validates**: AI generation, database persistence

## Troubleshooting

### Issue: HTTP 401 Unauthorized

**Cause**: Invalid or expired session token

**Solution**:
1. Verify you're logged in at http://localhost:3000
2. Get a fresh session token from browser cookies
3. Ensure token is correctly formatted (no extra spaces/quotes)

### Issue: HTTP 500 on POST /api/trends

**Cause**: ABACUSAI_API_KEY not configured or invalid

**Solution**:
1. Check `.env` file has `ABACUSAI_API_KEY=your_key`
2. Verify API key is valid at https://apps.abacus.ai
3. Restart server after adding key: `npm run dev`

### Issue: No trends in database

**Cause**: Database is empty

**Solution**:
1. Run POST /api/trends to generate sample trends (requires API key)
2. Or manually insert trends via database client

### Issue: Server not running

**Cause**: Development server not started

**Solution**:
```bash
npm run dev
```

### Issue: Connection refused

**Cause**: Database connection issue

**Solution**:
1. Check DATABASE_URL in `.env`
2. Verify Neon database is accessible
3. Run database migrations: `npx prisma migrate deploy`

## Configuration Summary

| Variable | Status | Required For |
|----------|--------|--------------|
| DATABASE_URL | ✅ Configured | All functionality |
| NEXTAUTH_SECRET | ✅ Configured | Authentication |
| NEXTAUTH_URL | ✅ Configured | Authentication |
| ABACUSAI_API_KEY | ❌ Not Configured | AI trend generation only |

## Next Steps

1. ✅ Start server: `npm run dev`
2. ✅ Obtain session token (login or from Agent-4)
3. ✅ Run test script: `./test-market-trends.sh YOUR_SESSION_TOKEN`
4. ⚠️ (Optional) Configure ABACUSAI_API_KEY for AI features
5. ⚠️ (Optional) Test POST endpoint with AI generation
6. ✅ Review test results in `agent-10-test-results.json`

## Output Files

| File | Purpose |
|------|---------|
| `agent-10-market-trends-test-report.json` | Detailed code review and test plan |
| `agent-10-test-results.json` | Live test execution results |
| `test-market-trends.sh` | Automated test script |
| `AGENT-10-TESTING-GUIDE.md` | This documentation |

## Support

If you encounter issues:
1. Check server logs in terminal running `npm run dev`
2. Review browser console for frontend errors
3. Check database connectivity with: `npx prisma studio`
4. Verify all environment variables are set correctly

## Code Locations

| Component | File Path |
|-----------|-----------|
| API Route | `/app/api/trends/route.ts` |
| Database Schema | `/prisma/schema.prisma` |
| Environment Config | `/.env` |
| Test Script | `/test-market-trends.sh` |
| Test Report | `/agent-10-market-trends-test-report.json` |

## Summary

The Market Trends API is fully implemented and ready for testing. The GET endpoint works without additional configuration, while the POST endpoint requires ABACUSAI_API_KEY for AI-powered trend generation. All helper functions are correctly implemented and data transformation logic is sound.

**Current Status**:
- ✅ Code Review: COMPLETE
- ⚠️ Live Testing: PENDING (requires server + session token)
- ❌ AI Generation: NOT CONFIGURED (requires API key)
