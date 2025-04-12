const { buffer } = require('micro');
const axios = require('axios');

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

const stripe = require('stripe')(process.env.STRIPE_SECRET);
const SHOPIFY_ENDPOINT = 'https://stripe-serverless-vercel.onrender.com/api/shopify-order'; // 🧠 direto, sem depender de env

module.exports = async function handler(req, res) {
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
      const customer = session.customer_details;

      let items = [];
      try {
        items = JSON.parse(session.metadata.items);
      } catch (err) {
        console.error('❌ Falha ao parsear metadata.items:', err);
        return res.status(400).send('Metadata.items inválido');
      }

      const line_items = items.map(item => ({
        variant_id: Number(item.variantId),
        quantity: Number(item.quantity),
      }));

      const [first_name, ...rest] = customer.name.split(' ');
      const shipping_address = {
        first_name,
        last_name: rest.join(' ') || '',
        address1: customer.address.line1,
        address2: customer.address.line2 || '',
        city: customer.address.city,
        province: customer.address.state,
        country: customer.address.country,
        zip: customer.address.postal_code
      };

      const amount = items.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
      }, 0) / 100;

      const payload = {
        email: customer.email,
        line_items,
        amount,
        shipping_address
      };

      try {
        const response = await axios.post(SHOPIFY_ENDPOINT, payload);
        console.log('🔥 Ordem criada na Shopify:', response.data);
      } catch (err) {
        console.error('💥 Erro criando ordem na Shopify:', err.response?.data || err.message);
      }
    }
  }

  res.status(200).send('Webhook processado com sucesso!');
};
