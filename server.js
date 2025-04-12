const http = require('http');
const { router, get, post } = require('microrouter');

const stripeWebhook = require('./api/stripe-webhook');
const shopifyOrder = require('./api/shopify-order');

const server = http.createServer(
  router(
    post('/api/stripe-webhook', stripeWebhook),
    post('/api/shopify-order', shopifyOrder),
    get('/', (req, res) => {
      res.end('Lek do Black rodando, caralho!');
    })
  )
);

server.listen(process.env.PORT || 3000, () => {
  console.log(`🔥 Servidor rodando na porta ${process.env.PORT || 3000}`);
});
