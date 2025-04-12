const http = require('http');
const { router, get, post } = require('microrouter');

const stripeWebhook = require('./api/stripe-webhook');
const shopifyOrder = require('./api/shopify-order');

const normalize = (handler) => (typeof handler === 'function' ? handler : handler.default || handler.handler);

const server = http.createServer(
  router(
    post('/api/stripe-webhook', normalize(stripeWebhook)),
    post('/api/shopify-order', normalize(shopifyOrder)),
    get('/', (req, res) => {
      res.end('Lek do Black rodando, caralho!');
    })
  )
);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
