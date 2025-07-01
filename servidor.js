// server.mjs
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const jsonDir = join(process.cwd(), 'JSON');

const server = createServer((req, res) => {
  // Listar archivos JSON
  if (req.method === 'GET' && req.url === '/json-files') {
    try {
      const files = readdirSync(jsonDir).filter(f => extname(f) === '.json');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error al listar archivos' }));
    }
  }

  // Leer archivo JSON específico: /json-file?name=archivo.json
  else if (req.method === 'GET' && req.url.startsWith('/json-file')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const name = url.searchParams.get('name');
    const filePath = join(jsonDir, name || '');
    if (!name || extname(name) !== '.json' || !existsSync(filePath)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Archivo no válido' }));
      return;
    }
    try {
      const content = readFileSync(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(content);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error al leer archivo' }));
    }
  }

  // Modificar archivo JSON específico: /json-file?name=archivo.json
  else if (req.method === 'POST' && req.url.startsWith('/json-file')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const name = url.searchParams.get('name');
    const filePath = join(jsonDir, name || '');
    if (!name || extname(name) !== '.json' || !existsSync(filePath)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Archivo no válido' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newContent = JSON.parse(body);
        writeFileSync(filePath, JSON.stringify(newContent, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Archivo actualizado correctamente.' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON inválido' }));
      }
    });
  }

  // Página principal y editor
  else if (req.method === 'GET' && (req.url === '/' || req.url === '/editor.html')) {
    try {
      const html = readFileSync(join(process.cwd(), 'editor.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(500);
      res.end('Error al cargar la página');
    }
  }

  // Resto de rutas
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Listening on http://127.0.0.1:3000');
});
// To run this server, use the command: node server.mjs
// Make sure to have a config.json file in the same directory with valid JSON content.
// The server will respond to GET requests for the configuration and the editor page,
// and handle POST requests to update the configuration.
// The HTML file should be named editor.html and placed in the same directory as this server code.
// The server listens on port 3000 and can be accessed at http://127.0.0.1:3000