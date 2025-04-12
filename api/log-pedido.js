const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'data', 'logs.json');

function readLogs() {
  if (!fs.existsSync(logFile)) return [];
  try {
    const content = fs.readFileSync(logFile);
    return JSON.parse(content.toString() || '[]');
  } catch (err) {
    console.error('❌ Erro lendo logs:', err);
    return [];
  }
}

function writeLog(newLog) {
  const logs = readLogs();
  logs.push({ ...newLog, date: new Date().toISOString() });
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

async function handler(req, res) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      writeLog(data);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Log salvo com sucesso' }));
    });
  } else if (req.method === 'GET') {
    const logs = readLogs();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(logs));
  } else {
    res.statusCode = 405;
    res.end(JSON.stringify({ message: 'Método não permitido' }));
  }
}

module.exports = handler;
