// Final comprehensive authentication test

interface CookieJar {
  cookies: Map<string, string>;
}

interface TestResult {
  agent: string;
  timestamp: string;
  testCredentials: {
    email: string;
    password: string;
  };
  results: {
    signinPageRendering: {
      status: string;
      httpStatus: number;
      details: string;
    };
    successfulLogin: {
      status: string;
      sessionCookie?: string;
      jwtToken?: string;
      details: string;
    };
    failedLogin: {
      status: string;
      correctlyRejected: boolean;
      details: string;
    };
    protectedRouteAuthenticated: {
      status: string;
      httpStatus: number;
      details: string;
    };
    protectedRouteUnauthenticated: {
      status: string;
      redirectedToSignin: boolean;
      httpStatus: number;
      details: string;
    };
  };
  sessionToken?: string;
  cookiesForPhase3?: string;
  criticalIssues: string[];
  warnings: string[];
  readyForPhase3: boolean;
}

function parseCookies(setCookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!setCookieHeader) return cookies;

  const cookieStrings = setCookieHeader.split(', ').join(',').split(',');
  for (const cookieStr of cookieStrings) {
    const parts = cookieStr.trim().split(';')[0].split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies.set(name, value);
    }
  }
  return cookies;
}

function cookiesToHeader(cookies: Map<string, string>): string {
  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function runFinalTests(): Promise<void> {
  const BASE_URL = 'http://localhost:3000';
  const TEST_USER = {
    email: 'test-login-001@example.com',
    password: 'SecurePass456!'
  };

  console.log('=== Agent-4: Authentication Testing ===\n');

  const testResult: TestResult = {
    agent: 'Agent-4-Authentication',
    timestamp: new Date().toISOString(),
    testCredentials: TEST_USER,
    results: {
      signinPageRendering: { status: 'PENDING', httpStatus: 0, details: '' },
      successfulLogin: { status: 'PENDING', details: '' },
      failedLogin: { status: 'PENDING', correctlyRejected: false, details: '' },
      protectedRouteAuthenticated: { status: 'PENDING', httpStatus: 0, details: '' },
      protectedRouteUnauthenticated: { status: 'PENDING', redirectedToSignin: false, httpStatus: 0, details: '' }
    },
    criticalIssues: [],
    warnings: [],
    readyForPhase3: false
  };

  const cookieJar: CookieJar = { cookies: new Map() };

  try {
    // Test 1: Signin page rendering
    console.log('Test 1: Signin Page Rendering...');
    const signinPage = await fetch(`${BASE_URL}/auth/signin`);
    const signinHtml = await signinPage.text();
    const hasSigninForm = signinHtml.toLowerCase().includes('sign in');
    const hasEmailField = signinHtml.toLowerCase().includes('email');

    if (signinPage.status === 200 && hasSigninForm) {
      testResult.results.signinPageRendering = {
        status: 'PASS',
        httpStatus: signinPage.status,
        details: 'Signin page loads correctly with authentication form'
      };
      console.log('   ✓ PASS - Signin page rendered');
    } else {
      testResult.results.signinPageRendering = {
        status: 'FAIL',
        httpStatus: signinPage.status,
        details: `Missing signin elements. Status: ${signinPage.status}`
      };
      console.log('   ✗ FAIL - Signin page issues');
    }

    // Test 2: Successful login
    console.log('\nTest 2: Successful Login...');

    // Get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfCookies = parseCookies(csrfResponse.headers.get('set-cookie'));
    csrfCookies.forEach((value, name) => cookieJar.cookies.set(name, value));
    const csrfData = await csrfResponse.json() as { csrfToken: string };

    // Attempt login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookiesToHeader(cookieJar.cookies)
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: TEST_USER.email,
        password: TEST_USER.password,
        json: 'true',
        callbackUrl: `${BASE_URL}/dashboard`
      }).toString(),
      redirect: 'manual'
    });

    const loginCookies = parseCookies(loginResponse.headers.get('set-cookie'));
    loginCookies.forEach((value, name) => cookieJar.cookies.set(name, value));

    const hasSessionToken = cookieJar.cookies.has('next-auth.session-token') ||
                            cookieJar.cookies.has('__Secure-next-auth.session-token');

    const sessionToken = cookieJar.cookies.get('next-auth.session-token') ||
                        cookieJar.cookies.get('__Secure-next-auth.session-token') || '';

    if (hasSessionToken && (loginResponse.status === 200 || (loginResponse.status >= 300 && loginResponse.status < 400))) {
      testResult.results.successfulLogin = {
        status: 'PASS',
        sessionCookie: cookiesToHeader(cookieJar.cookies),
        jwtToken: sessionToken.substring(0, 50) + '...',
        details: 'Successfully authenticated and received session token'
      };
      testResult.sessionToken = sessionToken;
      testResult.cookiesForPhase3 = cookiesToHeader(cookieJar.cookies);
      console.log('   ✓ PASS - Login successful, session token received');
    } else {
      testResult.results.successfulLogin = {
        status: 'FAIL',
        details: `Login failed. Status: ${loginResponse.status}, Session token: ${hasSessionToken}`
      };
      console.log('   ✗ FAIL - Login failed');
    }

    // Test 3: Failed login
    console.log('\nTest 3: Failed Login (Wrong Password)...');
    const freshCookieJar: CookieJar = { cookies: new Map() };
    const csrfResponse2 = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfCookies2 = parseCookies(csrfResponse2.headers.get('set-cookie'));
    csrfCookies2.forEach((value, name) => freshCookieJar.cookies.set(name, value));
    const csrfData2 = await csrfResponse2.json() as { csrfToken: string };

    const badLoginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookiesToHeader(freshCookieJar.cookies)
      },
      body: new URLSearchParams({
        csrfToken: csrfData2.csrfToken,
        email: TEST_USER.email,
        password: 'WrongPassword123!',
        json: 'true'
      }).toString(),
      redirect: 'manual'
    });

    const badLoginCookies = parseCookies(badLoginResponse.headers.get('set-cookie'));
    badLoginCookies.forEach((value, name) => freshCookieJar.cookies.set(name, value));

    const hasSessionAfterBadLogin = freshCookieJar.cookies.has('next-auth.session-token');
    const correctlyRejected = !hasSessionAfterBadLogin && badLoginResponse.status === 401;

    if (correctlyRejected) {
      testResult.results.failedLogin = {
        status: 'PASS',
        correctlyRejected: true,
        details: 'Invalid credentials correctly rejected with 401 status'
      };
      console.log('   ✓ PASS - Invalid credentials rejected');
    } else {
      testResult.results.failedLogin = {
        status: 'FAIL',
        correctlyRejected: false,
        details: `Status: ${badLoginResponse.status}, Session after bad login: ${hasSessionAfterBadLogin}`
      };
      console.log('   ✗ FAIL - Invalid credentials not properly rejected');
    }

    // Test 4: Protected route with authentication
    console.log('\nTest 4: Protected Route (With Auth)...');
    const dashboardAuthResponse = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        'Cookie': cookiesToHeader(cookieJar.cookies)
      },
      redirect: 'manual'
    });

    if (dashboardAuthResponse.status === 200) {
      const html = await dashboardAuthResponse.text();
      const hasProspectContent = html.toLowerCase().includes('prospect');
      testResult.results.protectedRouteAuthenticated = {
        status: 'PASS',
        httpStatus: dashboardAuthResponse.status,
        details: `Dashboard accessible with valid session. Has prospect content: ${hasProspectContent}`
      };
      console.log('   ✓ PASS - Dashboard accessible with authentication');
    } else {
      testResult.results.protectedRouteAuthenticated = {
        status: 'FAIL',
        httpStatus: dashboardAuthResponse.status,
        details: `Unexpected status: ${dashboardAuthResponse.status}`
      };
      console.log('   ✗ FAIL - Dashboard not accessible despite valid session');
    }

    // Test 5: Protected route without authentication
    console.log('\nTest 5: Protected Route (Without Auth)...');
    const dashboardNoAuthResponse = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual'
    });

    // Check for Next.js streaming redirect in HTML
    const noAuthHtml = await dashboardNoAuthResponse.text();
    const hasNextRedirect = noAuthHtml.includes('NEXT_REDIRECT') && noAuthHtml.includes('/auth/signin');

    if (hasNextRedirect) {
      testResult.results.protectedRouteUnauthenticated = {
        status: 'PASS',
        redirectedToSignin: true,
        httpStatus: dashboardNoAuthResponse.status,
        details: 'Server-side redirect to /auth/signin detected in streaming response'
      };
      console.log('   ✓ PASS - Dashboard redirects to signin (Next.js SSR redirect)');
    } else {
      testResult.results.protectedRouteUnauthenticated = {
        status: 'FAIL',
        redirectedToSignin: false,
        httpStatus: dashboardNoAuthResponse.status,
        details: 'No redirect detected. Dashboard may be accessible without auth.'
      };
      testResult.warnings.push('Dashboard does not show clear redirect in initial response');
      console.log('   ⚠ WARNING - No obvious redirect detected');
    }

  } catch (error) {
    console.error('Error during testing:', error);
    testResult.criticalIssues.push(`Test execution error: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Analyze results
  const allTests = Object.values(testResult.results).map(r => r.status);
  const passedTests = allTests.filter(s => s === 'PASS').length;
  const failedTests = allTests.filter(s => s === 'FAIL').length;

  // Check for critical issues
  if (testResult.results.signinPageRendering.status === 'FAIL') {
    testResult.criticalIssues.push('Signin page not rendering correctly');
  }
  if (testResult.results.successfulLogin.status === 'FAIL') {
    testResult.criticalIssues.push('Unable to login with valid credentials');
  }
  if (testResult.results.failedLogin.status === 'FAIL') {
    testResult.criticalIssues.push('SECURITY: Invalid credentials being accepted');
  }
  if (testResult.results.protectedRouteAuthenticated.status === 'FAIL') {
    testResult.criticalIssues.push('Protected routes not accessible with valid session');
  }

  // Ready for Phase 3 if critical tests pass
  testResult.readyForPhase3 =
    testResult.results.successfulLogin.status === 'PASS' &&
    testResult.results.failedLogin.status === 'PASS' &&
    testResult.results.protectedRouteAuthenticated.status === 'PASS' &&
    testResult.sessionToken !== undefined;

  // Save results
  const fs = await import('fs/promises');
  await fs.writeFile(
    '/Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub/agent-4-authentication-output.json',
    JSON.stringify(testResult, null, 2)
  );

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('AUTHENTICATION TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Tests Passed: ${passedTests}/${allTests.length}`);
  console.log(`Tests Failed: ${failedTests}/${allTests.length}`);
  console.log(`Critical Issues: ${testResult.criticalIssues.length}`);
  console.log(`Warnings: ${testResult.warnings.length}`);
  console.log(`Ready for Phase 3: ${testResult.readyForPhase3 ? 'YES' : 'NO'}`);

  if (testResult.sessionToken) {
    console.log(`\nSession Token: ${testResult.sessionToken.substring(0, 30)}...`);
    console.log('Session token saved for Phase 3 API testing');
  }

  if (testResult.criticalIssues.length > 0) {
    console.log('\nCritical Issues:');
    testResult.criticalIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }

  if (testResult.warnings.length > 0) {
    console.log('\nWarnings:');
    testResult.warnings.forEach((warning, i) => console.log(`  ${i + 1}. ${warning}`));
  }

  console.log('\nFull results saved to: agent-4-authentication-output.json');
  console.log('='.repeat(50));
}

runFinalTests().catch(console.error);
