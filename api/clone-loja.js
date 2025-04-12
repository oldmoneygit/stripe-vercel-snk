const axios = require('axios');
const getRawBody = require('raw-body');

module.exports = async (req, res) => {
  const buf = await getRawBody(req);
  const body = JSON.parse(buf.toString());

  const { baseDomain, baseToken, destDomain, destToken } = body;
  const log = (...args) => console.log('[🧬 CLONE]', ...args);
  log('Dados recebidos', body);

  const results = {
    products: 0,
    collections: 0,
    webhooks: 0,
    theme: false,
    customers: 0
  };

  const shopifyAPI = (domain, token) => ({
    url: `https://${domain}/admin/api/2023-10`,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });

  const base = shopifyAPI(baseDomain, baseToken);
  const dest = shopifyAPI(destDomain, destToken);

  try {
    // 1. Produtos
    const produtos = await axios.get(`${base.url}/products.json?limit=250`, { headers: base.headers });
    for (let produto of produtos.data.products) {
      const novoProduto = { product: { ...produto } };
      delete novoProduto.product.id;
      delete novoProduto.product.admin_graphql_api_id;
      delete novoProduto.product.created_at;
      delete novoProduto.product.updated_at;
      delete novoProduto.product.published_at;
      novoProduto.product.variants?.forEach(v => delete v.id);
      await axios.post(`${dest.url}/products.json`, novoProduto, { headers: dest.headers });
      results.products++;
    }

    // 2. Coleções
    const colecoes = await axios.get(`${base.url}/custom_collections.json?limit=250`, { headers: base.headers });
    for (let col of colecoes.data.custom_collections) {
      const nova = { custom_collection: { ...col } };
      delete nova.custom_collection.id;
      delete nova.custom_collection.updated_at;
      delete nova.custom_collection.published_at;
      await axios.post(`${dest.url}/custom_collections.json`, nova, { headers: dest.headers });
      results.collections++;
    }

    // 3. Webhooks
    const webhooks = await axios.get(`${base.url}/webhooks.json`, { headers: base.headers });
    for (let hook of webhooks.data.webhooks) {
      const novo = {
        webhook: {
          topic: hook.topic,
          address: hook.address.replace(baseDomain, destDomain),
          format: hook.format
        }
      };
      await axios.post(`${dest.url}/webhooks.json`, novo, { headers: dest.headers });
      results.webhooks++;
    }

    // 4. Tema
    const temas = await axios.get(`${base.url}/themes.json`, { headers: base.headers });
    const ativo = temas.data.themes.find(t => t.role === 'main');
    if (ativo && ativo.src) {
      const novoTema = {
        theme: {
          name: ativo.name,
          src: ativo.src,
          role: 'main'
        }
      };
      await axios.post(`${dest.url}/themes.json`, novoTema, { headers: dest.headers });
      results.theme = true;
    }

    // 5. Customers (email, nome, fone, endereço)
    const clientes = await axios.get(`${base.url}/customers.json?limit=100`, { headers: base.headers });
    for (let c of clientes.data.customers) {
      const novo = {
        customer: {
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          addresses: c.addresses.map(a => ({
            address1: a.address1,
            address2: a.address2,
            city: a.city,
            zip: a.zip,
            province: a.province,
            country: a.country
          }))
        }
      };
      await axios.post(`${dest.url}/customers.json`, novo, { headers: dest.headers });
      results.customers++;
    }

    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      status: 'ok',
      msg: `Clone finalizado com sucesso de ${baseDomain} para ${destDomain}`,
      resultado: results
    }));

  } catch (err) {
    console.error('💥 ERRO NO CLONE:', err);
    return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      error: 'Falha geral no processo de clonagem',
      detalhes: err.message
    }));
  }
};
