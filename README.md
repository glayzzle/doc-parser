# DocBlock & Annotations Parser

[![npm version](https://badge.fury.io/js/doc-parser.svg)](https://www.npmjs.com/package/doc-parser)
[![Build Status](https://travis-ci.org/glayzzle/doc-parser.svg?branch=master)](https://travis-ci.org/glayzzle/doc-parser)
[![Coverage Status](https://coveralls.io/repos/github/glayzzle/doc-parser/badge.svg?branch=master&v=1)](https://coveralls.io/github/glayzzle/doc-parser?branch=master)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Gitter](https://img.shields.io/badge/GITTER-join%20chat-green.svg)](https://gitter.im/glayzzle/Lobby)

This library is a javascript LALR(1) parser that parses docblocks and extracts
annotations under an structured syntax tree.

# Install

```sh
npm install doc-parser --save
```

And simple usage :

```js
var DocParser = require('doc-parser');
var reader = new DocParser();
var data = reader.parse('/** @hello world */');
```


# Supported syntaxes

```php
/**
 * Some description
 * @return boolean
 * @return map<string, SomeClass>
 * @author Ioan CHIRIAC <me@domain.com>
 * @throws Exception
 * @deprecated
 * @table('tableName', true)
 * @table(
 *   name='tableName',
 *   primary=true
 * )
 * @annotation1 @annotation2
 * @Target(["METHOD", "PROPERTY"])
 * @Attributes([
 *   @Attribute("stringProperty", type = "string"),
 *   @Attribute("annotProperty",  type = "SomeAnnotationClass"),
 * ])
 * @json({
 *   "key": "value",
 *   "object": { "inner": true },
 *   "list": [1, 2, 3]
 * })
 * <node>
 * Some inner multi line content
 * </node>
 */
```

# AST structure

```js
{
  kind: 'doc',
  summary: 'Some description retrieved from the first line of the coment',
  body: [
    {
      kind: 'return',
      type: 'void',
      description: 'Some extra informations'
    }
  ]
}
```

# Declaring custom doc blocks

By default, `doc-parser` supports `@return`,`@param`,`@throws` and `@deprecated`
doc blocks.

You can extend the support to any doc block :

```js
// lets handle @global (type) (var) (description)
var DocParser = require('doc-parser');
var reader = new DocParser({
  'global': [
    {
      property: 'type',
      parser: 'type',
      optional: true
    },
    {
      property: 'what',
      parser: 'variable',
      optional: true
    },
    {
      property: 'description',
      parser: 'text',
      optional: true,
      default: ''
    }
  ]
});
var data = reader.parse('/** @global string some description */');
```

This will result in a new kind of doc block with the specified properties. Here
a list of supported parsers :

- type : a simple type, class name, or array of types
- variable : a variable name
- text : a line of text (will eat every token until the current line ends)
- version: a semantic version
- array : an array of items
- object : a json object definition
- boolean : a boolean
- number : a number (integer or float)
- string : a simple or double quoted text

# Misc

This library is released under BSD-3 license clause.

