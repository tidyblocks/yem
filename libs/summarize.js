'use strict'

const util = require('./util')

/**
 * Summarization functions.
 */
class Summarize {
  /**
   * Count number of values.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Number of values.
   */
  static count (rows, col) {
    return rows.length
  }

  /**
   * Find maximum value.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Maximum value.
   */
  static maximum (rows, col) {
    if (rows.length === 0) return util.MISSING
    return rows.reduce((soFar, row) => (row[col] > soFar) ? row[col] : soFar,
                       rows[0][col])
  }

  /**
   * Find mean value.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Mean value.
   */
  static mean (rows, col) {
    if (rows.length === 0) return util.MISSING
    return rows.reduce((total, row) => total + row[col], 0) / rows.length
  }

  /**
   * Find median value.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Median value.
   */
  static median (rows, col) {
    if (rows.length === 0) return util.MISSING
    const temp = [...rows]
    temp.sort((left, right) => {
      if (left[col] < right[col]) {
        return -1
      }
      else if (left[col] > right[col]) {
        return 1
      }
      return 0
    })
    return temp[Math.floor(rows.length / 2)][col]
  }

  /**
   * Find minimum value.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Minimum value.
   */
  static minimum (rows, col) {
    if (rows.length === 0) return util.MISSING
    return rows.reduce((soFar, row) => (row[col] < soFar) ? row[col] : soFar,
                       rows[0][col])
  }

  /**
   * Find standard deviation.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Standard deviation.
   */
  static stdDev (rows, col) {
    if (rows.length === 0) return util.MISSING
    const values = rows.map(row => row[col])
    return Math.sqrt(_variance(values))
  }

  /**
   * Find sum.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Total.
   */
  static sum (rows, col) {
    if (rows.length === 0) return util.MISSING
    return rows.reduce((total, row) => total + row[col], 0)
  }

  /**
   * Find variance.
   * @param {Array} rows The rows containing values.
   * @param {string} col The column of interest.
   * @return {number} Variance.
   */
  static variance (rows, col) {
    if (rows.length === 0) return util.MISSING
    const values = rows.map(row => row[col])
    return _variance(values)
  }
}

/**
 * Attribute that records column name suffix.
 */
Summarize.SUFFIX = 'summarize'

//
// Provide column naming suffixes for all functions.
//
Summarize.count[Summarize.SUFFIX] = 'count'
Summarize.maximum[Summarize.SUFFIX] = 'maximum'
Summarize.mean[Summarize.SUFFIX] = 'mean'
Summarize.median[Summarize.SUFFIX] = 'median'
Summarize.minimum[Summarize.SUFFIX] = 'minimum'
Summarize.stdDev[Summarize.SUFFIX] = 'stdDev'
Summarize.sum[Summarize.SUFFIX] = 'sum'
Summarize.variance[Summarize.SUFFIX] = 'variance'

//
// Calculate variance using the simple formula.
//
const _variance = (values) => {
  const mean = values.reduce((total, val) => total + val, 0) / values.length
  const diffSq = values.map(val => (val - mean) ** 2)
  const result = diffSq.reduce((total, val) => total + val, 0) / diffSq.length
  return result
}

module.exports = Summarize
