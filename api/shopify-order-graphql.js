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
    res.writeHead(400).end('JSON do corpo tá uma merda!');
    return;
  }

  const { email, first_name, last_name, address1, city, zip, country, line_items } = parsed;

  if (!email || !line_items || !Array.isArray(line_items)) {
    res.writeHead(400).end('Dados obrigatórios faltando, porra!');
    return;
  }

  const shopifyDomain = process.env.SHOPIFY_DOMAIN; // ex: 602j2f-ig.myshopify.com
  const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN;

  // Formata os line_items como GraphQL input
  const lineItemsGQL = line_items.map(item => {
    return `{ variantId: "${item.variant_id}", quantity: ${item.quantity} }`;
  }).join(', ');

  const query = `
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

  const payload = JSON.stringify({ query });

  const options = {
    hostname: shopifyDomain,
    path: '/admin/api/2025-04/graphql.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      console.log('🔥 Shopify GraphQL response:', data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  });

  request.on('error', (err) => {
    console.error('💥 ERRO NA REQ SHOPIFY:', err);
    res.writeHead(500).end('Erro na requisição pra Shopify!');
  });

  request.write(payload);
  request.end();
};
