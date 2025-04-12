const axios = require('axios');

module.exports = async function cloneLoja(baseDomain, baseToken, destDomain, destToken) {
  try {
    baseDomain = baseDomain.trim();
    destDomain = destDomain.trim();
    baseToken = baseToken.trim();
    destToken = destToken.trim();

    if (!baseDomain || !destDomain || !baseToken || !destToken) {
      throw new Error('Faltando parâmetros obrigatórios');
    }

    const baseResponse = await axios.get(`https://${baseDomain}/admin/api/2023-10/products.json`, {
      headers: {
        'X-Shopify-Access-Token': baseToken,
        'Content-Type': 'application/json',
      },
    });

    const products = baseResponse.data.products || [];

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

      try {
        await axios.post(`https://${destDomain}/admin/api/2023-10/products.json`, productData, {
          headers: {
            'X-Shopify-Access-Token': destToken,
            'Content-Type': 'application/json',
          },
        });

        console.log(`✅ Produto "${product.title}" clonado com sucesso!`);
      } catch (error) {
        console.error(`Erro ao clonar o produto "${product.title}":`, error.response?.data?.errors || error.message);
      }
    }
  } catch (error) {
    console.error('💥 ERRO NO CLONE:', error.response?.data?.errors || error.message);
  }
};
