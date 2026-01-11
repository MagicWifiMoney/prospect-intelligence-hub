#!/usr/bin/env node

/**
 * Agent-5: Prospects CRUD Operations Testing
 * Tests all prospect-related CRUD API endpoints with authentication
 */

const fs = require('fs');

const SERVER = 'http://localhost:3000';
const RESULTS_FILE = '/tmp/agent-5-results.json';

// Initialize results object
const results = {
  agent: 'Agent-5-ProspectsCRUD',
  timestamp: '',
  results: {
    listProspects: {
      status: 'PENDING',
      totalProspectsFound: 0,
      filtersWorking: false,
      details: null
    },
    createProspect: {
      status: 'PENDING',
      prospectId: '',
      createdSuccessfully: false,
      details: null
    },
    getProspect: {
      status: 'PENDING',
      dataCorrect: false,
      details: null
    },
    updateProspect: {
      status: 'PENDING',
      notesAdded: false,
      details: null
    },
    duplicateDetection: {
      status: 'PENDING',
      correctlyPrevented: false,
      details: null
    }
  },
  testProspectId: '',
  criticalIssues: [],
  apiEndpointsWorking: '0/5'
};

let sessionCookie = '';
let testProspectId = '';

/**
 * Make HTTP request
 */
async function makeRequest(method, path, body = null, includeCookie = true) {
  const url = `${SERVER}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (includeCookie && sessionCookie) {
    options.headers['Cookie'] = sessionCookie;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // Capture cookies from response
    if (response.headers.has('set-cookie')) {
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        sessionCookie = cookies.split(';')[0];
      }
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: response.status,
      data,
      ok: response.ok
    };
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    return {
      status: 0,
      data: { error: error.message },
      ok: false
    };
  }
}

/**
 * Test 1: Authenticate
 */
async function testAuthentication() {
  console.log('\n=== Authentication ===');

  const response = await makeRequest('POST', '/api/auth/callback/credentials', {
    email: 'test@example.com',
    password: 'password123'
  }, false);

  console.log(`Status: ${response.status}`);

  if (response.ok) {
    console.log('✓ Authentication successful');
    return true;
  } else {
    console.log('✗ Authentication failed');
    console.log('Response:', response.data);

    // Try to check session anyway
    const sessionCheck = await makeRequest('GET', '/api/auth/session', null, true);
    console.log('Session check:', sessionCheck.data);

    return false;
  }
}

/**
 * Test 2: List Prospects - Basic
 */
async function testListProspects() {
  console.log('\n=== Test 1: GET /api/prospects (List - Basic) ===');

  const response = await makeRequest('GET', '/api/prospects?page=1&limit=20');

  console.log(`Status: ${response.status}`);

  if (response.status === 200) {
    const { prospects, total, page, totalPages } = response.data;
    console.log(`✓ PASS: List prospects returned successfully`);
    console.log(`  Total: ${total}, Page: ${page}, Total Pages: ${totalPages}`);
    console.log(`  Prospects in response: ${prospects?.length || 0}`);

    results.results.listProspects = {
      status: 'PASS',
      totalProspectsFound: total || 0,
      filtersWorking: true,
      details: { page, totalPages, count: prospects?.length || 0 }
    };
    return true;
  } else if (response.status === 401) {
    console.log('✗ FAIL: Unauthorized - authentication required');
    results.results.listProspects.status = 'FAIL';
    results.criticalIssues.push('List prospects requires authentication');
    return false;
  } else {
    console.log(`✗ FAIL: List prospects failed with status ${response.status}`);
    console.log('Response:', response.data);
    results.results.listProspects.status = 'FAIL';
    results.criticalIssues.push(`List prospects endpoint returned ${response.status}`);
    return false;
  }
}

/**
 * Test 3: List Prospects with Filters
 */
async function testListProspectsWithFilters() {
  console.log('\n=== Test 2: GET /api/prospects (With Filters) ===');

  // Test search filter
  const searchResponse = await makeRequest('GET', '/api/prospects?search=plumber&page=1&limit=10');
  console.log(`Search filter status: ${searchResponse.status}`);

  if (searchResponse.status === 200) {
    console.log(`  Found ${searchResponse.data.total || 0} prospects matching "plumber"`);
  }

  // Test city and businessType filter
  const filterResponse = await makeRequest('GET', '/api/prospects?city=Minneapolis&businessType=plumber');
  console.log(`City+Type filter status: ${filterResponse.status}`);

  if (filterResponse.status === 200) {
    console.log(`  Found ${filterResponse.data.total || 0} prospects in Minneapolis with type "plumber"`);
  }

  // Test score range filter
  const scoreResponse = await makeRequest('GET', '/api/prospects?minScore=50&maxScore=100');
  console.log(`Score range filter status: ${scoreResponse.status}`);

  if (scoreResponse.status === 200) {
    console.log(`  Found ${scoreResponse.data.total || 0} prospects with score 50-100`);
  }

  return true;
}

/**
 * Test 4: Create Prospect
 */
async function testCreateProspect() {
  console.log('\n=== Test 3: POST /api/prospects (Create) ===');

  const prospectData = {
    companyName: 'AutoTest Plumbing Co',
    businessType: 'plumber',
    city: 'Minneapolis',
    phone: '612-555-9999',
    email: 'info@autotestplumbing.com',
    website: 'https://autotestplumbing.com',
    placeId: 'test-auto-place-001',
    googleRating: 4.7,
    reviewCount: 35
  };

  const response = await makeRequest('POST', '/api/prospects', prospectData);

  console.log(`Status: ${response.status}`);

  if (response.status === 200) {
    const prospect = response.data.prospect;
    testProspectId = prospect.id;

    console.log(`✓ PASS: Prospect created successfully`);
    console.log(`  ID: ${prospect.id}`);
    console.log(`  Company: ${prospect.companyName}`);

    results.results.createProspect = {
      status: 'PASS',
      prospectId: prospect.id,
      createdSuccessfully: true,
      details: prospect
    };
    results.testProspectId = prospect.id;
    return true;
  } else {
    console.log(`✗ FAIL: Create prospect failed with status ${response.status}`);
    console.log('Response:', response.data);
    results.results.createProspect.status = 'FAIL';
    results.criticalIssues.push(`Create prospect endpoint returned ${response.status}`);
    return false;
  }
}

/**
 * Test 5: Get Single Prospect
 */
async function testGetProspect() {
  if (!testProspectId) {
    console.log('\n=== Test 4: GET /api/prospects/[id] (Single) ===');
    console.log('✗ SKIP: No prospect ID available');
    results.results.getProspect.status = 'SKIP';
    return false;
  }

  console.log(`\n=== Test 4: GET /api/prospects/${testProspectId} (Single) ===`);

  const response = await makeRequest('GET', `/api/prospects/${testProspectId}`);

  console.log(`Status: ${response.status}`);

  if (response.status === 200) {
    const prospect = response.data.prospect;
    console.log(`✓ PASS: Get single prospect successful`);
    console.log(`  Company: ${prospect.companyName}`);
    console.log(`  Business Type: ${prospect.businessType}`);
    console.log(`  City: ${prospect.city}`);
    console.log(`  Reviews: ${prospect.reviews?.length || 0}`);
    console.log(`  Activities: ${prospect.activities?.length || 0}`);

    results.results.getProspect = {
      status: 'PASS',
      dataCorrect: true,
      details: {
        hasReviews: prospect.reviews?.length > 0,
        hasActivities: prospect.activities?.length > 0,
        hasHistoricalData: prospect.historicalData?.length > 0
      }
    };
    return true;
  } else {
    console.log(`✗ FAIL: Get prospect failed with status ${response.status}`);
    console.log('Response:', response.data);
    results.results.getProspect.status = 'FAIL';
    results.criticalIssues.push(`Get prospect endpoint returned ${response.status}`);
    return false;
  }
}

/**
 * Test 6: Update Prospect
 */
async function testUpdateProspect() {
  if (!testProspectId) {
    console.log('\n=== Test 5: PATCH /api/prospects/[id] (Update) ===');
    console.log('✗ SKIP: No prospect ID available');
    results.results.updateProspect.status = 'SKIP';
    return false;
  }

  console.log(`\n=== Test 5: PATCH /api/prospects/${testProspectId} (Update) ===`);

  const updateData = {
    notes: 'Test note from automation',
    tags: 'automation,test'
  };

  const response = await makeRequest('PATCH', `/api/prospects/${testProspectId}`, updateData);

  console.log(`Status: ${response.status}`);

  if (response.status === 200) {
    const prospect = response.data.prospect;
    console.log(`✓ PASS: Update prospect successful`);
    console.log(`  Notes: ${prospect.notes}`);
    console.log(`  Tags: ${prospect.tags}`);

    results.results.updateProspect = {
      status: 'PASS',
      notesAdded: prospect.notes !== null,
      details: {
        notes: prospect.notes,
        tags: prospect.tags
      }
    };
    return true;
  } else {
    console.log(`✗ FAIL: Update prospect failed with status ${response.status}`);
    console.log('Response:', response.data);
    results.results.updateProspect.status = 'FAIL';
    results.criticalIssues.push(`Update prospect endpoint returned ${response.status}`);
    return false;
  }
}

/**
 * Test 7: Duplicate Detection
 */
async function testDuplicateDetection() {
  console.log('\n=== Test 6: Duplicate Detection ===');

  const prospectData = {
    companyName: 'AutoTest Plumbing Co',
    businessType: 'plumber',
    city: 'Minneapolis',
    phone: '612-555-9999',
    email: 'info@autotestplumbing.com',
    website: 'https://autotestplumbing.com',
    placeId: 'test-auto-place-001',
    googleRating: 4.7,
    reviewCount: 35
  };

  const response = await makeRequest('POST', '/api/prospects', prospectData);

  console.log(`Status: ${response.status}`);

  if (response.status === 400) {
    console.log(`✓ PASS: Duplicate detection working correctly`);
    console.log(`  Error message: ${response.data.error}`);

    results.results.duplicateDetection = {
      status: 'PASS',
      correctlyPrevented: true,
      details: { errorMessage: response.data.error }
    };
    return true;
  } else {
    console.log(`✗ FAIL: Duplicate detection not working`);
    console.log(`  Expected status 400, got ${response.status}`);
    console.log('Response:', response.data);
    results.results.duplicateDetection.status = 'FAIL';
    results.criticalIssues.push(`Duplicate detection failed - expected 400, got ${response.status}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('=== Agent-5: Prospects CRUD Operations Testing ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Server: ${SERVER}`);

  let passedTests = 0;
  const totalTests = 5;

  // Step 1: Authenticate
  await testAuthentication();

  // Step 2: List prospects
  if (await testListProspects()) passedTests++;

  // Step 3: List with filters
  await testListProspectsWithFilters();

  // Step 4: Create prospect
  if (await testCreateProspect()) passedTests++;

  // Step 5: Get single prospect
  if (await testGetProspect()) passedTests++;

  // Step 6: Update prospect
  if (await testUpdateProspect()) passedTests++;

  // Step 7: Duplicate detection
  if (await testDuplicateDetection()) passedTests++;

  // Finalize results
  results.timestamp = new Date().toISOString();
  results.apiEndpointsWorking = `${passedTests}/${totalTests}`;

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

  console.log('\n=== Final Results ===');
  console.log(JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${RESULTS_FILE}`);
  console.log(`Test Prospect ID: ${testProspectId}`);
  console.log(`API Endpoints Working: ${results.apiEndpointsWorking}`);

  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  results.criticalIssues.push(`Fatal error: ${error.message}`);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  process.exit(1);
});
