// Minimal bcrypt shim for desktop packaging. NOT cryptographically equivalent.
// Only supports hashSync(value, _saltRounds) and compareSync(value, hashed).
const crypto = require('crypto');

function sha256(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
}

function hashSync(value /*, saltRounds */) {
  // Intentionally ignore saltRounds; produce deterministic hash
  return sha256(value);
}

function compareSync(value, hashed) {
  return sha256(value) === String(hashed);
}

module.exports = { hashSync, compareSync };

























