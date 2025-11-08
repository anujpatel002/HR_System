const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const testCredentials = {
  admin: { email: 'admin@workzen.com', password: 'admin123' },
  employee: { email: 'john.doe@workzen.com', password: 'employee123' },
  payroll: { email: 'payroll@workzen.com', password: 'payroll123' }
};

let authToken = '';

// Helper function to make authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      withCredentials: true
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testLogin = async (userType = 'admin') => {
  console.log(`\n🔐 Testing login for ${userType}...`);
  try {
    const response = await apiCall('POST', '/auth/login', testCredentials[userType]);
    authToken = response.token;
    console.log('✅ Login successful');
    return response;
  } catch (error) {
    console.log('❌ Login failed');
    throw error;
  }
};

const testUsers = async () => {
  console.log('\n👥 Testing users endpoint...');
  try {
    const response = await apiCall('GET', '/users');
    console.log(`✅ Found ${response.data.length} users`);
    return response;
  } catch (error) {
    console.log('❌ Users test failed');
    throw error;
  }
};

const testPayrollStats = async () => {
  console.log('\n💰 Testing payroll stats...');
  try {
    const response = await apiCall('GET', '/payroll/stats');
    console.log('✅ Payroll stats:', response.data);
    return response;
  } catch (error) {
    console.log('❌ Payroll stats test failed');
    throw error;
  }
};

const testPayrollAll = async () => {
  console.log('\n📊 Testing all payrolls...');
  try {
    const response = await apiCall('GET', '/payroll/all');
    console.log(`✅ Found ${response.data.length} payroll records`);
    return response;
  } catch (error) {
    console.log('❌ All payrolls test failed');
    throw error;
  }
};

const testAttendance = async () => {
  console.log('\n⏰ Testing attendance...');
  try {
    const response = await apiCall('GET', '/attendance/today');
    console.log('✅ Today attendance:', response.data);
    return response;
  } catch (error) {
    console.log('❌ Attendance test failed');
    throw error;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    // Test login
    await testLogin('admin');
    
    // Test endpoints
    await testUsers();
    await testPayrollStats();
    await testPayrollAll();
    await testAttendance();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.log('\n❌ Tests failed:', error.message);
  }
};

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testLogin,
  testUsers,
  testPayrollStats,
  testPayrollAll,
  testAttendance,
  runTests
};