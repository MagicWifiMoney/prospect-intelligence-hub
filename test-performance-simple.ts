/**
 * Agent-14: Performance Testing Script (Simplified)
 * Tests API response times, concurrent load handling, and database query performance
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials from Agent-3
const TEST_CREDENTIALS = {
  email: 'test-automation-001@example.com',
  password: 'TestPassword123!'
};

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

async function getAuthenticatedFetch() {
  // Sign in using NextAuth
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();

  const signInResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      csrfToken,
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
      callbackUrl: `${BASE_URL}/dashboard`,
      json: 'true'
    }).toString(),
    redirect: 'manual'
  });

  const cookies = signInResponse.headers.get('set-cookie') || '';

  return (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookies
      }
    });
  };
}

async function measureResponseTime(
  fetchFn: (url: string, options?: RequestInit) => Promise<Response>,
  url: string,
  options: RequestInit = {}
): Promise<number> {
  const start = performance.now();
  const response = await fetchFn(url, options);
  const end = performance.now();

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${await response.text()}`);
  }

  await response.json(); // Ensure we read the full response
  return end - start;
}

async function testGetProspects(fetchFn: any): Promise<ResponseTime> {
  const times: number[] = [];
  const threshold = 500; // ms

  console.log('\n📊 Testing GET /api/prospects (5 requests)...');

  for (let i = 0; i < 5; i++) {
    try {
      const time = await measureResponseTime(fetchFn, `${BASE_URL}/api/prospects`);
      times.push(time);
      console.log(`  Request ${i + 1}: ${time.toFixed(2)}ms`);

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  Request ${i + 1} failed:`, error.message);
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

async function testPostProspect(fetchFn: any): Promise<ResponseTime> {
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

      const time = await measureResponseTime(fetchFn, `${BASE_URL}/api/prospects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      times.push(time);
      console.log(`  Request ${i + 1}: ${time.toFixed(2)}ms`);

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  Request ${i + 1} failed:`, error.message);
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

async function testGetProspectById(fetchFn: any): Promise<ResponseTime> {
  const times: number[] = [];
  const threshold = 300; // ms

  console.log('\n🔍 Testing GET /api/prospects/[id] (5 requests)...');

  try {
    // First, get a prospect ID
    const response = await fetchFn(`${BASE_URL}/api/prospects`);
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
        const time = await measureResponseTime(fetchFn, `${BASE_URL}/api/prospects/${prospectId}`);
        times.push(time);
        console.log(`  Request ${i + 1}: ${time.toFixed(2)}ms`);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`  Request ${i + 1} failed:`, error.message);
        times.push(9999);
      }
    }
  } catch (error) {
    console.error('  Failed to get prospect ID:', error);
    return {
      average: 'N/A',
      min: 'N/A',
      max: 'N/A',
      acceptable: false,
      times: []
    };
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

async function testConcurrentLoad(fetchFn: any) {
  console.log('\n⚡ Testing concurrent load (10 requests)...');

  const requests = Array(10).fill(null).map(() => fetchFn(`${BASE_URL}/api/prospects`));

  const start = performance.now();
  const results = await Promise.allSettled(requests);
  const end = performance.now();

  const successful = results.filter(r => r.status === 'fulfilled' && (r.value as Response).ok).length;
  const errors = results
    .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !(r.value as Response).ok))
    .map(r => r.status === 'rejected' ? (r as PromiseRejectedResult).reason.message : 'Request failed');

  const avgResponseTime = (end - start) / 10;

  console.log(`  Successful: ${successful}/10`);
  console.log(`  Average time per request: ${avgResponseTime.toFixed(2)}ms`);
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`);
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

async function testLargeDataQuery(fetchFn: any) {
  console.log('\n📦 Testing large data query (limit=100)...');

  try {
    const start = performance.now();
    const response = await fetchFn(`${BASE_URL}/api/prospects?limit=100`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    const end = performance.now();

    const responseTime = end - start;
    const recordsReturned = data.prospects?.length || 0;

    console.log(`  Response time: ${responseTime.toFixed(2)}ms`);
    console.log(`  Records returned: ${recordsReturned}`);

    return {
      status: responseTime < 2000 ? 'PASS' : 'FAIL',
      responseTime: `${responseTime.toFixed(2)}ms`,
      recordsReturned
    };
  } catch (error: any) {
    console.error('  Large data query failed:', error.message);
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

  let authenticatedFetch: any;

  try {
    console.log('\n🔐 Authenticating...');
    authenticatedFetch = await getAuthenticatedFetch();
    console.log('✅ Authentication successful');
  } catch (error) {
    console.error('❌ Failed to authenticate:', error);
    console.error('\nNote: Authentication may have failed. Proceeding with performance tests anyway...');
    // Create a basic fetch function for testing
    authenticatedFetch = fetch;
  }

  // Run tests
  const getProspectsResult = await testGetProspects(authenticatedFetch);
  const postProspectResult = await testPostProspect(authenticatedFetch);
  const getProspectByIdResult = await testGetProspectById(authenticatedFetch);
  const concurrentLoadResult = await testConcurrentLoad(authenticatedFetch);
  const largeDataQueryResult = await testLargeDataQuery(authenticatedFetch);

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
    recommendations.push('GET /api/prospects is slower than expected (>500ms). Consider adding database indexes or implementing caching.');
    slowQueries.push(`GET /api/prospects: ${getProspectsResult.average}`);
  }

  if (!postProspectResult.acceptable) {
    recommendations.push('POST /api/prospects is slower than expected (>1000ms). Review database write operations and validation logic.');
    slowQueries.push(`POST /api/prospects: ${postProspectResult.average}`);
  }

  if (!getProspectByIdResult.acceptable && getProspectByIdResult.times.length > 0) {
    recommendations.push('GET /api/prospects/[id] is slower than expected (>300ms). Ensure proper indexing on the id field.');
    slowQueries.push(`GET /api/prospects/[id]: ${getProspectByIdResult.average}`);
  }

  if (concurrentLoadResult.performanceDegradation !== 'none') {
    recommendations.push(`Performance degradation detected under concurrent load (${concurrentLoadResult.performanceDegradation}). Consider connection pooling or caching strategies.`);
  }

  if (largeDataQueryResult.responseTime !== 'Error' && parseFloat(largeDataQueryResult.responseTime) > 1000) {
    recommendations.push('Large data queries are slow (>1000ms). Implement pagination or optimize database queries.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All performance benchmarks are within acceptable ranges.');
    recommendations.push('Consider implementing monitoring and alerting for production use.');
    recommendations.push('Database queries appear to be well-optimized.');
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
  console.log(`  GET /api/prospects: ${getProspectsResult.average} (${getProspectsResult.acceptable ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`    Min: ${getProspectsResult.min}, Max: ${getProspectsResult.max}`);
  console.log(`  POST /api/prospects: ${postProspectResult.average} (${postProspectResult.acceptable ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`    Min: ${postProspectResult.min}, Max: ${postProspectResult.max}`);
  console.log(`  GET /api/prospects/[id]: ${getProspectByIdResult.average} (${getProspectByIdResult.acceptable ? 'PASS ✅' : 'FAIL ❌'})`);
  console.log(`    Min: ${getProspectByIdResult.min}, Max: ${getProspectByIdResult.max}`);
  console.log(`\nConcurrent Load Test: ${concurrentLoadResult.status}`);
  console.log(`  Requests successful: ${concurrentLoadResult.requestsSuccessful}`);
  console.log(`  Average response time: ${concurrentLoadResult.averageResponseTime}`);
  console.log(`  Performance degradation: ${concurrentLoadResult.performanceDegradation}`);
  console.log(`\nLarge Data Query Test: ${largeDataQueryResult.status}`);
  console.log(`  Response time: ${largeDataQueryResult.responseTime}`);
  console.log(`  Records returned: ${largeDataQueryResult.recordsReturned}`);

  if (slowQueries.length > 0) {
    console.log(`\n⚠️  Slow Queries Detected:`);
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
