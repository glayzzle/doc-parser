/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

// eslint-disable-next-line no-unused-vars
var should = require('should');
var tokens = require('../src/token');
var Lexer = require('../src/lexer');

describe('Test lexer', function () {
  var reader = new Lexer(tokens);
  it('Test windows lines', function () {
    reader.read([
      'hello',
      'world'
    ].join('\r\n'));

    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.text.should.be.exactly('hello');
    reader.line.should.be.exactly(1);

    reader.next().should.be.exactly(tokens.T_WHITESPACE);
    reader.text.should.be.exactly('\r\n');
    reader.line.should.be.exactly(2);

    reader.unput();
    reader.line.should.be.exactly(1);

    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.text.should.be.exactly('world');
    reader.line.should.be.exactly(2);
  });
  it('Test mac lines', function () {
    reader.read([
      'hello',
      'world'
    ].join('\r'));

    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.text.should.be.exactly('hello');
    reader.line.should.be.exactly(1);

    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.text.should.be.exactly('world');
    reader.line.should.be.exactly(2);
  });
  it('Test unlex', function () {
    reader.read([
      'hello',
      'world'
    ].join('\n'));

    // read
    var start = reader.state();
    reader.unlex();
    reader.offset.should.be.exactly(0);

    // next
    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.line.should.be.exactly(2);

    // go back
    reader.unlex(start);
    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.line.should.be.exactly(1);
    reader.text.should.be.exactly('hello');

    // next
    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.line.should.be.exactly(2);

    // back
    reader.unlex();
    reader.line.should.be.exactly(1);
    reader.text.should.be.exactly('hello');
  });
  it('Test float', function () {
    reader.read('1.2.3');
    reader.lex().should.be.exactly(tokens.T_NUM);
    reader.text.should.be.exactly('1.2');
    reader.lex().should.be.exactly(tokens.T_NUM);
    reader.text.should.be.exactly('.3');
  });
  it('Test assign', function () {
    reader.read('foo => a, bar: b');
    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.lex().should.be.exactly('=>');
    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.lex().should.be.exactly(',');
    reader.lex().should.be.exactly(tokens.T_STRING);
    reader.lex().should.be.exactly('=>');
    reader.lex().should.be.exactly(tokens.T_STRING);
  });
  it('Test text', function () {
    reader.read('\'aze\\\'rty\'');
    reader.lex().should.be.exactly(tokens.T_TEXT);
    reader.text.should.be.exactly('\'aze\\\'rty\'');
  });
});
