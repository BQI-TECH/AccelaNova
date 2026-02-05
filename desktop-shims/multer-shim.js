// Minimal multer shim: supports diskStorage() and .single() returning a no-op middleware.
function multer(/* options */) {
  return {
    single(fieldName) {
      return function noopMulter(req, _res, next) {
        req.file = null;
        next();
      };
    },
  };
}

multer.diskStorage = function diskStorage(opts) {
  return opts || {};
};

module.exports = multer;
























