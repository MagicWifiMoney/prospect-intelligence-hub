import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface TableCount {
  [key: string]: number;
}

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

interface IntegrityCheckResult {
  agent: string;
  timestamp: string;
  results: {
    tablesFound: number;
    tablesExpected: number;
    missingTables: string[];
    recordCounts: TableCount;
    seedData: string;
    indexes: {
      status: string;
      details: IndexInfo[];
      criticalIndexes: {
        name: string;
        found: boolean;
      }[];
    };
    basicQuery: {
      status: string;
      sampleData: any[];
    };
  };
  databaseHealth: string;
  issues: string[];
  recommendations: string[];
}

async function checkTables(): Promise<{ tablesFound: number; missingTables: string[] }> {
  const expectedTables = [
    'User',
    'Account',
    'Session',
    'VerificationToken',
    'Prospect',
    'ProspectHistorical',
    'ProspectReview',
    'ProspectActivity',
    'MarketTrend',
    'NewBusiness',
    'LeadGenOpportunity',
    'EmailTemplate',
    'SentEmail',
    'GoogleToken',
    'SystemJob'
  ];

  const result = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;

  const foundTables = result.map(r => r.tablename);
  const missingTables = expectedTables.filter(
    table => !foundTables.includes(table)
  );

  return {
    tablesFound: foundTables.length,
    missingTables
  };
}

async function getRecordCounts(): Promise<TableCount> {
  const counts: TableCount = {};

  try {
    counts.User = await prisma.user.count();
  } catch (e) {
    counts.User = -1;
  }

  try {
    counts.Account = await prisma.account.count();
  } catch (e) {
    counts.Account = -1;
  }

  try {
    counts.Session = await prisma.session.count();
  } catch (e) {
    counts.Session = -1;
  }

  try {
    counts.VerificationToken = await prisma.verificationToken.count();
  } catch (e) {
    counts.VerificationToken = -1;
  }

  try {
    counts.Prospect = await prisma.prospect.count();
  } catch (e) {
    counts.Prospect = -1;
  }

  try {
    counts.ProspectHistorical = await prisma.prospectHistorical.count();
  } catch (e) {
    counts.ProspectHistorical = -1;
  }

  try {
    counts.ProspectReview = await prisma.prospectReview.count();
  } catch (e) {
    counts.ProspectReview = -1;
  }

  try {
    counts.ProspectActivity = await prisma.prospectActivity.count();
  } catch (e) {
    counts.ProspectActivity = -1;
  }

  try {
    counts.MarketTrend = await prisma.marketTrend.count();
  } catch (e) {
    counts.MarketTrend = -1;
  }

  try {
    counts.NewBusiness = await prisma.newBusiness.count();
  } catch (e) {
    counts.NewBusiness = -1;
  }

  try {
    counts.LeadGenOpportunity = await prisma.leadGenOpportunity.count();
  } catch (e) {
    counts.LeadGenOpportunity = -1;
  }

  try {
    counts.EmailTemplate = await prisma.emailTemplate.count();
  } catch (e) {
    counts.EmailTemplate = -1;
  }

  try {
    counts.SentEmail = await prisma.sentEmail.count();
  } catch (e) {
    counts.SentEmail = -1;
  }

  try {
    counts.GoogleToken = await prisma.googleToken.count();
  } catch (e) {
    counts.GoogleToken = -1;
  }

  try {
    counts.SystemJob = await prisma.systemJob.count();
  } catch (e) {
    counts.SystemJob = -1;
  }

  return counts;
}

async function checkIndexes() {
  const indexes = await prisma.$queryRaw<IndexInfo[]>`
    SELECT
      indexname,
      tablename,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `;

  const criticalIndexes = [
    { name: 'Prospect_placeId_key', table: 'Prospect', found: false },
    { name: 'User_email_key', table: 'User', found: false },
    { name: 'Session_sessionToken_key', table: 'Session', found: false },
    { name: 'GoogleToken_userId_key', table: 'GoogleToken', found: false },
    { name: 'NewBusiness_placeId_key', table: 'NewBusiness', found: false },
    { name: 'ProspectReview_reviewId_key', table: 'ProspectReview', found: false }
  ];

  criticalIndexes.forEach(criticalIndex => {
    criticalIndex.found = indexes.some(idx => idx.indexname === criticalIndex.name);
  });

  const allCriticalFound = criticalIndexes.every(idx => idx.found);

  return {
    status: allCriticalFound ? 'PASS' : 'FAIL',
    details: indexes,
    criticalIndexes
  };
}

async function testBasicQuery() {
  try {
    const sampleData = await prisma.prospect.findMany({
      take: 5,
      select: {
        id: true,
        companyName: true,
        leadScore: true,
        city: true,
        googleRating: true,
        reviewCount: true
      }
    });

    return {
      status: 'PASS',
      sampleData
    };
  } catch (error) {
    return {
      status: 'FAIL',
      sampleData: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runIntegrityCheck(): Promise<IntegrityCheckResult> {
  console.log('Starting Database Integrity Check...\n');

  const timestamp = new Date().toISOString();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check tables
  console.log('1. Checking tables...');
  const { tablesFound, missingTables } = await checkTables();
  console.log(`   Found ${tablesFound} tables`);
  if (missingTables.length > 0) {
    console.log(`   Missing tables: ${missingTables.join(', ')}`);
    issues.push(`Missing ${missingTables.length} tables: ${missingTables.join(', ')}`);
    recommendations.push('Run Prisma migrations to create missing tables: npx prisma migrate deploy');
  }

  // Get record counts
  console.log('\n2. Counting records...');
  const recordCounts = await getRecordCounts();
  Object.entries(recordCounts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} records`);
  });

  // Check for seed data
  console.log('\n3. Checking seed data...');
  const hasSeedData = recordCounts.User > 0 ? 'PRESENT' : 'MISSING';
  console.log(`   Seed data: ${hasSeedData}`);
  if (hasSeedData === 'MISSING') {
    issues.push('No users found in database - seed data missing');
    recommendations.push('Run seed script: npm run seed or npx tsx scripts/seed.ts');
  }

  // Check indexes
  console.log('\n4. Checking indexes...');
  const indexResults = await checkIndexes();
  console.log(`   Index check: ${indexResults.status}`);
  console.log(`   Total indexes: ${indexResults.details.length}`);
  indexResults.criticalIndexes.forEach(idx => {
    console.log(`   ${idx.name}: ${idx.found ? 'FOUND' : 'MISSING'}`);
    if (!idx.found) {
      issues.push(`Critical index missing: ${idx.name}`);
    }
  });
  if (indexResults.status === 'FAIL') {
    recommendations.push('Run Prisma migrations to create missing indexes');
  }

  // Test basic query
  console.log('\n5. Testing basic queries...');
  const queryResults = await testBasicQuery();
  console.log(`   Query test: ${queryResults.status}`);
  if (queryResults.status === 'PASS') {
    console.log(`   Sample records retrieved: ${queryResults.sampleData.length}`);
  } else {
    issues.push('Basic query test failed');
    recommendations.push('Check database connection and table structure');
  }

  // Determine overall health
  const databaseHealth = issues.length === 0 ? 'GOOD' : 'ISSUES';

  const result: IntegrityCheckResult = {
    agent: 'Agent-2-Database',
    timestamp,
    results: {
      tablesFound,
      tablesExpected: 15,
      missingTables,
      recordCounts,
      seedData: hasSeedData,
      indexes: indexResults,
      basicQuery: queryResults
    },
    databaseHealth,
    issues,
    recommendations
  };

  return result;
}

async function main() {
  try {
    const result = await runIntegrityCheck();

    console.log('\n' + '='.repeat(80));
    console.log('DATABASE INTEGRITY CHECK SUMMARY');
    console.log('='.repeat(80));
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(80));

    // Also save to file
    const fs = require('fs');
    const outputPath = '/Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub/db-integrity-report.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nReport saved to: ${outputPath}`);

  } catch (error) {
    console.error('Error running integrity check:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
