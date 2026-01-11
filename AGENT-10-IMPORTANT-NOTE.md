# IMPORTANT: Category Filtering Behavior

## Critical Discovery

The category filtering in `/api/trends` works as follows:

### Database Query
```javascript
const where: any = {}
if (category && category !== 'all') {
  where.category = category  // Uses raw query param value
}
```

This means the category filter searches the **database category field directly**, not the transformed frontend category.

### How Categories Work

1. **Database Categories** (stored in MarketTrend.category):
   - Can be: "Service Business", "Marketing", "Technology", "Customer Behavior", etc.
   - These are the raw values from AI generation or data import

2. **Frontend Categories** (after transformation):
   - `service_business` - mapped from database categories containing "service" or "contractor"
   - `general_market` - default for unmatched categories
   - `industry_news` - mapped from categories containing "news" or "industry"

3. **The Mapping Happens After Retrieval**:
   ```javascript
   const trends = dbTrends.map(trend => ({
     category: mapCategory(trend.category),  // Transform happens here
     // ... other fields
   }))
   ```

### Practical Implications

#### Scenario A: Using Frontend Category as Filter
```bash
curl "http://localhost:3000/api/trends?category=service_business"
```
- Searches database for `category='service_business'` (exact match)
- Will only return records where database category is literally "service_business"
- Most records won't match because database has "Service Business" (capital S, space)

#### Scenario B: Using Database Category as Filter
```bash
curl "http://localhost:3000/api/trends?category=Service%20Business"
```
- Searches database for `category='Service Business'`
- Will return all records with that exact database category
- Results then transformed to `category: 'service_business'` in response

#### Scenario C: No Filter
```bash
curl "http://localhost:3000/api/trends"
```
- Returns all trends from database
- Each trend's category is transformed via `mapCategory()`
- Most reliable approach for getting all trends by frontend category

### Testing Recommendations

1. **First Test Without Filter**:
   - `GET /api/trends` - Get all trends
   - Inspect the actual database categories in use
   - Note what categories exist in your database

2. **Then Test With Database Categories**:
   - Use actual category values from database
   - Example: `?category=Service Business` (if that's what's in DB)

3. **Frontend Category Filtering**:
   - Should happen client-side after receiving all trends
   - Or API should be enhanced to map frontend categories to database categories before querying

### Code Review Note

The current implementation has a slight mismatch:
- **Query uses database category** (raw value)
- **Response uses frontend category** (transformed value)

This means:
- ✅ `?category=Service Business` - Works (searches database)
- ❌ `?category=service_business` - Unlikely to work (unless DB has exact match)
- ✅ No filter + client-side filtering - Works reliably

### Updated Test Plan

The test script should:
1. First GET all trends without filter
2. Inspect actual database categories
3. Test filtering with actual DB categories
4. Document the discrepancy between DB and frontend categories

### Recommended Fix (Future Enhancement)

Add reverse mapping in the API route:

```javascript
// Convert frontend category to database categories before query
function getDatabaseCategories(frontendCategory: string): string[] {
  switch (frontendCategory) {
    case 'service_business':
      return ['Service Business', 'service', 'contractor']
    case 'industry_news':
      return ['news', 'industry']
    case 'general_market':
      return ['Marketing', 'Technology', 'Customer Behavior']
    default:
      return [frontendCategory]
  }
}

// Then in GET handler:
if (category && category !== 'all') {
  const dbCategories = getDatabaseCategories(category)
  where.category = { in: dbCategories }
}
```

But for now, the tests should work with database categories, not frontend categories.

### Conclusion

- Category filtering **works** but expects **database category values**
- Frontend category values (`service_business`, etc.) are **display-only**
- Tests should use actual database categories for filtering
- Or use no filter and rely on getting all trends
