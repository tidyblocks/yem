'use strict'

const assert = require('assert')

const util = require('../libs/util')
const DataFrame = require('../libs/dataframe')
const Statistics = require('../libs/statistics')

const MISSING = util.MISSING

const {Colors} = require('./fixture')

describe('statistical tests', () => {
  it('runs an ANOVA', (done) => {
    const {result, legend} =
          Statistics.ANOVA(new DataFrame(Colors),
                           0.05, 'green', 'blue')
    assert.equal(legend._title, 'ANOVA',
                 'Wrong title')
    assert.equal(result.rejected, false,
                 'Wrong result')
    assert((0.6 <= result.pValue) && (result.pValue <= 0.8),
           'Wrong p-value')
    done()
  })

  it('runs Kolmogorov-Smirnov', (done) => {
    const {result, legend} =
          Statistics.KolmogorovSmirnov(new DataFrame(Colors),
                                       0.01, 2.0, 0.75, 'blue')
    assert.equal(legend._title, 'Kolmogorov-Smirnov test for normality',
                 'Wrong title')
    assert.equal(result.rejected, true,
                 'Wrong result')
    assert(result.pValue < 0.05,
           'Wrong p-value')
    done()
  })

  it('runs Kruskal-Wallis', (done) => {
    const {result, legend} =
          Statistics.KruskalWallis(new DataFrame(Colors),
                                   0.05, 'green', 'blue')
    assert.equal(legend._title, 'Kruskal-Wallis test',
                 'Wrong title')
    assert.equal(result.rejected, false,
                 'Wrong result')
    assert((0.6 <= result.pValue) && (result.pValue <= 0.7),
           'Wrong p-value')
    done()
  })

  it('runs one-sided two-sample t-test', (done) => {
    const {result, legend} =
          Statistics.TTestOneSample(new DataFrame(Colors),
                                    0.0, 0.05, 'blue')
    assert.equal(legend._title, 'one-sample two-sided t-test',
                 'Wrong title')
    assert.equal(result.rejected, true,
                 'Wrong result')
    assert((0.0 <= result.pValue) && (result.pValue <= 0.1),
           'Wrong p-value')
    done()
  })

  it('runs a paired two-sided t-test with different values', (done) => {
    const {result, legend} =
          Statistics.TTestPaired(new DataFrame(Colors),
                                 0.05, 'blue', 'green')
    assert.equal(legend._title, 'paired two-sided t-test',
                 'Wrong title')
    assert.equal(result.rejected, false,
                 'Wrong result')
    assert((0.9 <= result.pValue) && (result.pValue <= 1.1),
           'Wrong p-value')
    done()
  })

  it('runs a paired two-sided t-test with matching values', (done) => {
    const {result, legend} =
          Statistics.TTestPaired(new DataFrame(Colors),
                                 0.05, 'blue', 'blue')
    assert.equal(legend._title, 'paired two-sided t-test',
                 'Wrong title')
    assert.equal(result.rejected, false,
                 'Wrong result')
    assert((0.9 <= result.pValue) && (result.pValue <= 1.1),
           'Wrong p-value')
    done()
  })

  it('runs a one-sample z-test', (done) => {
    const {result, legend} =
          Statistics.ZTestOneSample(new DataFrame(Colors),
                                    1.0, 0.5, 0.05, 'blue')
    assert.equal(legend._title, 'one-sample Z-test',
                 'Wrong title')
    assert.equal(result.rejected, true,
                 'Wrong result')
    assert((0.0 <= result.pValue) && (result.pValue <= 0.1),
           'Wrong p-value')
    done()
  })
})
