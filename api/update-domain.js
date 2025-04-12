const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { oldDomain, newDomain } = JSON.parse(body);

      const projectDir = path.join(__dirname, '..');
      const filesToScan = [];

      const walkDir = (dir) => {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            if (!fullPath.includes('node_modules')) {
              walkDir(fullPath);
            }
          } else if (/\.(js|json|html|txt|css)$/.test(file)) {
            filesToScan.push(fullPath);
          }
        });
      };

      walkDir(projectDir);

      const modifiedFiles = [];

      filesToScan.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        if (content.includes(oldDomain)) {
          const updatedContent = content.replaceAll(oldDomain, newDomain);
          fs.writeFileSync(file, updatedContent, 'utf-8');
          modifiedFiles.push(file.replace(projectDir, ''));
        }
      });

      return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
        message: modifiedFiles.length
          ? `✅ Substituição concluída. ${modifiedFiles.length} arquivos modificados.`
          : `🟡 Nenhuma ocorrência de "${oldDomain}" foi encontrada.`,
        modifiedFiles
      }));
    } catch (err) {
      console.error('❌ Erro durante substituição:', err);
      return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Erro ao processar substituição', details: err.message }));
    }
  });
};
