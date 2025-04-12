const Stripe = require('stripe');
const getRawBody = require('raw-body');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// Liberar requisições da Shopify e geral
function setCorsHeaders(res) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Libera geral
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
    );
  } catch (e) {
    console.log('💥 Erro ao setar headers CORS:', e);
  }
}

module.exports = async function handler(req, res) {
  console.log('🔥 INICIOU HANDLER /api/create-checkout');
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    console.log('🔁 Preflight request OPTIONS respondido.');
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    console.log(`🚫 Método não permitido: ${req.method}`);
    res.statusCode = 405;
    return res.end(JSON.stringify({ message: 'Method Not Allowed' }));
  }

  try {
    const raw = await getRawBody(req);
    const parsedBody = JSON.parse(raw.toString());

    console.log('📦 Body recebido:', parsedBody);
    const { items } = parsedBody;

    if (!Array.isArray(items) || items.length === 0) {
      console.log('❌ Carrinho vazio ou inválido:', items);
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Carrinho vazio ou inválido' }));
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title || 'SNEAKER SNK HOUSE',
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      customer_creation: 'always',
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
      }
    });

    console.log('✅ Sessão Stripe criada com sucesso:', session.url);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ url: session.url }));

  } catch (err) {
    console.error('💥 Stripe Error:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor' }));
  }
};
