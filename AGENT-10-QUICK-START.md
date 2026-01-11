# Agent-10 Quick Start Guide

## Test Execution (3 Steps)

### Step 1: Start Server
```bash
npm run dev
```

### Step 2: Get Session Token
Login at http://localhost:3000, then:
- Open DevTools (F12)
- Go to: Application → Cookies
- Copy `next-auth.session-token` value

### Step 3: Run Tests
```bash
./test-market-trends.sh YOUR_SESSION_TOKEN
```

## Quick Manual Tests

### Test GET endpoint:
```bash
curl -H "Cookie: next-auth.session-token=TOKEN" \
  http://localhost:3000/api/trends
```

### Test category filter:
```bash
curl -H "Cookie: next-auth.session-token=TOKEN" \
  "http://localhost:3000/api/trends?category=service_business&limit=10"
```

### Test auth protection:
```bash
curl http://localhost:3000/api/trends
# Expected: 401 Unauthorized
```

## Enable AI Features (Optional)

Edit `.env`:
```bash
ABACUSAI_API_KEY=your_key_here
```

Then restart server and test:
```bash
curl -X POST -H "Cookie: next-auth.session-token=TOKEN" \
  http://localhost:3000/api/trends
```

## Test Results

After running tests, check:
- `agent-10-test-results.json` - Live test results
- `agent-10-final-report.json` - Complete analysis

## Status

✅ Code Review: COMPLETE
⚠️ Live Tests: PENDING (needs server + token)
❌ AI Generation: NOT CONFIGURED (needs API key)

## Documentation

See `AGENT-10-TESTING-GUIDE.md` for complete documentation.
