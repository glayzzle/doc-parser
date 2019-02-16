/*!
 * Copyright (C) 2017 Glayzzle (BSD3 License)
 * @authors https://github.com/glayzzle/docblock-parser/graphs/contributors
 * @url http://glayzzle.com/docblock-parser
 */

var should = require('should');
var DocBlockParser = require('../src/index');

describe('Test parser', function () {
  var doc = new DocBlockParser({
    boolean: [
      {
        property: 'value',
        parser: 'boolean'
      }
    ],
    array: [
      {
        property: 'value',
        parser: 'array'
      }
    ],
    number: [
      {
        property: 'value',
        parser: 'number'
      }
    ],
    string: [
      {
        property: 'value',
        parser: 'string'
      }
    ],
    text: [
      {
        property: 'value',
        parser: 'text'
      }
    ],
    object: [
      {
        property: 'value',
        parser: 'object'
      }
    ]
  });

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
    ast.body[0].name.should.be.exactly('test');
    ast.body[0].options.length.should.be.exactly(3);
    ast.body[0].options[0].kind.should.be.exactly('number');
    ast.body[0].options[0].value.should.be.exactly(123);
    ast.body[0].options[1].kind.should.be.exactly('number');
    ast.body[0].options[1].value.should.be.exactly(1.23);
    ast.body[0].options[2].kind.should.be.exactly('null');
  });

  it('test array', function () {
    var ast = doc.parse([
      '/**',
      ' * @test [1, 2, a => b]',
      ' */'
    ].join('\r\n'));
    ast.body[0].name.should.be.exactly('test');
    ast.body[0].options.length.should.be.exactly(1);
    ast.body[0].options[0].kind.should.be.exactly('array');
    // @todo console.log(ast.body[0].options[0]);
  });

  it('test boolean', function () {
    var ast = doc.parse([
      '/**',
      ' * @test true false',
      ' */'
    ].join('\r\n'));
    ast.body[0].name.should.be.exactly('test');
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

  it('test deprecated options', function () {
    var ast = doc.parse([
      '/**',
      ' * @deprecated Foo',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('deprecated');
    ast.body[0].description.should.be.exactly('Foo');
  });

  it('test boolean', function () {
    var ast = doc.parse([
      '/**',
      ' * @boolean true',
      ' * @boolean false',
      ' * @boolean',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('boolean');
    ast.body[0].value.should.be.exactly(true);
    ast.body[1].kind.should.be.exactly('boolean');
    ast.body[1].value.should.be.exactly(false);
    ast.body[2].kind.should.be.exactly('boolean');
    should.equal(ast.body[2].value, null);
  });

  it('test number', function () {
    var ast = doc.parse([
      '/**',
      ' * @number 123',
      ' * @number 1.23',
      ' * @number',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('number');
    ast.body[0].value.should.be.exactly(123);
    ast.body[1].kind.should.be.exactly('number');
    ast.body[1].value.should.be.exactly(1.23);
    ast.body[2].kind.should.be.exactly('number');
    should.equal(ast.body[2].value, null);
  });

  it('test string', function () {
    var ast = doc.parse([
      '/**',
      ' * @string "azerty"',
      ' * @string \'azerty\'',
      ' * @string',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('string');
    ast.body[0].value.should.be.exactly('azerty');
    ast.body[1].kind.should.be.exactly('string');
    ast.body[1].value.should.be.exactly('azerty');
    ast.body[2].kind.should.be.exactly('string');
    should.equal(ast.body[2].value, null);
  });

  it('test array', function () {
    var ast = doc.parse([
      '/**',
      ' * @array [1, 2, 3]',
      ' * @array array(4, 5, 6)',
      ' * @array',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('array');
    ast.body[0].value.should.be.eql([1, 2, 3]);
    ast.body[1].kind.should.be.exactly('array');
    ast.body[1].value.should.be.eql([4, 5, 6]);
    ast.body[2].kind.should.be.exactly('array');
    should.equal(ast.body[2].value, null);
  });

  it('test object', function () {
    var ast = doc.parse([
      '/**',
      ' * @object { foo: 1 }',
      ' * @object { "bar": false }',
      ' * @object',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('object');
    ast.body[0].value.should.be.eql({foo: 1});
    ast.body[1].kind.should.be.exactly('object');
    ast.body[1].value.should.be.eql({bar: false});
    ast.body[2].kind.should.be.exactly('object');
    should.equal(ast.body[2].value, null);
  });

  it('test getJsonValue', function () {
    var ast = doc.parse([
      '/**',
      ' * @object { foo: { bar: false }, "key": [1, 2, 3] }',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('object');
    ast.body[0].value.should.be.eql({foo: {bar: false}, key: [1, 2, 3]});
  });

  it('test readArray', function () {
    var ast = doc.parse([
      '/**',
      ' * @array [foo => bar, 1, 2, array]',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('array');
    ast.body[0].value.should.be.eql([
      {
        kind: 'key',
        name: 'foo',
        value: 'bar'
      },
      1,
      2,
      'array'
    ]);
  });

  it('test parseListOfTypes', function () {
    var ast = doc.parse([
      '/**',
      ' * @return String[Number, Number]',
      ' * @return Iterable<String, Foo>',
      ' */'
    ].join('\n'));
    ast.body[0].kind.should.be.exactly('return');
    ast.body[0].what.should.be.eql({
      index: [
        {
          fqn: false,
          kind: 'type',
          name: 'Number'
        },
        {
          fqn: false,
          kind: 'type',
          name: 'Number'
        }
      ],
      kind: 'collection',
      value: {
        fqn: false,
        kind: 'type',
        name: 'String'
      }
    });
  });

  it('test annotation method with no arguments', function () {
    var ast = doc.parse([
      '/**',
      ' * @SomeMethod()',
      ' * @SomeOtherAnnotation',
      ' */'
    ].join('\n'));
    ast.body.length.should.be.exactly(2);
    ast.body[0].kind.should.be.exactly('annotation');
    ast.body[0].arguments.length.should.be.exactly(0);
  });

  it('test empty array annotation', function () {
    var ast = doc.parse([
      '/**',
      ' * @SomeArray[]',
      ' * @SomeOtherAnnotation',
      ' */'
    ].join('\n'));
    ast.body.length.should.be.exactly(2);
    ast.body[0].kind.should.be.exactly('block');
    ast.body[0].options.length.should.be.exactly(1);
    ast.body[0].options[0].kind.should.be.exactly('array');
    ast.body[0].options[0].value.length.should.be.exactly(0);
  });
});
