const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  const filePath = path.join(__dirname, '../data/logs.json');

  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;

    const pedido = JSON.parse(body);

    const logs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    logs.unshift({ ...pedido, data: new Date().toISOString() });

    fs.writeFileSync(filePath, JSON.stringify(logs.slice(0, 100), null, 2)); // só mantém últimos 100

    res.writeHead(200).end('Log atualizado!');
  } else if (req.method === 'GET') {
    const logs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(logs));
  } else {
    res.writeHead(405).end('Método não permitido');
  }
};
