import Stripe from 'stripe';
import getRawBody from 'raw-body'; // ✅ usado pra garantir o req.body funcionando mesmo fora do Next.js/Vercel puro

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

function setCorsHeaders(res) {
  try {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', 'https://602j2f-ig.myshopify.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
    );
  } catch (e) {
    console.log('💥 Erro ao setar headers CORS:', e);
  }
}

export default async function handler(req, res) {
  console.log('🔥 INICIOU HANDLER /api/create-checkout');
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    console.log('🔁 Preflight request OPTIONS respondido.');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log(`🚫 Método não permitido: ${req.method}`);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const raw = await getRawBody(req);
    const parsedBody = JSON.parse(raw.toString());

    console.log('📦 Body recebido:', parsedBody);
    const { items } = parsedBody;

    if (!Array.isArray(items) || items.length === 0) {
      console.log('❌ Carrinho vazio ou inválido:', items);
      return res.status(400).json({ error: 'Carrinho vazio ou inválido' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'SNEAKER SNK HOUSE',
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
        items: JSON.stringify(items)
      }
    });

    console.log('✅ Sessão Stripe criada com sucesso:', session.url);
    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('💥 Stripe Error:', err.message);
    res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}
