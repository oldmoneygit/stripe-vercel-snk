const http = require('http');
const { router, get, post } = require('microrouter');
const fs = require('fs');
const path = require('path');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

// HANDLERS
const stripeWebhook = require('./api/stripe-webhook');
const shopifyOrder = require('./api/shopify-order');
const shopifyOrderGraphQL = require('./api/shopify-order-graphql');
const shopifyOrderPaid = require('./api/shopify-order-paid');
const logPedido = require('./api/log-pedido');
const cloneLoja = require('./api/clone-loja');
const updateDomain = require('./api/update-domain');

// FUNÇÃO PRA NORMALIZAR EXPORT DEFAULT
const normalize = (handler) => (typeof handler === 'function' ? handler : handler.default || handler.handler);

// SERVE STATIC FILES DA /public
const publicPath = path.join(__dirname, 'public');
const serve = serveStatic(publicPath);

// ROTEAMENTO PRINCIPAL
const server = http.createServer((req, res) => {
  // primeiro tenta servir arquivos estáticos
  serve(req, res, () => {
    router(
      post('/api/stripe-webhook', normalize(stripeWebhook)),
      post('/api/shopify-order', normalize(shopifyOrder)),
      post('/api/shopify-order-graphql', normalize(shopifyOrderGraphQL)),
      post('/api/shopify-order-paid', normalize(shopifyOrderPaid)),
      post('/api/log-pedido', normalize(logPedido)),
      get('/api/log-pedido', normalize(logPedido)),
      post('/api/clone-loja', normalize(cloneLoja)),
      post('/api/log-pedido', normalize(logPedido)),
      post('/api/update-domain', normalize(updateDomain)),
    )(req, res, finalhandler(req, res));
  });
});

// PORTA
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
