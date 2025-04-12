const http = require('http');
const { router, get, post } = require('microrouter');

// Importa os handlers
const stripeWebhook = require('./api/stripe-webhook');
const shopifyOrder = require('./api/shopify-order');
const shopifyOrderGraphQL = require('./api/shopify-order-graphql');
const shopifyOrderPaid = require('./api/shopify-order-paid'); // 👈 ADICIONADO AQUI

// Garante compatibilidade com export default
const normalize = (handler) => (typeof handler === 'function' ? handler : handler.default || handler.handler);

// Criação do servidor
const server = http.createServer(
  router(
    post('/api/stripe-webhook', normalize(stripeWebhook)),
    post('/api/shopify-order', normalize(shopifyOrder)),
    post('/api/shopify-order-graphql', normalize(shopifyOrderGraphQL)),
    post('/api/shopify-order-paid', normalize(shopifyOrderPaid)), // 👈 AQUI TAMBÉM
    get('/', (req, res) => {
      res.end('Lek do Black rodando, caralho!');
    })
  )
);

// Porta da desgraça
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
