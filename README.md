# DocBlock & Annotations Parser

[![npm version](https://badge.fury.io/js/docblock-parser.svg)](https://www.npmjs.com/package/parsedoc)
[![Build Status](https://travis-ci.org/glayzzle/docblock-parser.svg?branch=master)](https://travis-ci.org/glayzzle/docblock-parser)
[![Coverage Status](https://coveralls.io/repos/github/glayzzle/docblock-parser/badge.svg?branch=master)](https://coveralls.io/github/glayzzle/docblock-parser?branch=master)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![Gitter](https://img.shields.io/badge/GITTER-join%20chat-green.svg)](https://gitter.im/glayzzle/Lobby)

This library is a javascript LALR(1) parser that parses docblocks and extracts
annotations under an structured syntax tree.

# Install

```sh
npm install parsedoc --save
```

And simple usage :

```js
var ParseDoc = require('parsedoc');
var reader = new ParseDoc();
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

```

# Misc

This library is released under BSD-3 license clause.
