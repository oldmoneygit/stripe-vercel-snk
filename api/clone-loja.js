const axios = require('axios');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido, caralho!' });
  }

  const { dominio, token } = req.body;

  if (!dominio || !token) {
    return res.status(400).json({ error: 'Faltando domínio ou token, porra!' });
  }

  const origemDomain = process.env.SHOPIFY_DOMAIN;
  const origemToken = process.env.SHOPIFY_ACCESS_TOKEN;

  const origem = axios.create({
    baseURL: `https://${origemDomain}/admin/api/2023-10`,
    headers: {
      'X-Shopify-Access-Token': origemToken,
      'Content-Type': 'application/json',
    },
  });

  const destino = axios.create({
    baseURL: `https://${dominio}/admin/api/2023-10`,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
  });

  const relatorio = {
    produtos: { total: 0, sucesso: 0, erro: 0 },
    paginas: { total: 0, sucesso: 0, erro: 0 },
    colecoes: { total: 0, sucesso: 0, erro: 0 },
    webhooks: { total: 0, sucesso: 0, erro: 0 },
    tema: '❌ Ainda não clonado'
  };

  try {
    // === PRODUTOS ===
    const produtosResp = await origem.get('/products.json?limit=250');
    const produtos = produtosResp.data.products;
    relatorio.produtos.total = produtos.length;

    for (const produto of produtos) {
      const payload = {
        product: {
          title: produto.title,
          body_html: produto.body_html,
          vendor: produto.vendor,
          product_type: produto.product_type,
          tags: produto.tags,
          images: produto.images.map(img => ({ src: img.src })),
          variants: produto.variants.map(v => ({
            option1: v.option1,
            price: v.price,
            sku: v.sku,
            inventory_management: 'shopify',
            inventory_quantity: v.inventory_quantity,
          })),
        },
      };
      try {
        await destino.post('/products.json', payload);
        relatorio.produtos.sucesso++;
      } catch {
        relatorio.produtos.erro++;
      }
    }

    // === PÁGINAS ===
    const paginasResp = await origem.get('/pages.json?limit=100');
    const paginas = paginasResp.data.pages;
    relatorio.paginas.total = paginas.length;

    for (const page of paginas) {
      try {
        await destino.post('/pages.json', { page });
        relatorio.paginas.sucesso++;
      } catch {
        relatorio.paginas.erro++;
      }
    }

    // === COLEÇÕES ===
    const colecoesResp = await origem.get('/custom_collections.json?limit=250');
    const colecoes = colecoesResp.data.custom_collections;
    relatorio.colecoes.total = colecoes.length;

    for (const coll of colecoes) {
      const payload = {
        custom_collection: {
          title: coll.title,
          body_html: coll.body_html,
          published: coll.published,
        },
      };
      try {
        await destino.post('/custom_collections.json', payload);
        relatorio.colecoes.sucesso++;
      } catch {
        relatorio.colecoes.erro++;
      }
    }

    // === WEBHOOKS ===
    const webhooksResp = await origem.get('/webhooks.json');
    const webhooks = webhooksResp.data.webhooks;
    relatorio.webhooks.total = webhooks.length;

    for (const webhook of webhooks) {
      const payload = {
        webhook: {
          address: webhook.address,
          topic: webhook.topic,
          format: webhook.format,
        },
      };
      try {
        await destino.post('/webhooks.json', payload);
        relatorio.webhooks.sucesso++;
      } catch {
        relatorio.webhooks.erro++;
      }
    }

    // === TEMA ===
    try {
      const temasResp = await origem.get('/themes.json');
      const temaPrincipal = temasResp.data.themes.find(t => t.role === 'main');
      if (temaPrincipal) {
        const arquivosResp = await origem.get(`/themes/${temaPrincipal.id}/assets.json`);
        const arquivos = arquivosResp.data.assets.slice(0, 5); // pega os 5 principais

        for (const asset of arquivos) {
          const conteudo = await origem.get(`/themes/${temaPrincipal.id}/assets.json`, {
            params: { 'asset[key]': asset.key },
          });

          await destino.put(`/themes/${temaPrincipal.id}/assets.json`, {
            asset: {
              key: asset.key,
              value: conteudo.data.asset.value,
            },
          });
        }

        relatorio.tema = `✅ Clonado com ${arquivos.length} assets`;
      }
    } catch (err) {
      relatorio.tema = `❌ Falha na clonagem do tema: ${err.message}`;
    }

        // === CUSTOMERS ===
        const customersResp = await origem.get('/customers.json?limit=250');
        const customers = customersResp.data.customers;
        relatorio.customers = { total: customers.length, sucesso: 0, erro: 0 };
    
        for (const customer of customers) {
          const address = customer.default_address || {};
          const payload = {
            customer: {
              first_name: customer.first_name || '',
              last_name: customer.last_name || '',
              email: customer.email,
              phone: customer.phone || '',
              addresses: [
                {
                  address1: address.address1 || '',
                  address2: address.address2 || '',
                  city: address.city || '',
                  province: address.province || '',
                  country: address.country || '',
                  zip: address.zip || '',
                }
              ],
              verified_email: true,
            }
          };
    
          try {
            await destino.post('/customers.json', payload);
            relatorio.customers.sucesso++;
          } catch (err) {
            relatorio.customers.erro++;
          }
        }
    

    return res.status(200).json({
      message: '✅ Clonagem executada!',
      checklist: {
        produtos: `✅ ${relatorio.produtos.sucesso}/${relatorio.produtos.total} | ❌ ${relatorio.produtos.erro}`,
        paginas: `✅ ${relatorio.paginas.sucesso}/${relatorio.paginas.total} | ❌ ${relatorio.paginas.erro}`,
        colecoes: `✅ ${relatorio.colecoes.sucesso}/${relatorio.colecoes.total} | ❌ ${relatorio.colecoes.erro}`,
        webhooks: `✅ ${relatorio.webhooks.sucesso}/${relatorio.webhooks.total} | ❌ ${relatorio.webhooks.erro}`,
        tema: relatorio.tema,
      }
    });

  } catch (err) {
    console.error('💥 ERRO GERAL:', err.message);
    return res.status(500).json({ error: 'Erro na clonagem geral', detalhes: err.message });
  }
};
