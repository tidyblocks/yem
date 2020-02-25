'use strict'

const fs = require('fs')

const util = require('../libs/util')
const DataFrame = require('../libs/dataframe')
const Persist = require('../libs/persist')

const LOCAL_DATA_DIR = 'data'

/**
 * Testing UI class.
 */
class TestUI {
  /**
   * Build the testing UI singleton.
   */
  constructor () {
    this.reset()
  }

  /**
   * Reset internal state.
   */
  reset () {
    this.displayPlot(null)
    this.displayStatistics(null, null)
    this.displayLog(null)
    this.displayError(null)
    this.results = new Map()
  }

  /**
   * Display a plot.
   * @param {Object} spec Vega-Lite plot spec.
   */
  displayPlot (spec) {
    this.plot = spec
  }

  /**
   * Display statistics.
   * @param {Object} results Results of statistical test.
   * @param {Object} legend Explanatory legend.
   */
  displayStatistics (results, legend) {
    this.statistics = {results, legend}
  }

  /**
   * Display a log message.
   * @param {string} message To display.
   */
  displayLog (message) {
    this.log = message
  }

  /**
   * Display an error message.
   * @param {string} message To display.
   */
  displayError (message) {
    this.error = message
  }

  /**
   * Get a named dataset.
   * @param {string} path Path to file below local 'data' directory.
   * @returns Tabular data to be turned into dataframe.
   */
  getData (path) {
    util.check(path, `Cannot read from empty path`)
    path = `${process.cwd()}/${LOCAL_DATA_DIR}/${path}`
    const text = fs.readFileSync(path, 'utf-8')
    return util.csvToTable(text)
  }

  /**
   * Store a result.
   * @param {string} name Name to store dataframe as.
   * @param {DataFrame} df Dataframe to store.
   */
  setResult (name, df) {
    util.check(name && (typeof name === 'string'),
               `Result name must be non-empty string`)
    util.check(df instanceof DataFrame,
               `Result data must be dataframe`)
    this.results.set(name, df)
  }
}

/**
 * Testing UI singleton.
 */
TestUI.instance = new TestUI()

module.exports = TestUI
