import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  // ===== CORS HEADERS =========
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://qxxk00-am.myshopify.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { product, quantity, email } = req.body;

    if (!product || !quantity) {
      return res.status(400).json({ error: 'Missing product or quantity' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product,
            },
            unit_amount: 1999, // valor em centavos: 19.99 EUR
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: 'https://qxxk00-am.myshopify.com/pages/obrigado',
      cancel_url: 'https://qxxk00-am.myshopify.com/pages/erro',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Erro Stripe:', err);
    res.status(500).json({ error: 'Erro interno ao criar sessão' });
  }
}
