# Quick Start: Run Agent-5 Tests

## Prerequisites Check

```bash
# 1. Check if server is running
curl -s http://localhost:3000/api/auth/session

# 2. If server has errors, rebuild
rm -rf .next
npm run dev
# Wait 30 seconds for build to complete
```

## Execute Tests (Choose One Method)

### Method 1: Node.js (Recommended)
```bash
node test-prospects-crud.js
```

### Method 2: Bash Script
```bash
chmod +x test-prospects-crud.sh
./test-prospects-crud.sh
```

## View Results

```bash
# Pretty-print results
cat /tmp/agent-5-results.json | jq '.'

# Check status summary
cat /tmp/agent-5-results.json | jq '{agent, timestamp, apiEndpointsWorking, criticalIssues}'

# Get test prospect ID
cat /tmp/agent-5-results.json | jq -r '.testProspectId'
```

## Verify in Database

```bash
# Save test prospect ID
TEST_ID=$(cat /tmp/agent-5-results.json | jq -r '.testProspectId')

# Query database (requires psql)
psql postgresql://neondb_owner:npg_38wAfUZVtjbp@ep-dawn-pond-ahid3vsk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require -c "
SELECT id, \"companyName\", \"businessType\", city, notes, tags
FROM \"Prospect\"
WHERE \"placeId\" = 'test-auto-place-001';
"
```

## Quick Troubleshooting

**If you get 401 Unauthorized:**
```bash
# Create test user manually
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hash,
      firstName: 'Test',
      lastName: 'User',
      role: 'ADMIN'
    }
  });
  console.log('Test user ready:', user.email);
  await prisma.\$disconnect();
})();
"
```

**If server returns 500 errors:**
```bash
rm -rf .next
npm run dev
# Wait for rebuild, then retry tests
```

## Expected Output

```
=== Agent-5: Prospects CRUD Operations Testing ===
Timestamp: 2026-01-10T...

=== Test 1: GET /api/prospects (List - Basic) ===
✓ PASS: List prospects returned successfully

=== Test 3: POST /api/prospects (Create) ===
✓ PASS: Prospect created successfully
  ID: clxxxx...

=== Test 4: GET /api/prospects/clxxxx... (Single) ===
✓ PASS: Get single prospect successful

=== Test 5: PATCH /api/prospects/clxxxx... (Update) ===
✓ PASS: Update prospect successful

=== Test 6: Duplicate Detection ===
✓ PASS: Duplicate detection working correctly

API Endpoints Working: 5/5
```

## Save Test Prospect ID for Next Agents

```bash
# Export for Agent-6 and Agent-7
export TEST_PROSPECT_ID=$(cat /tmp/agent-5-results.json | jq -r '.testProspectId')
echo "Test Prospect ID: $TEST_PROSPECT_ID"
```

## One-Liner: Run Everything

```bash
# Fix server + run tests + view results
(rm -rf .next && npm run dev &) && sleep 30 && node test-prospects-crud.js && cat /tmp/agent-5-results.json | jq '.'
```
