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
                    const val1 = (yield p.char('%')).value
                        , val2 = (yield hex).value
                        , val3 = (yield hex).value
                    return `${val1}${val2}${val3}`
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
               const val1 = (yield param).value
               const val2 = (yield p.many(p.seq(function*() {
                 const val2a = (yield p.char(';')).value
                     , val2b = (yield param).value
                 return `${val2a}${val2b}`
               }))).value
               return `${val1}${val2}`
             })

let segment  = p.many(pchar)
  , fsegment = p.many1(pchar)
  , path     = p.seq(function*() {
                 const val1 = (yield fsegment).value
                 const val2 = (yield p.many(p.seq(function*() {
                   const val2a = (yield p.char('/')).value
                       , val2b = (yield segment).value
                   return `${val2a}${val2b}`
                 }))).value
                 return `${val1}${val2}`
               })

let rel_path = p.seq(function*() {
                 const val1 = (yield p.maybe(path)).value
                 const val2 = (yield p.maybe(p.seq(function*() {
                   const val2a = (yield p.char(';')).value
                       , val2b = (yield params).value
                   return `${val2a}${val2b}`
                 }))).value
                 const val3 = (yield p.maybe(p.seq(function*() {
                   const val3a = (yield p.char('?')).value 
                       , val3b = (yield query).value
                   return `${val3a}${val3b}`
                 }))).value
                 return `${val1}${val2}${val3}`
               })
let abs_path = p.seq(function*() {
                 const val1 = (yield p.char('/')).value
                     , val2 = (yield rel_path).value
                 return `${val1}${val2}`
               })
let net_path = p.seq(function*() {
                 const val1 = (yield p.string('//')).value
                     , val2 = (yield net_loc).value
                     , val3 = (yield p.maybe(abs_path)).value
                 return `${val1}${val2}${val3}`
               })

let relativeURL = p.either([net_path, abs_path, rel_path])

let genericRL = p.seq(function*() {
                  const val1 = (yield scheme).value
                      , val2 = (yield p.char(':')).value
                      , val3 = (yield relativeURL).value
                  return `${val1}${val2}${val3}`
                })

let absoluteURL = p.either([genericRL, p.seq(function*() {
                    const val1 = (yield scheme).value
                        , val2 = (yield p.char(':')).value
                        , val3 = (yield p.many(p.either([uchar, reserved]))).value
                    return `${val1}${val2}${val3}`
                  })])

let URL = p.seq(function*() {
            const val1 = (yield p.either([absoluteURL, relativeURL])).value
            const val2 = (yield p.maybe(p.seq(function*() {
              const val2a = (yield p.char('#')).value
                  , val2b = (yield fragment).value
              return `${val2a}${val2b}`
            }))).value
            return `${val1}${val2}`
          })


let seqEOF = function(parser) {
  return p.seq(function*() {
    const value = (yield parser).value
    yield p.eof
    return value
  })
}

let parse = string => p.parse(seqEOF(URL), p.stream(string)).value || false


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
