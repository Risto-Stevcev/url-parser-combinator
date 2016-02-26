# url-parser-combinator

[![Build Status](https://travis-ci.org/Risto-Stevcev/url-parser-combinator.svg)](https://travis-ci.org/Risto-Stevcev/url-parser-combinator)

A proper url parser and combinator that works with [eulalie](https://github.com/bodil/eulalie).


## Usage

```javascript
const parse = require('url-parser-combinator').parse

var goodUrl = parse('http://localhost:80/foo/bar?key1=value1&key2=value2')
// 'http://localhost:80/foo/bar?key1=value1&key2=value2'

var badUrl = parse('//foo//bar')
// false
```

## Implementation

The parser is an implementation of the BNF form for URLs based on the [RFC 1808 spec](http://www.ietf.org/rfc/rfc1808.txt).

All of the BNF rules in the RFC spec are provided to you as combinators, which means that you can use this library to get partial aspects of a url, such as `relativeURL`, `params`, or `query`, or create your own custom combinator from the components. For example, the library accepts relative and absolute urls, but you can use the provided `absoluteURL` combinator to make a parser that consumes only absolute urls.

You can also use the `URL` combinator as part of another parser. For example, in the eulalie readme there is simple parser for an HTTP request. You could use this combinator in conjunction with this example to make the parser validate that the `path` is a proper url rather than just an arbitrary string:

```javascript
const URL = require('url-parser-combinator').URL

const parser = p.seq(function*() {
  const {value: method} = yield p.many1(p.upper);
  yield p.spaces1;
  const {value: path} = yield URL;  // *Parse a URL*
  yield p.spaces1;
  yield p.string("HTTP/");
  const {value: version} = yield p.seq(function*() {
    const {value: left} = yield p.many1(p.digit);
    yield p.char(".");
    const {value: right} = yield p.many1(p.digit);
    return `${left}.${right}`;
  });
  return {method, path, version};
});
```

## License
Licensed under the MIT license.
