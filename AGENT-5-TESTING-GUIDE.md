# Agent-5: Prospects CRUD Operations Testing Guide

## Overview
This guide documents the testing requirements and procedures for Agent-5, which tests all prospect-related CRUD API endpoints with authentication.

## Prerequisites

### Server Status
- **URL**: http://localhost:3000
- **Status**: Must be running
- **Authentication**: NextAuth.js with credentials provider

### Dependencies
- Valid session token/cookie from Agent-4 (or manual authentication)
- Test user account with credentials:
  - Email: `test@example.com`
  - Password: `password123`

## API Endpoints to Test

### 1. GET /api/prospects (List Prospects)

**Purpose**: Retrieve a paginated list of prospects with optional filters

**Test Cases**:

#### Basic Pagination
```bash
GET /api/prospects?page=1&limit=20
```

**Expected Response** (200 OK):
```json
{
  "prospects": [...],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

#### Search Filter
```bash
GET /api/prospects?search=plumber
```

**Expected**: Returns prospects matching "plumber" in:
- Company name
- Business type
- City
- Phone
- Website

#### Location & Type Filters
```bash
GET /api/prospects?city=Minneapolis&businessType=plumber
```

**Expected**: Returns prospects matching both filters

#### Score Range Filter
```bash
GET /api/prospects?minScore=50&maxScore=100
```

**Expected**: Returns prospects with leadScore between 50-100

#### Hot Lead Filter
```bash
GET /api/prospects?isHotLead=true
```

**Expected**: Returns only hot lead prospects

#### Anomalies Filter
```bash
GET /api/prospects?hasAnomalies=true
```

**Expected**: Returns only prospects with detected anomalies

**Authentication**: Required (401 if not authenticated)

---

### 2. POST /api/prospects (Create Prospect)

**Purpose**: Create a new prospect entry

**Test Payload**:
```json
{
  "companyName": "AutoTest Plumbing Co",
  "businessType": "plumber",
  "city": "Minneapolis",
  "phone": "612-555-9999",
  "email": "info@autotestplumbing.com",
  "website": "https://autotestplumbing.com",
  "placeId": "test-auto-place-001",
  "googleRating": 4.7,
  "reviewCount": 35
}
```

**Expected Response** (200 OK):
```json
{
  "prospect": {
    "id": "clxxxx...",
    "companyName": "AutoTest Plumbing Co",
    "businessType": "plumber",
    "city": "Minneapolis",
    "phone": "612-555-9999",
    "email": "info@autotestplumbing.com",
    "website": "https://autotestplumbing.com",
    "placeId": "test-auto-place-001",
    "googleRating": 4.7,
    "reviewCount": 35,
    "dataSource": "Manual Entry",
    "createdAt": "2026-01-10T...",
    "updatedAt": "2026-01-10T..."
  }
}
```

**Side Effects**:
- Triggers background AI analysis via `/api/prospects/[id]/analyze`
- Creates initial prospect record with default values

**Validation**:
- `companyName` is required (400 if missing)
- Duplicate detection checks `placeId` or `companyName+city`

**Authentication**: Required (401 if not authenticated)

---

### 3. GET /api/prospects/[id] (Get Single Prospect)

**Purpose**: Retrieve detailed information about a specific prospect

**Example**:
```bash
GET /api/prospects/clxxxx123
```

**Expected Response** (200 OK):
```json
{
  "prospect": {
    "id": "clxxxx123",
    "companyName": "AutoTest Plumbing Co",
    "businessType": "plumber",
    "city": "Minneapolis",
    "phone": "612-555-9999",
    "email": "info@autotestplumbing.com",
    "website": "https://autotestplumbing.com",
    "placeId": "test-auto-place-001",
    "googleRating": 4.7,
    "reviewCount": 35,
    "leadScore": null,
    "sentimentScore": null,
    "isHotLead": false,
    "lastAnalyzed": null,
    "aiRecommendations": null,
    "anomaliesDetected": null,
    "contactedAt": null,
    "isConverted": false,
    "notes": null,
    "tags": null,
    "reviews": [],
    "historicalData": [],
    "activities": [],
    "createdAt": "2026-01-10T...",
    "updatedAt": "2026-01-10T..."
  }
}
```

**Includes Related Data**:
- `reviews`: Last 20 reviews ordered by publishedAt (desc)
- `historicalData`: Last 10 historical records ordered by recordedAt (desc)
- `activities`: Last 50 activities ordered by createdAt (desc)

**Error Cases**:
- 404 if prospect not found
- 401 if not authenticated

---

### 4. PATCH /api/prospects/[id] (Update Prospect)

**Purpose**: Update prospect information and metadata

**Test Payload**:
```json
{
  "notes": "Test note from automation",
  "tags": "automation,test"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "prospect": {
    "id": "clxxxx123",
    "notes": "Test note from automation",
    "tags": "automation,test",
    ...
  }
}
```

**Supported Fields**:
- `notes`: String
- `tags`: String (comma-separated)
- `contactedAt`: ISO date string or null
- `isConverted`: Boolean

**Side Effects** (Activity Logging):
When updating certain fields, activity records are created:

1. **Notes Added**:
   ```json
   {
     "activityType": "note",
     "content": "Test note from automation",
     "createdBy": "test@example.com"
   }
   ```

2. **Tags Updated**:
   ```json
   {
     "activityType": "tag_added",
     "content": "Tags updated: automation,test",
     "createdBy": "test@example.com"
   }
   ```

3. **Contacted Status Changed**:
   ```json
   {
     "activityType": "status_change",
     "content": "Marked as contacted",
     "createdBy": "test@example.com"
   }
   ```

**Authentication**: Required (401 if not authenticated)

---

### 5. Duplicate Detection Test

**Purpose**: Verify that duplicate prospects are prevented

**Test**: Create prospect with same `placeId` as existing prospect

**Expected Response** (400 Bad Request):
```json
{
  "error": "Prospect already exists"
}
```

**Duplicate Detection Logic**:
1. If `placeId` is provided, check for existing prospect with same `placeId`
2. Otherwise, check for existing prospect with same `companyName` and `city`

---

## Test Execution

### Manual Testing

1. **Authenticate**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/callback/credentials \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     -c cookies.txt
   ```

2. **List Prospects**:
   ```bash
   curl -b cookies.txt http://localhost:3000/api/prospects?page=1&limit=20
   ```

3. **Create Prospect**:
   ```bash
   curl -X POST http://localhost:3000/api/prospects \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d '{
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
   ```

4. **Get Prospect** (replace ID):
   ```bash
   curl -b cookies.txt http://localhost:3000/api/prospects/clxxxx123
   ```

5. **Update Prospect** (replace ID):
   ```bash
   curl -X PATCH http://localhost:3000/api/prospects/clxxxx123 \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d '{
       "notes": "Test note from automation",
       "tags": "automation,test"
     }'
   ```

6. **Test Duplicate**:
   ```bash
   curl -X POST http://localhost:3000/api/prospects \
     -H "Content-Type: application/json" \
     -b cookies.txt \
     -d '{
       "companyName": "AutoTest Plumbing Co",
       "businessType": "plumber",
       "city": "Minneapolis",
       "placeId": "test-auto-place-001"
     }'
   ```

### Automated Testing

#### Using Node.js Script:
```bash
node test-prospects-crud.js
```

#### Using Bash Script:
```bash
./test-prospects-crud.sh
```

---

## Expected Output Format

```json
{
  "agent": "Agent-5-ProspectsCRUD",
  "timestamp": "2026-01-10T22:30:00.000Z",
  "results": {
    "listProspects": {
      "status": "PASS",
      "totalProspectsFound": 15,
      "filtersWorking": true,
      "details": {
        "page": 1,
        "totalPages": 1,
        "count": 15
      }
    },
    "createProspect": {
      "status": "PASS",
      "prospectId": "clxxxx123",
      "createdSuccessfully": true,
      "details": { ... }
    },
    "getProspect": {
      "status": "PASS",
      "dataCorrect": true,
      "details": {
        "hasReviews": false,
        "hasActivities": false,
        "hasHistoricalData": false
      }
    },
    "updateProspect": {
      "status": "PASS",
      "notesAdded": true,
      "details": {
        "notes": "Test note from automation",
        "tags": "automation,test"
      }
    },
    "duplicateDetection": {
      "status": "PASS",
      "correctlyPrevented": true,
      "details": {
        "errorMessage": "Prospect already exists"
      }
    }
  },
  "testProspectId": "clxxxx123",
  "criticalIssues": [],
  "apiEndpointsWorking": "5/5"
}
```

---

## Database Verification

After running tests, verify the test prospect exists in the database:

```sql
-- Connect to PostgreSQL database
psql $DATABASE_URL

-- Check if test prospect exists
SELECT id, "companyName", "businessType", city, phone, email, "placeId", notes, tags
FROM "Prospect"
WHERE "placeId" = 'test-auto-place-001';

-- Check activities for the test prospect
SELECT pa."activityType", pa.content, pa."createdBy", pa."createdAt"
FROM "ProspectActivity" pa
JOIN "Prospect" p ON pa."prospectId" = p.id
WHERE p."placeId" = 'test-auto-place-001'
ORDER BY pa."createdAt" DESC;
```

---

## Known Issues and Troubleshooting

### Issue: Authentication Failing
**Symptom**: 401 Unauthorized on all endpoints
**Solution**:
1. Check if test user exists in database
2. Verify NextAuth.js is configured correctly
3. Ensure NEXTAUTH_SECRET and NEXTAUTH_URL are set in .env

### Issue: bcryptjs Module Error
**Symptom**: "Cannot find module './vendor-chunks/bcryptjs.js'"
**Solution**:
```bash
rm -rf .next
npm run dev
```

### Issue: Database Connection Error
**Symptom**: "PrismaClientInitializationError"
**Solution**:
1. Verify DATABASE_URL in .env
2. Test connection: `npx prisma db pull`
3. Check Neon database is accessible

### Issue: Duplicate Detection Not Working
**Symptom**: Creates duplicate prospects
**Solution**:
1. Verify `placeId` is unique in database schema
2. Check database constraints: `UNIQUE` on `placeId`
3. Ensure existing data doesn't have duplicate placeIds

---

## Success Criteria

✅ **PASS Criteria**:
- All 5 endpoints return expected status codes
- List endpoint returns paginated data with correct structure
- Create endpoint successfully creates prospect and returns ID
- Get endpoint retrieves full prospect with related data
- Update endpoint modifies prospect and logs activities
- Duplicate detection prevents creation of duplicate prospects
- No critical issues reported

❌ **FAIL Criteria**:
- Any endpoint returns unexpected status code
- Authentication fails consistently
- Database operations fail
- Duplicate detection allows duplicates
- Critical issues present

---

## Next Steps

After successful completion:
1. Save `testProspectId` for use by Agents 6-7
2. Verify test prospect in database
3. Review activity logs for test prospect
4. Clean up test data if needed (optional)

**Test Prospect Info**:
- **Place ID**: `test-auto-place-001`
- **Company**: AutoTest Plumbing Co
- **Location**: Minneapolis
- **Type**: plumber

This prospect will be used by:
- **Agent-6**: Analytics & Insights Testing
- **Agent-7**: AI Analysis Testing
