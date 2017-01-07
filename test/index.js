/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

// eslint-disable-next-line no-unused-vars
var should = require('should');
var DocBlockParser = require('../src/index');

describe('Test API', function () {
  var doc = new DocBlockParser();
  it('should parse only summary', function () {
    var ast = doc.parse('/** Hello world */');
    ast.kind.should.be.exactly('doc');
    ast.body.length.should.be.exactly(0);
    ast.summary.should.be.exactly('Hello world');
  });
  it('should keep whitespaces', function () {
    var ast = doc.parse([
      '/**',
      ' * Hello world',
      ' * ',
      ' * Second line',
      ' * ',
      ' */'
    ].join('\n'));
    ast.kind.should.be.exactly('doc');
    ast.body.length.should.be.exactly(0);
    ast.summary.should.be.exactly('Hello world\n\nSecond line\n');
  });

  it('test a simple annotation', function () {
    var ast = doc.parse([
      '/**',
      ' * Description',
      ' * @test',
      ' */'
    ].join('\n'));
    ast.summary.should.be.exactly('Description');
    ast.body.length.should.be.exactly(1);
    ast.body[0].kind.should.be.exactly('block');
  });
});
