const http = require('http');

const checkBackend = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/profile',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend is running on http://localhost:5000');
    console.log(`Status: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    console.log('❌ Backend is not running on http://localhost:5000');
    console.log('Please start the backend server:');
    console.log('1. Open a new terminal');
    console.log('2. cd backend');
    console.log('3. npm run dev');
  });

  req.on('timeout', () => {
    console.log('❌ Backend connection timeout');
    req.destroy();
  });

  req.end();
};

checkBackend();