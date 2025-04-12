const axios = require('axios');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405).end('Método não permitido, caralho!');
    return;
  }

  let body = '';

  try {
    for await (const chunk of req) {
      body += chunk;
    }
    req.body = JSON.parse(body);
  } catch (err) {
    console.error('💀 Erro parseando JSON do corpo:', err.message);
    res.writeHead(400).end('JSON inválido, porra!');
    return;
  }

  const { email, line_items, amount, shipping_address } = req.body || {};

  if (!email || !Array.isArray(line_items) || line_items.length === 0) {
    res.writeHead(400).end('Dados incompletos pra criar a porra da ordem');
    return;
  }

  const SHOPIFY_STORE = 'https://602j2f-ig.myshopify.com';
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

  const orderData = {
    order: {
      email,
      shipping_address,
      financial_status: 'paid',
      send_receipt: true,
      send_fulfillment_receipt: true,
      line_items,
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: parseFloat(amount),
        },
      ],
    },
  };

  try {
    const response = await axios.post(
      `${SHOPIFY_STORE}/admin/api/2023-10/orders.json`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        },
      }
    );

    console.log('🧾 Ordem criada na Shopify:', JSON.stringify(response.data, null, 2));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Ordem criada com sucesso!', data: response.data }));

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Erro ao criar ordem:', errData);

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Erro ao criar ordem na Shopify',
      details: errData,
    }));
  }
};
