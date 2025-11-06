const http = require('http');

const data = JSON.stringify({ message: 'Recommend me some products' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/ai-assistant/demo',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      console.log('STATUS', res.statusCode);
      console.log('BODY', JSON.parse(body));
    } catch (e) {
      console.log('STATUS', res.statusCode);
      console.log('RAW BODY', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
