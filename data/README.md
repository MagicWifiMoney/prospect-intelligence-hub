# Data Directory

⚠️ **This directory is excluded from version control** to protect sensitive business information.

## Required Files

To run this application, you need the following CSV files in this directory:

1. **prospect_list.csv** - Initial prospect data
2. **prospect_list_expanded.csv** - Expanded prospect dataset

## Data Structure

Each CSV file should contain the following columns:

- `company_name` - Business name
- `business_type` - Type of business (e.g., Painter, HVAC, Plumber)
- `address` - Street address
- `city` - City name
- `phone` - Contact phone number
- `email` - Contact email address
- `website` - Business website URL
- `gmb_url` - Google Business Profile URL
- `rating` - Google rating (0-5)
- `review_count` - Number of Google reviews
- `years_in_business` - Years the business has been operating
- `employee_count` - Number of employees
- `categories` - Business categories
- `facebook` - Facebook profile URL
- `instagram` - Instagram profile URL
- `linkedin` - LinkedIn profile URL
- `twitter` - Twitter profile URL

## Data Sources

### Option 1: Outscraper API

Use the Outscraper API to collect business data:

```bash
# Set your API key
export OUTSCRAPER_API_KEY="your_api_key_here"

# Run the collector script
node /home/ubuntu/shared/prospect_intel/mn_prospect_collector.js
```

### Option 2: Manual Upload

1. Prepare your CSV files with the structure above
2. Place them in this directory
3. Run the seed script to import:

```bash
cd /home/ubuntu/prospect_intelligence_hub/nextjs_space
yarn prisma db seed
```

### Option 3: Use Dashboard

Upload CSV files through the dashboard:

1. Log in to the dashboard
2. Navigate to "Add Prospects"
3. Use the CSV import feature

## Security Notes

- ❌ **Never commit CSV files to version control**
- ❌ **Do not share prospect data publicly**
- ✅ **Keep API keys in environment variables**
- ✅ **Use the `.env` file for sensitive configuration**
- ✅ **Respect data privacy regulations (GDPR, CCPA, etc.)**

## Data Privacy

This data contains:
- Personal contact information (phone numbers, emails)
- Business addresses
- Publicly available business information

Ensure compliance with:
- **GDPR** (if targeting EU businesses)
- **CCPA** (California businesses)
- **CAN-SPAM Act** (email marketing)
- **TCPA** (phone marketing)

## Need Help?

For questions about data collection or importing:
1. Check the main README.md
2. Review the Outscraper API documentation
3. Contact the development team
