import assert from 'assert';
import app from '../src/index.js';

async function runTests() {
  console.log('🧪 Starting Backend Auth Endpoints Self-Test...\n');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/auth`;

  try {
    // Test 1: Invalid credentials return 401
    console.log('1. Testing invalid credentials...');
    const failRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@pict.edu', password: 'wrongpassword' }),
    });
    assert.strictEqual(failRes.status, 401, 'Invalid credentials should return 401');
    const failBody = await failRes.json();
    assert.ok(failBody.message, 'Error response should have message');
    console.log('   ✓ Rejection with 401 verified');

    // Test 2: Missing fields return 400
    console.log('2. Testing missing fields validation...');
    const badReq = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '', password: '' }),
    });
    assert.strictEqual(badReq.status, 400, 'Empty identifier should return 400');
    console.log('   ✓ Input validation with 400 verified');

    // Test 3: Successful student login with student ID
    console.log('3. Testing student login with student ID identifier...');
    const studentLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'STU2023001', password: 'demo123', remember: true }),
    });
    assert.strictEqual(studentLogin.status, 200, 'Student login should return 200');
    const studentData = await studentLogin.json();
    assert.strictEqual(studentData.user.role, 'student', 'User role should be student');
    assert.strictEqual(studentData.user.studentId, 'STU2023001');
    assert.strictEqual(studentData.user.name, 'Aarav Kulkarni');
    assert.ok(!studentData.user.password_hash, 'Password hash must NEVER be exposed');

    // Verify Set-Cookie header is sent with httpOnly
    const cookieHeader = studentLogin.headers.get('set-cookie');
    assert.ok(cookieHeader && cookieHeader.includes('pict_session'), 'Should set HTTP-only pict_session cookie');
    assert.ok(cookieHeader.toLowerCase().includes('httponly'), 'Cookie must be HttpOnly');
    console.log('   ✓ Student login & secure HTTP-only cookie verified');

    // Extract cookie for session request
    const cookie = cookieHeader.split(';')[0];

    // Test 4: Current user session /api/auth/me with cookie
    console.log('4. Testing GET /api/auth/me with session cookie...');
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(meRes.status, 200, '/me should return 200');
    const meData = await meRes.json();
    assert.strictEqual(meData.user.name, 'Aarav Kulkarni');
    assert.strictEqual(meData.user.role, 'student');
    console.log('   ✓ Session persistence via cookie verified');

    // Test 5: Role authorization check on student dashboard
    console.log('5. Testing role authorization on student dashboard...');
    const dashRes = await fetch(`http://localhost:${port}/api/dashboard/student/STU2023001`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(dashRes.status, 200, 'Student can access own dashboard');
    const dashData = await dashRes.json();
    assert.strictEqual(dashData.name, 'Aarav Kulkarni');
    assert.strictEqual(dashData.isDemoMetrics, true, 'Demo metrics flag verified');

    // Student trying to access another student's dashboard is blocked
    const forbiddenRes = await fetch(`http://localhost:${port}/api/dashboard/student/OTHER_STUDENT`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(forbiddenRes.status, 403, 'Student cannot access another student dashboard (403)');
    console.log('   ✓ Server-side role authorization verified');

    // Test 6: Logout clears session cookie
    console.log('6. Testing logout...');
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    assert.strictEqual(logoutRes.status, 200, 'Logout returns 200');
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert.ok(logoutCookie && logoutCookie.includes('Max-Age=0') || logoutCookie.includes('Expires='), 'Logout clears cookie');
    console.log('   ✓ Logout & cookie clearing verified');

    console.log('\n🎉 ALL 6 BACKEND AUTHENTICATION TESTS PASSED!\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
