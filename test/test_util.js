'use strict'

const assert = require('assert')

const util = require('../libs/util')

describe('test basic functionality', () => {
  it('can run a single test', (done) => {
    assert(true)
    done()
  })

  it('throws errors when it is supposed to', (done) => {
    const msg = 'test message'
    try {
      util.check(false, msg)
    }
    catch(err) {
      assert(err.message.includes(msg),
             `Error does not include "${msg}"`)
    }
    done()
  })

  it('checks that only numbers and MISSING are numbers', (done) => {
    util.checkNumber(123)
    util.checkNumber(util.MISSING)
    assert.throws(() => util.checkNumber('abc'),
                  Error,
                  `Expected an Error for string`)
    assert.throws(() => util.checkNumber([]),
                  Error,
                  `Expected an Error for empty list`)
    done()
  })

  it('checks that types are MISSING or equal', (done) => {
    const firstDate = new Date('1983-12-02')
    util.checkTypeEqual(1, 2)
    util.checkTypeEqual('a', 'b')
    util.checkTypeEqual(util.MISSING, util.MISSING)
    util.checkTypeEqual(firstDate, new Date())
    util.checkTypeEqual(util.MISSING, 'a')
    util.checkTypeEqual(1, util.MISSING)
    util.checkTypeEqual(firstDate, util.MISSING)
    assert.throws(() => util.checkTypeEqual(1, 'a'),
                  Error,
                  `Expected an Error for number and string`)
    assert.throws(() => util.checkTypeEqual(firstDate, 'a'),
                  Error,
                  `Expected an Error for date and string`)
    assert.throws(() => util.checkTypeEqual(firstDate, 1),
                  Error,
                  `Expected an Error for date and number`)
    assert.throws(() => util.checkTypeEqual(1, {}),
                  Error,
                  `Expected an Error for number and object`)
    assert.throws(() => util.checkTypeEqual('a', {}),
                  Error,
                  `Expected an Error for string and object`)
    done()
  })
})
