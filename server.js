const http = require('http');
const { router, get, post } = require('microrouter');

// Importa tudo que é handler
const stripeWebhook = require('./api/stripe-webhook');
const shopifyOrder = require('./api/shopify-order');
const shopifyOrderGraphQL = require('./api/shopify-order-graphql'); // 👈 AQUI Ó

// Garante que não quebra se usar export default
const normalize = (handler) => (typeof handler === 'function' ? handler : handler.default || handler.handler);

// Cria o servidor com todas as rotas do backend
const server = http.createServer(
  router(
    post('/api/stripe-webhook', normalize(stripeWebhook)),
    post('/api/shopify-order', normalize(shopifyOrder)),
    post('/api/shopify-order-graphql', normalize(shopifyOrderGraphQL)), // 👈 AQUI TAMBÉM
    get('/', (req, res) => {
      res.end('Lek do Black rodando, caralho!');
    })
  )
);

// Porta configurável
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
