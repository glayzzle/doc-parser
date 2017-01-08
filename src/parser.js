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
  // list of parsers
  this.parsers = {
    type: this.parseType,
    variable: this.parseVarName,
    text: this.parseText,
    version: this.parseVersion,
    array: this.parseArray,
    object: this.parseObject,
    boolean: this.parseBoolean,
    number: this.parseNumber,
    string: this.parseString
  };
  // list of annotation specific nodes
  // most interesting ones only
  this.grammar = {
    param: [{
      property: 'type',
      parser: 'type',
      optional: true,
      default: 'mixed'
    },
    {
      property: 'name',
      parser: 'variable',
      optional: true
    },
    {
      property: 'description',
      parser: 'text',
      optional: true,
      default: ''
    }],
    return: [{
      property: 'what',
      parser: 'type',
      optional: true,
      default: false
    },
    {
      property: 'description',
      parser: 'text',
      optional: true,
      default: ''
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
      default: {
        major: 0,
        minor: 0,
        patch: 0,
        label: null
      }
    },
    {
      property: 'description',
      parser: 'text'
    }]
  };

  // optionnal grammar
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
    body: []
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

  // extract summary from text
  if (this.token === '@') {
    ast.summary = input.substring(0, this.lexer.offset - 1);
  } else {
    ast.summary = input.substring(0, this.lexer.offset);
  }

  // trim first starting line returns
  if (ast.summary[0] === '\r') {
    ast.summary = ast.summary.substring(1);
  }
  if (ast.summary[0] === '\n') {
    ast.summary = ast.summary.substring(1);
  }
  // trim last line returns
  if (ast.summary[ast.summary.length - 1] === '\n') {
    ast.summary = ast.summary.substring(0, ast.summary.length - 1);
  }
  if (ast.summary[ast.summary.length - 1] === '\r') {
    ast.summary = ast.summary.substring(0, ast.summary.length - 1);
  }

  // parsing blocks
  while (this.token !== this.lexer._t.T_EOF) {
    var node = this.parseTopStatement();
    if (node) {
      ast.body.push(node);
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
    // number
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
  var type;
  this.token = this.lexer.lex();
  if (this.token === this.lexer._t.T_STRING) {
    type = this.lexer.text.toLowerCase();
    var line = this.lexer.line;
    this.token = this.lexer.lex(); // eat

    // grammar specific annotation
    if (this.grammar[type]) {
      result = this.parseGrammar(type);
      if (result) {
        return result;
      }
    }

    if (this.token === '(') {
      // method annotation
      do {
        result = {
          kind: 'annotation',
          type: type,
          arguments: []
        };
        this.token = this.lexer.lex();
        item = this.parseTopStatement();
        if (item !== null) {
          result.arguments.push(item);
        }
      } while (this.token !== ')' && this.token !== this.lexer._t.T_EOF);
    } else {
      // generic doc block
      result = {
        kind: 'block',
        type: type,
        options: []
      };
      while (line === this.lexer.line) {
        item = this.parseTopStatement();
        if (item !== null) {
          result.options.push(item);
        }
        this.token = this.lexer.lex();
      }
    }
    return result;
  }
  // ignore it
  this.token = this.lexer.unlex();
  return null;
};

/**
 * Parsing a rule
 */
Parser.prototype.parseGrammar = function (name) {
  var result = {
    kind: name
  };
  var rules = this.grammar[name];
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    result[rule.property] = this.parseRule(rule);
  }
  return result;
};

/**
 * Parsing a rule
 */
Parser.prototype.parseRule = function (rule) {
  if (typeof this.parsers[rule.parser] === 'function') {
    var backup = this.lexer.state();
    var result = this.parsers[rule.parser].apply(this, []);
    if (result === null) {
      this.lexer.unlex(backup);
      if (typeof rule.default !== 'undefined') {
        return rule.default;
      }
    }
    return result;
  }
  return null;
};

/**
 * Check if current token can be a type
 * ```ebnf
 * type ::= '\\'? T_STRING ('\\' T_STRING) *
 * parseType ::= type |
 *    type '[' (type (',' type)*)? ']' |
 *    type '<' (type (',' type)*)? '>'
 * ```
 */
Parser.prototype.parseType = function () {
  var result = {
    kind: 'type',
    fqn: false,
    name: ''
  };
  if (this.token === '\\') {
    result.fqn = true;
    this.token = this.lexer.lex();
  }
  if (this.token !== this.lexer._t.T_STRING) {
    return null;
  }
  while (this.token === this.lexer._t.T_STRING) {
    result.name += this.lexer.text;
    this.token = this.lexer.lex(); // eat
    if (this.token === '\\') {
      result.name += '\\';
      this.token = this.lexer.lex(); // eat && continue
    } else if (this.token === '[') {
      // collection
      result = {
        kind: 'collection',
        value: result,
        index: this.parseListOfTypes(']')
      };
      if (result.index === null) {
        return null;
      }
      break;
    } else if (this.token === '<') {
      // template class
      result = {
        kind: 'class',
        class: result,
        parameters: this.parseListOfTypes('>')
      };
      if (result.parameters === null) {
        return null;
      }
      break;
    } else {
      break;
    }
  }
  return result;
};

/**
 * Parse a list of type
 * @private
 */
Parser.prototype.parseListOfTypes = function (charEnd) {
  var result = [];
  this.token = this.lexer.lex(); // eat && continue
  if (this.token === charEnd) {
    this.token = this.lexer.lex(); // eat && continue
  } else {
    var indexType = this.parseType();
    if (indexType !== null) {
      result.push(indexType);
      while (this.token === ',') {
        this.token = this.lexer.lex(); // eat && continue
        indexType = this.parseType();
        if (indexType === null) {
          break;
        } else {
          result.push(indexType);
        }
      }
    }
    if (this.token !== charEnd) {
      return null;
    }
  }
  return result;
};

/**
 * Reads a variable name
 */
Parser.prototype.parseVarName = function () {
  if (this.token === '$') {
    this.token = this.lexer.lex(); // eat && continue
    if (this.token === this.lexer._t.T_STRING) {
      var result = this.lexer.text;
      this.token = this.lexer.lex(); // eat && continue
      return result;
    }
  }
  return null;
};

/**
 * Parsing an entire line string
 */
Parser.prototype.parseText = function () {
  if (this.token !== this.lexer._t.T_STRING) {
    return null;
  }
  var line = this.lexer.backup.line;
  var offset = this.lexer.backup.offset;
  while (this.token !== this.lexer._t.EOF) {
    this.token = this.lexer.lex(); // eat && continue
    if (this.lexer.line !== line) {
      this.lexer.unlex();
      break;
    }
  }
  var result = this.lexer._input.substring(offset, this.lexer.offset).trim();
  this.token = this.lexer.lex(); // eat && continue
  return result;
};

/**
 * Reads a version informations
 * ```ebnf
 * parseVersion ::= T_NUM ('.' T_NUM ('.' T_NUM ('-' T_STRING)?)?)?
 * ```
 */
Parser.prototype.parseVersion = function () {
  var version = {
    major: 0,
    minor: 0,
    patch: 0,
    label: null
  };

  if (this.token !== this.lexer._t.T_NUM) {
    return null;
  }

  // PARSE THE NUMERIC PART
  var v = this.lexer.text;
  this.token = this.lexer.lex(); // eat && continue
  if (this.token === this.lexer._t.T_NUM) {
    v += this.lexer.text;
    this.token = this.lexer.lex(); // eat && continue
  }

  // EAT THE LABEL
  if (this.token === '-') {
    this.token = this.lexer.lex(); // eat && continue
    if (this.token === this.lexer._t.T_STRING) {
      version.label = this.lexer.text;
      this.token = this.lexer.lex(); // eat && continue
      if (this.token === this.lexer._t.T_NUM) {
        version.label += this.lexer.text;
        this.token = this.lexer.lex(); // eat && continue
      }
    }
  }

  // READ THE VERSION
  v = v.split('.');
  version.major = parseInt(v[0], 10);
  if (v.length > 1) {
    version.minor = parseInt(v[1], 10);
    if (v.length > 2) {
      version.patch = parseInt(v[2], 10);
    }
  }
  return version;
};

Parser.prototype.parseArray = function () {

};

Parser.prototype.parseObject = function () {

};

Parser.prototype.parseBoolean = function () {

};

Parser.prototype.parseNumber = function () {

};

Parser.prototype.parseString = function () {

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
      value: this.getJsonValue(this.parseTopStatement())
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
    var item = this.parseTopStatement();
    if (item !== null) { // ignore
      this.token = this.lexer.lex();
      item = this.getJsonValue(item);
      if (this.token === '=>') {
        this.token = this.lexer.lex(); // eat
        item = {
          kind: 'key',
          name: item,
          value: this.getJsonValue(
            this.parseTopStatement()
          )
        };
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
    result = JSON.parse(ast.value);
  } else if (ast.kind === 'word' || ast.kind === 'boolean') {
    result = ast.value;
  }
  return result;
};

module.exports = Parser;
