const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método errado, porra!' });

  const { baseDomain, baseToken, destDomain, destToken } = req.body;
  if (!baseDomain || !baseToken || !destDomain || !destToken) {
    return res.status(400).json({ error: 'Faltando dados, imbecil!' });
  }

  const results = {};

  const fetchShopify = async (domain, token, endpoint) => {
    const url = `https://${domain}/admin/api/2023-10/${endpoint}`;
    const response = await axios.get(url, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    return response.data;
  };

  const postShopify = async (domain, token, endpoint, data) => {
    const url = `https://${domain}/admin/api/2023-10/${endpoint}`;
    const response = await axios.post(url, data, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  };

  try {
    // Produtos
    const baseProducts = await fetchShopify(baseDomain, baseToken, 'products.json');
    for (const p of baseProducts.products) {
      const product = { ...p };
      delete product.id;
      delete product.admin_graphql_api_id;
      const posted = await postShopify(destDomain, destToken, 'products.json', { product });
    }
    results.products = { total: baseProducts.products.length };

    // Coleções
    const baseCollections = await fetchShopify(baseDomain, baseToken, 'custom_collections.json');
    for (const c of baseCollections.custom_collections) {
      const collection = { ...c };
      delete collection.id;
      const posted = await postShopify(destDomain, destToken, 'custom_collections.json', { custom_collection: collection });
    }
    results.collections = { total: baseCollections.custom_collections.length };

    // Páginas
    const basePages = await fetchShopify(baseDomain, baseToken, 'pages.json');
    for (const page of basePages.pages) {
      const p = { ...page };
      delete p.id;
      const posted = await postShopify(destDomain, destToken, 'pages.json', { page: p });
    }
    results.pages = { total: basePages.pages.length };

    // Webhooks
    const baseWebhooks = await fetchShopify(baseDomain, baseToken, 'webhooks.json');
    for (const wh of baseWebhooks.webhooks) {
      const w = { ...wh };
      delete w.id;
      const posted = await postShopify(destDomain, destToken, 'webhooks.json', { webhook: w });
    }
    results.webhooks = { total: baseWebhooks.webhooks.length };

    // Customers
    const baseCustomers = await fetchShopify(baseDomain, baseToken, 'customers.json');
    let created = 0;
    for (const cust of baseCustomers.customers) {
      const customer = {
        first_name: cust.first_name,
        last_name: cust.last_name,
        email: cust.email,
        phone: cust.phone,
        addresses: cust.addresses?.map(addr => ({
          address1: addr.address1,
          address2: addr.address2,
          city: addr.city,
          province: addr.province,
          zip: addr.zip,
          country: addr.country
        }))
      };
      try {
        await postShopify(destDomain, destToken, 'customers.json', { customer });
        created++;
      } catch (err) {
        console.log('Erro ao clonar customer:', err.response?.data?.errors || err.message);
      }
    }
    results.customers = { total: created };

    // Tema - só copia o principal se existir
    const themeList = await fetchShopify(baseDomain, baseToken, 'themes.json');
    const mainTheme = themeList.themes?.find(t => t.role === 'main');
    if (mainTheme) {
      const themeDownload = await axios.get(`https://${baseDomain}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
        headers: { 'X-Shopify-Access-Token': baseToken }
      });

      const themeAssets = themeDownload.data.assets;
      for (const asset of themeAssets) {
        if (!asset.key.endsWith('.liquid') && !asset.key.includes('.')) continue;
        const assetContent = await axios.get(`https://${baseDomain}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
          headers: { 'X-Shopify-Access-Token': baseToken },
          params: { 'asset[key]': asset.key }
        });

        await axios.put(`https://${destDomain}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
          asset: {
            key: asset.key,
            value: assetContent.data.asset.value
          }
        }, {
          headers: {
            'X-Shopify-Access-Token': destToken,
            'Content-Type': 'application/json'
          }
        });
      }

      results.theme = { total: themeAssets.length };
    }

    return res.status(200).json(results);

  } catch (err) {
    console.error('💥 Erro geral no clone:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Erro no processo de clonagem', details: err.message });
  }
};
