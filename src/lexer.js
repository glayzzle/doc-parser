/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */
'use strict';

/**
 * @constructor Lexer
 * @property {String} text Current parsed text (attached to current token)
 * @property {Number} offset Current offset
 * @property {String|Number} token Current parsed token
 */
var Lexer = function (tokens) {
  this._t = tokens;
};

// breaking symbols
var lexerSymbols = [
  ',', '=', ':', '(', ')', '[', ']', '{', '}', '@', '"', '\'', '\\', '<', '>', '$', '-', '.'
];

// whitespace chars
var lexerWhiteSpace = [' ', '\t', '\r', '\n'];

/**
 * Initialize the lexer with specified text
 */
Lexer.prototype.read = function (input) {
  this._input = input;
  this.line = 1;
  this.offset = 0;
  this.text = '';
  this.token = null;
  this.backup = null;
};

/**
 * Consumes a char
 * @return {String}
 */
Lexer.prototype.input = function () {
  if (this.offset < this._input.length) {
    this.ch = this._input[this.offset++];
    this.text += this.ch;
    if (this.ch === '\r') {
      if (this._input[this.offset] === '\n') {
        // windows line
        this.text += this._input[this.offset++];
      }
      this.line ++;
    } else if (this.ch === '\n') {
      this.line ++;
    }
    return this.ch;
  }
  return null;
};

/**
 * Revert back the current consumed char
 * @return {void}
 */
Lexer.prototype.unput = function () {
  this.offset--;
  this.text = this.text.substring(0, this.text.length - 1);
  this.ch = this._input[this.offset - 1];
  var after = this._input[this.offset];
  if (after === '\n' || after === '\r') {
    if (after === '\n' && this.ch === '\r') {
      this.offset --;
      this.ch = this._input[this.offset - 1];
      this.text = this.text.substring(0, this.text.length - 1);
    }
    this.line --;
  }
};

/**
 * Revert back the current consumed token
 * @return {String|Number} the previous token
 */
Lexer.prototype.unlex = function (state) {
  if (!state) {
    state = this.backup;
  }
  this.backup = null;
  if (state) {
    this.offset = state.offset;
    this.text = state.text;
    this.token = state.token;
    this.line = state.line;
    if (state.backup) {
      this.backup = state.backup;
    }
  }
  return this.token;
};

/**
 * Revert back the current consumed token
 * @return {String|Number} the previous token
 */
Lexer.prototype.state = function () {
  return {
    offset: this.offset,
    text: this.text,
    token: this.token,
    line: this.line,
    backup: this.backup
  };
};
/**
 * Consumes the next token (ignores whitespaces)
 * @return {String|Number} the current token
 */
Lexer.prototype.lex = function () {
  // backup
  this.backup = this.state();
  // scan
  this.token = this.next();
  while (this.token === this._t.T_WHITESPACE) {
    // ignore white space
    this.token = this.next();
  }
  // console.log(this.line, this.text);
  return this.token;
};

/**
 * Eats a token (see lex for public usage) including whitespace
 * @return {String|Number} the current token
 */
Lexer.prototype.next = function () {
  this.text = '';
  var ch = this.input();
  if (ch === null) {
    return this._t.T_EOF;
  } else if (ch === '"' || ch === '\'') {
    var tKey = ch;
    do {
      ch = this.input();
      if (ch === '\\') {
        this.input();
      }
    } while (ch !== tKey && this.offset < this._input.length);
    return this._t.T_TEXT;
  } else if (lexerSymbols.indexOf(ch) > -1) {
    if (ch === '.' && this.offset < this._input.length) {
      var nCh = this._input[this.offset].charCodeAt(0);
      if (nCh > 47 && nCh < 58) {
        return this.readNumber();
      }
    }
    if (ch === ':') {
      ch = '=>'; // alias
    } else if (ch === '=' && this.offset < this._input.length && this._input[this.offset] === '>') {
      ch += this.input();
    }
    return ch;
  } else if (lexerWhiteSpace.indexOf(ch) > -1) {
    ch = this.input();
    while (lexerWhiteSpace.indexOf(ch) > -1) {
      ch = this.input();
    }
    if (ch !== null) {
      this.unput();
    }
    return this._t.T_WHITESPACE;
  }
  // try to parse a number
  var isNumber = this.readNumber();
  if (isNumber) {
    return isNumber;
  }
  // try to parse classic text
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
};

Lexer.prototype.readNumber = function () {
  var ch = this.ch.charCodeAt(0);
  if (ch === 46 || (ch > 47 && ch < 58)) {
    var isFloat = (ch === 46);
    while (ch === 46 || (ch > 47 && ch < 58)) {
      ch = this.input();
      if (ch !== null) {
        ch = ch.charCodeAt(0);
      }
      if (ch === 46) {
        if (isFloat) {
          break;
        } else {
          isFloat = true;
        }
      }
    }
    if (ch !== null) {
      this.unput();
    }
    return this._t.T_NUM;
  }
  return null;
};

// exports
module.exports = Lexer;
