# 🎯 Prospect Intelligence Hub

> AI-Powered Lead Generation & CRM Platform for Minnesota Contractor & Service Businesses

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Live Demo**: [https://localmania.abacusai.app](https://localmania.abacusai.app) • **Click "View Demo"** for instant access

---

## 📖 Table of Contents

- [Background & Motivation](#-background--motivation)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Lead Scoring Algorithm](#-lead-scoring-algorithm)
- [Automated Collection](#-automated-collection)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Background & Motivation

### The Problem

B2B lead generation agencies and service providers face several challenges:

1. **Manual Prospecting** - Spending hours manually searching for potential clients on Google
2. **Quality Assessment** - Difficulty identifying high-quality leads from mediocre ones
3. **Data Fragmentation** - Contact info, ratings, and business data scattered across sources
4. **Outreach Efficiency** - No systematic way to prioritize which prospects to contact first
5. **Market Intelligence** - Missing insights on industry trends and competitive gaps

### The Solution

**Prospect Intelligence Hub** is a comprehensive SaaS platform that:

- ✅ **Automates** prospect discovery through Google Business Profile scraping
- ✅ **Scores** leads using a 6-factor AI algorithm (0-100 points)
- ✅ **Prioritizes** hot leads meeting strict quality criteria
- ✅ **Analyzes** prospects using Gemini AI for personalized outreach strategies
- ✅ **Tracks** market trends and anomalies for competitive advantage
- ✅ **Exports** data to CRM systems and email marketing platforms

### Target Users

- 🎯 **Lead Generation Agencies** - Find and qualify B2B leads at scale
- 🏢 **Marketing Agencies** - Identify prospects needing web design, SEO, or advertising
- 📞 **Sales Teams** - Prioritize outreach with data-driven lead scores
- 🛠️ **Service Providers** - Discover businesses lacking essential services (websites, call tracking)
- 📊 **Market Researchers** - Analyze industry trends and competitive landscapes

---

## ✨ Key Features

### 1. AI-Powered Lead Scoring (0-100)

Every prospect receives an automated score based on:

| Factor | Weight | Purpose |
|--------|--------|----------|
| **Google Rating** | 25 pts | Quality indicator |
| **Review Count** | 20 pts | Business establishment |
| **Website Presence** | 15 pts | Online professionalism |
| **Contact Info** | 10 pts | Reachability |
| **Social Media** | 10 pts | Marketing maturity |
| **Business Age** | 10 pts | Stability & growth |

**Result**: Instantly identify the best prospects from thousands of records.

### 2. Hot Lead Identification

Automatically flags premium prospects meeting ALL criteria:
- Lead Score ≥ 70
- Google Rating ≥ 4.5⭐
- Review Count ≥ 20
- Has Website
- Has Phone Number

**Current Database**: 170 hot leads out of 3,747 total prospects (4.5%)

### 3. AI Insights with Gemini

For any prospect, generate:
- 🎯 **Outreach Strategy** - Personalized approach based on business profile
- 🔍 **Pain Points** - Challenges your service can solve
- 💎 **Value Proposition** - Why they need your solution
- 📊 **Competitive Gaps** - Areas where they're falling behind
- 💬 **Sentiment Analysis** - Customer perception from reviews

### 4. Market Intelligence Dashboard

- 📈 **Trend Analysis** - AI-generated insights on industry shifts
- 🚨 **Anomaly Detection** - Find businesses with issues (no website, low reviews)
- 🆕 **New Business Tracking** - Early outreach opportunities
- 📊 **Analytics** - Lead distribution, conversion metrics, geographic patterns

### 5. Quick Actions & CRM Integration

- 📋 **Copy Contact Info** - One-click phone/email copying
- 🌐 **Open Links** - Direct access to GBP, website, social profiles
- ✉️ **Generate Messages** - AI-powered outreach templates
- ✅ **Status Tracking** - Mark as contacted/converted
- 📤 **CSV Export** - Import leads into any CRM

### 6. Automated Data Collection

Weekly scraper configured for:
- **15 Business Categories**: Landscaping, HVAC, Plumbing, Painting, Roofing, etc.
- **10 Minnesota Cities**: Minneapolis, St. Paul, Bloomington, Rochester, Duluth, etc.
- **Expected Yield**: 1,500-2,500 new businesses per run
- **Email Reports**: Sent to configured address with CSV attachments

---

## 🔧 How It Works

### Data Collection Flow

```
┌─────────────────┐
│ Outscraper API  │
│ (Google Maps)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Data Processor  │
│ - Normalize     │
│ - Deduplicate   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Lead Scoring    │
│ Algorithm       │
│ (6 factors)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL DB   │
│ (Prisma ORM)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Next.js UI      │
│ Dashboard       │
└─────────────────┘
```

### AI Insights Generation

```
┌─────────────┐      ┌──────────────┐
│  User       │─────→│  Dashboard   │
│  Request    │      │  UI          │
└─────────────┘      └──────┬───────┘
                            │
                            ▼
┌─────────────────────────────────────┐
│  /api/prospects/[id]/insights       │
│  - Fetch business data              │
│  - Format prompt for Gemini         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Gemini API (Google AI)             │
│  - Analyze reviews & profile        │
│  - Generate insights                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Parse & Store Results              │
│  - outreachStrategy                 │
│  - painPoints (array)               │
│  - valueProposition                 │
│  - competitiveGaps (array)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Update Database & Activity Log     │
└─────────────────────────────────────┘
```

### Lead Scoring Calculation

```typescript
// Example: Calculate lead score
const score = (
  (googleRating / 5) * 25 +                    // Max 25 pts
  Math.min((reviewCount / 200) * 20, 20) +     // Max 20 pts
  (hasWebsite ? 15 : 0) +                      // 15 pts
  (hasPhone && hasEmail ? 10 : 5) +            // 10 pts
  (hasSocialMedia ? 10 : 0) +                  // 10 pts
  (isEstablished ? 10 : 5)                     // 10 pts
)

// Hot Lead Criteria
const isHotLead = (
  score >= 70 &&
  googleRating >= 4.5 &&
  reviewCount >= 20 &&
  hasWebsite &&
  hasPhone
)
```

---

## 🏗️ Architecture

### System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Browser    │  │   Mobile     │  │   Tablet     │       │
│  │   (Chrome)   │  │   (Safari)   │  │   (iPad)     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 14 (App Router)                 │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │   Pages    │  │    API     │  │ Components │    │   │
│  │  │  (Server)  │  │  Routes    │  │   (RSC)    │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Authentication Layer                     │   │
│  │                (NextAuth.js)                         │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  DATABASE TIER  │ │   AI SERVICES   │ │  STORAGE TIER   │
│  ┌───────────┐  │ │  ┌───────────┐  │ │  ┌───────────┐  │
│  │PostgreSQL │  │ │  │  Gemini   │  │ │  │  AWS S3   │  │
│  │  +Prisma  │  │ │  │    API    │  │ │  │  Bucket   │  │
│  └───────────┘  │ │  └───────────┘  │ │  └───────────┘  │
│                 │ │  ┌───────────┐  │ │                 │
│                 │ │  │Outscraper │  │ │                 │
│                 │ │  │    API    │  │ │                 │
│                 │ │  └───────────┘  │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Database Schema (Simplified)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      String   @default("user")
}

model Prospect {
  id              String    @id @default(cuid())
  companyName     String
  businessType    String?
  city            String?
  phone           String?
  email           String?
  website         String?
  googleRating    Float?
  reviewCount     Int?
  leadScore       Int?
  isHotLead       Boolean   @default(false)
  outreachStrategy String?  // AI-generated
  painPoints      String[]  // AI-generated
  activities      ProspectActivity[]
}

model ProspectActivity {
  id          String   @id @default(cuid())
  prospectId  String
  prospect    Prospect @relation(...)
  action      String   // "viewed", "contacted", "ai_insights"
  createdAt   DateTime @default(now())
}

model MarketTrend {
  id          String   @id @default(cuid())
  title       String
  content     String
  impact      String   // "high", "medium", "low"
  category    String
}
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript 5.2](https://www.typescriptlang.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [Shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS 3.3](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/), [Chart.js](https://www.chartjs.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/), React Context

### Backend
- **Runtime**: Node.js 18+
- **Database**: [PostgreSQL 14+](https://www.postgresql.org/)
- **ORM**: [Prisma 6.7](https://www.prisma.io/)
- **Authentication**: [NextAuth.js 4.24](https://next-auth.js.org/)
- **Password Hashing**: bcryptjs
- **File Storage**: AWS S3 (via AWS SDK v3)

### AI & APIs
- **AI Engine**: [Google Gemini 1.5 Flash](https://ai.google.dev/)
- **Data Collection**: [Outscraper API](https://outscraper.com/)
- **Additional APIs**: Perplexity, Apify, DataForSEO

### Development Tools
- **Package Manager**: Yarn 1.22+
- **Linting**: ESLint 9.24 + Prettier 5.1
- **Type Checking**: TypeScript Compiler (tsc)
- **Git Hooks**: (Optional) Husky + lint-staged

### Deployment
- **Platform**: Abacus.AI (Cloud Hosting)
- **Domain**: localmania.abacusai.app
- **Environment**: Production-ready with auto-scaling

---

## 📋 Prerequisites

### Required Software

- **Node.js**: Version 18.x or higher
  ```bash
  node --version  # Should be v18.x.x or higher
  ```

- **Yarn**: Version 1.22+
  ```bash
  npm install -g yarn
  yarn --version
  ```

- **PostgreSQL**: Version 14+ (local or hosted)
  - [Download PostgreSQL](https://www.postgresql.org/download/)
  - Or use hosted: [Supabase](https://supabase.com/), [Neon](https://neon.tech/), [Railway](https://railway.app/)

- **Git**: For version control
  ```bash
  git --version
  ```

### Required API Keys

1. **Google Gemini API Key** (Required for AI insights)
   - Get it: https://ai.google.dev/
   - Free tier: 60 requests/minute

2. **Outscraper API Key** (Optional - for automated collection)
   - Get it: https://outscraper.com/
   - Free tier: 1,000 credits/month

3. **Abacus.AI API Key** (Optional - for LLM fallback)
   - Get it: https://abacus.ai/

4. **AWS S3 Credentials** (Optional - for file uploads)
   - If using file upload features
   - Set up: https://aws.amazon.com/s3/

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MagicWifiMoney/local-mania.git
cd local-mania
```

### 2. Install Dependencies

```bash
cd nextjs_space
yarn install
```

This installs all required packages:
- Next.js and React
- Prisma ORM
- Authentication libraries
- UI components
- AI SDK dependencies

**Installation time**: ~2-3 minutes

### 3. Verify Installation

```bash
yarn --version  # Should show yarn version
node --version  # Should show Node.js version
```

---

## ⚙️ Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/prospect_db"

# NextAuth (Generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AI APIs
GEMINI_API_KEY="AIzaSy..."              # Required for AI insights
ABACUSAI_API_KEY="your-abacusai-key"    # Optional

# AWS S3 (Optional - for file uploads)
AWS_PROFILE="hosted_storage"
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="your-folder/"
```

### 3. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in `.env`

---

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

#### Install PostgreSQL

**macOS** (via Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows**:
- Download from https://www.postgresql.org/download/windows/

#### Create Database

```bash
psql postgres
```

```sql
CREATE DATABASE prospect_db;
CREATE USER prospect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE prospect_db TO prospect_user;
\q
```

#### Update DATABASE_URL

```env
DATABASE_URL="postgresql://prospect_user:your_password@localhost:5432/prospect_db"
```

### Option 2: Hosted PostgreSQL (Recommended)

#### Supabase
1. Create account: https://supabase.com/
2. Create new project
3. Copy connection string from Settings → Database
4. Paste into `DATABASE_URL`

#### Railway
1. Create account: https://railway.app/
2. New Project → PostgreSQL
3. Copy `DATABASE_URL` from Variables tab

#### Neon
1. Create account: https://neon.tech/
2. Create project
3. Copy connection string

### Initialize Database Schema

```bash
# Generate Prisma client
yarn prisma generate

# Push schema to database
yarn prisma db push

# (Optional) Open Prisma Studio to view data
yarn prisma studio
```

### Seed Database with Sample Data

```bash
yarn prisma db seed
```

This creates:
- ✅ 2 admin users (john@doe.com, admin@marketingagency.com)
- ✅ 1 demo user (demo@prospectintel.com)
- ✅ 3,747 prospects (if CSV files present in `/data/`)
- ✅ 3 sample market trends

**Default Passwords** (bcrypt hashed):
- Admin: `johndoe123` / `admin123`
- Demo: `demo123`

---

## 🚀 Running the Application

### Development Mode

```bash
cd nextjs_space
yarn dev
```

Open browser: http://localhost:3000

**Features in Dev Mode**:
- ✅ Hot reload on file changes
- ✅ Detailed error messages
- ✅ React DevTools support
- ✅ Source maps enabled

### Production Build

```bash
# Build for production
yarn build

# Start production server
yarn start
```

### Database Management

```bash
# Generate Prisma client after schema changes
yarn prisma generate

# Push schema changes to database
yarn prisma db push

# Open Prisma Studio (GUI for database)
yarn prisma studio

# Seed database with initial data
yarn prisma db seed
```

### Linting & Type Checking

```bash
# Run ESLint
yarn lint

# Type check without building
tsc --noEmit
```

---

## 📁 Project Structure

```
prospect_intelligence_hub/
├── nextjs_space/                    # Main application directory
│   ├── app/                         # Next.js App Router
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/[...nextauth]/  # NextAuth endpoints
│   │   │   ├── prospects/           # Prospect CRUD
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── insights/    # AI insights generation
│   │   │   │   │   └── route.ts     # Get/update prospect
│   │   │   │   ├── refresh/         # Manual data refresh
│   │   │   │   └── route.ts         # List prospects
│   │   │   ├── trends/              # Market trends
│   │   │   └── signup/              # User registration
│   │   ├── auth/                    # Auth pages
│   │   │   ├── signin/              # Login page
│   │   │   └── signup/              # Registration page
│   │   ├── dashboard/               # Dashboard pages
│   │   │   ├── prospects/           # All prospects
│   │   │   │   └── [id]/            # Prospect detail
│   │   │   ├── hot-leads/           # Hot leads list
│   │   │   ├── analytics/           # Analytics dashboard
│   │   │   ├── trends/              # Market trends
│   │   │   ├── anomalies/           # Anomaly detection
│   │   │   ├── new-businesses/      # New business tracker
│   │   │   ├── add-prospects/       # Import/add prospects
│   │   │   ├── reports/             # Export & reports
│   │   │   ├── settings/            # User settings
│   │   │   ├── layout.tsx           # Dashboard layout
│   │   │   └── page.tsx             # Dashboard home
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing page
│   │   └── globals.css              # Global styles
│   ├── components/                  # React components
│   │   ├── dashboard/
│   │   │   ├── header.tsx           # Dashboard header
│   │   │   ├── sidebar.tsx          # Navigation sidebar
│   │   │   ├── overview-stats.tsx   # Stats cards
│   │   │   └── recent-activity.tsx  # Activity feed
│   │   ├── prospects/
│   │   │   ├── prospects-table.tsx  # Main table
│   │   │   ├── prospects-filters.tsx# Filters
│   │   │   └── quick-actions-menu.tsx# Actions dropdown
│   │   ├── hot-leads/
│   │   │   └── hot-leads-table.tsx  # Hot leads table
│   │   ├── analytics/
│   │   │   ├── analytics-overview.tsx
│   │   │   └── performance-charts.tsx
│   │   ├── ui/                      # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── lead-scoring-info.tsx # Lead scoring modal
│   │   │   └── ...                  # 40+ components
│   │   └── auth/
│   │       ├── signin-form.tsx      # Login form
│   │       └── signup-form.tsx      # Registration form
│   ├── lib/                         # Utilities & configs
│   │   ├── auth.ts                  # NextAuth config
│   │   ├── db.ts                    # Prisma client
│   │   ├── aws-config.ts            # AWS S3 config
│   │   ├── s3.ts                    # S3 operations
│   │   ├── types.ts                 # TypeScript types
│   │   └── utils.ts                 # Helper functions
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   ├── scripts/
│   │   └── seed.ts                  # Database seeding
│   ├── data/                        # Data files (gitignored)
│   │   ├── README.md                # Data setup guide
│   │   ├── prospect_list.csv        # Initial data (local only)
│   │   └── prospect_list_expanded.csv # Extended data (local only)
│   ├── public/                      # Static assets
│   │   └── favicon.svg
│   ├── .env                         # Environment variables (gitignored)
│   ├── .env.example                 # Environment template
│   ├── .gitignore                   # Git exclusions
│   ├── next.config.js               # Next.js config
│   ├── tailwind.config.ts           # Tailwind config
│   ├── tsconfig.json                # TypeScript config
│   ├── package.json                 # Dependencies
│   └── README.md                    # This file
├── shared/                          # Shared configs (gitignored)
│   └── prospect_intel/
│       ├── mn_prospect_config.json  # Collection config
│       ├── mn_prospect_collector.js # Automated scraper
│       └── send_email_report.js     # Email reports
├── SECURITY_AUDIT.md                # Security documentation
└── DATA_REFRESH_VERIFICATION.md     # Testing verification
```

---

## 📡 API Documentation

### Authentication

#### POST `/api/auth/[...nextauth]`
NextAuth.js authentication endpoints (handled automatically)

#### POST `/api/signup`
Register new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201):
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### Prospects

#### GET `/api/prospects`
Fetch all prospects with optional filters

**Query Parameters**:
- `search` - Search by company name
- `city` - Filter by city
- `businessType` - Filter by business type
- `minScore` - Minimum lead score
- `maxScore` - Maximum lead score
- `anomalies_only` - Show only anomalies (true/false)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

**Example**:
```bash
GET /api/prospects?city=Plymouth&minScore=70&limit=20
```

**Response** (200):
```json
{
  "prospects": [
    {
      "id": "clx...",
      "companyName": "Prime Painting Concepts",
      "businessType": "Painter",
      "city": "Plymouth",
      "phone": "+1612-702-4257",
      "email": null,
      "website": "http://primepaintingconcepts.com/",
      "googleRating": 4.9,
      "reviewCount": 45,
      "leadScore": 72,
      "isHotLead": true,
      "lastAnalyzed": "2024-12-22T10:30:00Z"
    }
  ],
  "total": 170,
  "page": 1,
  "totalPages": 9
}
```

#### GET `/api/prospects/[id]`
Fetch single prospect details

**Response** (200):
```json
{
  "id": "clx...",
  "companyName": "Prime Painting Concepts",
  "businessType": "Painter",
  "address": "14615 7th Ave N, Plymouth, MN 55447",
  "city": "Plymouth",
  "phone": "+1612-702-4257",
  "email": null,
  "website": "http://primepaintingconcepts.com/",
  "googleRating": 4.9,
  "reviewCount": 45,
  "leadScore": 72,
  "isHotLead": true,
  "outreachStrategy": "Focus on high-quality workmanship...",
  "painPoints": ["Finding reliable contractors", "Quality consistency"],
  "activities": [
    {
      "id": "clx...",
      "action": "viewed",
      "createdAt": "2024-12-22T10:30:00Z"
    }
  ],
  "lastAnalyzed": "2024-12-22T10:30:00Z"
}
```

#### PATCH `/api/prospects/[id]`
Update prospect data

**Request Body**:
```json
{
  "notes": "Called on 12/22, interested in web redesign",
  "tags": ["hot-lead", "web-design"],
  "contacted": true,
  "converted": false
}
```

**Response** (200):
```json
{
  "message": "Prospect updated successfully",
  "prospect": { /* updated prospect */ }
}
```

#### POST `/api/prospects/[id]/insights`
Generate AI insights for prospect

**Response** (200):
```json
{
  "insights": {
    "outreachStrategy": "Emphasize your 5-star reviews...",
    "painPoints": [
      "Finding reliable service providers",
      "Coordinating schedules",
      "Quality consistency"
    ],
    "valueProposition": "Your proven track record...",
    "competitiveGaps": [
      "Limited social media presence",
      "No email marketing visible"
    ],
    "sentimentSummary": "Highly positive customer reviews"
  },
  "message": "Insights generated successfully"
}
```

#### GET `/api/prospects/hot-leads`
Fetch all hot leads (score ≥ 70 + criteria)

**Response** (200):
```json
{
  "hotLeads": [ /* array of hot lead prospects */ ],
  "total": 170
}
```

#### POST `/api/prospects/refresh`
Trigger manual data refresh

**Response** (200):
```json
{
  "message": "Data refresh initiated",
  "jobId": "job_clx...",
  "status": "running"
}
```

### Market Trends

#### GET `/api/trends`
Fetch market trends

**Response** (200):
```json
{
  "trends": [
    {
      "id": "clx...",
      "title": "Digital Marketing Shift",
      "summary": "Local businesses increasing Google Ads spend...",
      "impact": "high",
      "category": "marketing",
      "direction": "up",
      "createdAt": "2024-12-22T10:00:00Z"
    }
  ]
}
```

#### POST `/api/trends`
Generate new AI-powered trends

**Response** (201):
```json
{
  "message": "Trends generated successfully",
  "trends": [ /* array of new trends */ ]
}
```

---

## 🎯 Lead Scoring Algorithm

### Scoring Breakdown

```typescript
function calculateLeadScore(prospect: Prospect): number {
  let score = 0

  // 1. Google Rating (Max 25 points)
  if (prospect.googleRating) {
    score += (prospect.googleRating / 5) * 25
  }
  // Example: 4.5⭐ = (4.5/5) × 25 = 22.5 pts

  // 2. Review Count (Max 20 points)
  if (prospect.reviewCount) {
    score += Math.min((prospect.reviewCount / 200) * 20, 20)
  }
  // Example: 45 reviews = (45/200) × 20 = 4.5 pts
  // Example: 500 reviews = capped at 20 pts

  // 3. Website Presence (15 points)
  if (prospect.website) {
    score += 15
  }

  // 4. Contact Information (10 points)
  if (prospect.phone && prospect.email) {
    score += 10
  } else if (prospect.phone || prospect.email) {
    score += 5
  }

  // 5. Social Media Presence (10 points)
  const hasSocial = (
    prospect.facebook ||
    prospect.instagram ||
    prospect.linkedin ||
    prospect.twitter
  )
  if (hasSocial) {
    score += 10
  }

  // 6. Business Establishment (10 points)
  const isEstablished = (
    prospect.reviewCount >= 50 ||
    prospect.yearsInBusiness >= 5
  )
  if (isEstablished) {
    score += 10
  } else {
    score += 5  // Partial credit
  }

  return Math.round(score)
}
```

### Hot Lead Criteria

```typescript
function isHotLead(prospect: Prospect): boolean {
  return (
    prospect.leadScore >= 70 &&
    prospect.googleRating >= 4.5 &&
    prospect.reviewCount >= 20 &&
    !!prospect.website &&
    !!prospect.phone
  )
}
```

### Score Interpretation

| Score Range | Classification | Action |
|-------------|---------------|--------|
| **80-100** | 🏆 Elite Leads | Immediate outreach, premium targeting |
| **70-79** | 🔥 Hot Leads | High priority, personalized approach |
| **60-69** | ⭐ Warm Leads | Standard outreach, nurture campaign |
| **40-59** | 📋 Average Leads | Lower priority, automated sequences |
| **0-39** | ⚠️ Cold Leads | Research needed, may have data gaps |

### Real Example

**Prime Painting Concepts** (Plymouth, MN)

```typescript
const prospect = {
  googleRating: 4.9,
  reviewCount: 45,
  website: "http://primepaintingconcepts.com/",
  phone: "+1612-702-4257",
  email: null,
  facebook: null,
  instagram: null,
  reviewCount: 45
}

// Calculation:
// Google Rating: (4.9/5) × 25 = 24.5 pts
// Review Count: (45/200) × 20 = 4.5 pts
// Website: 15 pts
// Contact: 5 pts (phone only)
// Social: 0 pts
// Established: 5 pts (partial)
// ───────────────────────────────
// Total: 54 pts

// Hot Lead? NO (score < 70)
```

---

## 🤖 Automated Collection

### Configuration

Edit `/shared/prospect_intel/mn_prospect_config.json`:

```json
{
  "outscraper": {
    "api_key_source": "/home/ubuntu/.config/abacusai_auth_secrets.json",
    "queries": [
      "landscaping companies in Minneapolis, MN",
      "HVAC contractors in St. Paul, MN",
      "plumbing services in Bloomington, MN"
    ],
    "rate_limit": {
      "requests_per_minute": 50,
      "delay_between_requests_ms": 1500
    }
  },
  "schedule": {
    "cron": "0 9 * * 1",
    "timezone": "America/Chicago",
    "description": "Every Monday at 9:00 AM CT"
  },
  "categories": [
    "landscaping", "HVAC", "plumbing", "painting",
    "roofing", "electrical", "carpentry", "flooring",
    "concrete", "fencing", "tree service", "window cleaning",
    "gutter cleaning", "pressure washing", "garage doors"
  ],
  "cities": [
    "Minneapolis", "St. Paul", "Bloomington", "Plymouth",
    "Rochester", "Duluth", "Brooklyn Park", "Woodbury",
    "Maple Grove", "St. Cloud"
  ]
}
```

### Running the Collector

```bash
cd /home/ubuntu/shared/prospect_intel
node mn_prospect_collector.js
```

**Process**:
1. Reads config file
2. Generates 150 search queries (15 categories × 10 cities)
3. Calls Outscraper API for each query
4. Deduplicates against existing database
5. Calculates lead scores
6. Inserts new prospects
7. Sends email report with CSV attachment

**Expected Yield**: 1,500-2,500 new businesses per run

### Email Reports

Reports sent to configured email include:
- 📊 Summary statistics
- 🔥 Hot leads discovered
- 📈 Category breakdown
- 📎 CSV attachment with all new prospects

---

## 🌐 Deployment

### Deploy to Production

The app is deployed at: https://localmania.abacusai.app

### Environment Variables for Production

Ensure these are set in your production environment:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://localmania.abacusai.app"
GEMINI_API_KEY="..."
AWS_BUCKET_NAME="..."
AWS_FOLDER_PREFIX="..."
```

### Build Commands

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma generate

# Build for production
yarn build

# Start server
yarn start
```

### Health Checks

- **Homepage**: https://localmania.abacusai.app/
- **Sign-in**: https://localmania.abacusai.app/auth/signin
- **Dashboard**: https://localmania.abacusai.app/dashboard

---

## 🔒 Security

### Data Protection

- ✅ **Passwords**: Hashed with bcrypt (12 rounds)
- ✅ **Sessions**: Encrypted JWT tokens via NextAuth
- ✅ **API Keys**: Stored in environment variables only
- ✅ **Database**: SSL-encrypted connections
- ✅ **File Uploads**: Virus scanning, type validation

### Access Control

- ✅ **Authentication**: Required for all dashboard routes
- ✅ **Authorization**: Role-based access (admin/user)
- ✅ **Demo Mode**: Read-only access for public demos
- ✅ **Rate Limiting**: API throttling (coming soon)

### Compliance

- **GDPR**: Right to erasure implemented
- **CCPA**: Data deletion available
- **CAN-SPAM**: Email compliance (for marketing use)
- **TCPA**: Phone number handling guidelines

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for full security documentation.

---

## 👥 Contributing

Contributions are welcome! Please follow these guidelines:

### Reporting Issues

1. Check existing issues first
2. Provide detailed description
3. Include reproduction steps
4. Add screenshots if applicable

### Pull Requests

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request with description

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Run `yarn lint` before committing
- Add comments for complex logic

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Built With

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Google Gemini](https://ai.google.dev/) - AI insights
- [Outscraper](https://outscraper.com/) - Data collection
- [Abacus.AI](https://abacus.ai/) - Hosting platform

### Inspiration

- Lead generation workflows from marketing agencies
- CRM best practices
- AI-powered sales intelligence tools

---

## 📞 Support & Contact

### Demo Access

**Try it now**: https://localmania.abacusai.app/auth/signin

Click **"View Demo"** for instant access (no account needed)

### Documentation

- [API Documentation](#-api-documentation)
- [Lead Scoring Guide](#-lead-scoring-algorithm)
- [Security Audit](SECURITY_AUDIT.md)
- [Data Refresh Verification](DATA_REFRESH_VERIFICATION.md)

### Repository

**GitHub**: https://github.com/MagicWifiMoney/local-mania

---

## 📊 Project Stats

- **Total Prospects**: 3,747
- **Hot Leads**: 170 (4.5%)
- **Average Lead Score**: 43.2
- **Data Quality**: 99.7% contact coverage
- **Code Lines**: ~15,000 (TypeScript + TSX)
- **Components**: 60+ React components
- **API Routes**: 10+ endpoints
- **Database Tables**: 6 core models

---

## 🗺️ Roadmap

### Planned Features

- [ ] Email campaign integration (Mailchimp, SendGrid)
- [ ] SMS outreach with Twilio
- [ ] Advanced analytics dashboard
- [ ] Custom lead scoring rules
- [ ] Multi-user workspaces
- [ ] API webhooks for CRM integration
- [ ] Mobile app (React Native)
- [ ] Chrome extension for quick prospecting
- [ ] AI-powered email generation
- [ ] Competitor analysis tools

### In Progress

- [x] Demo access mode
- [x] Lead scoring documentation
- [x] Security audit
- [x] Automated data collection
- [x] AI insights with Gemini

---

**Last Updated**: December 22, 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

---

<div align="center">

**Built with ❤️ for lead generation professionals**

[Demo](https://localmania.abacusai.app) • [GitHub](https://github.com/MagicWifiMoney/local-mania) • [Security](SECURITY_AUDIT.md)

</div>
