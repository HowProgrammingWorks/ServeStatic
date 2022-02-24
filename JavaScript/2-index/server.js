'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { Readable } = require('stream');

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

const folderIndex = (folder) => new Readable({
  async read() {
    const files = [];
    const folders = [];
    const rel = folder.substring(STATIC_PATH.length);
    const items = await fs.promises.readdir(folder, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) folders.push(item.name + '/');
      else files.push(item.name);
    }
    const list = folders.concat(files)
      .map((item) => `<li><a href="${rel}/${item}">${item}</a></li>`)
      .join('\n');
    this.push(`<h2>Directory index:</h2><ul>${list}</ul>`);
    this.push(null);
  }
});

const prepareFile = async (url) => {
  const name = url === '/' ? '/index.html' : url;
  const filePath = path.join(STATIC_PATH, name);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const stat = await fs.promises.lstat(filePath).catch(() => false);
  const exists = !!stat;
  const isDirectory = stat && stat.isDirectory();
  const found = !pathTraversal && exists;
  const streamPath = found ? filePath : STATIC_PATH + '/404.html';
  const ext = path.extname(streamPath).substring(1).toLowerCase();
  const factory = isDirectory ? folderIndex : fs.createReadStream;
  const stream = factory(streamPath);
  return { found, ext: isDirectory ? 'html' : ext, stream };
};

http.createServer(async (req, res) => {
  const file = await prepareFile(req.url);
  const statusCode = file.found ? 200 : 404;
  const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
  res.writeHead(statusCode, { 'Content-Type': mimeType });
  file.stream.pipe(res);
  console.log(`${req.method} ${req.url} ${statusCode}`);
}).listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);
