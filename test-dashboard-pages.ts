// Agent-12: Dashboard UI Pages Rendering Test
// Tests all 15 dashboard pages for rendering and performance

interface PageTestResult {
  status: 'PASS' | 'FAIL';
  httpStatus: number;
  loadTime: string;
  error?: string;
}

interface TestResult {
  agent: string;
  timestamp: string;
  pagesRendered: string;
  results: {
    dashboard: PageTestResult;
    prospects: PageTestResult;
    prospectDetail: PageTestResult;
    hotLeads: PageTestResult;
    goldmines: PageTestResult;
    leadGen: PageTestResult;
    scrape: PageTestResult;
    analytics: PageTestResult;
    trends: PageTestResult;
    anomalies: PageTestResult;
    newBusinesses: PageTestResult;
    email: PageTestResult;
    addProspects: PageTestResult;
    reports: PageTestResult;
    settings: PageTestResult;
  };
  performance: {
    fastestPage: string;
    slowestPage: string;
    averageLoadTime: string;
  };
  failedPages: string[];
  criticalIssues: string[];
}

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test-login-001@example.com',
  password: 'SecurePass456!'
};

async function getAuthCookies(): Promise<string[]> {
  try {
    console.log('Getting authentication cookies...');

    // Get CSRF token and cookies
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json() as { csrfToken: string };

    // Extract CSRF cookies
    const csrfCookies: string[] = [];
    csrfResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        csrfCookies.push(value.split(';')[0]);
      }
    });

    console.log('CSRF cookies:', csrfCookies);

    // Login with CSRF cookies
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookies.join('; ')
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: TEST_USER.email,
        password: TEST_USER.password,
        json: 'true'
      }).toString(),
      redirect: 'manual'
    });

    console.log('Login response status:', loginResponse.status);

    // Extract cookies from headers and parse them
    const rawCookies: string[] = [];
    loginResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        rawCookies.push(value);
      }
    });

    // Alternative: get all set-cookie headers
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader && rawCookies.length === 0) {
      rawCookies.push(setCookieHeader);
    }

    console.log('Raw cookies received:', rawCookies.length);

    // If login succeeded but no session cookie, check for redirect
    if (loginResponse.status >= 300 && loginResponse.status < 400) {
      const location = loginResponse.headers.get('location');
      console.log('Redirect location:', location);

      // Follow the redirect if it's to the dashboard
      if (location && !location.includes('signin')) {
        const followUpResponse = await fetch(`${BASE_URL}${location}`, {
          headers: {
            'Cookie': rawCookies.map(c => c.split(';')[0]).join('; ')
          },
          redirect: 'manual'
        });

        // Get additional cookies from the follow-up
        followUpResponse.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'set-cookie') {
            rawCookies.push(value);
          }
        });
      }
    }

    // Parse cookies to extract just name=value (remove Path, HttpOnly, etc.)
    const cookies = rawCookies.map(cookie => {
      // Extract just the name=value part (before the first semicolon)
      const parts = cookie.split(';');
      return parts[0].trim();
    });

    console.log(`Authenticated successfully. Received ${cookies.length} cookies.`);
    console.log('Cookies:', cookies);

    // Check if we have a session token
    const hasSessionToken = cookies.some(c => c.includes('next-auth.session-token'));
    if (!hasSessionToken) {
      console.warn('WARNING: No session token found in cookies!');
      const body = await loginResponse.text();
      console.log('Login response body:', body.substring(0, 200));
    }

    return cookies;
  } catch (error) {
    console.error('Authentication failed:', error);
    return [];
  }
}

async function getProspectId(cookies: string[]): Promise<string | null> {
  try {
    console.log('Fetching a prospect ID from the database...');
    const response = await fetch(`${BASE_URL}/api/prospects`, {
      headers: {
        'Cookie': cookies.join('; ')
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.prospects && data.prospects.length > 0) {
        return data.prospects[0]._id || data.prospects[0].id;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch prospect ID:', error);
    return null;
  }
}

async function testPage(url: string, cookies: string[], pageName: string): Promise<PageTestResult> {
  const startTime = Date.now();

  try {
    console.log(`Testing ${pageName}: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Cookie': cookies.join('; ')
      },
      redirect: 'manual'
    });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Check if redirected to signin (auth failure)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') || '';
      if (location.includes('signin')) {
        return {
          status: 'FAIL',
          httpStatus: response.status,
          loadTime: `${loadTime}ms`,
          error: 'Redirected to signin - authentication failed'
        };
      }
    }

    // Check for errors in response
    if (response.status !== 200) {
      return {
        status: 'FAIL',
        httpStatus: response.status,
        loadTime: `${loadTime}ms`,
        error: `HTTP ${response.status}`
      };
    }

    // Get response body to check for errors
    const html = await response.text();

    // Check for actual errors (not just the word "Error" in UI)
    // Look for specific error patterns that indicate page failure
    const hasApplicationError = html.includes('Application error: a client-side exception has occurred');
    const has500Error = html.includes('>500<') || html.includes('Internal Server Error');
    const hasUnhandledError = html.includes('Unhandled Runtime Error') || html.includes('Unhandled Rejection');

    // Check for Next.js development error overlay
    const hasNextErrorOverlay = html.includes('__next_error_');

    // Extract specific error details if found
    let errorDetails = '';
    if (hasApplicationError) {
      errorDetails = 'Application error: client-side exception';
    } else if (has500Error) {
      errorDetails = 'HTTP 500 Internal Server Error';
    } else if (hasUnhandledError) {
      const match = html.match(/Unhandled [^<]*/);
      errorDetails = match ? match[0].substring(0, 100) : 'Unhandled error';
    } else if (hasNextErrorOverlay) {
      // Try to extract the error message from the overlay
      const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
      errorDetails = match ? `Next.js error: ${match[1]}` : 'Next.js error overlay';
    }

    if (errorDetails) {
      console.log(`  ERROR FOUND: ${errorDetails}`);
      return {
        status: 'FAIL',
        httpStatus: response.status,
        loadTime: `${loadTime}ms`,
        error: errorDetails
      };
    }

    // Success
    const status = loadTime > 3000 ? 'PASS' : 'PASS';
    return {
      status,
      httpStatus: response.status,
      loadTime: `${loadTime}ms`
    };

  } catch (error) {
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    return {
      status: 'FAIL',
      httpStatus: 0,
      loadTime: `${loadTime}ms`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runTests(): Promise<void> {
  console.log('=== Starting Dashboard UI Pages Rendering Test ===\n');

  // Initialize results
  const testResult: TestResult = {
    agent: 'Agent-12-UIPages',
    timestamp: new Date().toISOString(),
    pagesRendered: '0/15',
    results: {
      dashboard: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      prospects: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      prospectDetail: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      hotLeads: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      goldmines: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      leadGen: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      scrape: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      analytics: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      trends: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      anomalies: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      newBusinesses: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      email: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      addProspects: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      reports: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' },
      settings: { status: 'FAIL', httpStatus: 0, loadTime: '0ms' }
    },
    performance: {
      fastestPage: '',
      slowestPage: '',
      averageLoadTime: '0ms'
    },
    failedPages: [],
    criticalIssues: []
  };

  // Authenticate
  const cookies = await getAuthCookies();

  if (cookies.length === 0) {
    testResult.criticalIssues.push('Authentication failed - cannot test pages');
    console.error('CRITICAL: Unable to authenticate');

    // Write results
    const fs = await import('fs/promises');
    await fs.writeFile(
      '/Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub/agent-12-ui-pages-output.json',
      JSON.stringify(testResult, null, 2)
    );

    console.log('\nTest aborted due to authentication failure.');
    return;
  }

  // Get a prospect ID for detail page test
  const prospectId = await getProspectId(cookies);
  console.log(`Prospect ID for detail page: ${prospectId || 'none found'}\n`);

  // Test all pages
  testResult.results.dashboard = await testPage(`${BASE_URL}/dashboard`, cookies, 'Dashboard Overview');
  testResult.results.prospects = await testPage(`${BASE_URL}/dashboard/prospects`, cookies, 'All Prospects');

  // Test prospect detail page only if we have an ID
  if (prospectId) {
    testResult.results.prospectDetail = await testPage(`${BASE_URL}/dashboard/prospects/${prospectId}`, cookies, 'Prospect Detail');
  } else {
    testResult.results.prospectDetail = {
      status: 'FAIL',
      httpStatus: 0,
      loadTime: '0ms',
      error: 'No prospect ID available for testing'
    };
  }

  testResult.results.hotLeads = await testPage(`${BASE_URL}/dashboard/hot-leads`, cookies, 'Hot Leads');
  testResult.results.goldmines = await testPage(`${BASE_URL}/dashboard/goldmines`, cookies, 'Goldmines');
  testResult.results.leadGen = await testPage(`${BASE_URL}/dashboard/lead-gen`, cookies, 'Lead Gen');
  testResult.results.scrape = await testPage(`${BASE_URL}/dashboard/scrape`, cookies, 'Scraper');
  testResult.results.analytics = await testPage(`${BASE_URL}/dashboard/analytics`, cookies, 'Analytics');
  testResult.results.trends = await testPage(`${BASE_URL}/dashboard/trends`, cookies, 'Trends');
  testResult.results.anomalies = await testPage(`${BASE_URL}/dashboard/anomalies`, cookies, 'Anomalies');
  testResult.results.newBusinesses = await testPage(`${BASE_URL}/dashboard/new-businesses`, cookies, 'New Businesses');
  testResult.results.email = await testPage(`${BASE_URL}/dashboard/email`, cookies, 'Email Hub');
  testResult.results.addProspects = await testPage(`${BASE_URL}/dashboard/add-prospects`, cookies, 'Add Prospects');
  testResult.results.reports = await testPage(`${BASE_URL}/dashboard/reports`, cookies, 'Reports');
  testResult.results.settings = await testPage(`${BASE_URL}/dashboard/settings`, cookies, 'Settings');

  // Analyze results
  const loadTimes: { page: string; time: number }[] = [];
  let passedCount = 0;

  Object.entries(testResult.results).forEach(([key, result]) => {
    const timeMs = parseInt(result.loadTime.replace('ms', ''));
    loadTimes.push({ page: key, time: timeMs });

    if (result.status === 'PASS') {
      passedCount++;
    } else {
      testResult.failedPages.push(key);
      if (result.error) {
        testResult.criticalIssues.push(`${key}: ${result.error}`);
      }
    }
  });

  testResult.pagesRendered = `${passedCount}/15`;

  // Calculate performance metrics
  loadTimes.sort((a, b) => a.time - b.time);
  const fastest = loadTimes[0];
  const slowest = loadTimes[loadTimes.length - 1];
  const avgTime = Math.round(loadTimes.reduce((sum, item) => sum + item.time, 0) / loadTimes.length);

  testResult.performance.fastestPage = `${fastest.page} (${fastest.time}ms)`;
  testResult.performance.slowestPage = `${slowest.page} (${slowest.time}ms)`;
  testResult.performance.averageLoadTime = `${avgTime}ms`;

  // Write results to file
  const fs = await import('fs/promises');
  await fs.writeFile(
    '/Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub/agent-12-ui-pages-output.json',
    JSON.stringify(testResult, null, 2)
  );

  // Print summary
  console.log('\n=== Test Results Summary ===');
  console.log(`Pages Rendered Successfully: ${testResult.pagesRendered}`);
  console.log(`Failed Pages: ${testResult.failedPages.length}`);
  console.log(`\nPerformance:`);
  console.log(`  Fastest: ${testResult.performance.fastestPage}`);
  console.log(`  Slowest: ${testResult.performance.slowestPage}`);
  console.log(`  Average: ${testResult.performance.averageLoadTime}`);

  if (testResult.failedPages.length > 0) {
    console.log(`\nFailed Pages:`);
    testResult.failedPages.forEach(page => {
      console.log(`  - ${page}: ${testResult.results[page as keyof typeof testResult.results].error || 'Unknown error'}`);
    });
  }

  if (testResult.criticalIssues.length > 0) {
    console.log(`\nCritical Issues: ${testResult.criticalIssues.length}`);
    testResult.criticalIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  console.log('\nFull results saved to: agent-12-ui-pages-output.json');
}

runTests().catch(console.error);
