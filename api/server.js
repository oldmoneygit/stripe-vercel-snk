const { createServer } = require('micro');
const handler = require('./api/index');

const server = createServer(handler);
server.listen(3000);
