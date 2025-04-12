const http = require('http');
const path = require('path');
const finalhandler = require('finalhandler');
const { router, get, post } = require('microrouter');
const serveStatic = require('serve-static');

// Importa os handlers
const stripeWebhook = require('./api/stripe-webhook');
const shopifyOrder = require('./api/shopify-order');
const shopifyOrderGraphQL = require('./api/shopify-order-graphql');
const shopifyOrderPaid = require('./api/shopify-order-paid');
const logPedido = require('./api/log-pedido');

// Normaliza export default
const normalize = (handler) => (typeof handler === 'function' ? handler : handler.default || handler.handler);

// Middleware pra servir HTML, CSS, JS e imagens da pasta /public
const staticMiddleware = serveStatic(path.join(__dirname, 'public'));

// Criação do servidor com rotas + arquivos públicos
const server = http.createServer((req, res) => {
  // Primeiro tenta rodar as rotas da API
  const match = router(
    // APIs
    post('/api/stripe-webhook', normalize(stripeWebhook)),
    post('/api/shopify-order', normalize(shopifyOrder)),
    post('/api/shopify-order-graphql', normalize(shopifyOrderGraphQL)),
    post('/api/shopify-order-paid', normalize(shopifyOrderPaid)),
    post('/api/log-pedido', normalize(logPedido)),
    get('/api/log-pedido', normalize(logPedido)),

    // Rota raiz
    get('/', (req, res) => {
      res.end('Lek do Black rodando, caralho!');
    })
  )(req, res);

  // Se nenhuma rota da API bateu, tenta servir um arquivo estático
  if (!match) staticMiddleware(req, res, finalhandler(req, res));
});

// Porta configurável
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
