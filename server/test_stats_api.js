const http = require('http');

const postData = JSON.stringify({
  email: 'admin@odoo.com',
  password: 'Password@123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const response = JSON.parse(data);
    if (response.success) {
      console.log('Login Successful');
      const token = response.data.token;
      callStats(token);
    } else {
      console.log('Login Failed', response);
    }
  });
});

loginReq.write(postData);
loginReq.end();

function callStats(token) {
  const statsOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/stats/employees',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const statsReq = http.request(statsOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('STATS STATUS:', res.statusCode);
      console.log('STATS BODY:', data);
    });
  });

  statsReq.end();
}
