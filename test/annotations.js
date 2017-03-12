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
  it('should every block', function () {
    var ast = doc.parse([
      '/**',
      ' * @constructor',
      ' * @param SimpleElement $element',
      ' * @param BlockFactory $blockFactory',
      ' * @param Mapper $mapper',
      ' * @param BrowserInterface $browser',
      ' * @param SequenceSorterInterface $sequenceSorter',
      ' * @param ObjectManager $objectManager',
      ' * @param array $config [optional]',
      ' */'
    ].join('\r'));
    JSON.stringify(ast.body).should.be.exactly(
      '[' +
      '{"kind":"block","name":"constructor","options":[]},' +
      '{"kind":"param","type":{"kind":"type","fqn":false,"name":"SimpleElement"},"name":"element","description":""},' +
      '{"kind":"param","type":{"kind":"type","fqn":false,"name":"BlockFactory"},"name":"blockFactory","description":""},' +
      '{"kind":"param","type":{"kind":"type","fqn":false,"name":"Mapper"},"name":"mapper","description":""},' +
      '{"kind":"param","type":{"kind":"type","fqn":false,"name":"BrowserInterface"},"name":"browser","description":""},' +
      '{"kind":"param","type":{"kind":"type","fqn":false,"name":"SequenceSorterInterface"},"name":"sequenceSorter","description":""},' +
      '{"kind":"param","type":{"kind":"type","fqn":false,"name":"ObjectManager"},"name":"objectManager","description":""},' +
      '{"kind":"param","type":{"kind":"type","fqn":false,"name":"array"},"name":"config","description":""},{"kind":"array","value":["optional"]}' +
      ']'
    );
  });

  it('test deprecated', function () {
    var ast = doc.parse([
      '/**',
      ' * @deprecated 1.2.3-alpha',
      ' * @deprecated That\'s the way',
      ' */'
    ].join('\r\n'));
    ast.body.length.should.be.exactly(2);

    ast.body[0].kind.should.be.exactly('deprecated');
    (ast.body[0].description === null).should.be.exactly(true);
    ast.body[0].version.major.should.be.exactly(1);
    ast.body[0].version.minor.should.be.exactly(2);
    ast.body[0].version.patch.should.be.exactly(3);
    ast.body[0].version.label.should.be.exactly('alpha');

    ast.body[1].kind.should.be.exactly('deprecated');
    ast.body[1].description.should.be.exactly('That\'s the way');
    ast.body[1].version.major.should.be.exactly(0);
    ast.body[1].version.minor.should.be.exactly(0);
    ast.body[1].version.patch.should.be.exactly(0);
    (ast.body[1].version.label === null).should.be.exactly(true);
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
