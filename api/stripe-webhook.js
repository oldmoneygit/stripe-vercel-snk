import { buffer } from 'micro';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

const STRIPE_SECRET = process.env.STRIPE_SECRET;
const SHOPIFY_ENDPOINT = `${process.env.BASE_URL}/api/shopify-order`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido, caralho!');
  }

  const sig = req.headers['stripe-signature'];
  const stripe = require('stripe')(STRIPE_SECRET);

  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook inválido:', err.message);
    return res.status(400).send(`Webhook inválido: ${err.message}`);
  }

  // 👇 Evento que tu quer: sessão de checkout completa
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Só se o pagamento foi confirmado
    if (session.payment_status === 'paid') {
      // Exemplo básico, tu pode refinar isso
      const payload = {
        email: session.customer_details.email,
        variantId: 44857738491191, // ⚠️ troca esse valor depois!
        quantity: 1,
        amount: session.amount_total / 100
      };

      try {
        const response = await axios.post(SHOPIFY_ENDPOINT, payload);
        console.log('🔥 Ordem criada na Shopify:', response.data);
      } catch (err) {
        console.error('💥 Deu ruim na criação de ordem na Shopify:', err.message);
      }
    }
  }

  res.status(200).send('Webhook recebido e processado, porra!');
}
