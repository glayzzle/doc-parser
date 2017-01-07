/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

var should = require('should');
var DocBlockParser = require('../src/index');

describe('Test parser', function () {
  var doc = new DocBlockParser();

  it('extend grammar', function () {
    var doc2 = new DocBlockParser({
      foo: [],
      return: [
        null,
        {
          property: 'bar'
        }
      ]
    });
    should.exist(doc2.parser.grammar.foo);
    doc2.parser.grammar.return[1].property.should.be.exactly('bar');
  });

  it('test number', function () {
    var ast = doc.parse([
      '/**',
      ' * Description',
      ' * @test 123 1.23',
      ' */'
    ].join('\n'));
    ast.body[0].type.should.be.exactly('test');
    ast.body[0].options.length.should.be.exactly(2);
    ast.body[0].options[0].kind.should.be.exactly('number');
    ast.body[0].options[0].value.should.be.exactly('123');
    ast.body[0].options[1].kind.should.be.exactly('number');
    ast.body[0].options[1].value.should.be.exactly('1.23');
  });

  it('test rule', function () {
    var ast = doc.parse([
      '/**',
      ' * Description',
      ' * @return void Some extra informations',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('return');
    console.log(ast.body[0]);
  });
});
