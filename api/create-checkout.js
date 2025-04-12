import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://qxxk00-am.myshopify.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio ou inválido' });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.title || 'Produto Desconhecido',
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_creation: 'always',
      success_url: 'https://qxxk00-am.myshopify.com/pages/obrigado',
      cancel_url: 'https://qxxk00-am.myshopify.com/pages/erro',
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['ES'],
      },
      phone_number_collection: {
        enabled: true,
      },
      locale: 'es',
      metadata: {
        items: JSON.stringify(items), // 🔥 Tudo codificado pro webhook ler depois
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
