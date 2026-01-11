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

---

## 🧠 CREATIVE TECHNIQUES (No Apollo/Hunter)

### Free Email Finding Methods

| Method | How It Works | Tool/Approach |
|--------|--------------|---------------|
| **Email Permutation** | Generate first.last@, f.last@, firstl@ variations | `emeth-/Email-Permutator` (GitHub) |
| **SMTP Verification** | Test if email exists without sending | `getpingback/ping-email` or roll our own |
| **Google Search Dorking** | `site:company.com email OR contact` | Apify Google Search scraper |
| **Website Contact Scraping** | Extract emails from /contact, /about pages | Already have: `vdrmota/contact-info-scraper` |
| **WHOIS Lookup** | Domain registrant often = owner email | `datascoutapi/DomainDaddy` on Apify |
| **GitHub Commits** | Devs expose emails in git commits | `pixelbubble/GithubEmailFinder` |
| **Catch-All Detection** | Test if domain accepts all emails | SMTP check technique |
| **Social Bio Scraping** | Twitter/IG/LinkedIn bios often have emails | Social scrapers |

### Free Open Source Tools Worth Integrating

| Tool | Stars | What It Does |
|------|-------|--------------|
| `gosom/google-maps-scraper` | ⭐2.6K | Go-based GMaps scraper with emails |
| `omkarcloud/google-maps-scraper` | ⭐2.3K | Python GMaps scraper |
| `Josue87/EmailFinder` | ⭐408 | Find emails via search engines |
| `mautic/mautic` | ⭐9K | Open source marketing automation |
| `PaulleDemon/Email-automation` | ⭐108 | Open source cold email tool |

### N8N Integration Ideas (from X threads)

1. **N8N + Apify Free Tier** → Unlimited lead gen with workflows
2. **Auto-personalization** → Scrape LinkedIn/website → AI generates hooks
3. **Email warmup** → Rotate templates to avoid spam filters
4. **Follow-up sequences** → Same thread replies for better deliverability

### Advanced Signal Sources

| Signal | Why It Matters | How To Get |
|--------|----------------|------------|
| **Job Postings** | Hiring = budget, growth | Indeed/LinkedIn scraper |
| **Tech Stack** | No website = needs one, old WP = needs refresh | BuiltWith |
| **Review Velocity** | Slowing reviews = struggling business | Compare GMaps + Yelp trends |
| **Social Inactivity** | Dead FB page = needs help | Check last post date |
| **Website Age** | Old domain + bad site = relaunch opportunity | WHOIS |
| **Competitor Gaps** | High rating competitors, low rating prospect | Cross-reference reviews |
| **Response Time** | Slow to respond = pain point to solve | Mystery shop |
| **Ad Spend Signals** | Running FB/Google ads = has budget | Facebook Ad Library scraper |

---

## 📋 FULL IMPLEMENTATION CHECKLIST

### Phase 1: Core (Do First)
- [ ] 1. Swap Google Maps actor → email-extracting version
- [ ] 2. Add contact scraper for website enrichment
- [ ] 3. Add BuiltWith tech stack detection
- [ ] 4. Add email permutation + SMTP verification

### Phase 2: Multi-Source Leads
- [ ] 5. Yelp listings + reviews
- [ ] 6. Angi (Angie's List)
- [ ] 7. Yellow Pages
- [ ] 8. Facebook Pages scraper
- [ ] 9. LinkedIn company data
- [ ] 10. BBB listings

### Phase 3: Smart Enrichment
- [ ] 11. Google Search dorking for emails
- [ ] 12. WHOIS/domain intelligence
- [ ] 13. Social bio email extraction
- [ ] 14. Job posting signals (hiring = budget)
- [ ] 15. Facebook Ad Library (ad spend = budget)

### Phase 4: Outreach Automation
- [ ] 16. Complete Gmail integration
- [ ] 17. Email templates with merge fields
- [ ] 18. Follow-up sequences (same-thread)
- [ ] 19. A/B testing for subject lines
- [ ] 20. N8N workflow export for power users

---

*Last updated: 2026-01-10 @ 2:26am*
*Owner: Jay G + Bottie 🤖*
*Branch: feature/enhanced-scraping*
