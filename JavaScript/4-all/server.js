'use strict';

const http = require('node:http');
const fs = require('node:fs').promises;
const path = require('node:path');

const PORT = 8000;

const STATIC_PATH = path.join(process.cwd(), './static');

const MIME_TYPE = {
  default: 'application/octet-stream',
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpeg',
  ico: 'image/x-icon',
};

const cache = new Map();

const cacheFile = async (filePath) => {
  const key = filePath.substring(STATIC_PATH.length).replace(/\\/g, '/');
  const value = await fs.readFile(filePath);
  cache.set(key, value);
};

const cacheDirectory = async (directoryPath) => {
  const files = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(file.path, file.name);
    if (file.isDirectory()) cacheDirectory(filePath);
    else cacheFile(filePath);
  }
  const key = directoryPath.substring(STATIC_PATH.length).replace(/\\/g, '/');
  cache.set(
    key || '/',
    files.map((file) => file.name)
  );
};

cacheDirectory(STATIC_PATH);

const folderIndex = (url) => {
  const items = cache.get(url);
  if (url !== '/' && items[0] !== '../') items.unshift('../');
  const list = items
    .map((el) => {
      const addres = path.join(url, el);
      return `<li><a href="http://localhost:${PORT}${addres}">${el}</a></li>`;
    })
    .join('\n');
  const file = `<h2>Directory files: <h2> <ul>${list}</ul>`;
  return file;
};

const prepareFile = (url) => {
  const filePath = path.join(STATIC_PATH, url);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  // console.log(pathTraversal)
  const exists = cache.get(url);
  const found = !pathTraversal && !!exists;
  let cachePath = url;
  if (!found) cachePath = '/errors/404.html';
  if (pathTraversal) cachePath = '/errors/traversal.html'; // Не знаю как установить true через браузер
  if (!'readingRights') cachePath = '/errors/no-reading.html'; // Не представляю как это раелизовать без авторизации пользователя
  const errorPath =
    cachePath.startsWith('/errors/') && cachePath.endsWith('.html');
  const isDirectory = exists instanceof Array && !errorPath;
  const ext = path.extname(cachePath).substring(1);
  const content = isDirectory ? folderIndex(cachePath) : cache.get(cachePath);
  return { found, ext: isDirectory ? 'html' : ext, content };
};

http
  .createServer((req, res) => {
    const file = prepareFile(req.url);
    const mimeType = MIME_TYPE[file.ext] || MIME_TYPE.default;
    const statusCode = file.found ? 200 : 404;
    res.writeHead(statusCode, { 'content-type': mimeType });
    res.end(file.content);
  })
  .listen(PORT, () =>
    console.log(`Server is running: http://localhost:${PORT}`)
  );
