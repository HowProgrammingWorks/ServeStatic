'use strict';

const fs = require('fs').promises;
const http = require('http');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
  default: 'application/octet-stream',
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  json: 'application/json',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpg',
  gif: 'image/gif',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const STATIC_PATH = path.join(process.cwd(), './static');

const cache = new Map();

const cacheFile = async (filePath) => {
  const data = await fs.readFile(filePath, 'utf8');
  const key = filePath.substring(STATIC_PATH.length);
  cache.set(key, data);
};

const cacheDirectory = async (directoryPath) => {
  const files = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(directoryPath, file.name);
    if (file.isDirectory()) cacheDirectory(filePath);
    else cacheFile(filePath);
  }
};

cacheDirectory(STATIC_PATH);

http.createServer((req, res) => {
  const ext = path.extname(req.url).substring(1).toLowerCase();
  const mimeType = MIME_TYPES[ext] || MIME_TYPES.html;
  const data = cache.get(req.url);
  const statusCode = data ? 200 : 404;
  res.writeHead(statusCode, { 'Content-Type': mimeType });
  res.end(data);
  console.log(`${req.method} ${req.url} ${statusCode}`);
}).listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);
