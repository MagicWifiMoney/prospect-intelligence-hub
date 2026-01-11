// Simple authentication test using proper NextAuth flow

async function testAuth() {
  const BASE_URL = 'http://localhost:3000';
  const TEST_USER = {
    email: 'test-login-001@example.com',
    password: 'SecurePass456!'
  };

  console.log('=== NextAuth Authentication Test ===\n');

  // Step 1: Test signin page
  console.log('1. Testing signin page...');
  const signinPage = await fetch(`${BASE_URL}/auth/signin`);
  console.log(`   Status: ${signinPage.status}`);
  const signinHtml = await signinPage.text();
  console.log(`   Has sign in form: ${signinHtml.includes('sign in') || signinHtml.includes('Sign in')}`);

  // Step 2: Get CSRF token
  console.log('\n2. Getting CSRF token...');
  const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json() as { csrfToken: string };
  console.log(`   CSRF Token: ${csrfData.csrfToken.substring(0, 20)}...`);

  // Step 3: Test login with CORRECT credentials
  console.log('\n3. Testing login with CORRECT credentials...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: TEST_USER.email,
      password: TEST_USER.password,
      json: 'true'
    }).toString(),
    redirect: 'manual'
  });

  console.log(`   Login response status: ${loginResponse.status}`);

  const setCookieHeader = loginResponse.headers.get('set-cookie');
  console.log(`   Set-Cookie header present: ${!!setCookieHeader}`);

  if (setCookieHeader) {
    const hasSessionToken = setCookieHeader.includes('next-auth.session-token');
    console.log(`   Session token present: ${hasSessionToken}`);
    if (hasSessionToken) {
      console.log(`   Session cookies: ${setCookieHeader.substring(0, 100)}...`);
    } else {
      console.log(`   Cookies: ${setCookieHeader}`);
    }
  }

  const loginBody = await loginResponse.text();
  console.log(`   Response body: ${loginBody.substring(0, 200)}`);

  // Step 4: Test login with WRONG password
  console.log('\n4. Testing login with WRONG password...');
  const csrfResponse2 = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData2 = await csrfResponse2.json() as { csrfToken: string };

  const badLoginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
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
  const badSetCookie = badLoginResponse.headers.get('set-cookie');
  const hasSessionAfterBadLogin = badSetCookie ? badSetCookie.includes('next-auth.session-token') : false;
  console.log(`   Session token after bad login: ${hasSessionAfterBadLogin}`);

  // Step 5: Test dashboard without auth
  console.log('\n5. Testing dashboard access without authentication...');
  const dashboardNoAuth = await fetch(`${BASE_URL}/dashboard`, {
    redirect: 'manual'
  });
  console.log(`   Dashboard (no auth) status: ${dashboardNoAuth.status}`);
  if (dashboardNoAuth.status >= 300 && dashboardNoAuth.status < 400) {
    const location = dashboardNoAuth.headers.get('location');
    console.log(`   Redirected to: ${location}`);
  }

  // Step 6: Check if dashboard page exists
  console.log('\n6. Checking dashboard structure...');
  const dashboardHtml = await dashboardNoAuth.text();
  const hasLoadingIndicator = dashboardHtml.includes('Loading') || dashboardHtml.includes('loading');
  console.log(`   Has loading/redirect indicator: ${hasLoadingIndicator}`);

  console.log('\n=== Test Complete ===');
}

testAuth().catch(console.error);
