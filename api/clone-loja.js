const cloneLoja = require('../utils/cloneloja');

module.exports = async (req, res) => {
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const { baseDomain, baseToken, destDomain, destToken } = JSON.parse(body);

      if (!baseDomain || !destDomain || !baseToken || !destToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Faltando parâmetros obrigatórios' }));
      }

      await cloneLoja(baseDomain, baseToken, destDomain, destToken);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Clone finalizado com sucesso!' }));
    });
  } catch (err) {
    console.error('Erro na API de clonagem:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Erro interno no servidor', details: err.message }));
  }
};
