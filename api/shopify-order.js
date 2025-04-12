import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido, caralho!' });
  }

  try {
    const { email, line_items, amount } = req.body;

    const SHOPIFY_STORE = 'https://qxxk00-am.myshopify.com';
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    const orderData = {
      order: {
        email,
        financial_status: 'paid',
        send_receipt: true,
        send_fulfillment_receipt: true,
        line_items,
        transactions: [
          {
            kind: 'sale',
            status: 'success',
            amount
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

    return res.status(200).json({ message: 'Ordem criada com sucesso!', data: response.data });

  } catch (error) {
    console.error('❌ Erro ao criar ordem:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao criar ordem', details: error.response?.data || error.message });
  }
}
