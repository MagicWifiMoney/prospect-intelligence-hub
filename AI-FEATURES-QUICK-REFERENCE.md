# AI Features Quick Reference

## Setup

Add to `.env`:
```bash
ABACUSAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

## Endpoints

### AI Lead Scoring
```bash
POST /api/prospects/{id}/analyze
Authentication: Required
Returns: leadScore, sentimentScore, isHotLead, recommendations, anomalies
```

### AI Insights
```bash
POST /api/prospects/{id}/insights
Authentication: Required
Returns: outreachStrategy, painPoints, valueProposition, sentimentSummary, competitiveGaps
```

## Anomaly Detection (Automatic)

Detects:
- Personal phone numbers (cell/mobile patterns)
- Missing website
- Low review activity (<5 reviews)

## Test Suite

Run tests:
```bash
node test-ai-analysis.js
```

View results:
```bash
cat test-results/agent-7-ai-analysis-*.json
```

## Database Fields Updated

- `leadScore`
- `sentimentScore`
- `isHotLead`
- `aiRecommendations`
- `anomaliesDetected`
- `outreachStrategy`
- `painPoints`
- `lastAnalyzed`

## Current Status

- Abacus AI Scoring: NOT_CONFIGURED (add API key)
- Gemini Insights: NOT_CONFIGURED (add API key)
- Anomaly Detection: WORKING (3 types detected)

## Next Steps

1. Get API keys from:
   - Abacus AI: https://apps.abacus.ai/
   - Google Gemini: https://ai.google.dev/

2. Add keys to `.env`

3. Run test suite to verify

4. Monitor API usage and costs
