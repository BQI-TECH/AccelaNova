// Minimal dotenv shim for desktop packaging. No-ops but preserves API shape.
module.exports = {
  config: function config() {
    return { parsed: {}, error: null };
  },
  parse: function parse() {
    return {};
  },
};


























