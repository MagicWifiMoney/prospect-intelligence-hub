/**
 * Agent-14: Performance Testing Script
 * Tests API response times, concurrent load handling, and database query performance
 */

interface ResponseTime {
  average: string;
  min: string;
  max: string;
  acceptable: boolean;
  times: number[];
}

interface PerformanceResult {
  agent: string;
  timestamp: string;
  results: {
    apiResponseTimes: {
      getProspects: ResponseTime;
      postProspect: ResponseTime;
      getProspectById: ResponseTime;
    };
    concurrentLoad: {
      status: string;
      requestsSuccessful: string;
      errors: string[];
      performanceDegradation: string;
      averageResponseTime: string;
    };
    largeDataQuery: {
      status: string;
      responseTime: string;
      recordsReturned: number;
    };
  };
  performanceSummary: string;
  slowQueries: string[];
  recommendations: string[];
}

const BASE_URL = 'http://localhost:3000';

// Test credentials from Agent-3
const TEST_CREDENTIALS = {
  email: 'test-automation-001@example.com',
  password: 'TestPassword123!'
};

async function getSessionToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_CREDENTIALS)
  });

  if (!response.ok) {
    throw new Error(`Failed to get session token: ${response.status}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  // Extract session token from cookie
  const sessionMatch = cookies.match(/next-auth\.session-token=([^;]+)/);
  if (!sessionMatch) {
    throw new Error('Session token not found in cookies');
  }

  return sessionMatch[1];
}

async function measureResponseTime(
  url: string,
  options: RequestInit = {}
): Promise<number> {
  const start = performance.now();
  const response = await fetch(url, options);
  const end = performance.now();

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return end - start;
}

async function testGetProspects(sessionToken: string): Promise<ResponseTime> {
  const times: number[] = [];
  const threshold = 500; // ms

  console.log('\n📊 Testing GET /api/prospects (5 requests)...');

  for (let i = 0; i < 5; i++) {
    try {
      const time = await measureResponseTime(`${BASE_URL}/api/prospects`, {
        headers: {
          'Cookie': `next-auth.session-token=${sessionToken}`
        }
      });
      times.push(time);
      console.log(`  Request ${i + 1}: ${time.toFixed(2)}ms`);
    } catch (error) {
      console.error(`  Request ${i + 1} failed:`, error);
      times.push(9999);
    }
  }

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    average: `${average.toFixed(2)}ms`,
    min: `${min.toFixed(2)}ms`,
    max: `${max.toFixed(2)}ms`,
    acceptable: average < threshold,
    times
  };
}

async function testPostProspect(sessionToken: string): Promise<ResponseTime> {
  const times: number[] = [];
  const threshold = 1000; // ms

  console.log('\n📝 Testing POST /api/prospects (5 requests)...');

  for (let i = 0; i < 5; i++) {
    try {
      const testData = {
        name: `Performance Test Company ${Date.now()}-${i}`,
        website: `https://test-${Date.now()}-${i}.com`,
        industry: 'Technology',
        employeeCount: 100,
        revenue: 1000000,
        location: 'San Francisco, CA'
      };

      const time = await measureResponseTime(`${BASE_URL}/api/prospects`, {
        method: 'POST',
        headers: {
          'Cookie': `next-auth.session-token=${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      times.push(time);
      console.log(`  Request ${i + 1}: ${time.toFixed(2)}ms`);
    } catch (error) {
      console.error(`  Request ${i + 1} failed:`, error);
      times.push(9999);
    }
  }

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    average: `${average.toFixed(2)}ms`,
    min: `${min.toFixed(2)}ms`,
    max: `${max.toFixed(2)}ms`,
    acceptable: average < threshold,
    times
  };
}

async function testGetProspectById(sessionToken: string): Promise<ResponseTime> {
  const times: number[] = [];
  const threshold = 300; // ms

  console.log('\n🔍 Testing GET /api/prospects/[id] (5 requests)...');

  // First, get a prospect ID
  const response = await fetch(`${BASE_URL}/api/prospects`, {
    headers: {
      'Cookie': `next-auth.session-token=${sessionToken}`
    }
  });

  const data = await response.json();
  const prospectId = data.prospects?.[0]?.id;

  if (!prospectId) {
    console.error('  No prospects found for testing');
    return {
      average: 'N/A',
      min: 'N/A',
      max: 'N/A',
      acceptable: false,
      times: []
    };
  }

  for (let i = 0; i < 5; i++) {
    try {
      const time = await measureResponseTime(`${BASE_URL}/api/prospects/${prospectId}`, {
        headers: {
          'Cookie': `next-auth.session-token=${sessionToken}`
        }
      });
      times.push(time);
      console.log(`  Request ${i + 1}: ${time.toFixed(2)}ms`);
    } catch (error) {
      console.error(`  Request ${i + 1} failed:`, error);
      times.push(9999);
    }
  }

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    average: `${average.toFixed(2)}ms`,
    min: `${min.toFixed(2)}ms`,
    max: `${max.toFixed(2)}ms`,
    acceptable: average < threshold,
    times
  };
}

async function testConcurrentLoad(sessionToken: string) {
  console.log('\n⚡ Testing concurrent load (10 requests)...');

  const requests = Array(10).fill(null).map(() =>
    fetch(`${BASE_URL}/api/prospects`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    })
  );

  const start = performance.now();
  const results = await Promise.allSettled(requests);
  const end = performance.now();

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason.message);

  const avgResponseTime = (end - start) / 10;

  console.log(`  Successful: ${successful}/10`);
  console.log(`  Average time per request: ${avgResponseTime.toFixed(2)}ms`);
  if (errors.length > 0) {
    console.log(`  Errors:`, errors);
  }

  // Determine performance degradation
  let degradation = 'none';
  if (avgResponseTime > 1000) {
    degradation = 'significant';
  } else if (avgResponseTime > 500) {
    degradation = 'minor';
  }

  return {
    status: successful === 10 ? 'PASS' : 'FAIL',
    requestsSuccessful: `${successful}/10`,
    errors,
    performanceDegradation: degradation,
    averageResponseTime: `${avgResponseTime.toFixed(2)}ms`
  };
}

async function testLargeDataQuery(sessionToken: string) {
  console.log('\n📦 Testing large data query (limit=100)...');

  try {
    const start = performance.now();
    const response = await fetch(`${BASE_URL}/api/prospects?limit=100`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    });
    const end = performance.now();

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    const responseTime = end - start;
    const recordsReturned = data.prospects?.length || 0;

    console.log(`  Response time: ${responseTime.toFixed(2)}ms`);
    console.log(`  Records returned: ${recordsReturned}`);

    return {
      status: responseTime < 2000 ? 'PASS' : 'FAIL',
      responseTime: `${responseTime.toFixed(2)}ms`,
      recordsReturned
    };
  } catch (error) {
    console.error('  Large data query failed:', error);
    return {
      status: 'FAIL',
      responseTime: 'Error',
      recordsReturned: 0
    };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Agent-14: Performance Testing Suite');
  console.log('=' .repeat(50));

  let sessionToken: string;

  try {
    console.log('\n🔐 Getting session token...');
    sessionToken = await getSessionToken();
    console.log('✅ Session token obtained');
  } catch (error) {
    console.error('❌ Failed to get session token:', error);
    process.exit(1);
  }

  // Run tests
  const getProspectsResult = await testGetProspects(sessionToken);
  const postProspectResult = await testPostProspect(sessionToken);
  const getProspectByIdResult = await testGetProspectById(sessionToken);
  const concurrentLoadResult = await testConcurrentLoad(sessionToken);
  const largeDataQueryResult = await testLargeDataQuery(sessionToken);

  // Analyze results
  const allAcceptable =
    getProspectsResult.acceptable &&
    postProspectResult.acceptable &&
    getProspectByIdResult.acceptable &&
    concurrentLoadResult.status === 'PASS' &&
    largeDataQueryResult.status === 'PASS';

  const performanceSummary = allAcceptable ? 'GOOD' :
    (getProspectsResult.acceptable && postProspectResult.acceptable) ? 'ACCEPTABLE' : 'POOR';

  const recommendations: string[] = [];
  const slowQueries: string[] = [];

  if (!getProspectsResult.acceptable) {
    recommendations.push('GET /api/prospects is slower than expected. Consider adding database indexes or implementing caching.');
    slowQueries.push(`GET /api/prospects: ${getProspectsResult.average}`);
  }

  if (!postProspectResult.acceptable) {
    recommendations.push('POST /api/prospects is slower than expected. Review database write operations and validation logic.');
    slowQueries.push(`POST /api/prospects: ${postProspectResult.average}`);
  }

  if (!getProspectByIdResult.acceptable) {
    recommendations.push('GET /api/prospects/[id] is slower than expected. Ensure proper indexing on the id field.');
    slowQueries.push(`GET /api/prospects/[id]: ${getProspectByIdResult.average}`);
  }

  if (concurrentLoadResult.performanceDegradation !== 'none') {
    recommendations.push('Performance degradation detected under concurrent load. Consider connection pooling or caching strategies.');
  }

  if (parseFloat(largeDataQueryResult.responseTime) > 1000) {
    recommendations.push('Large data queries are slow. Implement pagination or optimize database queries.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All performance benchmarks are within acceptable ranges.');
    recommendations.push('Consider implementing monitoring and alerting for production use.');
  }

  const result: PerformanceResult = {
    agent: 'Agent-14-Performance',
    timestamp: new Date().toISOString(),
    results: {
      apiResponseTimes: {
        getProspects: getProspectsResult,
        postProspect: postProspectResult,
        getProspectById: getProspectByIdResult
      },
      concurrentLoad: concurrentLoadResult,
      largeDataQuery: largeDataQueryResult
    },
    performanceSummary,
    slowQueries,
    recommendations
  };

  // Save results
  const fs = require('fs');
  const outputPath = '/Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub/test-results/agent-14-performance-' + Date.now() + '.json';
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('📊 PERFORMANCE TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`\n✅ Overall Performance: ${performanceSummary}`);
  console.log(`\nAPI Response Times:`);
  console.log(`  GET /api/prospects: ${getProspectsResult.average} (${getProspectsResult.acceptable ? 'PASS' : 'FAIL'})`);
  console.log(`  POST /api/prospects: ${postProspectResult.average} (${postProspectResult.acceptable ? 'PASS' : 'FAIL'})`);
  console.log(`  GET /api/prospects/[id]: ${getProspectByIdResult.average} (${getProspectByIdResult.acceptable ? 'PASS' : 'FAIL'})`);
  console.log(`\nConcurrent Load: ${concurrentLoadResult.status}`);
  console.log(`  Requests successful: ${concurrentLoadResult.requestsSuccessful}`);
  console.log(`  Performance degradation: ${concurrentLoadResult.performanceDegradation}`);
  console.log(`\nLarge Data Query: ${largeDataQueryResult.status}`);
  console.log(`  Response time: ${largeDataQueryResult.responseTime}`);
  console.log(`  Records returned: ${largeDataQueryResult.recordsReturned}`);

  if (slowQueries.length > 0) {
    console.log(`\n⚠️  Slow Queries:`);
    slowQueries.forEach(q => console.log(`  - ${q}`));
  }

  console.log(`\n💡 Recommendations:`);
  recommendations.forEach(r => console.log(`  - ${r}`));

  console.log(`\n📁 Results saved to: ${outputPath}`);

  return result;
}

// Run tests
runPerformanceTests()
  .then(() => {
    console.log('\n✅ Performance testing completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Performance testing failed:', error);
    process.exit(1);
  });
