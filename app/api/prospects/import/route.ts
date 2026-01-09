
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/s3'
import csv from 'csv-parser'
import { Readable } from 'stream'

interface CSVRow {
  [key: string]: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer())
    const cloudStoragePath = await uploadFile(buffer, file.name)

    // Parse CSV
    const csvText = buffer.toString('utf-8')
    const results: CSVRow[] = []

    return new Promise<NextResponse>((resolve) => {
      const stream = Readable.from(csvText)
      
      stream
        .pipe(csv())
        .on('data', (data: CSVRow) => results.push(data))
        .on('end', async () => {
          try {
            let imported = 0
            let skipped = 0
            const errors: string[] = []

            for (const row of results) {
              try {
                // Map CSV columns to prospect fields (flexible mapping)
                const prospectData: any = {
                  companyName: row.company_name || row.companyName || row.name || row.business_name,
                  businessType: row.business_type || row.businessType || row.category,
                  address: row.address,
                  city: row.city,
                  phone: row.phone,
                  email: row.email,
                  website: row.website,
                  gbpUrl: row.gbp_url || row.gmb_url,
                  googleRating: row.google_rating || row.rating ? parseFloat(row.google_rating || row.rating) : null,
                  reviewCount: row.review_count ? parseInt(row.review_count) : null,
                  placeId: row.place_id || row.placeId,
                  icpScore: row.icp_score ? parseFloat(row.icp_score) : null,
                  categories: row.categories,
                  facebook: row.facebook,
                  instagram: row.instagram,
                  linkedin: row.linkedin,
                  twitter: row.twitter,
                  dataSource: 'CSV Import',
                  dateCollected: new Date(),
                }

                // Skip if no company name
                if (!prospectData.companyName) {
                  skipped++
                  continue
                }

                // Check if prospect already exists
                const whereClause = prospectData.placeId 
                  ? { placeId: prospectData.placeId }
                  : {
                      companyName: prospectData.companyName,
                      city: prospectData.city || undefined,
                    }

                const existingProspect = await prisma.prospect.findFirst({ where: whereClause })

                if (existingProspect) {
                  // Update existing prospect
                  await prisma.prospect.update({
                    where: { id: existingProspect.id },
                    data: prospectData,
                  })
                } else {
                  // Create new prospect
                  await prisma.prospect.create({
                    data: prospectData,
                  })
                }

                imported++
              } catch (error) {
                errors.push(`Row ${imported + skipped + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
                skipped++
              }
            }

            resolve(NextResponse.json({
              success: true,
              imported,
              skipped,
              total: results.length,
              errors: errors.slice(0, 10), // Limit errors shown
              cloudStoragePath,
            }))

          } catch (error) {
            resolve(NextResponse.json(
              { error: 'Failed to process CSV data' },
              { status: 500 }
            ))
          }
        })
        .on('error', (error) => {
          resolve(NextResponse.json(
            { error: 'Failed to parse CSV file' },
            { status: 400 }
          ))
        })
    })

  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
