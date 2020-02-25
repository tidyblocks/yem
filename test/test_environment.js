'use strict'

const assert = require('assert')

const util = require('../libs/util')

const TestUI = require('./ui')
const fixture = require('./fixture')

const csvTest = (fixture, expected, message) => {
  fixture = fixture.join('\n')
  const actual = util.csvToTable(fixture)
  assert.deepEqual(expected, actual, message)
}

describe('converts text to CSV', () => {
  it('returns no rows for empty text', (done) => {
    csvTest([''], [], `Expected no rows`)
    done()
  })

  it('returns no rows for all whitespace', (done) => {
    csvTest(['   ', '\t', '\n'], [], `Expected no rows`)
    done()
  })

  it('handles a header row on its own', (done) => {
    csvTest(['header'], [], `Expected just a header`)
    done()
  })

  it('handles a single row with a single column', (done) => {
    csvTest(['header', 'value'], [{header: 'value'}],
            `Expected one row`)
    done()
  })

  it('handles multiple rows with a single column', (done) => {
    csvTest(['header', '1', '2', '3'],
            [{header: 1}, {header: 2}, {header: 3}],
            `Expected three rows`)
    done()
  })

  it('handles a single row with multiple columns', (done) => {
    csvTest(['left,middle,right', '"10","20",thirty'],
            [{left: "10", middle: "20", right: "thirty"}],
            `Expected one row`)
    done()
  })

  it('handles multiple rows and columns', (done) => {
    csvTest(['left,right', '"10",20', 'thirty,40'],
            [{left: "10", right: 20},
             {left: "thirty", right: 40}],
            `Expected two rows and two columns`)
    done()
  })

  it('replaces spaces and invalid characters in headers', (done) => {
    csvTest(['  spaces\t,&abc!', 'true,false'],
            [{spaces: true, abc: false}],
            `Expected cleaned headers`)
    done()
  })

  it('fills in empty headers', (done) => {
    csvTest([',  ,', 'a, b ,c'],
            [{EMPTY: 'a', EMPTY_1: ' b ', EMPTY_2: 'c'}],
            `Expected empty header replacement and serial numbering`)
    done()
  })

  it('ensures header names start with an underscore or letter', (done) => {
    csvTest(['123,1abc', 'yes,no'],
            [{_123: 'yes', _1abc: 'no'}],
            `Expected leading underscores`)
    done()
  })

  it('ensures unique header names', (done) => {
    csvTest(['name,name,name', 'a,b,c'],
            [{name: 'a', name_1: 'b', name_2: 'c'}])
    done()
  })

  it('handles NA', (done) => {
    csvTest(['header','a','NA','b'],
            [{header: 'a'}, {header: util.MISSING}, {header: 'b'}],
            `Expected missing value for NA`)
    done()
  })
})

describe('reading data', () => {
  it('refuses to read from an empty path', (done) => {
    assert.throws(() => TestUI.instance.getData(''),
                  Error,
                  `Should not be able to read empty path`)
    done()
  })

  it('reads a local data file', (done) => {
    const result = TestUI.instance.getData('names.csv')
    assert.deepEqual(result, fixture.names,
                     `Wrong rows`)
    done()
  })
})
