/**
 * Simple test script to verify geocoding functionality
 */

async function testGeocoding() {
  const baseUrl = 'http://localhost:8080';
  
  console.log('🧪 Testing Geocoding API...\n');

  // Test 1: Valid ZIP code
  try {
    console.log('Test 1: Valid ZIP code (98498)');
    const response1 = await fetch(`${baseUrl}/api/geocode/98498`);
    const result1 = await response1.json();
    
    if (result1.success) {
      console.log('✅ PASS - Valid ZIP returned:', result1.data);
    } else {
      console.log('❌ FAIL - Valid ZIP failed:', result1.message);
    }
  } catch (error) {
    console.log('❌ FAIL - Network error:', error);
  }

  // Test 2: Invalid ZIP code
  try {
    console.log('\nTest 2: Invalid ZIP code (99999)');
    const response2 = await fetch(`${baseUrl}/api/geocode/99999`);
    const result2 = await response2.json();
    
    if (!result2.success && response2.status === 404) {
      console.log('✅ PASS - Invalid ZIP properly rejected:', result2.message);
    } else {
      console.log('❌ FAIL - Invalid ZIP should be rejected');
    }
  } catch (error) {
    console.log('❌ FAIL - Network error:', error);
  }

  // Test 3: Health check
  try {
    console.log('\nTest 3: Health check');
    const response3 = await fetch(`${baseUrl}/api/geocode/health`);
    const result3 = await response3.json();
    
    if (result3.success && result3.availableZips > 0) {
      console.log('✅ PASS - Health check passed, available ZIPs:', result3.availableZips);
      console.log('📍 Supported ZIPs:', result3.supportedZips);
    } else {
      console.log('❌ FAIL - Health check failed');
    }
  } catch (error) {
    console.log('❌ FAIL - Network error:', error);
  }

  // Test 4: Frontend integration test
  console.log('\n🌐 Frontend Integration Test Instructions:');
  console.log('1. Open the app in your browser');
  console.log('2. Go to the Distance filter section');
  console.log('3. Enter ZIP code: 98498');
  console.log('4. You should see: "📍 Lakewood, WA"');
  console.log('5. Try ZIP code: 90210');
  console.log('6. You should see: "📍 Beverly Hills, CA"');
  console.log('7. Try ZIP code: 99999');
  console.log('8. You should see error message with supported ZIPs');

  console.log('\n🎉 Geocoding API tests completed!');
}

export default testGeocoding;

// Run tests if this file is executed directly
testGeocoding().catch(console.error);
