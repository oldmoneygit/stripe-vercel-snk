const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405).end('Método não permitido');
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (err) {
    res.writeHead(400).end('JSON zoado');
    return;
  }

  const { email, first_name, last_name, address1, city, zip, country, line_items } = parsed;

  const shopifyDomain = process.env.SHOPIFY_DOMAIN;
  const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN;

  const lineItemsGQL = line_items.map(item => {
    return `{ variantId: "${item.variant_id}", quantity: ${item.quantity} }`;
  }).join(', ');

  const query = `
    mutation {
      orderCreate(input: {
        email: "${email}",
        financialStatus: PAID,
        shippingAddress: {
          address1: "${address1}",
          city: "${city}",
          country: "${country}",
          zip: "${zip}",
          firstName: "${first_name}",
          lastName: "${last_name}"
        },
        lineItems: [${lineItemsGQL}]
      }) {
        order {
          id
          name
          statusUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const payload = JSON.stringify({ query });

  const options = {
    hostname: shopifyDomain,
    path: '/admin/api/2025-04/graphql.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      console.log('✅ Pedido marcado como pago:', data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  });

  request.on('error', (err) => {
    console.error('❌ Shopify error:', err);
    res.writeHead(500).end('Erro criando pedido');
  });

  request.write(payload);
  request.end();
};
