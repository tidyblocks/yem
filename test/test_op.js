'use strict'

const assert = require('assert')

const util = require('../libs/util')
const {
  Op,
  Typecheck,
  Convert,
  Datetime
} = require('../libs/op')

const fixture = require('./fixture')

const MISSING = util.MISSING
const getLeft = (row, i) => Op.get(row, i, 'left')
const getRight = (row, i) => Op.get(row, i, 'right')
const getNum = (row, i) => Op.get(row, i, 'num')
const getStr = (row, i) => Op.get(row, i, 'str')
const getDate = (row, i) => Op.get(row, i, 'date')
const getBool = (row, i) => Op.get(row, i, 'bool')

const threeDates = [
  {date: new Date(1)},
  {date: new Date(20)},
  {date: new Date(300)}
]

describe('get values', () => {
  it('gets values from rows', (done) => {
    const expected = [2, 5, 2, MISSING, 4, MISSING]
    const actual = fixture.number.map((row, i) => Op.get(row, i, 'left'))
    assert.deepEqual(expected, actual,
                     `Got wrong value(s)`)
    done()
  })

  it('does not get values from nonexistent columns', (done) => {
    assert.throws(() => Op.get({left: 1}, 0, 'nope'),
                  Error,
                  `Should not be able to get value for missing column`)
    done()
  })
})

describe('arithmetic operations', () => {
  it('adds', (done) => {
    const expected = [4, 7, 2, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.add(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for add`)
    done()
  })

  it('divides', (done) => {
    const expected = [1.0, 2.5, MISSING, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.divide(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for divide`)
    done()
  })

  it('exponentiates', (done) => {
    const expected = [4, 25, 1, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.power(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for power`)
    done()
  })

  it('multiplies', (done) => {
    const expected = [4, 10, 0, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.multiply(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for multiply`)
    done()
  })

  it('negates', (done) => {
    const expected = [-2, -2, 0, -3, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.negate(row, i, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for negate`)
    done()
  })

  it('remainders', (done) => {
    const expected = [0, 1, MISSING, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.remainder(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for power`)
    done()
  })

  it('subtracts', (done) => {
    const expected = [0, 3, 2, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.subtract(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for subtract`)
    done()
  })
})

describe('logical operations', () => {
  it('ands', (done) => {
    const expected = [true, false, false, false, MISSING, false, MISSING]
    const actual = fixture.bool.map((row, i) => Op.and(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for and`)
    done()
  })

  it('nots', (done) => {
    const expected = [false, false, true, true, MISSING, true, MISSING]
    const actual = fixture.bool.map((row, i) => Op.not(row, i, getLeft))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for not`)
    done()
  })

  it('ors', (done) => {
    const expected = [true, true, true, false, false, MISSING, MISSING]
    const actual = fixture.bool.map((row, i) => Op.or(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for or`)
    done()
  })
})

describe('comparison on numbers', () => {
  it('greater numbers', (done) => {
    const expected = [false, true, true, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.greater(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for greater numbers`)
    done()
  })

  it('greater equals numbers', (done) => {
    const expected = [true, true, true, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.greaterEqual(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for greater equal numbers`)
    done()
  })

  it('equals numbers', (done) => {
    const expected = [true, false, false, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.equal(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for equal numbers`)
    done()
  })

  it('not equals numbers', (done) => {
    const expected = [false, true, true, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.notEqual(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for not equal numbers`)
    done()
  })

  it('less equals numbers', (done) => {
    const expected = [true, false, false, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.lessEqual(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for less equal numbers`)
    done()
  })

  it('less numbers', (done) => {
    const expected = [false, false, false, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.less(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for less numbers`)
    done()
  })
})

describe('comparison on strings', () => {
  it('greater strings', (done) => {
    const expected = [false, false, true, true, MISSING, MISSING, MISSING]
    const actual = fixture.string.map((row, i) => Op.greater(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for greater strings`)
    done()
  })

  it('greater equals strings', (done) => {
    const expected = [true, false, true, true, MISSING, MISSING, MISSING]
    const actual = fixture.string.map((row, i) => Op.greaterEqual(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for greater equal strings`)
    done()
  })

  it('equals strings', (done) => {
    const expected = [true, false, false, false, MISSING, MISSING, MISSING]
    const actual = fixture.string.map((row, i) => Op.equal(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for equal strings`)
    done()
  })

  it('not equals strings', (done) => {
    const expected = [false, true, true, true, MISSING, MISSING, MISSING]
    const actual = fixture.string.map((row, i) => Op.notEqual(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for not equal strings`)
    done()
  })

  it('less equals strings', (done) => {
    const expected = [true, true, false, false, MISSING, MISSING, MISSING]
    const actual = fixture.string.map((row, i) => Op.lessEqual(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for less equal strings`)
    done()
  })

  it('less strings', (done) => {
    const expected = [false, true, false, false, MISSING, MISSING, MISSING]
    const actual = fixture.string.map((row, i) => Op.less(row, i, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for less strings`)
    done()
  })
})

describe('comparison on dates', () => {
  it('greater dates', (done) => {
    const test = (row, i) => new Date(4000)
    const expected = [true, true, true]
    const actual = threeDates.map((row, i) => Op.greater(row, i, test, getDate))
    assert.deepEqual(expected, actual,
                     `Wrong result(s) for greater dates`)
    done()
  })

  it('greater equals dates', (done) => {
    const test = (row, i) => new Date(20)
    const expected = [true, true, false]
    const actual = threeDates.map((row, i) => Op.greaterEqual(row, i, test, getDate))
    assert.deepEqual(expected, actual,
                     `Wrong result(s) for greater equal dates`)
    done()
  })

  it('equals dates', (done) => {
    const test = (row, i) => new Date(20)
    const expected = [false, true, false]
    const actual = threeDates.map((row, i) => Op.equal(row, i, test, getDate))
    assert.deepEqual(expected, actual,
                     `Wrong result(s) for equal dates`)
    done()
  })

  it('not equals dates', (done) => {
    const test = (row, i) => new Date(20)
    const expected = [true, false, true]
    const actual = threeDates.map((row, i) => Op.notEqual(row, i, test, getDate))
    assert.deepEqual(expected, actual,
                     `Wrong result(s) for not equal dates`)
    done()
  })

  it('less equals dates', (done) => {
    const test = (row, i) => new Date(20)
    const expected = [false, true, true]
    const actual = threeDates.map((row, i) => Op.lessEqual(row, i, test, getDate))
    assert.deepEqual(expected, actual,
                     `Wrong result(s) for less equal dates`)
    done()
  })

  it('less dates', (done) => {
    const test = (row, i) => new Date(1)
    const expected = [false, true, true]
    const actual = threeDates.map((row, i) => Op.less(row, i, test, getDate))
    assert.deepEqual(expected, actual,
                     `Wrong result(s) for less dates`)
    done()
  })
})

describe('conditional', () => {
  it('pulls values conditionally', (done) => {
    const expected = [2, 5, 0, MISSING, MISSING, MISSING]
    const actual = fixture.number.map((row, i) => Op.ifElse(row, i, getRight, getLeft, getRight))
    assert.deepEqual(expected, actual,
                     `Wrong value(s) for conditional`)
    done()
  })
})

describe('type checks', () => {
  it('correctly identifies wrong types', (done) => {
    const allChecks = [
      [getBool, 'bool', Typecheck.isDatetime, 'datetime'],
      [getBool, 'bool', Typecheck.isNumber, 'num'],
      [getBool, 'bool', Typecheck.isText, 'text'],
      [getDate, 'datetime', Typecheck.isBool, 'bool'],
      [getDate, 'datetime', Typecheck.isNumber, 'num'],
      [getDate, 'datetime', Typecheck.isText, 'text'],
      [getNum, 'num', Typecheck.isBool, 'bool'],
      [getNum, 'num', Typecheck.isDatetime, 'datetime'],
      [getNum, 'num', Typecheck.isText, 'text'],
      [getStr, 'str', Typecheck.isBool, 'bool'],
      [getStr, 'str', Typecheck.isDatetime, 'datetime'],
      [getStr, 'str', Typecheck.isNumber, 'num']
    ]
    for (const [get, actual, check, tested] of allChecks) {
      assert.deepEqual(fixture.mixed.map((row, i) => check(row, i, get)),
                       [false, false],
                       `Should not pass with ${actual} versus ${tested}`)
    }
    done()
  })

  it('correctly identifies right types', (done) => {
    const allChecks = [
      [getBool, Typecheck.isBool, 'bool'],
      [getDate, Typecheck.isDatetime, 'datetime'],
      [getNum, Typecheck.isNumber, 'num'],
      [getStr, Typecheck.isText, 'text']
    ]
    for (const [get, check, name] of allChecks) {
      assert.deepEqual(fixture.mixed.map((row, i) => check(row, i, get)),
                       [true, false],
                       `Incorrect result(s) for ${name}`)
    }
    done()
  })

  it('correctly identifies missing values', (done) => {
    const allChecks = [
      [getBool, 'bool'],
      [getDate, 'datetime'],
      [getNum, 'num'],
      [getStr, 'text']
    ]
    const check = Typecheck.isMissing
    for (const [get, name] of allChecks) {
      assert.deepEqual(fixture.mixed.map((row, i) => check(row, i, get)),
                       [false, true],
                       `Incorrect result(s) for ${name}`)
    }
    done()
  })
})

describe('type conversions', () => {
  it('converts basic types correctly', (done) => {
    const checks = [
      ['bool', Convert.toBool, MISSING, MISSING],
      ['bool', Convert.toBool, false, false],
      ['bool', Convert.toBool, true, true],
      ['bool', Convert.toBool, '', false],
      ['bool', Convert.toBool, 'abc', true],
      ['bool', Convert.toBool, 0, false],
      ['bool', Convert.toBool, -3, true],
      ['bool', Convert.toBool, 9.5, true],
      ['number', Convert.toNumber, MISSING, MISSING],
      ['number', Convert.toNumber, false, 0],
      ['number', Convert.toNumber, true, 1],
      ['number', Convert.toNumber, '123.4', 123.4],
      ['number', Convert.toNumber, 'abc', MISSING],
      ['number', Convert.toNumber, new Date(0), 0],
      ['string', Convert.toText, MISSING, MISSING],
      ['string', Convert.toText, false, 'false'],
      ['string', Convert.toText, true, 'true'],
      ['string', Convert.toText, -123, '-123'],
      ['string', Convert.toText, 'abc', 'abc'],
      ['string', Convert.toText, new Date(0), 'Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)']
    ]
    for (const [name, convert, input, expected] of checks) {
      const val = (row, i) => input
      const actual = convert({}, 0, val)
      assert.equal(actual, expected,
                   `Wrong result for ${name}: ${input} => ${actual}`)
    }
    done()
  })

  it('converts non-datetimes correctly', (done) => {
    const checks = [
      ['datetime', Convert.toDatetime, MISSING, MISSING],
      ['datetime', Convert.toDatetime, '', MISSING],
      ['datetime', Convert.toDatetime, 'abc', MISSING]
    ]
    for (const [name, convert, input, expected] of checks) {
      const val = (row, i) => input
      const actual = convert({}, 0, val)
      assert.equal(actual, expected,
                   `Wrong result for ${name}: ${input} => ${actual}`)
    }
    done()
  })

  it('converts valid datetimes correctly', (done) => {
    const checks = [
      ['datetime', Convert.toDatetime, '1983-12-02', new Date('1983-12-02')],
      ['datetime', Convert.toDatetime, 123, new Date(123)],
      ['datetime', Convert.toDatetime, new Date(456), new Date(456)]
    ]
    for (const [name, convert, input, expected] of checks) {
      const val = (row, i) => input
      const actual = convert({}, 0, val)
      assert(actual instanceof Date,
             `Wrong result type for ${name}: ${input} => ${actual}`)
      assert.equal(actual.getTime(), expected.getTime(),
                   `Wrong result for ${name}: ${input} => ${actual}`)
    }
    done()
  })
})

describe('extract values from datetimes', () => {
  it('extracts components of datetimes', (done) => {
    // Zero-based month in constructor *sigh*.
    const getValue = (row, i) => new Date(1983, 11, 2, 7, 55, 19, 0)
    assert.equal(Datetime.year({}, 0, getValue), 1983,
                 `Wrong year`)
    assert.equal(Datetime.month({}, 0, getValue), 12,
                 `Wrong month`)
    assert.equal(Datetime.day({}, 0, getValue), 2,
                 `Wrong day`)
    assert.equal(Datetime.weekday({}, 0, getValue), 5,
                 `Wrong weekday`)
    assert.equal(Datetime.hours({}, 0, getValue), 7,
                 `Wrong hours`)
    assert.equal(Datetime.minutes({}, 0, getValue), 55,
                 `Wrong minutes`)
    assert.equal(Datetime.seconds({}, 0, getValue), 19,
                 `Wrong seconds`)
    done()
  })

  it('manages missing values when extracting from datetimes', (done) => {
    const getValue = (row, i) => MISSING
    assert.equal(Datetime.year({}, 0, getValue), MISSING,
                 `Wrong result for year`)
    assert.equal(Datetime.month({}, 0, getValue), MISSING,
                 `Wrong result for month`)
    assert.equal(Datetime.day({}, 0, getValue), MISSING,
                 `Wrong result for day`)
    assert.equal(Datetime.weekday({}, 0, getValue), MISSING,
                 `Wrong result for weekday`)
    assert.equal(Datetime.hours({}, 0, getValue), MISSING,
                 `Wrong result for hours`)
    assert.equal(Datetime.minutes({}, 0, getValue), MISSING,
                 `Wrong result for minutes`)
    assert.equal(Datetime.seconds({}, 0, getValue), MISSING,
                 `Wrong result for seconds`)
    done()
  })
})
