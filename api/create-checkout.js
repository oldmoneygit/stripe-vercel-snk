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
    const { quantity, price } = req.body;

    // TIRA ESSA PORRA DE EMAIL DAQUI, ANIMAL
    if (typeof quantity !== 'number' || quantity < 1 || typeof price !== 'number' || isNaN(price)) {
      return res.status(400).json({ error: 'Missing or invalid quantity or price' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'SNEAKER',
            },
            unit_amount: price,
          },
          quantity,
        },
      ],
      mode: 'payment',
      customer_creation: 'always',
      success_url: 'https://qxxk00-am.myshopify.com/pages/obrigado',
      cancel_url: 'https://qxxk00-am.myshopify.com/pages/erro',
      // ADICIONA ESSA BOSTA AQUI 👇👇👇👇
      billing_address_collection: 'required',
      shipping_address_collection: {
      allowed_countries: ['ES'] // Põe os que tu aceita
  },
  phone_number_collection: {
    enabled: true
  },
  locale: 'es',
    });

    

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
