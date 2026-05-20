const http = require('http');

http.get('http://localhost:5173/', (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
  res.on('data', () => {}); // Consume response data to free up memory
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
