'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { Readable } = require('stream');

const STATIC_PATH = path.join(process.cwd(), './static');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const serveFile = name => {
  const filePath = path.join(STATIC_PATH, name);
  if (!filePath.startsWith(STATIC_PATH)) {
    console.log(`Can't be served: ${name}`);
    return null;
  }
  const stream = fs.createReadStream(filePath);
  console.log(`Served: ${name}`);
  return stream;
};

const folderIndex = name => {
  const folderPath = path.join(STATIC_PATH, name);
  if (!folderPath.startsWith(STATIC_PATH)) {
    console.log(`Can't generate index for: ${name}`);
    return null;
  }
  const stream = new Readable({
    read() {
      const files = [];
      const folders = [];
      fs.readdir(folderPath, { withFileTypes: true }, (err, items) => {
        if (err) {
          console.log(`'Can't read folder: ${path}`);
          return;
        }
        for (const item of items) {
          if (item.isDirectory()) folders.push(`/${item.name}/`);
          else files.push(item.name);
        }
        const list = folders.concat(files)
          .map(item => `<li><a href="${item}">${item}</a></li>`)
          .join('\n');
        stream.push(`<h2>Directory index:</h2><ul>${list}</ul>`);
        stream.push(null);
      });
    }
  });
  console.log(`Index: ${name}`);
  return stream;
};

http.createServer((req, res) => {
  const { url } = req;
  const fileExt = path.extname(url).substring(1);
  const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
  res.writeHead(200, { 'Content-Type': mimeType });
  const stream = url.endsWith('/') ? folderIndex(url) : serveFile(url);
  if (stream) stream.pipe(res);
}).listen(8000);
