import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const buffer = async (readable) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

export default async function handler(req, res) {
  console.log("🔥 Recebido requisição Stripe");

  if (req.method !== 'POST') {
    console.log("❌ Método não permitido:", req.method);
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log("📦 EVENTO CONSTRUÍDO:", event.type);
  } catch (err) {
    console.error("❌ Erro no Webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log("✅ Pagamento confirmado:", session.customer_email, session.amount_total);
  } else {
    console.log("ℹ️ Outro evento recebido:", event.type);
  }

  await new Promise(resolve => setTimeout(resolve, 2000)); // força log na Vercel
  res.status(200).json({ received: true });
}
