const Stripe = require('stripe');
const getRawBody = require('raw-body');
const axios = require('axios');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const raw = await getRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);
  } catch (err) {
    console.error('💀 Erro na verificação do webhook:', err.message);
    res.statusCode = 400;
    return res.end(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const items = JSON.parse(session.metadata.items || '[]');

    console.log('✅ Webhook Stripe processado com sucesso!');
    console.log('🧠 ITEMS:', items);

    // Montar pedido Shopify
    try {
      const orderData = {
        order: {
          line_items: items.map(item => ({
            variant_id: item.variantId,
            quantity: item.quantity
          })),
          email: session.customer_details.email,
          phone: session.customer_details.phone,
          shipping_address: {
            first_name: session.customer_details.name.split(' ')[0],
            last_name: session.customer_details.name.split(' ').slice(1).join(' '),
            address1: session.customer_details.address.line1,
            city: session.customer_details.address.city,
            province: session.customer_details.address.state,
            country: 'Spain',
            zip: session.customer_details.address.postal_code,
            phone: session.customer_details.phone,
          },
          financial_status: 'paid'
        }
      };

      const response = await axios.post(
        `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2023-10/orders.json`,
        orderData,
        {
          headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('🔥 Pedido criado na Shopify!', response.data);
    } catch (err) {
      console.error('❌ Erro ao criar pedido na Shopify:', err.response?.data || err.message);
    }
  }

  res.statusCode = 200;
  res.end('Webhook recebido!');
};
