import Stripe from 'stripe';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const rawBody = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ PAGAMENTO CONFIRMADO:', session);

    await criarPedidoNaShopify(session);
  }

  res.status(200).json({ received: true });
}

async function criarPedidoNaShopify(session) {
  const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
  const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

  const customer = session.customer_details;
  const address = customer.address;

  const body = {
    order: {
      email: customer.email,
      financial_status: 'paid',
      send_receipt: true,
      send_fulfillment_receipt: true,
      customer: {
        first_name: customer.name?.split(' ')[0] || '',
        last_name: customer.name?.split(' ').slice(1).join(' ') || '',
        email: customer.email,
        phone: customer.phone || '',
      },
      shipping_address: {
        first_name: customer.name?.split(' ')[0] || '',
        last_name: customer.name?.split(' ').slice(1).join(' ') || '',
        address1: address.line1 || '',
        address2: address.line2 || '',
        city: address.city || '',
        province: address.state || '',
        country: address.country || '',
        zip: address.postal_code || '',
        phone: customer.phone || '',
      },
      billing_address: {
        first_name: customer.name?.split(' ')[0] || '',
        last_name: customer.name?.split(' ').slice(1).join(' ') || '',
        address1: address.line1 || '',
        address2: address.line2 || '',
        city: address.city || '',
        province: address.state || '',
        country: address.country || '',
        zip: address.postal_code || '',
        phone: customer.phone || '',
      },
      line_items: [
        {
          title: 'SNEAKER',
          quantity: 1,
          price: session.amount_total / 100,
        },
      ]
    }
  };

  const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2023-10/orders.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log('🧾 Pedido criado na Shopify:', JSON.stringify(data, null, 2));
}
