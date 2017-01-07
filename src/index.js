/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */
'use strict';

var token = require('./token');
var Lexer = require('./lexer');
var Parser = require('./parser');

/**
 * @constructor API
 * @property {Object} token
 * @property {Lexer} lexer
 * @property {Parser} parser
 */
var API = function (grammar) {
  this.token = token;
  this.lexer = new Lexer(this.token);
  this.parser = new Parser(this.lexer, grammar);
};

/**
 * Parsing the specified input
 * @return {Array} AST
 */
API.prototype.parse = function (input) {
  return this.parser.parse(input);
};

module.exports = API;
