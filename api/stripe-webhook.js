import { buffer } from 'micro';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = require('stripe')(process.env.STRIPE_SECRET);
const SHOPIFY_ENDPOINT = `${process.env.BASE_URL}/api/shopify-order`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido, porra!');
  }

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook inválido:', err.message);
    return res.status(400).send(`Webhook inválido: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status === 'paid') {
      const email = session.customer_details.email;
      let items = [];

      try {
        items = JSON.parse(session.metadata.items);
      } catch (err) {
        console.error('❌ Falha ao parsear metadata.items:', err);
        return res.status(400).send('Metadata.items inválido');
      }

      // Monta os line_items pro Shopify
      const line_items = items.map(item => ({
        variant_id: Number(item.variantId),
        quantity: Number(item.quantity),
      }));

      // Soma total da fatura (convertendo de centavos pra decimal)
      const amount = items.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
      }, 0) / 100;

      // Prepara payload da ordem Shopify
      const payload = {
        email,
        line_items,
        amount
      };

      // Bate no endpoint que cria ordem
      try {
        const response = await axios.post(SHOPIFY_ENDPOINT, payload);
        console.log('🔥 Ordem criada na Shopify:', response.data);
      } catch (err) {
        console.error('💥 Erro criando ordem na Shopify:', err.response?.data || err.message);
      }
    }
  }

  res.status(200).send('Webhook processado com sucesso!');
}
