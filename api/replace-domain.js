const fs = require('fs');
const path = require('path');

const OLD_DOMAIN = 'qxxk00-am.myshopify.com';
const NEW_DOMAIN = '602j2f-ig.myshopify.com';

const extensions = ['.js', '.json', '.html']; // Arquivos que vai varrer

const directory = './'; // Diretório raiz do projeto

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(directory, function(filePath) {
  if (!extensions.includes(path.extname(filePath))) return;

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(OLD_DOMAIN)) {
    const updated = content.replaceAll(OLD_DOMAIN, NEW_DOMAIN);
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`✅ Substituído em: ${filePath}`);
  }
});
