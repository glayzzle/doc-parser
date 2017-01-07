/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */
'use strict';

// Deep recursive merge
var extend = function (a, b) {
  if (a) {
    if (Array.isArray(b)) {
      for (var i = 0; i < b.length; i++) {
        if (b[i]) {
          a[i] = extend(a[i], b[i]);
        }
      }
      return a;
    } else if (typeof b === 'object') {
      Object.getOwnPropertyNames(b).forEach(function (key) {
        a[key] = extend(a[key], b[key]);
      });
      return a;
    }
  }
  return b;
};

// Regex to split a documentation
var docSplit = /^(\s*\*[ \t]*|[ \t]*)(.*)$/gm;

/**
 * @constructor Parser
 * @property {Lexer} lexer
 */
var Parser = function (lexer, grammar) {
  this.lexer = lexer;
  this.grammar = {
    param: [{
      property: 'type',
      parser: 'type',
      optional: true,
      default: 'mixed'
    },
    {
      property: 'name',
      parser: 'name',
      optional: true
    },
    {
      property: 'description',
      parser: 'text',
      optional: true
    }],
    return: [{
      property: 'what',
      parser: 'type',
      optional: true,
      default: 'void'
    },
    {
      property: 'description',
      parser: 'text',
      optional: true
    }],
    throws: [{
      property: 'what',
      parser: 'type',
      optional: true,
      default: 'Exception'
    },
    {
      property: 'description',
      parser: 'text',
      optional: true
    }],
    deprecated: [{
      property: 'version',
      parser: 'version',
      optional: true,
      default: 'latest'
    },
    {
      property: 'description',
      parser: 'text'
    }]
  };

  if (grammar) {
    this.extendGrammar(grammar);
  }
};

/**
 * extending the grammar
 */
Parser.prototype.extendGrammar = function (grammar) {
  this.grammar = extend(this.grammar, grammar);
};

/**
 * Parses the specified input
 * @return {Array} AST
 */
Parser.prototype.parse = function (input) {
  var ast = {
    kind: 'doc',
    summary: '',
    blocks: []
  };

  // array of lines (output from php-parser)
  if (Array.isArray(input)) {
    input = input.join('\n');
  } else {
    // strip comments decoration
    input = input.substring(2, input.length - 2).split(docSplit);
    var lines = [];
    for (var i = 2; i < input.length; i += 3) {
      lines.push(input[i].trim());
    }
    input = lines.join('\n');
  }

  // initialize the lexer
  this.lexer.read(input);
  this.token = this.lexer.lex();

  // reads the summary
  while (this.token !== this.lexer._t.T_EOF) {
    if (this.token === '@') {
      break;
    }
    this.token = this.lexer.lex();
  }
  ast.summary = input.substring(0, this.lexer.offset);

  // parsing blocks
  while (this.token !== this.lexer._t.T_EOF) {
    var node = this.parseTopStatement();
    if (node) {
      ast.blocks.push(node);
    }
    this.token = this.lexer.lex();
  }
  return ast;
};

Parser.prototype.parseTopStatement = function () {
  if (this.token === this.lexer._t.T_STRING) {
    return this.parseStatement();
  } else if (this.token === this.lexer._t.T_TEXT) {
    // found a text
    return {
      kind: 'text',
      value: this.lexer.text
    };
  } else if (this.token === this.lexer._t.T_NUM) {
    // a number
    return {
      kind: 'number',
      value: this.lexer.text
    };
  } else if (this.token === '[') {
    // can be an Array
    return {
      kind: 'array',
      value: this.readArray(']')
    };
  } else if (this.token === '{') {
    // can be a JSON
    return {
      kind: 'object',
      value: this.readJson()
    };
  } else if (this.token === '@') {
    return this.parseAnnotation();
  }
  // ignore it
  return null;
};

/**
 * Parses a @annotation
 */
Parser.prototype.parseAnnotation = function () {
  var result;
  var item;
  this.token = this.lexer.lex();
  if (this.token === this.lexer._t.T_STRING) {
    // inner annotation
    result = ['annotation', this.lexer.text, []];
    this.token = this.lexer.lex();
    if (this.token === '(') {
      // with args
      do {
        this.token = this.lexer.lex();
        item = this.parseTopStatement();
        if (item !== null) {
          result[2].push(item);
        }
      } while (this.token !== ')' && this.token !== this.lexer._t.T_EOF);
    } else {
      this.token = this.lexer.unlex();
    }
    return result;
  }
  // ignore it
  this.token = this.lexer.unlex();
};

/**
 * Parses a T_STRING statement
 */
Parser.prototype.parseStatement = function () {
  var word = this.lexer.text.toLowerCase();
  if (word === 'true') {
    return {
      kind: 'boolean',
      value: true
    };
  } else if (word === 'false') {
    return {
      kind: 'boolean',
      value: false
    };
  } else if (word === 'null') {
    return {
      kind: 'null'
    };
  } else if (word === 'array') {
    this.token = this.lexer.lex();
    if (this.token === '(') {
      return {
        kind: 'array',
        value: this.readArray(')')
      };
    }
    this.token = this.lexer.unlex();
    return {
      kind: 'word',
      value: this.lexer.text
    };
  }

  // check other cases
  var name = this.lexer.text;
  this.token = this.lexer.lex();
  if (this.token === '=' || this.token === '=>') {
    // key value
    this.token = this.lexer.lex();
    return {
      kind: 'key',
      name: name,
      value: this.getJsonValue(this.body())
    };
  } else if (this.token === '(') {
    // method
    var result = {
      kind: 'method',
      name: name,
      arguments: []
    };
    do {
      this.token = this.lexer.lex();
      var item = this.parseTopStatement();
      if (item !== null) {
        result.arguments.push(item);
      }
    } while (this.token !== ')' && this.token !== this.lexer._t.T_EOF);
    return result;
  }
  this.token = this.lexer.unlex();
  return {
    kind: 'word',
    value: name
  };
};

Parser.prototype.readArray = function (endChar) {
  var result = [];
  do {
    this.token = this.lexer.lex(); // consume start char
    var item = this.body();
    if (item !== null) { // ignore
      this.token = this.lexer.lex();
      item = this.getJsonValue(item);
      if (this.token === '=>') {
        this.token = this.lexer.lex(); // eat
        item = [
          'key', item,
          this.getJsonValue(
            this.parseTopStatement()
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

Parser.prototype.readJson = function () {
  var result = {};
  do {
    this.token = this.lexer.lex();
    var item = this.parseTopStatement();
    if (item !== null) { // ignore
      this.token = this.lexer.lex(); // eat
      if (this.token === '=>') {
        item = this.getJsonKey(item);
        if (item !== null) {
          this.token = this.lexer.lex();
          result[item] = this.getJsonValue(
            this.parseTopStatement()
          );
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

Parser.prototype.getJsonValue = function (ast) {
  if (!ast) {
    return null;
  }

  var result = this.getJsonKey(ast);
  if (result === null) {
    if (ast.kind === 'object') {
      result = ast.value;
    } else if (ast.kind === 'array') {
      result = [];
      ast.value.forEach(function (item) {
        result.push(this.getJsonValue(item));
      }.bind(this));
    } else {
      result = ast;
    }
  }
  return result;
};

// converts an ast node to a scalar key
Parser.prototype.getJsonKey = function (ast) {
  var result = null;
  if (ast.kind === 'text') {
    result = ast.value.substring(1, ast.value.length - 1);
    try {
      result = JSON.parse('"' + result + '"');
    } catch (err) {
    }
  } else if (ast.kind === 'number') {
    result = JSON.parse(ast[1]);
  } else if (ast.kind === 'word' || ast.kind === 'boolean') {
    result = ast.value;
  }
  return result;
};

module.exports = Parser;
