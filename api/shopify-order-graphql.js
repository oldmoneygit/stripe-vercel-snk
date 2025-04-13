const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405).end('Método não permitido, porra!');
    return;
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (err) {
    console.error('❌ JSON inválido:', err);
    res.writeHead(400).end('JSON do corpo tá uma merda!');
    return;
  }

  const {
    email,
    first_name,
    last_name,
    address1,
    city,
    zip,
    country,
    line_items,
  } = parsed;

  if (!email || !line_items || !Array.isArray(line_items) || line_items.length === 0) {
    res.writeHead(400).end('Faltando dados obrigatórios, seu animal!');
    return;
  }

  const shopifyDomain = process.env.SHOPIFY_DOMAIN;
  const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN;

  const lineItemsGQL = line_items.map(item => {
    return `{ variantId: "${item.variant_id}", quantity: ${item.quantity} }`;
  }).join(', ');

  const mutation = `
    mutation {
      draftOrderCreate(input: {
        email: "${email}",
        shippingAddress: {
          address1: "${address1}",
          city: "${city}",
          country: "${country}",
          zip: "${zip}",
          firstName: "${first_name}",
          lastName: "${last_name}"
        },
        lineItems: [${lineItemsGQL}],
        useCustomerDefaultAddress: false
      }) {
        draftOrder {
          id
          invoiceUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const payload = JSON.stringify({ query: mutation });

  const options = {
    hostname: shopifyDomain,
    path: '/admin/api/2024-04/graphql.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      console.log('🔥 Shopify respondeu:', data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  });

  request.on('error', (err) => {
    console.error('💥 ERRO AO ENVIAR PRA SHOPIFY:', err);
    res.writeHead(500).end('Erro ao conectar com Shopify, porra!');
  });

  request.write(payload);
  request.end();
};
