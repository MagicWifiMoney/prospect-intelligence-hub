// Complete authentication test with proper cookie handling

interface CookieJar {
  cookies: Map<string, string>;
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

async function testAuthComplete() {
  const BASE_URL = 'http://localhost:3000';
  const TEST_USER = {
    email: 'test-login-001@example.com',
    password: 'SecurePass456!'
  };

  const cookieJar: CookieJar = { cookies: new Map() };

  console.log('=== Complete NextAuth Authentication Test ===\n');

  // Step 1: Get CSRF token and collect cookies
  console.log('1. Getting CSRF token...');
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
    headers: {
      'Cookie': cookiesToHeader(cookieJar.cookies)
    }
  });

  // Collect cookies from CSRF request
  const csrfCookies = parseCookies(csrfResponse.headers.get('set-cookie'));
  csrfCookies.forEach((value, name) => cookieJar.cookies.set(name, value));

  const csrfData = await csrfResponse.json() as { csrfToken: string };
  console.log(`   CSRF Token: ${csrfData.csrfToken.substring(0, 30)}...`);
  console.log(`   Cookies collected: ${cookieJar.cookies.size}`);

  // Step 2: Test login with CORRECT credentials
  console.log('\n2. Testing login with CORRECT credentials...');
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

  console.log(`   Login response status: ${loginResponse.status}`);

  const loginCookies = parseCookies(loginResponse.headers.get('set-cookie'));
  loginCookies.forEach((value, name) => cookieJar.cookies.set(name, value));

  const hasSessionToken = cookieJar.cookies.has('next-auth.session-token') ||
                          cookieJar.cookies.has('__Secure-next-auth.session-token');
  console.log(`   Session token present: ${hasSessionToken}`);
  console.log(`   Total cookies: ${cookieJar.cookies.size}`);

  const loginBody = await loginResponse.text();
  console.log(`   Response body: ${loginBody.substring(0, 150)}`);

  if (hasSessionToken) {
    const sessionToken = cookieJar.cookies.get('next-auth.session-token') ||
                        cookieJar.cookies.get('__Secure-next-auth.session-token') || '';
    console.log(`   Session token: ${sessionToken.substring(0, 30)}...`);
  }

  // Step 3: Test dashboard access WITH authentication
  console.log('\n3. Testing dashboard access WITH authentication...');
  const dashboardAuthResponse = await fetch(`${BASE_URL}/dashboard`, {
    headers: {
      'Cookie': cookiesToHeader(cookieJar.cookies)
    },
    redirect: 'manual'
  });

  console.log(`   Dashboard (with auth) status: ${dashboardAuthResponse.status}`);
  if (dashboardAuthResponse.status >= 300 && dashboardAuthResponse.status < 400) {
    const location = dashboardAuthResponse.headers.get('location');
    console.log(`   Redirected to: ${location}`);
  } else if (dashboardAuthResponse.status === 200) {
    const html = await dashboardAuthResponse.text();
    const hasProspectText = html.toLowerCase().includes('prospect');
    const hasAnalytics = html.toLowerCase().includes('analytics');
    console.log(`   Dashboard loaded successfully`);
    console.log(`   Has prospect content: ${hasProspectText}`);
    console.log(`   Has analytics content: ${hasAnalytics}`);
  }

  // Step 4: Test failed login
  console.log('\n4. Testing login with WRONG password...');
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

  console.log(`   Bad login response status: ${badLoginResponse.status}`);
  const badLoginCookies = parseCookies(badLoginResponse.headers.get('set-cookie'));
  badLoginCookies.forEach((value, name) => freshCookieJar.cookies.set(name, value));

  const hasSessionAfterBadLogin = freshCookieJar.cookies.has('next-auth.session-token') ||
                                  freshCookieJar.cookies.has('__Secure-next-auth.session-token');
  console.log(`   Session token after bad login: ${hasSessionAfterBadLogin}`);

  const badLoginBody = await badLoginResponse.text();
  console.log(`   Response: ${badLoginBody.substring(0, 150)}`);

  // Step 5: Test dashboard without auth
  console.log('\n5. Testing dashboard access WITHOUT authentication...');
  const dashboardNoAuthResponse = await fetch(`${BASE_URL}/dashboard`, {
    redirect: 'manual'
  });

  console.log(`   Dashboard (no auth) status: ${dashboardNoAuthResponse.status}`);
  if (dashboardNoAuthResponse.status >= 300 && dashboardNoAuthResponse.status < 400) {
    const location = dashboardNoAuthResponse.headers.get('location');
    console.log(`   Redirected to: ${location}`);
    console.log(`   Redirect is to signin: ${location?.includes('signin')}`);
  } else {
    console.log(`   WARNING: Dashboard accessible without authentication`);
  }

  // Summary
  console.log('\n=== Test Summary ===');
  const results = {
    successfulLogin: hasSessionToken,
    failedLoginPrevented: !hasSessionAfterBadLogin,
    protectedRouteWithAuth: dashboardAuthResponse.status === 200,
    protectedRouteWithoutAuth: dashboardNoAuthResponse.status >= 300 && dashboardNoAuthResponse.status < 400
  };

  console.log(`Successful login: ${results.successfulLogin ? 'PASS' : 'FAIL'}`);
  console.log(`Failed login prevented: ${results.failedLoginPrevented ? 'PASS' : 'FAIL'}`);
  console.log(`Protected route (with auth): ${results.protectedRouteWithAuth ? 'PASS' : 'FAIL'}`);
  console.log(`Protected route (without auth): ${results.protectedRouteWithoutAuth ? 'PASS' : 'FAIL'}`);

  const allPassed = Object.values(results).every(v => v);
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  // Save session token for Phase 3
  if (hasSessionToken) {
    const sessionToken = cookieJar.cookies.get('next-auth.session-token') ||
                        cookieJar.cookies.get('__Secure-next-auth.session-token') || '';
    const fs = await import('fs/promises');
    await fs.writeFile(
      '/Users/jacobgiebel/Desktop/coding_workspace/prospect-intelligence-hub/session-token.txt',
      sessionToken
    );
    console.log('\nSession token saved to session-token.txt for Phase 3');
  }
}

testAuthComplete().catch(console.error);
