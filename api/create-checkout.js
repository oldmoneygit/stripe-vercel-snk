const Stripe = require('stripe');
const getRawBody = require('raw-body');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// 🔧 Configuração de CORS para liberar tudo
function setCorsHeaders(res) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir qualquer origem
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT'); // Permitir todos os métodos
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, Origin'
    ); // Permitir todos os headers comuns
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache de preflight por 24 horas
  } catch (e) {
    console.error('❌ Falha ao setar CORS headers:', e.message);
  }
}

// 🧨 Handler Principal
module.exports = async function handler(req, res) {
  console.log('🔥 INICIOU HANDLER /api/create-checkout');
  setCorsHeaders(res);

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log('🔁 Preflight OPTIONS respondido.');
    res.statusCode = 204; // Sem conteúdo
    res.end();
    return;
  }

  // Verificar se o método é POST
  if (req.method !== 'POST') {
    console.warn(`🚫 Método proibido: ${req.method}`);
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Method Not Allowed' }));
    return;
  }

  try {
    // Obter o corpo da requisição
    const raw = await getRawBody(req);
    const parsedBody = JSON.parse(raw.toString());

    console.log('📦 Body recebido:', parsedBody);

    const { items } = parsedBody;

    // Validar os itens do carrinho
    if (!Array.isArray(items) || items.length === 0) {
      console.warn('❌ Carrinho vazio ou inválido:', items);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Carrinho vazio ou inválido' }));
      return;
    }

    // Criar a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'SNEAKER SNK HOUSE', // Nome do produto
          },
          unit_amount: Math.round(item.price * 100), // Certifique-se de que o valor está em centavos
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: 'https://602j2f-ig.myshopify.com/pages/obrigado',
      cancel_url: 'https://602j2f-ig.myshopify.com/pages/erro',
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['ES'],
      },
      phone_number_collection: {
        enabled: true,
      },
      locale: 'es',
      metadata: {
        items: JSON.stringify(items),
      },
    });

    console.log('✅ Stripe session criada:', session.url);

    // Retornar a URL da sessão de checkout
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ url: session.url }));
  } catch (err) {
    console.error('💥 Stripe Error:', err.message);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor' }));
  }
};