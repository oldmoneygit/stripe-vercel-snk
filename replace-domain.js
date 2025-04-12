const fs = require('fs');
const path = require('path');

// CONFIGURA AQUI: DOMÍNIO ANTIGO E NOVO
const OLD_DOMAIN = '602j2f-ig.myshopify.com';
const NEW_DOMAIN = '602j2f-ig.myshopify.com';

// TIPOS DE ARQUIVOS QUE SERÃO ANALISADOS
const VALID_EXTENSIONS = ['.js', '.json', '.html', '.txt'];

function replaceInFile(filePath, oldText, newText) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(oldText)) {
    const updated = content.split(oldText).join(newText);
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Substituído em: ${filePath}`);
    return true;
  }
  return false;
}

function scanAndReplace(dir, oldText, newText) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanAndReplace(fullPath, oldText, newText);
    } else if (VALID_EXTENSIONS.includes(path.extname(entry.name))) {
      replaceInFile(fullPath, oldText, newText);
    }
  }
}

console.log(`🚀 Substituindo "${OLD_DOMAIN}" por "${NEW_DOMAIN}" em arquivos...`);
scanAndReplace(__dirname, OLD_DOMAIN, NEW_DOMAIN);
console.log('🎯 Substituição finalizada.');
