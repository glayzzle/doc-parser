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
      ' * @test 123 1.23 null',
      ' */'
    ].join('\r\n'));
    ast.body[0].type.should.be.exactly('test');
    ast.body[0].options.length.should.be.exactly(3);
    ast.body[0].options[0].kind.should.be.exactly('number');
    ast.body[0].options[0].value.should.be.exactly('123');
    ast.body[0].options[1].kind.should.be.exactly('number');
    ast.body[0].options[1].value.should.be.exactly('1.23');
    ast.body[0].options[2].kind.should.be.exactly('null');
  });

  it('test array', function () {
    var ast = doc.parse([
      '/**',
      ' * @test [1, 2, a => b]',
      ' */'
    ].join('\r\n'));
    ast.body[0].type.should.be.exactly('test');
    ast.body[0].options.length.should.be.exactly(1);
    ast.body[0].options[0].kind.should.be.exactly('array');
    console.log(ast.body[0].options[0]);
  });

  it('test boolean', function () {
    var ast = doc.parse([
      '/**',
      ' * @test true false',
      ' */'
    ].join('\r\n'));
    ast.body[0].type.should.be.exactly('test');
    ast.body[0].options.length.should.be.exactly(2);
    ast.body[0].options[0].kind.should.be.exactly('boolean');
    ast.body[0].options[0].value.should.be.exactly(true);
    ast.body[0].options[1].kind.should.be.exactly('boolean');
    ast.body[0].options[1].value.should.be.exactly(false);
  });

  it('test return rule', function () {
    var ast = doc.parse([
      '/**',
      ' * Description',
      ' * @return void Some extra informations',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('return');
    ast.body[0].what.kind.should.be.exactly('type');
    ast.body[0].what.name.should.be.exactly('void');
    ast.body[0].description.should.be.exactly('Some extra informations');
  });

  it('test return optional values', function () {
    var ast = doc.parse('/* @return \\Foo\\Bar[] */');
    ast.body[0].kind.should.be.exactly('return');
    ast.body[0].what.kind.should.be.exactly('collection');
    ast.body[0].what.value.kind.should.be.exactly('type');
    ast.body[0].what.value.name.should.be.exactly('Foo\\Bar');
    ast.body[0].what.value.fqn.should.be.exactly(true);
    ast.body[0].description.should.be.exactly('');
  });

  it('test return defaults', function () {
    var ast = doc.parse('/* @return */');
    ast.body[0].kind.should.be.exactly('return');
    ast.body[0].what.should.be.exactly(false);
    ast.body[0].description.should.be.exactly('');
  });

  it('test param', function () {
    var ast = doc.parse([
      '/**',
      ' * Description',
      ' * @param String $var Foo is Bar',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('param');
    ast.body[0].type.name.should.be.exactly('String');
    ast.body[0].name.should.be.exactly('var');
    ast.body[0].description.should.be.exactly('Foo is Bar');
  });

  it('test param defaults', function () {
    var ast = doc.parse([
      '/**',
      ' * Description',
      ' * @param String Foo is Bar',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('param');
    ast.body[0].type.name.should.be.exactly('String');
    should.equal(ast.body[0].name, null);
    ast.body[0].description.should.be.exactly('Foo is Bar');
  });

  it('test deprecated', function () {
    var ast = doc.parse([
      '/**',
      ' * @deprecated 13.223.314-beta.5',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('deprecated');
    ast.body[0].version.major.should.be.exactly(13);
    ast.body[0].version.minor.should.be.exactly(223);
    ast.body[0].version.patch.should.be.exactly(314);
    ast.body[0].version.label.should.be.exactly('beta.5');
  });
});
