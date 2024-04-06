const HTTP = require('http');
const URL = require('url').URL;
const PORT = 3000;

function generateDiceRoll(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getParams(path) {
  const url = new URL(`${path}`, `https://localhost:${PORT}`);
  return url.searchParams;
}

function rollDice(params) {
  const rolls = params.get('rolls');
  const sides = params.get('sides');
  let body = '';

  for (let idx = 0; idx < rolls; idx += 1) {
    body += `You rolled: ${generateDiceRoll(1, sides)}\n\n`;
  }

  return body;
}

const SERVER = HTTP.createServer((req, res) => {
  let method = req.method;
  let path = req.url;

  if (path === '/favicon.ico') {
    res.statusCode = 404;
    res.end();
    
  } else {
    let content = rollDice(getParams(path));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');

    res.write(content); // content
    res.write(`${method} ${path}\n`); // path
    res.end();
  }
});

SERVER.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});