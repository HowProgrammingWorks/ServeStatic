'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const STATIC_PATH = path.join(process.cwd(), './static');

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

http.createServer((req, res) => {
  const { url } = req; //.substring(1)
  const name = url === '/' ? '/index.html' : url;
  const stream = serveFile(name);
  if (stream) stream.pipe(res);
}).listen(8000);
