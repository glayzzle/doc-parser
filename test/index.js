/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */
var DocBlockParser = require('../src/index');

describe('Test API', function () {
  var doc = new DocBlockParser();
  it('should parse something', function () {
    var ast = doc.parse('Hello world');
    console.log(ast);
  });
});
