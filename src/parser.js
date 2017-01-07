/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */
'use strict';

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
  for (var k in grammar) {
    var e = grammar[k]; // node object
    if (!this.grammar.hasOwnProperty(k)) {
      this.grammar[k] = e;
    } else {
      for (var i = 0; i < e.length; i++) {
        if (e[i]) { // array of properties
          if (!this.grammar[k][i]) {
            this.grammar[k][i] = e[i];
          } else {
            for (var j in e[i]) { // option of property
              this.grammar[k][i][j] = e[i][j];
            }
          }
        }
      }
    }
  }
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
  this.lexer.read(input);
  this.token = this.lexer.lex();
  while (this.token !== this.lexer._t.T_EOF) {
    var node = this.body();
    if (node) {
      ast.push(node);
    }
    this.token = this.lexer.lex();
  }
  return ast;
};

Parser.prototype.body = function () {
  var result;
  var name;
  var item;
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
        result = ['array'];
        result.push(this.read_array(')'));
        return result;
      }
      this.token = this.lexer.unlex();
      return ['type', this.lexer.text];
    }
    name = this.lexer.text;
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
      result = ['method', name, []];
      do {
        this.token = this.lexer.lex();
        item = this.body();
        if (item !== null) {
          result[2].push(item);
        }
      } while (this.token !== ')' && this.token !== this.lexer._t.T_EOF);
      return result;
    }
    this.token = this.lexer.unlex();
    return ['type', name];
  } else if (this.token === this.lexer._t.T_TEXT) {
    return ['text', this.lexer.text];
  } else if (this.token === this.lexer._t.T_NUM) {
    return ['number', this.lexer.text];
  } else if (this.token === '[') {
    // can be an Array
    result = ['array'];
    result.push(this.read_array(']'));
    return result;
  } else if (this.token === '{') {
    // can be a JSON
    result = ['json'];
    result.push(this.read_json());
    return result;
  } else if (this.token === '@') {
    this.token = this.lexer.lex();
    if (this.token === this.lexer._t.T_STRING) {
      // inner annotation
      result = ['annotation', this.lexer.text, []];
      this.token = this.lexer.lex();
      if (this.token === '(') {
        // with args
        do {
          this.token = this.lexer.lex();
          item = this.body();
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
    return null;
  }
  // ignore it
  return null;
};

Parser.prototype.read_array = function (endChar) {
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

Parser.prototype.read_json = function () {
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

Parser.prototype.get_json_value = function (ast) {
  if (!ast) {
    return null;
  }

  var result = this.get_json_key(ast);
  if (result === null) {
    if (ast[0] === 'json') {
      result = ast[1];
    } else if (ast[0] === 'array') {
      result = [];
      ast[1].forEach(function (item) {
        result.push(this.get_json_value(item));
      }.bind(this));
    } else {
      result = ast;
    }
  }
  return result;
};

// converts an ast node to a scalar key
Parser.prototype.get_json_key = function (ast) {
  var result = null;
  if (ast[0] === 'text') {
    result = ast[1].substring(1, ast[1].length - 1);
    try {
      result = JSON.parse('"' + result + '"');
    } catch (err) {
    }
  } else if (ast[0] === 'number') {
    result = JSON.parse(ast[1]);
  } else if (ast[0] === 'type' || ast[0] === 'boolean') {
    result = ast[1];
  }
  return result;
};

module.exports = Parser;
