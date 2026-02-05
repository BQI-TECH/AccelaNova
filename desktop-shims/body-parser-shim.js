// Minimal body-parser shim using Express built-in parsers.
const express = require('express');

module.exports = {
  json: (options) => express.json(options),
  text: (options) => express.text(options),
  urlencoded: (options) => express.urlencoded({ ...(options || {}), extended: !!(options && options.extended) }),
};


























