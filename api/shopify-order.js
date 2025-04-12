const axios = require('axios');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido, caralho!' });
  }

  try {
    const { email, line_items, amount, shipping_address } = req.body;

    if (!email || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'Dados incompletos pra criar a porra da ordem' });
    }

    const SHOPIFY_STORE = 'https://qxxk00-am.myshopify.com';
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

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
            amount: parseFloat(amount)
          }
        ]
      }
    };

    const response = await axios.post(
      `${SHOPIFY_STORE}/admin/api/2023-10/orders.json`,
      orderData,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Shopify respondeu:', response.data);
    return res.status(200).json({ message: 'Ordem criada com sucesso!', data: response.data });

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Erro ao criar ordem:', errData);

    return res.status(500).json({
      error: 'Erro ao criar ordem na Shopify',
      details: errData
    });
  }
};
