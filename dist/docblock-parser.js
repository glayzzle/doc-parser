/*! docblock-parser - BSD3 License - 2017-01-05 */

require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

"use strict";

/**
 * @constructor Lexer
 * @property {String} text Current parsed text (attached to current token)
 * @property {Number} offset Current offset
 * @property {String|Number} token Current parsed token
 */
var Lexer = function(tokens) {
  this._t = tokens;
};


// breaking symbols
var lexerSymbols = [
  ',', '=', ':', '(', ')', '[', ']', '{', '}', '@'
];

// whitespace chars
var lexerWhiteSpace = [' ', '\t', '\r', '\n'];

/**
 * Initialize the lexer with specified text
 */
Lexer.prototype.read = function(input) {
  this._input = input;
  this.offset = 0;
  this.text = "";
  this.token = null;
};

/**
 * Consumes a char
 * @return {String}
 */
Lexer.prototype.input = function() {
  if (this.offset < this._input.length) {
    this.ch = this._input[this.offset++];
    this.text += this.ch;
    return this.ch;
  } else {
    return null;
  }
};

/**
 * Revert back the current consumed char
 * @return {void}
 */
Lexer.prototype.unput = function() {
  this.offset--;
  this.text = this.text.substring(0, this.text.length - 1);
};

/**
 * Revert back the current consumed token
 * @return {String|Number} the previous token
 */
Lexer.prototype.unlex = function() {
  this.offset = this.__offset;
  this.text = this.__text;
  this.token = this.__token;
  return this.token;
};

/**
 * Consumes the next token (ignores whitespaces)
 * @return {String|Number} the current token
 */
Lexer.prototype.lex = function() {
  // backup
  this.__offset = this.offset;
  this.__text = this.text;
  this.__token = this.token;
  // scan
  this.token = this.next();
  while (this.token === this._t.T_WHITESPACE) {
    // ignore white space
    this.token = this.next();
  }
  return this.token;
};

/**
 * Eats a token (see lex for public usage) including whitespace
 * @return {String|Number} the current token
 */
Lexer.prototype.next = function() {
  this.text = "";
  var ch = this.input();
  if (ch === null) return this._t.T_EOF;
  if (ch === '"' || ch === "'") {
    var tKey = ch;
    do {
      ch = this.input();
      if (ch === '\\') {
        this.input();
      }
    } while (ch !== tKey && this.offset < this._input.length);
    return this._t.T_TEXT;
  } else if (lexerSymbols.indexOf(ch) > -1) {
    if (ch === ':')
      ch = '=>'; // alias
    if (ch === '=' && this._input[this.offset] === '>') {
      ch += this.input();
    }
    return ch;
  } else if (lexerWhiteSpace.indexOf(ch) > -1) {
    ch = this.input();
    while (lexerWhiteSpace.indexOf(ch) > -1) {
      ch = this.input();
    }
    if (ch !== null) this.unput();
    return this._t.T_WHITESPACE;
  } else {
    ch = ch.charCodeAt(0);
    if (ch > 47 && ch < 58) {
      while (ch > 47 && ch < 58 && ch !== null) {
        ch = this.input();
        if (ch !== null)
          ch = ch.charCodeAt(0);
      }
      if (ch !== null) this.unput();
      return this._t.T_NUM;
    } else {
      do {
        ch = this.input();
        if (
          lexerSymbols.indexOf(ch) > -1 ||
          lexerWhiteSpace.indexOf(ch) > -1
        ) {
          this.unput();
          break;
        }
      } while (this.offset < this._input.length);
      return this._t.T_STRING;
    }
  }
};

// exports
module.exports = Lexer;

},{}],2:[function(require,module,exports){
/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

"use strict";

var t = require('./token');
var lexer = require('./lexer');

/**
 * @constructor Parser
 * @property {Lexer} lexer
 */
var Parser = function(lexer) {
  this.lexer = lexer;
};

/**
 * Parses the specified input
 * @return {Array} AST
 */
Parser.prototype.parse = function(input) {
  var ast = [];
  this.lexer.read(input);
  this.token = this.lexer.lex();
  while (this.token !== this.lexer._t.T_EOF) {
    var node = this.body();
    if (node) ast.push(node);
    this.token = this.lexer.lex();
  }
  return ast;
}

Parser.prototype.body = function() {
  if (this.token === this.lexer._t.T_STRING) {
    if (this.lexer.text === 'true') {
      return ['boolean', true];
    } else if (this.lexer.text === 'false') {
      return ['boolean', false];
    } else if (this.lexer.text === 'null') {
      return ['null'];
    } else if (this.lexer.text === 'array') {
      this.token = this.lexer.lex();
      if (this.token === '(') {
        var result = ['array'];
        result.push(this.read_array(')'));
        return result;
      } else {
        this.token = this.lexer.unlex();
      }
      return ['type', this.lexer.text];
    } else {
      var name = this.lexer.text;
      this.token = this.lexer.lex();
      if (this.token === '=' || this.token === '=>') {
        // key value
        this.token = this.lexer.lex();
        return [
          'key',
          name,
          this.get_json_value(this.body())
        ];
      } else if (this.token === '(') {
        // method
        var result = ['method', name, []];
        do {
          this.token = this.lexer.lex();
          var item = this.body();
          if (item !== null) {
            result[2].push(item);
          }
        } while (this.token !== ')' && this.token !== this.lexer._t.T_EOF);
        return result;
      } else {
        this.token = this.lexer.unlex();
      }
      return ['type', name];
    }
  } else if (this.token === this.lexer._t.T_TEXT) {
    return ['text', this.lexer.text];
  } else if (this.token === this.lexer._t.T_NUM) {
    return ['number', this.lexer.text];
  } else if (this.token === '[') {
    // can be an Array
    var result = ['array'];
    result.push(this.read_array(']'));
    return result;
  } else if (this.token === '{') {
    // can be a JSON
    var result = ['json'];
    result.push(this.read_json());
    return result;
  } else if (this.token === '@') {
    this.token = this.lexer.lex();
    if (this.token === this.lexer._t.T_STRING) {
      // inner annotation
      var result = ['annotation', this.lexer.text, []];
      this.token = this.lexer.lex();
      if (this.token === '(') {
        // with args
        do {
          this.token = this.lexer.lex();
          var item = this.body();
          if (item !== null) {
            result[2].push(item);
          }
        } while (this.token !== ')' && this.token !== this.lexer._t.T_EOF);
      } else {
        this.token = this.lexer.unlex();
      }
      return result;
    } else {
      // ignore it
      this.token = this.lexer.unlex();
      return null;
    }
  } else {
    // ignore it
    return null;
  }
};

Parser.prototype.read_array = function(endChar) {
  var result = [];
  do {
    this.token = this.lexer.lex(); // consume start char
    var item = this.body();
    if (item !== null) { // ignore
      this.token = this.lexer.lex();
      item = this.get_json_value(item);
      if (this.token === '=>') {
        this.token = this.lexer.lex(); // eat
        item = [
          'key', item,
          this.get_json_value(
            this.body()
          )
        ];
        this.token = this.lexer.lex(); // eat
      }
      if (this.token !== ',') {
        this.token = this.lexer.unlex();
      }
      result.push(item);
    }
  } while (this.token !== endChar && this.token !== this.lexer._t.T_EOF);
  return result;
};

Parser.prototype.read_json = function(endChar) {
  var result = {};
  do {
    this.token = this.lexer.lex();
    var item = this.body();
    if (item !== null) { // ignore
      this.token = this.lexer.lex(); // eat
      if (this.token === '=>') {
        item = this.get_json_key(item);
        if (item !== null) {
          this.token = this.lexer.lex();
          result[item] = this.get_json_value(this.body());
        }
        this.token = this.lexer.lex();
      }
      if (this.token !== ',') {
        this.token = this.lexer.unlex();
      }
    }
  } while (this.token !== '}' && this.token !== this.lexer._t.T_EOF);
  this.token = this.lexer.lex();
  return result;
};

Parser.prototype.get_json_value = function(ast) {
  if (!ast) return null;
  var result = this.get_json_key(ast);
  if (result === null) {
    if (ast[0] === 'json') {
      result = ast[1];
    } else if (ast[0] === 'array') {
      result = [];
      ast[1].forEach(function(item) {
        result.push(this.get_json_value(item));
      }.bind(this));
    } else {
      result = ast;
    }
  }
  return result;
};

// converts an ast node to a scalar key
Parser.prototype.get_json_key = function(ast) {
  if (ast[0] === 'text') {
    var result = ast[1].substring(1, ast[1].length - 1);
    try {
      return JSON.parse('"' + result + '"');
    } catch (e) {
      return result;
    }
  } else if (ast[0] === 'number') {
    return JSON.parse(ast[1]);
  } else if (ast[0] === 'type' || ast[0] === 'boolean') {
    return ast[1];
  } else {
    return null;
  }
};

module.exports = Parser;

},{"./lexer":1,"./token":3}],3:[function(require,module,exports){
/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

"use strict";

module.exports = {
  T_EOF: 1,
  T_WHITESPACE: 2,
  T_TEXT: 3,
  T_STRING: 4,
  T_NUM: 5
};

},{}],"docblock-parser":[function(require,module,exports){
/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

"use strict";

var token = require('./token');
var Lexer = require('./lexer');
var Parser = require('./parser');

/**
 * @constructor API
 * @property {Object} token
 * @property {Lexer} lexer
 * @property {Parser} parser
 */
var API = function() {
  this.token = token;
  this.lexer = new Lexer(this.token);
  this.parser = new Parser(this.lexer);
};

/**
 * Parsing the specified input
 * @return {Array} AST
 */
API.prototype.parse = function(input) {
  return this.parser.parse(input);
}

module.exports = API;

},{"./lexer":1,"./parser":2,"./token":3}]},{},[]);
