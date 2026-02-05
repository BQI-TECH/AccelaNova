// Minimal uuid shim providing v4()
const crypto = require('crypto');
function v4() {
  const buf = crypto.randomBytes(16);
  // Per RFC 4122 set version and variant bits
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = buf.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
module.exports = { v4 };
























