import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  // ======= Handle Preflight (OPTIONS) first! =======
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', 'https://qxxk00-am.myshopify.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
    );
    res.status(200).end();
    return;
  }

  // ======= Apply CORS headers for all other requests =======
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://qxxk00-am.myshopify.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
  );

  // ======= Block non-POST methods =======
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log('📩 REQ BODY:', req.body);
    console.log('📩 REQ HEADERS:', req.headers);
    console.log('📩 REQ METHOD:', req.method);
    console.log('📩 REQ URL:', req.url);
    console.log('📩 REQ COOKIES:', req.cookies);
    console.log('📩 REQ QUERY:', req.query);
    console.log('📩 REQ PROTOCOL:', req.protocol);
    console.log('📩 REQ HOST:', req.headers.host);
    console.log('📩 REQ IP:', req.ip);

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
            unit_amount: 1999,
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
    console.error('🔥 ERRO DETALHADO DO STRIPE:');
console.error('📛 MESSAGE:', err.message);
console.error('🧠 STACK:', err.stack);
console.error('📦 RAW:', JSON.stringify(err, null, 2));

    res.status(500).json({ error: 'Internal Server Error' });
  }
}
