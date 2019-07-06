'use strict';

const fs = require('fs').promises;
const http = require('http');
const path = require('path');

const STATIC_PATH = path.join(process.cwd(), './static');
const STATIC_PATH_LENGTH = STATIC_PATH.length;

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const cache = new Map();

const cacheFile = async filePath => {
  const data = await fs.readFile(filePath, 'utf8');
  const key = filePath.substring(STATIC_PATH_LENGTH);
  cache.set(key, data);
};

const cacheDirectory = async directoryPath => {
  const items = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(directoryPath, item.name);
    if (item.isDirectory()) cacheDirectory(itemPath);
    else cacheFile(itemPath);
  }
};

cacheDirectory(STATIC_PATH);

http.createServer((req, res) => {
  const { url } = req;
  const fileExt = path.extname(url).substring(1);
  const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
  res.writeHead(200, { 'Content-Type': mimeType });
  const data = cache.get(url);
  res.end(data);
}).listen(8000);
