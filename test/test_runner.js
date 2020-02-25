'use strict'

const assert = require('assert')

const util = require('../libs/util')
const {Op} = require('../libs/op')
const DataFrame = require('../libs/dataframe')
const {
  Stage,
  ExprBuilder,
  PipeBuilder,
  PlotBuilder
} = require('../libs/builder')
const Runner = require('../libs/runner')

const TestUI = require('./ui')

const Pass = (runner, df) => df

const Table = new DataFrame([{left: 1, right: 10},
                             {left: 2, right: 20}])
const Head = new Stage((runner, df) => Table,
                       null, null, false, true)
const Middle = new Stage(Pass, null, null, true, true)
const Tail = new Stage(Pass, null, null, true, false)
const TailNotify = new Stage(Pass, null, 'keyword', true, false)

describe('manage registration', () => {
  it('requires a UI', (done) => {
    assert.throws(() => new Runner(null),
                  Error,
                  `Expected an error with a null UI`)
    done()
  })

  it('cannot get nonexistent data', (done) => {
    const runner = new Runner(TestUI.instance)
    assert.throws(() => runner.getResult('something'),
                  Error,
                  `Should not be able to get nonexistent data`)
    done()
  })

  it('requires a name and some data when notifying', (done) => {
    const runner = new Runner(TestUI.instance)
    assert.throws(() => runner.notify('', new DataFrame([])),
                  Error,
                  `Should require notification name`)
    assert.throws(() => runner.notify('name', new Date()),
                  Error,
                  `Should require dataframe`)
    done()
  })

  it('can notify when nothing is waiting', (done) => {
    const runner = new Runner(TestUI.instance)
    const df = new DataFrame([])
    runner.notify('name', df)
    assert(df.equal(runner.getResult('name')),
           `Should be able to get data after notifying`)
    done()
  })

  it('requires arrays when registering a pipeline', (done) => {
    const runner = new Runner(TestUI.instance)
    assert.throws(() => runner.register('string', []),
                  Error,
                  `Expected error`)
    assert.throws(() => runner.register([], []),
                  Error,
                  `Expected error`)
    assert.throws(() => runner.register(['something'], 'string'),
                  Error,
                  `Expected error`)
    assert.throws(() => runner.register(['something'], [123]),
                  Error,
                  `Expected error`)
    done()
  })

  it('registers a pipeline that depends on nothing', (done) => {
    const runner = new Runner(TestUI.instance)
    const pipeline = [Middle]
    runner.register(pipeline)
    assert.equal(runner.queue.length, 1,
                 `Expected one item in queue`)
    assert.equal(runner.queue[0], pipeline,
                 `Expected pipeline in queue`)
    assert.equal(runner.waiting.size, 0,
                 `Expected nothing to be waiting`)
    done()
  })

  it('registers a pipeline with dependencies', (done) => {
    const runner = new Runner(TestUI.instance)
    const requires = ['first', 'second']
    const stage = new Stage(Pass, requires, null, true, true)
    const pipeline = [stage]
    runner.register(pipeline)
    assert.equal(runner.queue.length, 0,
                 `Expected nothing in run queue`)
    assert.equal(runner.waiting.size, 1,
                 `Expected one item in waiting set`)
    assert.deepEqual(runner.waiting.get(pipeline), new Set(requires),
                     `Wrong values in waiting set`)
    done()
  })

  it('makes something runnable when its single dependency resolves', (done) => {
    const runner = new Runner(TestUI.instance)
    const second = new Stage(Pass, ['first'], null, true, true)
    runner.register([second])
    assert.equal(runner.queue.length, 0,
                 `Should have nothing in run queue`)
    assert.equal(runner.waiting.size, 1,
                 `Should have one non-runnable pipeline`)
    const df = new DataFrame([])
    runner.notify('first', df)
    assert.equal(runner.waiting.size, 0,
                 `Waiting set should be empty`)
    assert.deepEqual(runner.queue, [[second]],
                     `Should have second pipeline in run queue`)
    done()
  })

  it('makes something runnable when its last dependency resolves', (done) => {
    const runner = new Runner(TestUI.instance)
    const requires = ['first', 'second', 'third']
    const last = new Stage(Pass, requires, null, true, true)
    runner.register([last])
    assert.equal(runner.waiting.size, 1,
                 `Should have one non-runnable pipeline`)
    const df = new DataFrame([])
    for (const name of ['third', 'second']) {
      runner.notify(name, df)
      assert(runner.waiting.size > 0,
             `Pipeline should still be waiting`)
      assert.equal(runner.queue.length, 0,
                   `Nothing should be runnable`)
    }
    runner.notify('first', df)
    assert.equal(runner.waiting.size, 0,
                 `Nothing should be waiting`)
    assert.deepEqual(runner.queue, [[last]],
                     `Should have pipeline in run queue`)
    done()
  })

  it('only makes some things runnable', (done) => {
    const runner = new Runner(TestUI.instance)

    const left = new Stage(Pass, ['something'], null, true, true)
    runner.register([left])
    const right = new Stage(Pass, ['else'], null, true, true)
    runner.register([right])
    assert.equal(runner.waiting.size, 2,
                 `Should have two non-runnable pipelines`)

    const df = new DataFrame([])
    runner.notify('else', df)
    assert.equal(runner.waiting.size, 1,
                 `Should still have one waiting pipeline`)
    assert.deepEqual(runner.queue, [[right]],
                     `Should have one runnable pipeline`)
    done()
  })
})

describe('executes pipelines', () => {
  it('refuses to execute an empty pipeline', (done) => {
    const runner = new Runner(TestUI.instance)
    assert.throws(() => runner.execute([]),
                  Error,
                  `Should not execute empty pipeline`)
    done()
  })

  it('refuses to execute a pipeline whose first stage requires input', (done) => {
    const runner = new Runner(TestUI.instance)
    assert.throws(() => runner.execute([Middle]),
                  Error,
                  `Should not execute pipeline requiring input`)
    done()
  })

  it('refuses to execute a pipeline whose later stages require input', (done) => {
    const runner = new Runner(TestUI.instance)
    assert.throws(() => runner.execute([Head, Middle, Head, Middle]),
                  Error,
                  `Should not execute pipeline whose middle stages require input`)
    done()
  })

  it('refuses to execute a pipeline whose early stages do not produce output', (done) => {
    const runner = new Runner(TestUI.instance)
    assert.throws(() => runner.execute([Head, Tail, Tail]),
                  Error,
                  `Should not execute pipeline whose middle stage does not produce output`)
    done()
  })

  it('executes a single-stage pipeline without a tail', (done) => {
    const runner = new Runner(TestUI.instance)
    const result = runner.execute([Head])
    assert.equal(result.name, null,
                 `Result should not be named`)
    assert(result.data.equal(Table),
           `Result should contain unmodified table`)
    done()
  })

  it('executes a two-stage pipeline without a tail', (done) => {
    const runner = new Runner(TestUI.instance)
    const result = runner.execute([Head, Middle])
    assert.equal(result.name, null,
                 `Result should not be named`)
    assert(result.data.equal(Table),
           `Result should contain unmodified table`)
    done()
  })

  it('executes a three-stage pipeline with a tail', (done) => {
    const runner = new Runner(TestUI.instance)
    const result = runner.execute([Head, Middle, Tail])
    assert.equal(result.name, null,
                 `Result should not be named`)
    assert(result.data.equal(Table),
           `Result should contain unmodified table`)
    done()
  })

  it('executes a pipeline with notification', (done) => {
    const runner = new Runner(TestUI.instance)
    const result = runner.execute([Head, TailNotify])
    assert.equal(result.name, 'keyword',
                 `Result should include name`)
    assert(result.data.equal(Table),
           `Result should contain unmodified table`)
    done()
  })
})

describe('runs all pipelines', () => {
  it('catches errors in pipelines', (done) => {
    const runner = new Runner(TestUI.instance)
    const failure = new Stage((runner, df) => util.fail('error message'),
                              null, null, false, true)
    runner.register([failure])
    runner.run()
    assert.equal(runner.getError().length, 1,
                 `No saved error message`)
    assert(runner.getError()[0].startsWith('error message'),
           `Error message incorrectly formatted`)
    assert(runner.ui.error.startsWith('error message'),
           `Wrong or missing error message in UI`)
    done()
  })

  it('runs a single pipeline with no dependencies that does not notify', (done) => {
    const runner = new Runner(TestUI.instance)
    runner.register([Head, Tail])
    runner.run()
    assert.equal(runner.ui.results.size, 0,
                 `Nothing should be registered`)
    done()
  })

  it('runs a single pipeline with no dependencies that notifies', (done) => {
    const runner = new Runner(TestUI.instance)
    runner.register([Head, TailNotify])
    runner.run()
    assert(runner.getResult('keyword').equal(Table),
           `Missing or incorrect table`)
    done()
  })

  it('runs two independent pipelines in some order', (done) => {
    const runner = new Runner(TestUI.instance)
    const tailLocal = new Stage(Pass, null, 'local', true, false)
    runner.register([Head, tailLocal])
    runner.register([Head, TailNotify])
    runner.run()
    assert(runner.getResult('keyword').equal(Table),
           `Missing or incorrect table`)
    assert(runner.getResult('local').equal(Table),
           `Missing or incorrect table`)
    done()
  })

  it('runs pipelines that depend on each other', (done) => {
    const runner = new Runner(TestUI.instance)
    const headRequire = new Stage((runner, df) => Table,
                                  ['keyword'], null, false, true)
    const tailLocal = new Stage(Pass, null, 'local', true, false)
    runner.register([Head, TailNotify])
    runner.register([headRequire, tailLocal])
    runner.run()
    assert(runner.getResult('keyword').equal(Table),
           `Missing or incorrect table`)
    assert(runner.getResult('local').equal(Table),
           `Missing or incorrect table`)
    done()
  })

  it('handles a join correctly', (done) => {
    const runner = new Runner(TestUI.instance)
    const tailAlpha = new Stage(Pass, null, 'alpha', true, false)
    const tailBeta = new Stage(Pass, null, 'beta', true, false)
    const join = PipeBuilder.Join('alpha', 'left', 'beta', 'left')
    runner.register([Head, tailAlpha])
    runner.register([Head, tailBeta])
    runner.register([join, TailNotify])

    runner.run()
    assert.equal(runner.ui.error, null,
                 `Should not have an error message`)

    const data = [{alpha_right: 10, beta_right: 10 },
                  {alpha_right: 20, beta_right: 20 }]
    data[0][DataFrame.JOINCOL] = 1
    data[1][DataFrame.JOINCOL] = 2
    const expected = new DataFrame(data)
    assert(runner.getResult('keyword').equal(expected),
           `Missing or incorrect result from join`)

    done()
  })
})
