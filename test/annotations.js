/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

// eslint-disable-next-line no-unused-vars
var should = require('should');
var DocBlockParser = require('../src/index');

describe('Test annotations', function () {
  var doc = new DocBlockParser();
  it('should parse', function () {
    var ast = doc.parse([
      '@foobar'
    ]);
    ast.body[0].kind.should.be.exactly('block');
    ast.body[0].name.should.be.exactly('foobar');
    ast.body[0].options.length.should.be.exactly(0);
  });
  it('should parse', function () {
    var ast = doc.parse([
      '@foobar .'
    ]);
    ast.body[0].kind.should.be.exactly('block');
    ast.body[0].name.should.be.exactly('foobar');
    ast.body[0].options.length.should.be.exactly(0);
  });
  it('should parse', function () {
    var ast = doc.parse([
      '/**',
      ' * @foobar("arg", @bar("foo" => true))',
      ' * bark(as => dog)',
      ' */'
    ].join('\r\n'));
    ast.body[0].kind.should.be.exactly('annotation');
    ast.body[0].name.should.be.exactly('foobar');
    ast.body[0].arguments[0].kind.should.be.exactly('text');
    ast.body[0].arguments[1].kind.should.be.exactly('annotation');
    ast.body[0].arguments[1].arguments[0].kind.should.be.exactly('key');
    ast.body[0].arguments[1].arguments[0].name.should.be.exactly('foo');
    ast.body[0].arguments[1].arguments[0].value.kind.should.be.exactly('boolean');
    ast.body[0].arguments[1].arguments[0].value.value.should.be.exactly(true);
    ast.body[1].kind.should.be.exactly('method');
    ast.body[1].name.should.be.exactly('bark');
    ast.body[1].arguments[0].kind.should.be.exactly('key');
    ast.body[1].arguments[0].name.should.be.exactly('as');
    ast.body[1].arguments[0].value.should.be.exactly('dog');
  });
});
