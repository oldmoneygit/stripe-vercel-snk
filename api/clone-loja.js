const getRawBody = require('raw-body');
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Lê o corpo da requisição
    const raw = await getRawBody(req);
    const body = JSON.parse(raw.toString('utf8'));

    const { baseDomain, baseToken, destDomain, destToken } = body;

    if (!baseDomain || !baseToken || !destDomain || !destToken) {
      return res.writeHead(400).end('❌ Dados de clonagem incompletos, caralho!');
    }

    // Placeholder só pra teste
    console.log(`🧬 Clonando de ${baseDomain} => ${destDomain}`);

    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      status: 'ok',
      msg: `Clone iniciado de ${baseDomain} para ${destDomain}`
    }));

  } catch (err) {
    console.error('💥 ERRO NO CLONE:', err.message);
    return res.writeHead(500).end('Erro fodido no processamento do clone');
  }
};
