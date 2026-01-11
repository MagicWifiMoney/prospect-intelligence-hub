# Agent-5: Code Analysis - Prospects CRUD API

## Overview
This document provides a detailed technical analysis of the Prospects CRUD API implementation, including authentication flow, database operations, and edge cases.

---

## Authentication Architecture

### NextAuth.js Configuration
**File**: `/lib/auth.ts`

```typescript
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 1. Validate credentials exist
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 2. Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        // 3. Verify user and password exist
        if (!user?.password) {
          return null
        }

        // 4. Compare password hash
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        // 5. Return user object or null
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,  // Using JWT instead of database sessions
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT token
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID and role to session
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
}
```

**Key Points**:
- Uses JWT strategy (no database session storage)
- Passwords hashed with bcryptjs
- Custom role-based authorization via callbacks
- User role stored in JWT token and session

---

## API Route: GET /api/prospects

### Location
`/app/api/prospects/route.ts` (lines 9-112)

### Authentication Check
```typescript
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Query Parameters Processing
```typescript
const { searchParams } = new URL(request.url)
const page = parseInt(searchParams.get('page') || '1')
const limit = parseInt(searchParams.get('limit') || '20')
const search = searchParams.get('search')
const businessType = searchParams.get('businessType')
const city = searchParams.get('city')
const isHotLead = searchParams.get('isHotLead')
const hasAnomalies = searchParams.get('hasAnomalies')
const minScore = searchParams.get('minScore')
const maxScore = searchParams.get('maxScore')

const skip = (page - 1) * limit
```

### Dynamic Where Clause Building
```typescript
const where: any = {}

// Search across multiple fields (OR condition)
if (search) {
  where.OR = [
    { companyName: { contains: search, mode: 'insensitive' } },
    { businessType: { contains: search, mode: 'insensitive' } },
    { city: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search } },
    { website: { contains: search, mode: 'insensitive' } },
  ]
}

// Business type filter (fuzzy match)
if (businessType && businessType !== 'all') {
  where.businessType = { contains: businessType, mode: 'insensitive' }
}

// City filter (exact match)
if (city && city !== 'all') {
  where.city = city
}

// Hot lead filter (boolean)
if (isHotLead === 'true') {
  where.isHotLead = true
}

// Anomalies filter (check for non-null)
if (hasAnomalies === 'true') {
  where.anomaliesDetected = { not: null }
}

// Score range filter (numeric range)
if (minScore || maxScore) {
  where.leadScore = {}
  if (minScore) where.leadScore.gte = parseFloat(minScore)
  if (maxScore) where.leadScore.lte = parseFloat(maxScore)
}
```

**Important Notes**:
- Search is case-insensitive for text fields
- Phone search is case-sensitive (numbers)
- BusinessType uses fuzzy matching (contains)
- City uses exact matching
- Special values 'all' are excluded from filtering

### Database Query
```typescript
const [prospects, total] = await Promise.all([
  prisma.prospect.findMany({
    where,
    skip,
    take: limit,
    orderBy: { leadScore: 'desc' },  // Always sorted by score
    select: {
      // Limited fields for list view (performance optimization)
      id: true,
      companyName: true,
      businessType: true,
      address: true,
      city: true,
      phone: true,
      email: true,
      website: true,
      gbpUrl: true,
      googleRating: true,
      reviewCount: true,
      leadScore: true,
      sentimentScore: true,
      isHotLead: true,
      lastAnalyzed: true,
      aiRecommendations: true,
      anomaliesDetected: true,
      contactedAt: true,
      isConverted: true,
      updatedAt: true,
    },
  }),
  prisma.prospect.count({ where }),
])
```

**Performance Optimizations**:
- Parallel execution of query and count (Promise.all)
- Select only necessary fields (not full prospect object)
- Pagination to limit result set size

### Response Format
```typescript
return NextResponse.json({
  prospects,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
})
```

---

## API Route: POST /api/prospects

### Location
`/app/api/prospects/route.ts` (lines 114-187)

### Request Body Processing
```typescript
const body = await request.json()
const {
  companyName,
  businessType,
  address,
  city,
  phone,
  email,
  website,
  gbpUrl,
  placeId,
} = body
```

### Validation
```typescript
if (!companyName) {
  return NextResponse.json(
    { error: 'Company name is required' },
    { status: 400 }
  )
}
```

**Only validates**: `companyName` is required
**All other fields**: Optional

### Duplicate Detection Logic
```typescript
const existingProspect = placeId
  ? await prisma.prospect.findUnique({ where: { placeId } })
  : await prisma.prospect.findFirst({
      where: {
        companyName,
        city: city || undefined,
      },
    })

if (existingProspect) {
  return NextResponse.json(
    { error: 'Prospect already exists' },
    { status: 400 }
  )
}
```

**Logic Flow**:
1. If `placeId` provided: Check for unique placeId (indexed field)
2. If no `placeId`: Check for combination of companyName + city
3. Return 400 if match found

**Edge Cases**:
- If city is null/undefined, only checks companyName
- placeId takes precedence over name+city check
- Case-sensitive comparison for placeId
- Exact match required (no fuzzy matching)

### Prospect Creation
```typescript
const prospect = await prisma.prospect.create({
  data: {
    companyName,
    businessType,
    address,
    city,
    phone,
    email,
    website,
    gbpUrl,
    placeId,
    dataSource: 'Manual Entry',  // Hard-coded
  },
})
```

**Default Values**:
- `dataSource`: Always "Manual Entry" for API created prospects
- All other fields use Prisma schema defaults (e.g., leadScore: null)

### Background AI Analysis Trigger
```typescript
fetch(`${request.nextUrl.origin}/api/prospects/${prospect.id}/analyze`, {
  method: 'POST',
}).catch(() => {}) // Fire and forget
```

**Key Characteristics**:
- Asynchronous (doesn't block response)
- Fire-and-forget (errors ignored)
- Uses internal API endpoint
- Triggered immediately after creation

---

## API Route: GET /api/prospects/[id]

### Location
`/app/api/prospects/[id]/route.ts` (lines 6-46)

### Dynamic Route Parameter
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
)
```

### Database Query with Relations
```typescript
const prospect = await prisma.prospect.findUnique({
  where: { id: params.id },
  include: {
    reviews: {
      orderBy: { publishedAt: 'desc' },
      take: 20  // Only last 20 reviews
    },
    historicalData: {
      orderBy: { recordedAt: 'desc' },
      take: 10  // Only last 10 snapshots
    },
    activities: {
      orderBy: { createdAt: 'desc' },
      take: 50  // Only last 50 activities
    }
  }
})
```

**Performance Considerations**:
- Limits related records to prevent huge response sizes
- Ordered by most recent first
- Single database query with joins

### 404 Handling
```typescript
if (!prospect) {
  return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
}
```

---

## API Route: PATCH /api/prospects/[id]

### Location
`/app/api/prospects/[id]/route.ts` (lines 48-114)

### Request Body Processing
```typescript
const body = await req.json()
const { notes, tags, contactedAt, isConverted } = body

const updateData: any = {}
if (notes !== undefined) updateData.notes = notes
if (tags !== undefined) updateData.tags = tags
if (contactedAt !== undefined) updateData.contactedAt = contactedAt ? new Date(contactedAt) : null
if (isConverted !== undefined) updateData.isConverted = isConverted
```

**Key Points**:
- Only updates provided fields (partial update)
- `undefined` check allows setting fields to null
- Date conversion for contactedAt
- No validation on field values

### Prospect Update
```typescript
const prospect = await prisma.prospect.update({
  where: { id: params.id },
  data: updateData
})
```

**Behavior**:
- Throws error if prospect not found (caught by error handler)
- Returns updated prospect object
- Updates timestamp automatically (Prisma updatedAt)

### Activity Logging

#### Note Activity
```typescript
if (notes) {
  await prisma.prospectActivity.create({
    data: {
      prospectId: params.id,
      activityType: 'note',
      content: notes,
      createdBy: session.user?.email || 'system'
    }
  })
}
```

#### Tag Activity
```typescript
if (tags) {
  await prisma.prospectActivity.create({
    data: {
      prospectId: params.id,
      activityType: 'tag_added',
      content: `Tags updated: ${tags}`,
      createdBy: session.user?.email || 'system'
    }
  })
}
```

#### Contacted Activity
```typescript
if (contactedAt) {
  await prisma.prospectActivity.create({
    data: {
      prospectId: params.id,
      activityType: 'status_change',
      content: 'Marked as contacted',
      createdBy: session.user?.email || 'system'
    }
  })
}
```

**Important Notes**:
- Activities created AFTER prospect update
- Separate database operations (not transactional)
- Uses session email for createdBy (falls back to "system")
- Each update type logs separate activity
- No activity logged for isConverted (potential bug?)

---

## Error Handling Patterns

### Common Pattern
```typescript
try {
  // API logic
} catch (error) {
  console.error('Error description:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Characteristics**:
- Generic error message to client
- Detailed error logged to console
- Always returns 500 status
- No error differentiation for client

**Potential Issues**:
- Hides database errors from client
- No retry logic
- No error categorization
- Doesn't distinguish between different error types

---

## Database Schema Dependencies

### Prospect Table
```typescript
model Prospect {
  id                  String   @id @default(cuid())
  companyName         String
  businessType        String?
  address             String?
  city                String?
  phone               String?
  email               String?
  website             String?
  gbpUrl              String?
  placeId             String?  @unique
  googleRating        Float?
  reviewCount         Int?
  leadScore           Float?
  sentimentScore      Float?
  isHotLead           Boolean  @default(false)
  lastAnalyzed        DateTime?
  aiRecommendations   String?
  anomaliesDetected   String?
  contactedAt         DateTime?
  isConverted         Boolean  @default(false)
  notes               String?
  tags                String?
  dataSource          String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  reviews             Review[]
  historicalData      HistoricalData[]
  activities          ProspectActivity[]
}
```

### Related Tables
- **Review**: One-to-many relationship
- **HistoricalData**: One-to-many relationship
- **ProspectActivity**: One-to-many relationship

---

## Security Considerations

### ✅ Implemented
1. Authentication required on all endpoints
2. Session-based authorization (JWT)
3. SQL injection prevention (Prisma ORM)
4. Input sanitization via Prisma

### ⚠️ Missing
1. Role-based access control (all authenticated users have same permissions)
2. Rate limiting
3. Input validation (only companyName required)
4. Email/phone format validation
5. URL validation for website/gbpUrl
6. CSRF protection
7. Request size limits
8. Activity logging for all operations (missing for isConverted)

---

## Performance Considerations

### ✅ Optimizations
1. Pagination for list endpoint
2. Field selection (select only needed fields)
3. Parallel queries (Promise.all)
4. Database indexes on placeId
5. Limit related records (reviews, activities)

### ⚠️ Potential Issues
1. No caching layer
2. No database connection pooling configuration
3. Search uses `contains` (slower than indexed search)
4. Multiple separate database calls for activity logging
5. No query result streaming for large datasets

---

## Testing Recommendations

### Unit Tests
- [ ] Duplicate detection logic
- [ ] Where clause building
- [ ] Date parsing for contactedAt
- [ ] Activity logging conditions

### Integration Tests
- [ ] Authentication flow
- [ ] Database operations
- [ ] Related data fetching
- [ ] Background job triggering

### Edge Cases
- [ ] Empty search results
- [ ] Invalid prospect ID
- [ ] Null/undefined field values
- [ ] Large pagination values
- [ ] Concurrent updates
- [ ] Network errors during background job trigger

---

## API Improvements Suggestions

### Input Validation
```typescript
// Add Zod schema validation
const createProspectSchema = z.object({
  companyName: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/).optional(),
  website: z.string().url().optional(),
  googleRating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
})
```

### Error Handling
```typescript
// Differentiate error types
if (error instanceof Prisma.PrismaClientKnownRequestError) {
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'Duplicate entry' },
      { status: 409 }
    )
  }
}
```

### Activity Logging
```typescript
// Use database transaction
await prisma.$transaction([
  prisma.prospect.update({ where: { id }, data: updateData }),
  ...activityLogs.map(log => prisma.prospectActivity.create({ data: log }))
])
```

### Caching
```typescript
// Add Redis caching for frequently accessed prospects
const cached = await redis.get(`prospect:${id}`)
if (cached) return JSON.parse(cached)
```

---

## Conclusion

The Prospects CRUD API is well-structured with:
- ✅ Clean separation of concerns
- ✅ Proper authentication
- ✅ Efficient database queries
- ✅ Good pagination support

Areas for improvement:
- ⚠️ Input validation
- ⚠️ Error handling granularity
- ⚠️ Transaction safety for updates
- ⚠️ Role-based permissions
- ⚠️ Comprehensive activity logging
