const fs = require('fs');
const path = require('path');

const ANTIGO_DOMINIO = '602j2f-ig.myshopify.com';

module.exports = async (req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  await new Promise(resolve => req.on('end', resolve));

  const { novoDominio } = JSON.parse(body);
  if (!novoDominio) return res.end(JSON.stringify({ erro: 'Faltou o domínio novo, porra!' }));

  const pastaProjeto = path.join(__dirname, '..'); // Sobe um nível
  const extensoesAlvo = ['.js', '.json', '.html', '.env'];

  const arquivosAlterados = [];

  const substituirDominios = (dir) => {
    fs.readdirSync(dir).forEach(nome => {
      const fullPath = path.join(dir, nome);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        substituirDominios(fullPath);
      } else if (extensoesAlvo.includes(path.extname(nome))) {
        const conteudo = fs.readFileSync(fullPath, 'utf8');
        if (conteudo.includes(ANTIGO_DOMINIO)) {
          const atualizado = conteudo.split(ANTIGO_DOMINIO).join(novoDominio);
          fs.writeFileSync(fullPath, atualizado, 'utf8');
          arquivosAlterados.push(fullPath.replace(pastaProjeto, '.'));
        }
      }
    });
  };

  substituirDominios(pastaProjeto);

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    mensagem: `✅ Substituição feita de ${ANTIGO_DOMINIO} para ${novoDominio}`,
    alterados: arquivosAlterados
  }));
};
