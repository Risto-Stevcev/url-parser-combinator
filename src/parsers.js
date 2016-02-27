'use strict'
require('babel-polyfill')
const p = require('eulalie')

/* http://www.ietf.org/rfc/rfc1808.txt
 URL         = ( absoluteURL | relativeURL ) [ "#" fragment ]

 absoluteURL = generic-RL | ( scheme ":" *( uchar | reserved ) )

 generic-RL  = scheme ":" relativeURL

 relativeURL = net_path | abs_path | rel_path

 net_path    = "//" net_loc [ abs_path ]
 abs_path    = "/"  rel_path
 rel_path    = [ path ] [ ";" params ] [ "?" query ]

 path        = fsegment *( "/" segment )
 fsegment    = 1*pchar
 segment     =  *pchar

 params      = param *( ";" param )
 param       = *( pchar | "/" )

 scheme      = 1*( alpha | digit | "+" | "-" | "." )
 net_loc     =  *( pchar | ";" | "?" )
 query       =  *( uchar | reserved )
 fragment    =  *( uchar | reserved )

 pchar       = uchar | ":" | "@" | "&" | "="
 uchar       = unreserved | escape
 unreserved  = alpha | digit | safe | extra

 escape      = "%" hex hex
 hex         = digit | "A" | "B" | "C" | "D" | "E" | "F" |
                       "a" | "b" | "c" | "d" | "e" | "f"

 alpha       = lowalpha | hialpha
 lowalpha    = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" |
               "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" |
               "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
 hialpha     = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" |
               "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" |
               "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"

 digit       = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" |
               "8" | "9"

 safe        = "$" | "-" | "_" | "." | "+"
 extra       = "!" | "*" | "'" | "(" | ")" | ","
 national    = "{" | "}" | "|" | "\" | "^" | "~" | "[" | "]" | "`"
 reserved    = ";" | "/" | "?" | ":" | "@" | "&" | "="
 punctuation = "<" | ">" | "#" | "%" | <">
*/

let isHex         = c => /^[0-9a-fA-F]?$/.test(c)
  , isSafe        = c => /^[$\-_\.+]?$/.test(c)
  , isExtra       = c => /^[!*'(),]?$/.test(c) 
  , isNational    = c => /^[{}\|\\^~\[\]`]?$/.test(c)
  , isReserved    = c => /^[;/?:@&=]?$/.test(c)
  , isPunctuation = c => /^[<>#%"]?$/.test(c)

let safe        = p.sat(isSafe)
  , extra       = p.sat(isExtra)
  , national    = p.sat(isNational)
  , reserved    = p.sat(isReserved)
  , punctuation = p.sat(isPunctuation)

let hex         = p.sat(isHex)
  , escape      = p.seq(function*() {
                    return (yield p.char('%')).value
                         + (yield hex).value
                         + (yield hex).value
                  })

let unreserved  = p.either([p.letter, p.digit, safe, extra])
  , uchar       = p.either([unreserved, escape])
  , pchar       = p.either([uchar, p.char(':'), p.char('@'), p.char('&'), p.char('=')])

let scheme   = p.many1(p.either([p.letter, p.digit, p.char('+'), p.char('-'), p.char('.')]))
  , net_loc  = p.many(p.either([pchar, p.char(';'), p.char('?')]))
  , query    = p.many(p.either([uchar, reserved]))
  , fragment = query

let param  = p.many(p.either([pchar, p.char('/')]))
  , params = p.seq(function*() {
               return (yield param).value
                    + (yield p.many(p.seq(function*() {
                        return (yield p.char(';')).value
                             + (yield param).value
                      }))).value
             })

let segment  = p.many(pchar)
  , fsegment = p.many1(pchar)
  , path     = p.seq(function*() {
                 return (yield fsegment).value
                      + (yield p.many(p.seq(function*() {
                          return (yield p.char('/')).value
                               + (yield segment).value
                        }))).value
               })

let rel_path = p.seq(function*() {
                 return (yield p.maybe(path)).value
                      + (yield p.maybe(p.seq(function*() {
                          return (yield p.char(';')).value
                               + (yield params).value
                        }))).value
                      + (yield p.maybe(p.seq(function*() {
                          return (yield p.char('?')).value 
                               + (yield query).value
                        }))).value
               })
let abs_path = p.seq(function*() {
                 return (yield p.char('/')).value
                      + (yield rel_path).value
               })
let net_path = p.seq(function*() {
                 return (yield p.string('//')).value
                      + (yield net_loc).value
                      + (yield p.maybe(abs_path)).value
               })

let relativeURL = p.either([net_path, abs_path, rel_path])

let genericRL = p.seq(function*() {
                  return (yield scheme).value
                       + (yield p.char(':')).value
                       + (yield relativeURL).value
                })

let absoluteURL = p.either([genericRL, p.seq(function*() {
                    return (yield scheme).value
                         + (yield p.char(':')).value
                         + (yield p.many(p.either([uchar, reserved]))).value
                  })])

let URL = p.seq(function*() {
            return (yield p.either([absoluteURL, relativeURL])).value
                 + (yield p.maybe(p.seq(function*() {
                     return (yield p.char('#')).value
                          + (yield fragment).value
                   }))).value
          })


let seqEOF = function(parser) {
  return p.seq(function*() {
    const value = (yield parser).value
    yield p.eof
    return value
  })
}

let parse = string => p.parse(seqEOF(URL), p.stream(string)).value || ''


module.exports = {
  isHex:         isHex,
  isSafe:        isSafe,
  isExtra:       isExtra,
  isNational:    isNational,
  isReserved:    isReserved,
  isPunctuation: isPunctuation,

  seqEOF:      seqEOF,
  parse:       parse,

  URL:         URL,
  absoluteURL: absoluteURL,
  genericRL:   genericRL,
  relativeURL: relativeURL,

  net_path:    net_path,
  abs_path:    abs_path,
  rel_path:    rel_path,

  path:        path,
  fsegment:    fsegment,
  segment:     segment,

  params:      params,
  param:       param,

  scheme:      scheme,
  net_loc:     net_loc,
  query:       query,
  fragment:    fragment,

  pchar:       pchar,
  uchar:       uchar,
  unreserved:  unreserved,

  hex:         hex,
  escape:      escape,

  safe:        safe,
  extra:       extra,
  national:    national,
  reserved:    reserved,
  punctuation: punctuation
}
