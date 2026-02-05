// Minimal extract-json-from-string shim: attempts naive JSON parse, else returns empty array.
module.exports = function extractJson(str) {
  if (typeof str !== 'string') return [];
  try {
    const parsed = JSON.parse(str);
    return [parsed];
  } catch (_) {
    return [];
  }
};
























