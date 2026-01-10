# 🚀 Prospect Intelligence Hub — Product Roadmap

> Making this a sellable product with enhanced scraping + email finding

---

## 🎯 THE 10 NEW LEAD SOURCES

| # | Actor | What It Does | Signal Value |
|---|-------|--------------|--------------|
| 1 | `lukaskrivka/google-maps-with-contact-details` | Google Maps + auto-extracts emails/socials from websites | 🔥 Core upgrade |
| 2 | `vdrmota/contact-info-scraper` | Scrape any website for emails, phones, all socials | 🔥 Enrichment |
| 3 | `code_crafter/leads-finder` | Apollo-style lookup: company → decision maker emails | 🔥 Outreach |
| 4 | `canadesk/builtwith` | Tech stack detection (CMS, analytics, chat widgets) | Know if they need a website/SEO |
| 5 | `jupri/yelp` | Yelp business listings + ratings + review counts | Competitor to GMaps |
| 6 | `delicious_zebu/yelp-reviews-scraper` | Deep Yelp reviews for sentiment mining | Pain point signals |
| 7 | `apify/facebook-pages-scraper` | FB page info, followers, activity | Social presence check |
| 8 | `igolaizola/angi-scraper` | Angi (Angie's List) - home services directory | Perfect for contractors |
| 9 | `trudax/yellow-pages-us-scraper` | Yellow Pages listings | Old school but comprehensive |
| 10 | `apimaestro/linkedin-company-detail` | LinkedIn company data (no cookies) | B2B enrichment |

**Bonus actors (lower priority):**
- `compass/Google-Maps-Reviews-Scraper` — Deep review mining (63M runs)
- `scraped/bbb` — Better Business Bureau listings
- `scraped/nextdoor-business-scraper` — Nextdoor local businesses
- `zscrape/craigslist-scraper` — Craigslist services ads

---

## Phase 1: Core Scraping Upgrades ⭐ PRIORITY

### 1.1 Swap Google Maps Scraper
- [ ] Replace `compass/crawler-google-places` → `lukaskrivka/google-maps-with-contact-details`
- [ ] Same Google Maps data PLUS auto-extracted emails/socials
- [ ] Update `lib/apify.ts` with new actor
- [ ] Update `app/api/scrape/google-maps/route.ts`
- [ ] Test with quick scrape

### 1.2 Add Website Contact Scraper
- [ ] Integrate `vdrmota/contact-info-scraper`
- [ ] New route: `app/api/scrape/enrich-contacts/route.ts`
- [ ] "Enrich" button on prospect pages
- [ ] Bulk enrichment for prospects missing emails

### 1.3 Add Apollo-Style Leads Finder
- [ ] Integrate `code_crafter/leads-finder`
- [ ] New route: `app/api/scrape/find-decision-makers/route.ts`
- [ ] "Find Decision Makers" feature in dashboard

### 1.4 Add Tech Stack Detection
- [ ] Integrate `canadesk/builtwith` (2M+ runs)
- [ ] Detect: CMS, analytics, live chat, forms, etc.
- [ ] New scoring factor: "Needs Website" / "Has Outdated Tech"
- [ ] Flag prospects with no website or old WordPress

---

## Phase 2: Directory Scrapers

### 2.1 Yelp Integration
- [ ] Integrate `jupri/yelp` for business listings
- [ ] Cross-reference with Google Maps data
- [ ] Compare ratings across platforms (signal: review gaps)

### 2.2 Yelp Reviews Deep Dive
- [ ] Integrate `delicious_zebu/yelp-reviews-scraper`
- [ ] Sentiment analysis on reviews
- [ ] Extract pain points mentioned in negative reviews
- [ ] Auto-generate outreach hooks from review themes

### 2.3 Angi (Angie's List)
- [ ] Integrate `igolaizola/angi-scraper`
- [ ] Perfect for home services (HVAC, plumbers, roofers)
- [ ] Capture Angi ratings + reviews

### 2.4 Yellow Pages
- [ ] Integrate `trudax/yellow-pages-us-scraper`
- [ ] Comprehensive business listings
- [ ] Good for businesses not on Google Maps

---

## Phase 3: Social + LinkedIn

### 3.1 Facebook Pages
- [ ] Integrate `apify/facebook-pages-scraper` (15M runs)
- [ ] Get: page likes, last post date, about info
- [ ] Signal: "No FB presence" or "Inactive FB"

### 3.2 LinkedIn Company Data
- [ ] Integrate `apimaestro/linkedin-company-detail`
- [ ] Get: employee count, industry, description
- [ ] Match prospects to LinkedIn company pages

---

## Phase 4: Email Hub Activation

### 4.1 Gmail Integration
- [ ] Complete OAuth flow (UI already exists)
- [ ] Send emails from prospect pages
- [ ] Track opens, clicks, replies

### 4.2 Email Templates + Sequences
- [ ] Template management
- [ ] Mail merge with prospect variables
- [ ] Follow-up sequences

---

## Phase 5: Polish for Sale

### 5.1 Multi-Tenancy + Billing
- [ ] Workspace support
- [ ] Stripe integration
- [ ] Usage-based billing

### 5.2 Onboarding
- [ ] First-run wizard
- [ ] Demo mode
- [ ] Docs/tutorials

---

## Database Schema Updates

New fields to add to `Prospect` model:

```prisma
// Contact enrichment
ownerName           String?
ownerEmail          String?
ownerPhone          String?
ownerLinkedIn       String?

// Company social
companyLinkedIn     String?
companyFacebook     String?
companyInstagram    String?
companyTwitter      String?

// Tech stack
techStackRaw        Json?           // Full BuiltWith response
hasCMS              Boolean?
cmsType             String?         // WordPress, Wix, Squarespace, etc.
hasAnalytics        Boolean?
hasLiveChat         Boolean?
needsWebsite        Boolean?

// Multi-source ratings
yelpRating          Float?
yelpReviewCount     Int?
angiRating          Float?
bbbRating           String?         // A+, A, B, etc.
facebookRating      Float?

// Enrichment tracking
enrichedAt          DateTime?
enrichmentSources   String[]        // ["google_maps", "yelp", "builtwith", etc.]
```

---

## Status Tracker

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Enhanced Google Maps | 🔲 | Swap actor |
| 2 | Website Contact Scraper | 🔲 | Enrichment |
| 3 | Leads Finder | 🔲 | Decision makers |
| 4 | BuiltWith Tech Stack | 🔲 | Website needs |
| 5 | Yelp Listings | 🔲 | Cross-reference |
| 6 | Yelp Reviews | 🔲 | Sentiment |
| 7 | Facebook Pages | 🔲 | Social check |
| 8 | Angi Scraper | 🔲 | Home services |
| 9 | Yellow Pages | 🔲 | Comprehensive |
| 10 | LinkedIn Company | 🔲 | B2B data |

---

## Technical Notes

**Apify Actor Reference:**
```javascript
const APIFY_ACTORS = {
  // Core
  GOOGLE_MAPS_PLUS: 'lukaskrivka/google-maps-with-contact-details',
  CONTACT_SCRAPER: 'vdrmota/contact-info-scraper',
  LEADS_FINDER: 'code_crafter/leads-finder',
  
  // Tech detection
  BUILTWITH: 'canadesk/builtwith',
  
  // Directories
  YELP_LISTINGS: 'jupri/yelp',
  YELP_REVIEWS: 'delicious_zebu/yelp-reviews-scraper',
  ANGI: 'igolaizola/angi-scraper',
  YELLOW_PAGES: 'trudax/yellow-pages-us-scraper',
  
  // Social
  FACEBOOK_PAGES: 'apify/facebook-pages-scraper',
  LINKEDIN_COMPANY: 'apimaestro/linkedin-company-detail',
  
  // Bonus
  GOOGLE_REVIEWS_DEEP: 'compass/Google-Maps-Reviews-Scraper',
  BBB: 'scraped/bbb',
  NEXTDOOR: 'scraped/nextdoor-business-scraper',
}
```

---

*Last updated: 2026-01-10 @ 2:23am*
*Owner: Jay G + Bottie 🤖*
*Branch: feature/enhanced-scraping*
