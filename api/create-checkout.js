const Stripe = require('stripe');
const getRawBody = require('raw-body');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return res.end(JSON.stringify({ message: 'Method Not Allowed' }));

  const raw = await getRawBody(req);
  const { items } = JSON.parse(raw.toString());

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.end(JSON.stringify({ error: 'Carrinho vazio ou inválido' }));
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: 'SNK HOUSE' },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    customer_creation: 'always',
    success_url: 'https://602j2f-ig.myshopify.com/pages/obrigado',
    cancel_url: 'https://602j2f-ig.myshopify.com/pages/erro',
    billing_address_collection: 'auto',
    shipping_address_collection: { allowed_countries: ['ES'] },
    phone_number_collection: { enabled: true },
    locale: 'es',
    metadata: {
      items: JSON.stringify(items.map(({ variantId, quantity }) => ({
        variantId, quantity
      })))
    }
  });

  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ url: session.url }));
};
