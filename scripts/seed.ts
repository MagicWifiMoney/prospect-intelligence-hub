
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import csv from 'csv-parser'
import path from 'path'

const prisma = new PrismaClient()

interface CSVRow {
  company_name: string;
  business_type?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  gmb_url?: string;
  gbp_url?: string;
  rating?: string;
  google_rating?: string;
  review_count?: string;
  years_in_business?: string;
  employee_count?: string;
  categories?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  recent_reviews?: string;
  growth_signals?: string;
  tech_stack?: string;
  place_id?: string;
  icp_score?: string;
  date_collected?: string;
  qualification_signals?: string;
  data_source?: string;
  search_location?: string;
}

async function parseCSV(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const results: CSVRow[] = []
    const fullPath = path.resolve(filePath)

    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`)
      resolve([])
      return
    }

    fs.createReadStream(fullPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

function cleanNumber(value?: string): number | undefined {
  if (!value || value === '') return undefined
  const num = parseFloat(value.replace(/,/g, ''))
  return isNaN(num) ? undefined : num
}

function cleanString(value?: string): string | undefined {
  if (!value || value === '' || value.toLowerCase() === 'null') return undefined
  return value.trim()
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...')

    // Create test users
    const hashedPassword = await bcrypt.hash('johndoe123', 12)
    const adminPassword = await bcrypt.hash('admin123', 12)

    await prisma.user.upsert({
      where: { email: 'john@doe.com' },
      update: {},
      create: {
        email: 'john@doe.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        role: 'admin',
      },
    })

    await prisma.user.upsert({
      where: { email: 'admin@marketingagency.com' },
      update: {},
      create: {
        email: 'admin@marketingagency.com',
        password: adminPassword,
        firstName: 'Marketing',
        lastName: 'Admin',
        name: 'Marketing Admin',
        role: 'admin',
      },
    })

    // Create demo user for public access
    const demoPassword = await bcrypt.hash('demo123', 12)
    await prisma.user.upsert({
      where: { email: 'demo@prospectintel.com' },
      update: {},
      create: {
        email: 'demo@prospectintel.com',
        password: demoPassword,
        firstName: 'Demo',
        lastName: 'User',
        name: 'Demo User',
        role: 'user',
      },
    })

    console.log('✅ Test users created (including demo user)')

    // Import prospect data from CSV files
    const csvFiles = [
      'data/prospect_list.csv',
      'data/prospect_list_expanded.csv'
    ]

    let totalImported = 0

    for (const csvFile of csvFiles) {
      console.log(`📁 Processing ${csvFile}...`)
      const csvData = await parseCSV(csvFile)

      if (csvData.length === 0) {
        console.log(`⚠️  No data found in ${csvFile}`)
        continue
      }

      for (const row of csvData) {
        try {
          const prospectData = {
            companyName: cleanString(row.company_name) || 'Unknown Company',
            businessType: cleanString(row.business_type),
            address: cleanString(row.address),
            city: cleanString(row.city),
            phone: cleanString(row.phone),
            email: cleanString(row.email),
            website: cleanString(row.website),
            gbpUrl: cleanString(row.gbp_url || row.gmb_url),
            googleRating: cleanNumber(row.google_rating || row.rating),
            reviewCount: Math.floor(cleanNumber(row.review_count) || 0),
            yearsInBusiness: Math.floor(cleanNumber(row.years_in_business) || 0) || undefined,
            employeeCount: Math.floor(cleanNumber(row.employee_count) || 0) || undefined,
            categories: cleanString(row.categories),
            facebook: cleanString(row.facebook),
            instagram: cleanString(row.instagram),
            linkedin: cleanString(row.linkedin),
            twitter: cleanString(row.twitter),
            recentReviews: cleanString(row.recent_reviews),
            growthSignals: cleanString(row.growth_signals),
            techStack: cleanString(row.tech_stack),
            placeId: cleanString(row.place_id),
            icpScore: cleanNumber(row.icp_score),
            dateCollected: row.date_collected ? new Date(row.date_collected) : new Date(),
            qualificationSignals: cleanString(row.qualification_signals),
            dataSource: cleanString(row.data_source) || 'CSV Import',
            searchLocation: cleanString(row.search_location),
          }

          // Skip if no place_id and company name is generic
          if (!prospectData.placeId && (!prospectData.companyName || prospectData.companyName === 'Unknown Company')) {
            continue
          }

          // Check if prospect already exists
          if (prospectData.placeId) {
            await prisma.prospect.upsert({
              where: { placeId: prospectData.placeId },
              update: prospectData,
              create: prospectData,
            })
          } else {
            // For prospects without placeId, check if exists and create/update accordingly
            const existingProspect = await prisma.prospect.findFirst({
              where: {
                companyName: prospectData.companyName,
                city: prospectData.city || undefined,
              },
            })

            if (existingProspect) {
              await prisma.prospect.update({
                where: { id: existingProspect.id },
                data: prospectData,
              })
            } else {
              await prisma.prospect.create({
                data: prospectData,
              })
            }
          }

          totalImported++
        } catch (error) {
          console.error('Error importing prospect:', row.company_name, error)
        }
      }
    }

    console.log(`✅ Imported ${totalImported} prospects`)

    // Add some sample market trends
    const sampleTrends = [
      {
        category: 'Service Business',
        title: 'Digital Transformation in Home Services',
        content: 'Service-based businesses are increasingly adopting digital tools for customer management, scheduling, and communication. This trend is driving higher customer satisfaction and operational efficiency.',
        source: 'Industry Research',
        trend: 'Growing',
        relevance: 0.9,
        publishedAt: new Date(),
      },
      {
        category: 'Marketing',
        title: 'Local SEO Becomes Critical for Service Businesses',
        content: 'With 46% of all Google searches having local intent, service businesses must optimize their Google Business Profile and local citations to remain competitive.',
        source: 'Marketing Analysis',
        trend: 'Accelerating',
        relevance: 0.95,
        publishedAt: new Date(),
      },
      {
        category: 'Technology',
        title: 'AI-Powered Customer Service Rising',
        content: 'Service businesses are implementing chatbots and AI-powered customer service tools to handle inquiries, schedule appointments, and provide instant support.',
        source: 'Tech Trends',
        trend: 'Emerging',
        relevance: 0.8,
        publishedAt: new Date(),
      },
    ]

    for (const trend of sampleTrends) {
      await prisma.marketTrend.upsert({
        where: { id: `trend-${trend.title.toLowerCase().replace(/\s+/g, '-')}` },
        update: trend,
        create: {
          id: `trend-${trend.title.toLowerCase().replace(/\s+/g, '-')}`,
          ...trend,
        },
      })
    }

    console.log('✅ Sample market trends added')
    console.log('🎉 Database seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedDatabase()
}
