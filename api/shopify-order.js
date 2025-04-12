import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido, caralho!' });
  }

  try {
    const { email, variantId, quantity, amount } = req.body;

    // 🚨 Variáveis de ambiente seguras
    const SHOPIFY_STORE = 'https://qxxk00-am.myshopify.com';
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!SHOPIFY_ACCESS_TOKEN) {
      throw new Error('SHOPIFY_ACCESS_TOKEN não foi definido, porra!');
    }

    const orderData = {
      order: {
        email,
        financial_status: 'paid',
        send_receipt: true,
        send_fulfillment_receipt: true,
        line_items: [
          {
            variant_id: variantId,
            quantity
          }
        ],
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

    console.log('🚀 Ordem criada com sucesso:', response.data);
    return res.status(200).json({ message: 'Ordem criada com sucesso, caralho!', data: response.data });

  } catch (error) {
    console.error('❌ Deu merda criando ordem:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Deu merda criando ordem.',
      error: error.response?.data || error.message
    });
  }
}
