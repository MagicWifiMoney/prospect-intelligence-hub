import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  agent: string
  timestamp: string
  results: {
    signupPageRendering: {
      status: string
      httpStatus: number
      errors: string[]
    }
    userCreation: {
      status: string
      testUser1: string
      testUser2: string
      apiResponse: any
    }
    passwordHashing: {
      status: string
      isHashed: boolean
      algorithm: string
      hashPrefix?: string
    }
    duplicatePrevention: {
      status: string
      errorMessage: string
    }
  }
  testCredentials: {
    user1: {
      email: string
      password: string
    }
    user2: {
      email: string
      password: string
    }
  }
  criticalIssues: string[]
  readyForPhase2Agent4: boolean
}

async function testSignupPageRendering() {
  try {
    const response = await fetch('http://localhost:3000/auth/signup')
    const text = await response.text()

    return {
      status: response.status === 200 ? 'PASS' : 'FAIL',
      httpStatus: response.status,
      errors: response.status === 200 ? [] : [`HTTP ${response.status}`]
    }
  } catch (error: any) {
    return {
      status: 'FAIL',
      httpStatus: 0,
      errors: [error.message]
    }
  }
}

async function createTestUser(email: string, password: string, firstName: string, lastName: string) {
  try {
    const response = await fetch('http://localhost:3000/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
      }),
    })

    const data = await response.json()

    return {
      success: response.ok,
      status: response.status,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      status: 0,
      error: error.message,
    }
  }
}

async function checkPasswordHashing(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return {
        status: 'FAIL',
        isHashed: false,
        algorithm: 'none',
      }
    }

    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')

    return {
      status: isHashed ? 'PASS' : 'FAIL',
      isHashed,
      algorithm: isHashed ? 'bcrypt' : 'unknown',
      hashPrefix: user.password.substring(0, 10),
    }
  } catch (error: any) {
    return {
      status: 'FAIL',
      isHashed: false,
      algorithm: 'error',
      error: error.message,
    }
  }
}

async function testDuplicatePrevention(email: string) {
  try {
    const response = await fetch('http://localhost:3000/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: 'AnyPassword123!',
        firstName: 'Duplicate',
        lastName: 'Test',
      }),
    })

    const data = await response.json()

    return {
      status: response.status === 400 && data.error ? 'PASS' : 'FAIL',
      errorMessage: data.error || '',
    }
  } catch (error: any) {
    return {
      status: 'FAIL',
      errorMessage: error.message,
    }
  }
}

async function cleanupTestUsers() {
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-automation-001@example.com',
            'test-login-001@example.com',
          ],
        },
      },
    })
    console.log('Cleaned up existing test users')
  } catch (error) {
    console.log('No existing test users to clean up')
  }
}

async function runTests() {
  console.log('Starting Agent-3: User Registration Testing\n')

  const criticalIssues: string[] = []

  // Cleanup first
  await cleanupTestUsers()

  // Test 1: Signup page rendering
  console.log('Test 1: Testing signup page rendering...')
  const signupPageResult = await testSignupPageRendering()
  console.log(`  Status: ${signupPageResult.status}`)
  if (signupPageResult.status === 'FAIL') {
    criticalIssues.push('Signup page failed to render')
  }

  // Test 2: Create first test user
  console.log('\nTest 2: Creating test user 1...')
  const user1Result = await createTestUser(
    'test-automation-001@example.com',
    'TestPassword123!',
    'Test',
    'Automation'
  )
  console.log(`  Status: ${user1Result.success ? 'PASS' : 'FAIL'}`)
  if (!user1Result.success) {
    criticalIssues.push('Failed to create test user 1')
  }

  // Test 3: Check password hashing
  console.log('\nTest 3: Verifying password hashing...')
  const hashingResult = await checkPasswordHashing('test-automation-001@example.com')
  console.log(`  Status: ${hashingResult.status}`)
  console.log(`  Is Hashed: ${hashingResult.isHashed}`)
  console.log(`  Algorithm: ${hashingResult.algorithm}`)
  if (hashingResult.hashPrefix) {
    console.log(`  Hash Prefix: ${hashingResult.hashPrefix}`)
  }
  if (hashingResult.status === 'FAIL') {
    criticalIssues.push('Password is not properly hashed')
  }

  // Test 4: Test duplicate prevention
  console.log('\nTest 4: Testing duplicate email prevention...')
  const duplicateResult = await testDuplicatePrevention('test-automation-001@example.com')
  console.log(`  Status: ${duplicateResult.status}`)
  console.log(`  Error Message: ${duplicateResult.errorMessage}`)
  if (duplicateResult.status === 'FAIL') {
    criticalIssues.push('Duplicate email prevention not working')
  }

  // Test 5: Create second test user
  console.log('\nTest 5: Creating test user 2...')
  const user2Result = await createTestUser(
    'test-login-001@example.com',
    'SecurePass456!',
    'Login',
    'Test'
  )
  console.log(`  Status: ${user2Result.success ? 'PASS' : 'FAIL'}`)
  if (!user2Result.success) {
    criticalIssues.push('Failed to create test user 2')
  }

  // Generate final report
  const result: TestResult = {
    agent: 'Agent-3-Registration',
    timestamp: new Date().toISOString(),
    results: {
      signupPageRendering: signupPageResult,
      userCreation: {
        status: user1Result.success && user2Result.success ? 'PASS' : 'FAIL',
        testUser1: 'test-automation-001@example.com',
        testUser2: 'test-login-001@example.com',
        apiResponse: {
          user1: user1Result,
          user2: user2Result,
        },
      },
      passwordHashing: hashingResult,
      duplicatePrevention: duplicateResult,
    },
    testCredentials: {
      user1: {
        email: 'test-automation-001@example.com',
        password: 'TestPassword123!',
      },
      user2: {
        email: 'test-login-001@example.com',
        password: 'SecurePass456!',
      },
    },
    criticalIssues,
    readyForPhase2Agent4: criticalIssues.length === 0,
  }

  console.log('\n' + '='.repeat(80))
  console.log('FINAL REPORT')
  console.log('='.repeat(80))
  console.log(JSON.stringify(result, null, 2))
  console.log('='.repeat(80))

  await prisma.$disconnect()

  return result
}

runTests().catch(console.error)
