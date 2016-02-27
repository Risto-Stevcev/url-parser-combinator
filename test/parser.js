'use strict'
const expect = require('chai').expect
const parse = require('../index').parse

describe('Parser', () => {
  this.urls = [ 'g:h'
              , 'http://a/b/c/g'
              , 'http://a/b/c/g/'
              , 'http://a/g'
              , 'http://g'
              , 'http://a/b/c/d;p?y'
              , 'http://a/b/c/g?y'
              , 'http://a/b/c/g?y/./x'
              , 'http://a/b/c/d;p?q#s'
              , 'http://a/b/c/g#s'
              , 'http://a/b/c/g#s/./x'
              , 'http://a/b/c/g?y#s'
              , 'http://a/b/c/d;x'
              , 'http://a/b/c/g;x'
              , 'http://a/b/c/g;x?y#s'
              , 'http://a/b/c/'
              , 'http://a/b/'
              , 'http://a/b/g'
              , 'http://a/'
              , 'http://a/g'
              , 'https://localhost:80/foo/bar#hash'
              , 'http://localhost:80/foo/bar?key1=value1&key2=value2'
              , 'file:///path/to/file.txt'
              , 'ftp:///path/to/file.txt'
              ]

  it('should parse the urls', () => {
    this.urls.forEach(url => expect(parse(url)).to.equal(url))
  })

  it('should fail to parse the url', () => {
    expect(parse('//foo//bar')).to.equal('')
  })
})
