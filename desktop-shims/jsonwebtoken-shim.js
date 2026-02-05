// Minimal HS256 JWT shim compatible with `sign(payload, secret, { expiresIn })` and `verify(token, secret)`
const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function unbase64url(input) {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input += '='.repeat(4 - pad);
  return Buffer.from(input, 'base64').toString('utf8');
}

function hmac(data, secret) {
  return base64url(crypto.createHmac('sha256', String(secret)).update(data).digest());
}

function parseExpiry(exp) {
  if (!exp) return null;
  if (typeof exp === 'number') return exp;
  // simple "30d" | "12h" | "15m" | "10s"
  const m = String(exp).match(/^(\d+)([smhd])$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return n * mult;
}

function sign(payload = {}, secret, options = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const expSecs = parseExpiry(options.expiresIn);
  const body = { ...payload };
  if (expSecs) body.exp = now + expSecs;
  const headerSeg = base64url(JSON.stringify(header));
  const payloadSeg = base64url(JSON.stringify(body));
  const data = `${headerSeg}.${payloadSeg}`;
  const signature = hmac(data, secret);
  return `${data}.${signature}`;
}

function verify(token, secret) {
  if (typeof token !== 'string') throw new Error('invalid token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid token');
  const [headerSeg, payloadSeg, sig] = parts;
  const data = `${headerSeg}.${payloadSeg}`;
  const expected = hmac(data, secret);
  if (sig !== expected) throw new Error('invalid signature');
  const payload = JSON.parse(unbase64url(payloadSeg) || '{}');
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('jwt expired');
  return payload;
}

module.exports = { sign, verify };

























