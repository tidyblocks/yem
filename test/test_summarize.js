'use strict'

const assert = require('assert')

const util = require('../libs/util')
const Summarize = require('../libs/summarize')

const twoRows = [{ones: 1, tens: 10},
                 {ones: 2, tens: 20}]
const threeRows = [{ones: 3},
                   {ones: 2},
                   {ones: 2},
                   {ones: 2},
                   {ones: 1}]

describe('count', () => {
  it('counts empty dataframes', (done) => {
    assert.equal(Summarize.count([], 'whatever'), 0,
                 `Expected zero rows`)
    done()
  })

  it('counts non-empty dataframes', (done) => {
    assert.equal(Summarize.count(twoRows, 'whatever'), 2,
                 `Expected two rows`)
    done()
  })
})

describe('maximum', () => {
  it('finds maximum of empty dataframes', (done) => {
    assert.equal(Summarize.maximum([], 'ones'), util.MISSING,
                 `Expected missing value`)
    done()
  })

  it('finds maximum of non-empty dataframes', (done) => {
    assert.equal(Summarize.maximum(twoRows, 'ones'), 2,
                 `Wrong value`)
    done()
  })
})

describe('mean', () => {
  it('finds mean of empty dataframes', (done) => {
    assert.equal(Summarize.mean([], 'ones'), util.MISSING,
                 `Expected missing value`)
    done()
  })

  it('finds mean of non-empty dataframes', (done) => {
    assert.equal(Summarize.mean(twoRows, 'ones'), 1.5,
                 `Wrong value`)
    done()
  })
})

describe('median', () => {
  it('finds median of empty dataframes', (done) => {
    assert.equal(Summarize.median([], 'ones'), util.MISSING,
                 `Expected missing value`)
    done()
  })

  it('finds median of non-empty dataframes', (done) => {
    assert.equal(Summarize.median(twoRows, 'ones'), 2,
                 `Wrong value`)
    done()
  })

  it('finds median of odd-sized dataframes', (done) => {
    assert.equal(Summarize.median(threeRows, 'ones'), 2,
                 `Wrong value`)
    done()
  })
})

describe('minimum', () => {
  it('finds minimum of empty dataframes', (done) => {
    assert.equal(Summarize.minimum([], 'ones'), util.MISSING,
                 `Expected missing value`)
    done()
  })

  it('finds minimum of non-empty dataframes', (done) => {
    assert.equal(Summarize.minimum(twoRows, 'ones'), 1,
                 `Wrong value`)
    done()
  })

  it('finds minimum of non-empty dataframes in reverse', (done) => {
    const temp = twoRows.slice().reverse()
    assert.equal(Summarize.minimum(temp, 'ones'), 1,
                 `Wrong value`)
    done()
  })
})

describe('standard deviation', () => {
  it('finds standard deviation of empty dataframes', (done) => {
    assert.equal(Summarize.stdDev([], 'ones'), util.MISSING,
                 `Expected missing value`)
    done()
  })

  it('finds standard deviation of non-empty dataframes', (done) => {
    assert.equal(Summarize.stdDev(twoRows, 'ones'), 0.5,
                 `Wrong value`)
    done()
  })
})

describe('sum', () => {
  it('finds sum of empty dataframes', (done) => {
    assert.equal(Summarize.sum([], 'ones'), util.MISSING,
                 `Expected missing value`)
    done()
  })

  it('finds sum of non-empty dataframes', (done) => {
    assert.equal(Summarize.sum(twoRows, 'ones'), 3,
                 `Wrong value`)
    done()
  })
})

describe('variance', () => {
  it('finds variance of empty dataframes', (done) => {
    assert.equal(Summarize.variance([], 'ones'), util.MISSING,
                 `Expected missing value`)
    done()
  })

  it('finds variance of non-empty dataframes', (done) => {
    assert.equal(Summarize.variance(twoRows, 'ones'), 0.25,
                 `Wrong value`)
    done()
  })
})
