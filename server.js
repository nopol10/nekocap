/**
 * This is a sample server that can be used to run the NekoCap website with HTTP2
 * Define SSL_KEY_PATH, SSL_CERT_PATH, SSL_CA_PATH in a .env file.
 */
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const next = require("next");
const fs = require("fs");
const spdy = require("spdy");
const dotenv = require("dotenv");

const PORT = 443;
const env = dotenv.config({ path: "./.env" }).parsed;
const app = next({ dev: false, hostname: env.NEXT_HOSTNAME, port: PORT });
const handle = app.getRequestHandler();

const options = {
  key: fs.readFileSync(env.SSL_KEY_PATH, "utf8"),
  cert: fs.readFileSync(env.SSL_CERT_PATH, "utf8"),
  ca: [fs.readFileSync(env.SSL_CA_PATH, "utf8")],
};

const server = express();
server.use(helmet({ contentSecurityPolicy: false, frameguard: false }));
server.use(cors());
server.use(compression());

const CACHED_PATH_SUFFIXES = [
  ".woff2",
  ".wasm",
  "/subtitles-octopus-worker.js",
];

app.prepare().then(() => {
  server.all("*", (req, res) => {
    if (!!req.path && isCachedPath(req.path)) {
      res.setHeader("Cache-Control", "public,max-age=31536000");
    }
    return handle(req, res);
  });
  spdy.createServer(options, server).listen(PORT);
});

function isCachedPath(path) {
  const suffixIsCacheable = CACHED_PATH_SUFFIXES.some((suffix) => {
    return path.endsWith(suffix);
  });
  return suffixIsCacheable;
}
