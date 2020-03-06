'use strict'

const papaparse = require('papaparse')

/**
 * Utilities.
 */
class util {
  /**
   * Unilaterally fail (used to mark unimplemented functions).
   * @param {string} message What to report.
   */
  static fail (message) {
    throw new Error(message)
  }

  /**
   * Raise exception if a condition doesn't hold.
   * @param {Boolean} condition Condition that must be true.
   * @param {string} message What to say if it isn't.
   */
  static check (condition, message) {
    if (!condition) {
      util.fail(message)
    }
  }

  /**
   * Check that a value is numeric.
   * @param {whatever} value What to check.
   */
  static checkNumber (value) {
    util.check((value === util.MISSING) ||
               (typeof value === 'number'),
               `Value ${value} is not missing or a number`)
    return value
  }

  /**
   * Check that the types of two values are the same.
   * @param {whatever} left One of the values.
   * @param {whatever} right The other value.
   */
  static checkTypeEqual (left, right) {
    util.check((left === util.MISSING) ||
               (right === util.MISSING) ||
               (typeof left === typeof right),
               `Values ${left} and ${right} have different types`)
  }

  /**
   * Convert CSV-formatted text to array of objects with uniform keys.
   * @param {string} text Text to parse.
   * @returns Array of objects.
   */
  static csvToTable (text) {
    const seen = new Map() // used across all calls to transformHeader
    const transformHeader = (name) => {
      // Simple character fixes.
      name = name
        .trim()
        .replace(/ /g, '_')
        .replace(/[^A-Za-z0-9_]/g, '')

      // Ensure header is not empty after character fixes.
      if (name.length === 0) {
        name = 'EMPTY'
      }

      // Name must start with underscore or letter.
      if (!name.match(/^[_A-Za-z]/)) {
        name = `_${name}`
      }

      // Name must be unique.
      if (seen.has(name)) {
        const serial = seen.get(name) + 1
        seen.set(name, serial)
        name = `${name}_${serial}`
      }
      else {
        seen.set(name, 0)
      }

      return name
    }

    const result = papaparse.parse(text.trim(), {
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: transformHeader,
      transform: function (value) {
        return (value === 'NA' | value === null) ? util.MISSING : value
      }
    })

    return result.data
  }
}

/**
 * Value to indicate missing data.
 */
util.MISSING = null

module.exports = util
