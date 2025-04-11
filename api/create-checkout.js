import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { product, quantity, email } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: product,
          },
          unit_amount: 1999, // preço em centavos (19.99)
        },
        quantity: quantity || 1,
      },
    ],
    mode: 'payment',
    success_url: 'https://qxxk00-am.myshopify.com/sucesso',
    cancel_url: 'https://qxxk00-am.myshopify.com.com/cancelado',
    customer_email: email,
  });

  res.status(200).json({ url: session.url });
}
