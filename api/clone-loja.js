const axios = require('axios');
require('dotenv').config();

// Chamada da função com os parâmetros corretos
(async () => {
  const BASE_TOKEN = process.env.BASE_TOKEN;
  const DEST_TOKEN = process.env.DEST_TOKEN;

  await cloneLoja(
    process.env.BASE_DOMAIN,
    BASE_TOKEN,
    process.env.DEST_DOMAIN,
    DEST_TOKEN
  );
})();

module.exports = async function cloneLoja(baseDomain, baseToken, destDomain, destToken) {
  try {
    console.log('Parâmetros recebidos antes da normalização:', { baseDomain, baseToken, destDomain, destToken });

    baseDomain = typeof baseDomain === 'string' ? baseDomain.trim() : '';
    baseToken = typeof baseToken === 'string' ? baseToken.trim() : '';
    destDomain = typeof destDomain === 'string' ? destDomain.trim() : '';
    destToken = typeof destToken === 'string' ? destToken.trim() : '';

    console.log('Parâmetros normalizados:', { baseDomain, baseToken, destDomain, destToken });

    if (!baseDomain || !destDomain) {
      throw new Error('Os domínios baseDomain e destDomain são obrigatórios.');
    }
    if (!/^.+\.myshopify\.com$/.test(baseDomain) || !/^.+\.myshopify\.com$/.test(destDomain)) {
      throw new Error('Os domínios devem estar no formato "example.myshopify.com".');
    }

    if (!baseToken || !destToken) {
      throw new Error('Os tokens baseToken e destToken são obrigatórios.');
    }

    console.log(`Obtendo produtos da loja de origem: ${baseDomain}`);
    const baseResponse = await axios.get(`https://${baseDomain}/admin/api/2023-10/products.json`, {
      headers: {
        'X-Shopify-Access-Token': baseToken,
        'Content-Type': 'application/json',
      },
    });

    const products = baseResponse.data.products || [];
    console.log(`Produtos encontrados: ${products.length}`);

    if (products.length === 0) {
      console.log('Nenhum produto encontrado na loja de origem.');
      return;
    }

    for (const product of products) {
      const productData = {
        product: {
          title: product.title,
          body_html: product.body_html,
          vendor: product.vendor,
          product_type: product.product_type || "Default",
          status: product.status || "active",
          variants: product.variants.map(variant => ({
            title: variant.title,
            price: variant.price,
            inventory_policy: variant.inventory_policy,
            compare_at_price: variant.compare_at_price,
            taxable: variant.taxable,
            requires_shipping: variant.requires_shipping,
          })),
          images: product.images.map(image => ({
            src: image.src,
          })),
        },
      };

      console.log(`Clonando produto: ${product.title}`);
      try {
        const destResponse = await axios.post(
          `https://${destDomain}/admin/api/2023-10/products.json`,
          productData,
          {
            headers: {
              'X-Shopify-Access-Token': destToken,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`Produto "${product.title}" clonado com sucesso!`, destResponse.data);
      } catch (error) {
        console.error(`Erro ao clonar o produto "${product.title}":`, error.response?.data?.errors || error.message);
      }
    }
  } catch (error) {
    console.error('💥 ERRO NO CLONE:', error.response?.data?.errors || error.message);
  }
};