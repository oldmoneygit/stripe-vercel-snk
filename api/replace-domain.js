const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.end('Método proibido seu bosta');
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { oldDomain, newDomain } = JSON.parse(body);

      if (!oldDomain || !newDomain) {
        return res.end('Domínios inválidos');
      }

      const EXTS = ['.js', '.json', '.html', '.liquid', '.css'];
      const altered = [];

      function walk(dir) {
        let files = fs.readdirSync(dir);
        files.forEach(file => {
          const filepath = path.join(dir, file);
          const stat = fs.statSync(filepath);

          if (stat.isDirectory()) {
            walk(filepath);
          } else if (EXTS.includes(path.extname(filepath))) {
            let content = fs.readFileSync(filepath, 'utf8');
            if (content.includes(oldDomain)) {
              const newContent = content.split(oldDomain).join(newDomain);
              fs.writeFileSync(filepath, newContent, 'utf8');
              altered.push(filepath);
            }
          }
        });
      }

      walk('./');

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        message: 'Domínio substituído com sucesso!',
        files: altered,
        total: altered.length
      }));
    } catch (err) {
      res.statusCode = 500;
      res.end('Erro no servidor: ' + err.message);
    }
  });
};
