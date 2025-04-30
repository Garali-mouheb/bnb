
const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('✅ Le serveur répond correctement\n');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur de test démarré sur le port ${PORT}`);
});
