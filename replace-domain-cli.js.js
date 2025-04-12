const fs = require('fs');
const path = require('path');

const OLD_DOMAIN = '602j2f-ig.myshopify.com';
const NEW_DOMAIN = '602j2f-ig.myshopify.com';

const TARGET_EXTENSIONS = ['.js', '.json', '.html', '.css'];

function substituirDominiosEmArquivo(filePath) {
  const conteudo = fs.readFileSync(filePath, 'utf8');

  if (!conteudo.includes(OLD_DOMAIN)) return false;

  const novoConteudo = conteudo.split(OLD_DOMAIN).join(NEW_DOMAIN);
  fs.writeFileSync(filePath, novoConteudo, 'utf8');

  console.log(`✅ Substituído em: ${filePath}`);
  return true;
}

function percorrerDiretorio(dir) {
  const arquivos = fs.readdirSync(dir);

  arquivos.forEach((nome) => {
    const fullPath = path.join(dir, nome);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      percorrerDiretorio(fullPath);
    } else if (TARGET_EXTENSIONS.includes(path.extname(fullPath))) {
      substituirDominiosEmArquivo(fullPath);
    }
  });
}

console.log(`🚀 Iniciando substituição de "${OLD_DOMAIN}" por "${NEW_DOMAIN}"`);
percorrerDiretorio(process.cwd());
console.log('🎉 Substituição finalizada!');
