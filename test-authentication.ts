// Using built-in fetch API (Node.js 18+)

interface TestResult {
  agent: string;
  timestamp: string;
  results: {
    signinPageRendering: {
      status: string;
      httpStatus: number;
      details?: string;
    };
    successfulLogin: {
      status: string;
      sessionCookie?: string;
      jwtToken?: string;
      callbackUrl?: string;
      error?: string;
    };
    failedLogin: {
      status: string;
      correctlyRejected: boolean;
      details?: string;
    };
    protectedRouteAuthenticated: {
      status: string;
      httpStatus?: number;
      details?: string;
    };
    protectedRouteUnauthenticated: {
      status: string;
      redirectedToSignin: boolean;
      httpStatus?: number;
    };
  };
  sessionToken?: string;
  criticalIssues: string[];
  readyForPhase3: boolean;
}

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test-login-001@example.com',
  password: 'SecurePass456!'
};

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSigninPageRendering(): Promise<TestResult['results']['signinPageRendering']> {
  try {
    console.log('Testing signin page rendering...');
    const response = await fetch(`${BASE_URL}/auth/signin`);
    const html = await response.text();

    const hasSignInForm = html.includes('Sign in') || html.includes('signin');
    const hasEmailInput = html.includes('email') || html.includes('Email');
    const hasPasswordInput = html.includes('password') || html.includes('Password');

    if (response.status === 200 && hasSignInForm && hasEmailInput && hasPasswordInput) {
      return {
        status: 'PASS',
        httpStatus: response.status,
        details: 'Signin page renders correctly with form elements'
      };
    } else {
      return {
        status: 'FAIL',
        httpStatus: response.status,
        details: `Missing elements. Status: ${response.status}, Form: ${hasSignInForm}, Email: ${hasEmailInput}, Password: ${hasPasswordInput}`
      };
    }
  } catch (error) {
    return {
      status: 'FAIL',
      httpStatus: 0,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function testSuccessfulLogin(): Promise<{ result: TestResult['results']['successfulLogin'], cookies: string[] }> {
  try {
    console.log('Testing successful login...');

    // First, get the CSRF token by visiting signin page
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
      method: 'GET'
    });
    const csrfData = await csrfResponse.json() as { csrfToken: string };
    const csrfToken = csrfData.csrfToken;

    console.log('Got CSRF token:', csrfToken);

    // Now attempt login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: csrfToken,
        email: TEST_USER.email,
        password: TEST_USER.password,
        json: 'true'
      }).toString(),
      redirect: 'manual'
    });

    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    const cookies = setCookieHeaders ? setCookieHeaders.split(',').map(c => c.trim()) : [];
    console.log('Login response status:', loginResponse.status);
    console.log('Cookies received:', cookies.length);
    console.log('Set-Cookie header:', setCookieHeaders);

    // NextAuth returns 200 with redirect URL on success
    if (loginResponse.status === 200 || (loginResponse.status >= 300 && loginResponse.status < 400)) {
      const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
      const csrfCookie = cookies.find(c => c.includes('next-auth.csrf-token'));

      if (sessionCookie) {
        return {
          result: {
            status: 'PASS',
            sessionCookie: sessionCookie,
            jwtToken: 'JWT stored in session cookie',
            callbackUrl: loginResponse.headers.get('location') || '/dashboard'
          },
          cookies: cookies
        };
      } else {
        // Try to read response body
        const body = await loginResponse.text();
        return {
          result: {
            status: 'FAIL',
            error: `No session cookie received. Status: ${loginResponse.status}, Body: ${body.substring(0, 200)}`
          },
          cookies: cookies
        };
      }
    } else {
      const body = await loginResponse.text();
      return {
        result: {
          status: 'FAIL',
          error: `Unexpected status ${loginResponse.status}. Body: ${body.substring(0, 200)}`
        },
        cookies: []
      };
    }
  } catch (error) {
    return {
      result: {
        status: 'FAIL',
        error: `Exception: ${error instanceof Error ? error.message : String(error)}`
      },
      cookies: []
    };
  }
}

async function testFailedLogin(): Promise<TestResult['results']['failedLogin']> {
  try {
    console.log('Testing failed login with wrong password...');

    // Get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json() as { csrfToken: string };

    // Attempt login with wrong password
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: TEST_USER.email,
        password: 'WrongPassword123!',
        json: 'true'
      }).toString(),
      redirect: 'manual'
    });

    const setCookieHeaders2 = loginResponse.headers.get('set-cookie');
    const cookies = setCookieHeaders2 ? setCookieHeaders2.split(',').map(c => c.trim()) : [];
    const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));

    // Login should fail - no session cookie should be set
    const correctlyRejected = !sessionCookie && (loginResponse.status === 401 || loginResponse.status === 200);

    return {
      status: correctlyRejected ? 'PASS' : 'FAIL',
      correctlyRejected: correctlyRejected,
      details: `Status: ${loginResponse.status}, Session cookie present: ${!!sessionCookie}`
    };
  } catch (error) {
    return {
      status: 'FAIL',
      correctlyRejected: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function testProtectedRouteAuthenticated(cookies: string[]): Promise<TestResult['results']['protectedRouteAuthenticated']> {
  try {
    console.log('Testing protected route with authentication...');

    if (cookies.length === 0) {
      return {
        status: 'FAIL',
        details: 'No cookies available from login'
      };
    }

    const response = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        'Cookie': cookies.join('; ')
      },
      redirect: 'manual'
    });

    console.log('Protected route (authenticated) status:', response.status);

    // Should return 200 (dashboard loads) or at least not redirect to signin
    if (response.status === 200) {
      return {
        status: 'PASS',
        httpStatus: response.status,
        details: 'Dashboard accessible with valid session'
      };
    } else if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      return {
        status: 'FAIL',
        httpStatus: response.status,
        details: `Redirected to ${location} despite valid session`
      };
    } else {
      return {
        status: 'FAIL',
        httpStatus: response.status,
        details: `Unexpected status: ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'FAIL',
      details: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function testProtectedRouteUnauthenticated(): Promise<TestResult['results']['protectedRouteUnauthenticated']> {
  try {
    console.log('Testing protected route without authentication...');

    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual'
    });

    console.log('Protected route (unauthenticated) status:', response.status);

    // Should redirect to signin
    const isRedirect = response.status >= 300 && response.status < 400;
    const location = response.headers.get('location') || '';
    const redirectedToSignin = location.includes('/auth/signin') || location.includes('/api/auth/signin');

    return {
      status: (isRedirect && redirectedToSignin) ? 'PASS' : 'FAIL',
      redirectedToSignin: redirectedToSignin,
      httpStatus: response.status
    };
  } catch (error) {
    return {
      status: 'FAIL',
      redirectedToSignin: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function runTests(): Promise<void> {
  console.log('=== Starting Authentication Tests ===\n');

  const testResult: TestResult = {
    agent: 'Agent-4-Authentication',
    timestamp: new Date().toISOString(),
    results: {
      signinPageRendering: { status: 'PENDING', httpStatus: 0 },
      successfulLogin: { status: 'PENDING' },
      failedLogin: { status: 'PENDING', correctlyRejected: false },
      protectedRouteAuthenticated: { status: 'PENDING' },
      protectedRouteUnauthenticated: { status: 'PENDING', redirectedToSignin: false }
    },
    criticalIssues: [],
    readyForPhase3: false
  };

  // Test 1: Signin page rendering
  testResult.results.signinPageRendering = await testSigninPageRendering();
  await delay(500);

  // Test 2: Successful login
  const { result: loginResult, cookies } = await testSuccessfulLogin();
  testResult.results.successfulLogin = loginResult;
  await delay(500);

  // Extract session token
  if (loginResult.sessionCookie) {
    const match = loginResult.sessionCookie.match(/next-auth\.session-token=([^;]+)/);
    if (match) {
      testResult.sessionToken = match[1];
    }
  }

  // Test 3: Failed login
  testResult.results.failedLogin = await testFailedLogin();
  await delay(500);

  // Test 4: Protected route with authentication
  testResult.results.protectedRouteAuthenticated = await testProtectedRouteAuthenticated(cookies);
  await delay(500);

  // Test 5: Protected route without authentication
  testResult.results.protectedRouteUnauthenticated = await testProtectedRouteUnauthenticated();

  // Analyze results
  const allTests = [
    testResult.results.signinPageRendering.status,
    testResult.results.successfulLogin.status,
    testResult.results.failedLogin.status,
    testResult.results.protectedRouteAuthenticated.status,
    testResult.results.protectedRouteUnauthenticated.status
  ];

  const failedTests = allTests.filter(status => status === 'FAIL');

  if (testResult.results.signinPageRendering.status === 'FAIL') {
    testResult.criticalIssues.push('Signin page not rendering correctly');
  }
  if (testResult.results.successfulLogin.status === 'FAIL') {
    testResult.criticalIssues.push('Unable to login with valid credentials');
  }
  if (testResult.results.failedLogin.status === 'FAIL') {
    testResult.criticalIssues.push('Security issue: Invalid credentials accepted');
  }
  if (testResult.results.protectedRouteAuthenticated.status === 'FAIL') {
    testResult.criticalIssues.push('Protected routes not accessible with valid session');
  }
  if (testResult.results.protectedRouteUnauthenticated.status === 'FAIL') {
    testResult.criticalIssues.push('Security issue: Protected routes accessible without authentication');
  }

  testResult.readyForPhase3 = failedTests.length === 0 && testResult.sessionToken !== undefined;

  // Write results to file
  const fs = await import('fs/promises');
  await fs.writeFile(
    '/Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub/agent-4-authentication-output.json',
    JSON.stringify(testResult, null, 2)
  );

  // Print summary
  console.log('\n=== Test Results Summary ===');
  console.log(`Signin Page Rendering: ${testResult.results.signinPageRendering.status}`);
  console.log(`Successful Login: ${testResult.results.successfulLogin.status}`);
  console.log(`Failed Login: ${testResult.results.failedLogin.status}`);
  console.log(`Protected Route (Authenticated): ${testResult.results.protectedRouteAuthenticated.status}`);
  console.log(`Protected Route (Unauthenticated): ${testResult.results.protectedRouteUnauthenticated.status}`);
  console.log(`\nTotal Failed: ${failedTests.length}/5`);
  console.log(`Critical Issues: ${testResult.criticalIssues.length}`);
  console.log(`Ready for Phase 3: ${testResult.readyForPhase3}`);

  if (testResult.sessionToken) {
    console.log(`\nSession Token: ${testResult.sessionToken.substring(0, 20)}...`);
  }

  console.log('\nFull results saved to: agent-4-authentication-output.json');
}

runTests().catch(console.error);
