const Stripe = require('stripe');
const getRawBody = require('raw-body');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
const SHOPIFY_STORE = process.env.SHOPIFY_STORE; // tipo "602j2f-ig.myshopify.com"

module.exports = async function handler(req, res) {
  const raw = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log('❌ Webhook Signature inválida:', err.message);
    return res.end('Webhook error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadataItems = JSON.parse(session.metadata.items || '[]');

    const lineItems = metadataItems.map(item => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    }));

    try {
      const orderResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/orders.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: {
            line_items: lineItems,
            financial_status: 'paid',
            tags: 'stripe-auto'
          }
        })
      });

      const orderData = await orderResponse.json();
      console.log('✅ Pedido criado na Shopify:', orderData);

    } catch (err) {
      console.error('💥 ERRO AO CRIAR ORDEM NA SHOPIFY:', err.message);
    }
  }

  res.end('ok');
};
