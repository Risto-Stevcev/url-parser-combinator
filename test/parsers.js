'use strict'
require('babel-polyfill')
const expect = require('chai').expect
    , p      = require('eulalie')

const s = require('../src/parsers')

let many = function(parser) {
  return p.seq(function*() {
    const value = (yield parser).value
    yield p.eof
    return value
  })
}

describe('Predicates', () => {
  describe('isHex', () => {
    it('should match the correct chars', () => {
      '0123456789abcdefABCDEF'.split('').forEach(string => expect(s.isHex(string)).to.be.true)
    })

    it('should not match incorrect chars', () => {
      ['G','AA','.'].forEach(string => expect(s.isHex(string)).to.be.false)
    })
  })

  describe('isSafe', () => {
    it('should match the correct chars', () => {
      '$-_.+'.split('').forEach(string => expect(s.isSafe(string)).to.be.true)
    })

    it('should not match incorrect chars', () => {
      ['$$','a','@','Z'].forEach(string => expect(s.isSafe(string)).to.be.false)
    })
  })

  describe('isExtra', () => {
    it('should match the correct chars', () => {
      "!*'(),".split('').forEach(string => expect(s.isExtra(string)).to.be.true)
    })

    it('should not match incorrect chars', () => {
      ['!!','a','@','Z'].forEach(string => expect(s.isExtra(string)).to.be.false)
    })
  })

  describe('isNational', () => {
    it('should match the correct chars', () => {
      '{}|\\^~[]`'.split('').forEach(string => expect(s.isNational(string)).to.be.true)
    })

    it('should not match incorrect chars', () => {
      ['{{','a','@','Z'].forEach(string => expect(s.isNational(string)).to.be.false)
    })
  })

  describe('isReserved', () => {
    it('should match the correct chars', () => {
      ';/?:@&='.split('').forEach(string => expect(s.isReserved(string)).to.be.true)
    })

    it('should not match incorrect chars', () => {
      [';;','a','!','Z'].forEach(string => expect(s.isReserved(string)).to.be.false)
    })
  })

  describe('isPunctuation', () => {
    it('should match the correct chars', () => {
      '<>#%"'.split('').forEach(string => expect(s.isPunctuation(string)).to.be.true)
    })

    it('should not match incorrect chars', () => {
      ['<<','a','@','Z'].forEach(string => expect(s.isPunctuation(string)).to.be.false)
    })
  })
})



describe('Parsers', () => {
  describe('URL', () => {
    it('should parse text', () => {
      [ 'file:///foo/bar.txt'
      , 'http://localhost:80/foo/bar#hash'
      , 'http://localhost:80/foo/bar?key1=value1&key2=value2' ].forEach(string => {
        expect(p.parse(s.seqEOF(s.URL), p.stream(string))).to.have.property('value', string)
      })
      expect(p.parse(s.URL, p.stream(''))).to.have.property('value', '')
    })
  })

  describe('absoluteURL', () => {
    it('should parse text', () => {
      [ 'file:///foo/bar.txt'
      , 'http://localhost:80/foo/bar?key1=value1&key2=value2' ].forEach(string => {
        expect(p.parse(s.seqEOF(s.absoluteURL), p.stream(string))).to.have.property('value', string)
      })
    })
 
    it('should fail to parse text', () => {
      expect(p.parse(s.absoluteURL, p.stream(''))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.absoluteURL), p.stream('//localhost:80/foo/bar?key1=value1'))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.absoluteURL), p.stream('//localhost:80/foo/bar#hash'))).to.be.instanceof(Error)
    })
  })

  describe('genericRL', () => {
    it('should parse text', () => {
      [ 'file:///foo/bar.txt'
      , 'http://localhost:80/foo/bar?key1=value1&key2=value2' ].forEach(string => {
        expect(p.parse(s.seqEOF(s.genericRL), p.stream(string))).to.have.property('value', string)
      })
    })
 
    it('should fail to parse text', () => {
      expect(p.parse(s.genericRL, p.stream(''))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.genericRL), p.stream('//localhost:80/foo/bar?key1=value1'))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.genericRL), p.stream('//localhost:80/foo/bar#hash'))).to.be.instanceof(Error)
    })
  })

  describe('relativeURL', () => {
    it('should parse text', () => {
      [ 'foo/bar;key1=value1?key2=value2'
      , '/foo/bar;key1=value1;key2=value2'
      , '//localhost:80/foo/bar?key1=value1&key2=value2' ].forEach(string => {
        expect(p.parse(s.seqEOF(s.relativeURL), p.stream(string))).to.have.property('value', string)
      })
      expect(p.parse(s.relativeURL, p.stream(''))).to.have.property('value', '')
    })

    it('should fail to parse text', () => {
      expect(p.parse(s.seqEOF(s.relativeURL), p.stream('//localhost:80/foo/bar#hash'))).to.be.instanceof(Error)
    })
  })

  describe('net_path', () => {
    it('should parse text', () => {
      [ '//localhost:80/foo'
      , '//localhost:80/foo/bar'
      , '//localhost:80/foo/bar;key1=value1?key2=value2'
      , '//localhost:80/foo/bar;key1=value1;key2=value2'
      , '//localhost:80/foo/bar?key1=value1&key2=value2' ].forEach(string => {
        expect(p.parse(s.seqEOF(s.net_path), p.stream(string))).to.have.property('value', string)
      })
    })

    it('should fail to parse text', () => {
      expect(p.parse(s.net_path, p.stream(''))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.net_path), p.stream('/foo/bar'))).to.be.instanceof(Error)
    })
  })

  describe('abs_path', () => {
    it('should parse text', () => {
      [ '/foo'
      , '/foo/bar'
      , '/foo/bar;key1=value1?key2=value2'
      , '/foo/bar;key1=value1;key2=value2'
      , '/foo/bar?key1=value1&key2=value2' ].forEach(string => {
        expect(p.parse(s.seqEOF(s.abs_path), p.stream(string))).to.have.property('value', string)
      })
    })

    it('should fail to parse text', () => {
      expect(p.parse(s.abs_path, p.stream(''))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.abs_path), p.stream('foo/bar'))).to.be.instanceof(Error)
    })
  })

  describe('rel_path', () => {
    it('should parse text', () => {
      [ 'foo/bar'
      , 'foo/bar;key1=value1?key2=value2'
      , 'foo/bar;key1=value1;key2=value2'
      , 'foo/bar?key1=value1&key2=value2' ].forEach(string => {
        expect(p.parse(s.seqEOF(s.rel_path), p.stream(string))).to.have.property('value', string)
      })
      expect(p.parse(s.rel_path, p.stream(''))).to.have.property('value', '')
    })
  })

  describe('path', () => {
    it('should parse text', () => {
      expect(p.parse(s.seqEOF(s.path), p.stream('foo/bar'))).to.have.property('value', 'foo/bar')
    })

    it('should fail to parse text', () => {
      expect(p.parse(s.path, p.stream(''))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.path), p.stream('foo?/bar'))).to.be.instanceof(Error)
    })
  })

  describe('fsegment', () => {
    it('should parse text', () => {
      expect(p.parse(s.seqEOF(s.fsegment), p.stream('aZ0+*:@&='))).to.have.property('value', 'aZ0+*:@&=')
      expect(p.parse(s.seqEOF(s.fsegment), p.stream('aZ0+*:@&=')).value)
        .to.equal(p.parse(s.seqEOF(p.many(s.pchar)), p.stream('aZ0+*:@&=')).value)
    })

    it('should fail to parse text', () => {
      expect(p.parse(s.fsegment, p.stream(''))).to.be.instanceof(Error)
      expect(p.parse(s.seqEOF(s.fsegment), p.stream('hello?'))).to.be.instanceof(Error)
    })
  })

  describe('segment', () => {
    it('should parse text', () => {
      expect(p.parse(s.segment, p.stream(''))).to.have.property('value', '')
      expect(p.parse(s.seqEOF(s.segment), p.stream('aZ0+*:@&='))).to.have.property('value', 'aZ0+*:@&=')
      expect(p.parse(s.seqEOF(s.segment), p.stream('aZ0+*:@&=')).value)
        .to.equal(p.parse(s.seqEOF(p.many(s.pchar)), p.stream('aZ0+*:@&=')).value)
    })

    it('should fail to parse text', () => {
      expect(p.parse(s.seqEOF(s.segment), p.stream('hello?'))).to.be.instanceof(Error)
    })
  })

  describe('params', () => {
    it('should parse text', () => {
      expect(p.parse(s.params, p.stream(''))).to.have.property('value', '')
      expect(p.parse(s.seqEOF(s.params), p.stream('key1=value1'))).to.have.property('value', 'key1=value1')
      expect(p.parse(s.seqEOF(s.params), p.stream('key1=value1;key2=value2'))).to.have.property('value', 'key1=value1;key2=value2')
    })

    it('should fail to parse text', () => {
      expect(p.parse(s.seqEOF(s.params), p.stream('key1=value1?key2=value2'))).to.be.instanceof(Error)
    })
  })

  describe('param', () => {
    it('should parse text', () => {
      ['a','Z','0','+','*',':','@','&','=','/'].forEach(string => {
        expect(p.parse(s.param, p.stream(string))).to.have.property('value', string)
        expect(p.parse(s.param, p.stream(string)).value)
          .to.equal(p.parse(s.pchar,     p.stream(string)).value ||
                    p.parse(p.char('/'), p.stream(string)).value)
      })
      expect(p.parse(s.param, p.stream(''))).to.have.property('value', '')
      expect(p.parse(s.seqEOF(s.param), p.stream('aZ0+*:@&=/'))).to.have.property('value', 'aZ0+*:@&=/')
    })

    it('should fail to parse text', () => {
      ['{','}'].forEach(string => expect(p.parse(s.seqEOF(s.param), p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('fragment', () => {
    it('should be an alias for query', () => {
      expect(s.fragment).to.equal(s.query)
    })
  })

  describe('query', () => {
    it('should parse text', () => {
      ['a','Z','0','+','*',';','/','?',':','@','&','='].forEach(string => {
        expect(p.parse(s.query, p.stream(string))).to.have.property('value', string)
        expect(p.parse(s.query, p.stream(string)).value)
          .to.equal(p.parse(s.uchar,    p.stream(string)).value ||
                    p.parse(s.reserved, p.stream(string)).value)
      })
      expect(p.parse(s.query, p.stream(''))).to.have.property('value', '')
      expect(p.parse(s.seqEOF(s.query), p.stream('aZ0+*@&='))).to.have.property('value', 'aZ0+*@&=')
    })

    it('should fail to parse text', () => {
      ['{','}'].forEach(string => expect(p.parse(s.seqEOF(s.query), p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('net_loc', () => {
    it('should parse text', () => {
      ['a','Z','0','+','*',':','@','&','=',';','?'].forEach(string => {
        expect(p.parse(s.net_loc, p.stream(string))).to.have.property('value', string)
        expect(p.parse(s.net_loc, p.stream(string)).value)
          .to.equal(p.parse(s.pchar,    p.stream(string)).value ||
                    p.parse(p.char(';'), p.stream(string)).value ||
                    p.parse(p.char('?'), p.stream(string)).value)
      })
      expect(p.parse(s.net_loc, p.stream(''))).to.have.property('value', '')
      expect(p.parse(s.seqEOF(s.net_loc), p.stream('aZ0+*'))).to.have.property('value', 'aZ0+*')
    })

    it('should fail to parse text', () => {
      ['{','}'].forEach(string => expect(p.parse(s.seqEOF(s.net_loc), p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('scheme', () => {
    it('should parse text', () => {
      ['a','Z','0','+','-','.'].forEach(string => {
        expect(p.parse(s.scheme, p.stream(string))).to.have.property('value', string)
        expect(p.parse(s.scheme, p.stream(string)).value)
          .to.equal(p.parse(p.letter,    p.stream(string)).value ||
                    p.parse(p.digit,     p.stream(string)).value ||
                    p.parse(p.char('+'), p.stream(string)).value ||
                    p.parse(p.char('-'), p.stream(string)).value ||
                    p.parse(p.char('.'), p.stream(string)).value)
      })
      expect(p.parse(s.seqEOF(s.scheme), p.stream('aZ0+-.'))).to.have.property('value', 'aZ0+-.')
    })

    it('should fail to parse text', () => {
      ['{','?'].forEach(string => expect(p.parse(s.scheme, p.stream(string))).to.be.instanceof(Error))
      expect(p.parse(s.scheme, p.stream(''))).to.be.instanceof(Error)
    })
  })

  describe('pchar', () => {
    it('should parse text', () => {
      ['a','Z','0','+','*',':','@','&','='].forEach(string => {
        expect(p.parse(s.pchar, p.stream(string))).to.have.property('value', string)
        expect(p.parse(s.pchar, p.stream(string)).value)
          .to.equal(p.parse(s.uchar,     p.stream(string)).value ||
                    p.parse(p.char(':'), p.stream(string)).value ||
                    p.parse(p.char('@'), p.stream(string)).value ||
                    p.parse(p.char('&'), p.stream(string)).value ||
                    p.parse(p.char('='), p.stream(string)).value)
      })
    })

    it('should fail to parse text', () => {
      ['{','?'].forEach(string => expect(p.parse(s.pchar, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('uchar', () => {
    it('should parse text', () => {
      ['a','Z','0','+','*'].forEach(string => {
        expect(p.parse(s.uchar, p.stream(string))).to.have.property('value', string)
        expect(p.parse(s.uchar, p.stream(string)).value)
          .to.equal(p.parse(s.unreserved, p.stream(string)).value ||
                    p.parse(s.escape,     p.stream(string)).value)
      })
    })

    it('should fail to parse text', () => {
      ['@','?'].forEach(string => expect(p.parse(s.uchar, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('unreserved', () => {
    it('should parse text', () => {
      ['a','Z','0','+','*'].forEach(string => {
        expect(p.parse(s.unreserved, p.stream(string))).to.have.property('value', string)
        expect(p.parse(s.unreserved, p.stream(string)).value)
          .to.equal(p.parse(p.letter, p.stream(string)).value ||
                    p.parse(p.digit,  p.stream(string)).value ||
                    p.parse(s.safe,   p.stream(string)).value ||
                    p.parse(s.extra,  p.stream(string)).value)
      })
    })

    it('should fail to parse text', () => {
      ['@','?'].forEach(string => expect(p.parse(s.unreserved, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('escape', () => {
    it('should parse text', () => {
      ['%0F','%AF'].forEach(string => expect(p.parse(s.escape, p.stream(string))).to.have.property('value', string))
    })

    it('should fail to parse text', () => {
      ['%','%A','AF','%AG'].forEach(string => expect(p.parse(s.escape, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('hex', () => {
    it('should parse text', () => {
      '0123456789abcdefABCDEF'.split('').forEach(string => expect(p.parse(s.hex, p.stream(string))).to.have.property('value', string))
    })

    it('should fail to parse text', () => {
      ['g','G','x'].forEach(string => expect(p.parse(s.hex, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('safe', () => {
    it('should parse text', () => {
      '$-_.+'.split('').forEach(string => expect(p.parse(s.safe, p.stream(string))).to.have.property('value', string))
    })

    it('should fail to parse text', () => {
      ['@','a','Z'].forEach(string => expect(p.parse(s.safe, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('extra', () => {
    it('should parse text', () => {
      "!*'(),".split('').forEach(string => expect(p.parse(s.extra, p.stream(string))).to.have.property('value', string))
    })

    it('should fail to parse text', () => {
      ['@','a','Z'].forEach(string => expect(p.parse(s.extra, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('national', () => {
    it('should parse text', () => {
      '{}|\\^~[]`'.split('').forEach(string => expect(p.parse(s.national, p.stream(string))).to.have.property('value', string))
    })

    it('should fail to parse text', () => {
      ['@','a','Z'].forEach(string => expect(p.parse(s.national, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('reserved', () => {
    it('should parse text', () => {
      ';/?:@&='.split('').forEach(string => expect(p.parse(s.reserved, p.stream(string))).to.have.property('value', string))
    })

    it('should fail to parse text', () => {
      ['!','a','Z'].forEach(string => expect(p.parse(s.reserved, p.stream(string))).to.be.instanceof(Error))
    })
  })

  describe('punctuation', () => {
    it('should parse text', () => {
      '<>#%"'.split('').forEach(string => expect(p.parse(s.punctuation, p.stream(string))).to.have.property('value', string))
    })

    it('should fail to parse text', () => {
      ['@','a','Z'].forEach(string => expect(p.parse(s.punctuation, p.stream(string))).to.be.instanceof(Error))
    })
  })
})
