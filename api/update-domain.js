const fs = require('fs');
const path = require('path');

module.exports = async function updateDomain(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk });
  req.on('end', () => {
    try {
      const { oldDomain, newDomain } = JSON.parse(body);

      const dir = path.join(__dirname, '..'); // raiz do projeto
      const files = getAllFiles(dir, ['.js', '.html', '.json']);

      let logs = [];

      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');

        if (content.includes(oldDomain)) {
          const updated = content.replaceAll(oldDomain, newDomain);
          fs.writeFileSync(file, updated, 'utf8');
          logs.push({
            file: path.relative(dir, file),
            status: '✅ Modificado',
          });
        }
      });

      if (logs.length === 0) {
        logs.push({ file: '-', status: '🚫 Nenhum arquivo com domínio antigo encontrado' });
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Finalizado', logs }));
    } catch (err) {
      console.error('💥 ERRO AO SUBSTITUIR:', err.message);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  });
};

function getAllFiles(dirPath, extensions, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, extensions, arrayOfFiles);
    } else if (extensions.includes(path.extname(file))) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}
