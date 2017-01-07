/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

var should = require('should');
var DocBlockParser = require('../src/index');

describe('Test parser', function () {
  it('extend grammar', function () {
    var doc = new DocBlockParser({
      foo: [],
      return: [
        null,
        {
          property: 'bar'
        }
      ]
    });
    should.exist(doc.parser.grammar.foo);
    doc.parser.grammar.return[1].property.should.be.exactly('bar');
  });
});
