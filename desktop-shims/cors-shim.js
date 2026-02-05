// Minimal CORS shim compatible with cors({ origin: true })
module.exports = function corsShim(options = {}) {
  const reflectOrigin = options.origin === true;
  const allowOrigin = typeof options.origin === "string" ? options.origin : "*";
  const allowHeaders =
    (options.allowedHeaders && options.allowedHeaders.join(", ")) ||
    "Origin, X-Requested-With, Content-Type, Accept, Authorization";
  const allowMethods =
    (options.methods && options.methods.join(", ")) ||
    "GET, POST, PUT, PATCH, DELETE, OPTIONS";
  const allowCredentials =
    typeof options.credentials === "boolean" ? options.credentials : true;

  return function corsMiddleware(req, res, next) {
    const originHeader = req.headers.origin;
    res.setHeader(
      "Access-Control-Allow-Origin",
      reflectOrigin && originHeader ? originHeader : allowOrigin
    );
    res.setHeader("Vary", "Origin");
    if (allowCredentials) res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", allowHeaders);
    res.setHeader("Access-Control-Allow-Methods", allowMethods);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    next();
  };
};


























