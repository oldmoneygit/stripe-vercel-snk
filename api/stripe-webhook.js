const { buffer } = require('micro');
const axios = require('axios');

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

const stripe = require('stripe')(process.env.STRIPE_SECRET);
const SHOPIFY_ORDER_ENDPOINT = `${process.env.BASE_URL}/api/shopify-order`; // 🔥 isso vai bater direto na tua API REST

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.writeHead(405).end('Método não permitido');

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook inválido:', err.message);
    return res.writeHead(400).end(`Webhook inválido: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status === 'paid') {
      let items = [];
      try {
        items = JSON.parse(session.metadata.items);
      } catch (err) {
        console.error('❌ Metadata zoada:', err.message);
        return res.writeHead(400).end('Metadata.items inválido');
      }

      const customer = session.customer_details;
      const address = customer.address;

      const [first_name, ...rest] = customer.name.split(' ');

      const payload = {
        email: customer.email,
        line_items: items.map(item => ({
          variant_id: Number(item.variantId),
          quantity: Number(item.quantity),
        })),
        amount: items.reduce((acc, item) => acc + (item.price * item.quantity), 0) / 100,
        shipping_address: {
          first_name,
          last_name: rest.join(' ') || '',
          address1: address.line1,
          address2: address.line2 || '',
          city: address.city,
          province: address.state,
          country: address.country,
          zip: address.postal_code
        }
      };

      // 🚀 Cria o pedido na Shopify automático
      try {
        const result = await axios.post(SHOPIFY_ORDER_ENDPOINT, payload);
        console.log('✅ Pedido criado na Shopify:', result.data);
      } catch (err) {
        console.error('💥 ERRO CRIANDO ORDEM:', err.response?.data || err.message);
      }
    }
  }

  res.writeHead(200).end('Webhook processado com sucesso');
};
