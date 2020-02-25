'use strict'

const util = require('./util')
const DataFrame = require('./dataframe')
const {Stage} = require('./builder')

/**
 * Run pipelines.
 */
class Runner {
  /**
   * Create a pipeline runner to work within a UI.
   * @param {Object} ui A user interface.
   */
  constructor (ui) {
    util.check(ui,
               `Require a ui object`)

    this.error = []             // error messages
    this.log = []               // log messages
    this.plot = null            // result plot
    this.stats = null           // statistical reports
    this.queue = []             // pipelines ready to run
    this.waiting = new Map()    // pipelines waiting to be runnable

    this.ui = ui
    this.ui.reset()
  }

  /**
   * Record an error message.
   * @param {string} message To display.
   */
  appendError (message) {
    this.error.push(message)
    this.ui.displayError(message)
  }

  /**
   * Get error messages.
   */
  getError () {
    return this.error
  }

  /**
   * Log a pipeline stage.
   * @param {Object} event What to record for posterity.
   */
  appendLog (event) {
    this.log.push(event)
  }

  /**
   * Get the log.
   */
  getLog () {
    return this.log
  }

  /**
   * Set result.
   * @param {string} name Name of data.
   * @param {object} data Dataframe to store.
   */
  setResult (name, df) {
    util.check(name && (typeof name === 'string'),
               `Result name must be non-empty string`)
    util.check(df instanceof DataFrame,
               `Require dataframe`)
    this.ui.setResult(name, df)
  }

  /**
   * Get named result of processing.
   * @param {string} name Name of data.
   * @returns Stored result.
   */
  getResult (name) {
    util.check(this.ui.results.has(name),
               `Result "${name}" unknown`)
    return this.ui.results.get(name)
  }

  /**
   * Notify the manager that a named pipeline has finished running.
   * This enqueues pipeline functions to run if their dependencies are satisfied.
   * @param {string} name Name of the pipeline that just completed.
   * @param {Object} data The DataFrame produced by the pipeline.
   */
  notify (name, data) {
    util.check(name,
               `Cannot notify with empty name`)
    util.check(data instanceof DataFrame,
               `Data must be a dataframe`)
    this.setResult(name, data)
    const toRemove = []
    this.waiting.forEach((dependencies, pipeline) => {
      dependencies.delete(name)
      if (dependencies.size === 0) {
        this.queue.push(pipeline)
        toRemove.push(pipeline)
      }
    })
    toRemove.forEach(pipeline => this.waiting.delete(pipeline))
  }

  /**
   * Register a new pipeline function with what it depends on and what it produces.
   * @param {pipeline} pipeline Function encapsulating pipeline to run.
   */
  register (pipeline) {
    util.check(Array.isArray(pipeline) &&
               (pipeline.length > 0) &&
               pipeline.every(stage => (stage instanceof Stage)),
               `Pipelines must be non-empty arrays`)
    if (pipeline[0].requires.length === 0) {
      this.queue.push(pipeline)
    }
    else {
      this.waiting.set(pipeline, new Set(pipeline[0].requires))
    }
  }

  /**
   * Run all pipelines in an order that respects dependencies within an environment.
   * This depends on `notify` to add pipelines to the queue.
   */
  run () {
    this.ui.reset()
    try {
      while (this.queue.length > 0) {
        const pipeline = this.queue.shift()
        const {name, data} = this.execute(pipeline)
        if (name) {
          this.notify(name, data)
          this.ui.setResult(name, data)
        }
      }
    }
    catch (err) {
      this.appendError(`${err.message}: ${err.stack}`)
    }
    this.ui.displayLog(this.getLog().map(x => JSON.stringify(x)).join('\n'))
  }

  /**
   * Execute a pipeline.
   * @param {pipeline} pipeline The stages in the pipeline.
   * @returns The result of the final stage.
   */
  execute (pipeline) {
    util.check(Array.isArray(pipeline) && (pipeline.length > 0),
               `Require non-empty array of functions`)
    util.check(!pipeline[0].input,
               `First stage of pipeline cannot require input`)
    util.check(pipeline.slice(1).every(stage => stage.input),
               `All stages of pipeline after the first must take input`)
    util.check(pipeline.slice(0, -1).every(stage => stage.output),
               `All stages of pipeline except the last must produce output`)

    let data = null
    for (const stage of pipeline) {
      data = stage.run(this, data)
    }

    const last = pipeline.slice(-1)[0]
    return {name: last.produces, data: data}
  }
}

module.exports = Runner
