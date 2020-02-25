'use strict'

const assert = require('assert')
const {
  Op,
  Typecheck,
  Convert,
  Datetime
} = require('../libs/op')
const {
  ExprBuilder,
  PipeBuilder,
  PlotBuilder,
  StatsBuilder
} = require('../libs/builder')
const Runner = require('../libs/runner')
const Persist = require('../libs/persist')

const TestUI = require('./ui')

const checkOp = (fixture, expected, message) => {
  const actual = Persist.JSONToOp(fixture)
  assert.equal(actual.toString(), expected.toString(),
               message)
}

const checkStage = (fixture, expected, message) => {
  const actual = Persist.JSONToStage(fixture)
  assert.equal(actual.toString(), expected.toString(),
               `Failed to restore ${message}`)
}

describe('requires stage name and kind', () => {
  it('requires indication that JSON is a stage', (done) => {
    assert.throws(() => Persist.JSONToStage({notkind: 'nope'}),
                  Error,
                  `Should not accept missing kind`)
    done()
  })

  it('requires stage name', (done) => {
    assert.throws(() => Persist.JSONToStage({kind: 'stage', name: 'whoops'}),
                  Error,
                  `Should not accept unknown stage name`)
    done()
  })
})

describe('restore operations from JSON', () => {
  it('requires an expression kind', (done) => {
    assert.throws(() => Persist.JSONToOp({unkind: 'nope'}),
                  Error,
                  `Should not accept op without kind`)
    done()
  })
  
  it('requires a known kind of expression', (done) => {
    assert.throws(() => Persist.JSONToOp({kind: 'whoops'}),
                  Error,
                  `Should not accept unknown kind of op`)
    done()
  })

  it('requires a known operation name', (done) => {
    assert.throws(() => Persist.OpLookup('whoops'),
                  Error,
                  `Requires known operation name`)
    done()
  })
  
  it('restores a constant', (done) => {
    checkOp({'kind': 'constant', constant: 'something'},
            ExprBuilder.Constant('something'),
            `Failed to restore constant`)
    done()
  })

  it('restores a value', (done) => {
    checkOp({kind: 'value', value: 'blue'},
            ExprBuilder.Value('blue'),
            `Failed to restore value`)
    done()
  })

  it('restores unary operations', (done) => {
    const childOp = ExprBuilder.Constant(123)
    const childJson = {'kind': 'constant', 'constant': 123}
    const allChecks = [
      ['negate', Op.negate],
      ['not', Op.not]
    ]
    for (const [name, func] of allChecks) {
      checkOp({kind: 'unary', op: name, child: childJson},
              ExprBuilder.Unary(func, childOp),
              `Failed to restore unary expression ${name}`)
    }
    done()
  })

  it('restores binary operations', (done) => {
    const childOp = ExprBuilder.Constant(123)
    const childJson = {'kind': 'constant', 'constant': 123}
    const allChecks = [
      ['add', Op.add],
      ['and', Op.and],
      ['divide', Op.divide],
      ['equal', Op.equal],
      ['greater', Op.greater],
      ['greaterEqual', Op.greaterEqual],
      ['less', Op.less],
      ['lessEqual', Op.lessEqual],
      ['multiply', Op.multiply],
      ['notEqual', Op.notEqual],
      ['or', Op.or],
      ['power', Op.power],
      ['remainder', Op.remainder],
      ['subtract', Op.subtract]
    ]
    for (const [name, func] of allChecks) {
      checkOp({kind: 'binary', op: name, left: childJson, right: childJson},
              ExprBuilder.Binary(func, childOp, childOp),
              `Failed to restore binary expression ${name}`)
    }
    done()
  })

  it('restores ternary operations', (done) => {
    const childOp = ExprBuilder.Constant(123)
    const childJson = {'kind': 'constant', 'constant': 123}
    const allChecks = [
      ['ifElse', Op.ifElse]
    ]
    for (const [name, func] of allChecks) {
      checkOp({kind: 'ternary', op: name, left: childJson,
               middle: childJson, right: childJson},
              ExprBuilder.Ternary(func, childOp, childOp, childOp),
              `Failed to restore ternary expression ${name}`)
    }
    done()
  })

  it('restores type-checking operations', (done) => {
    const childOp = ExprBuilder.Constant(123)
    const childJson = {'kind': 'constant', 'constant': 123}
    const allChecks = [
      ['isBool', Typecheck.isBool],
      ['isDatetime', Typecheck.isDatetime],
      ['isMissing', Typecheck.isMissing],
      ['isNumber', Typecheck.isNumber],
      ['isText', Typecheck.isText]
    ]
    for (const [name, func] of allChecks) {
      checkOp({kind: 'unary', op: name, child: childJson},
              ExprBuilder.Unary(func, childOp),
              `Failed to restore type-checking expression ${name}`)
    }
    done()
  })

  it('restores conversion operations', (done) => {
    const childOp = ExprBuilder.Constant(123)
    const childJson = {'kind': 'constant', 'constant': 123}
    const allChecks = [
      ['toBool', Convert.toBool],
      ['toDatetime', Convert.toDatetime],
      ['toNumber', Convert.toNumber],
      ['toText', Convert.toText]
    ]
    for (const [name, func] of allChecks) {
      checkOp({kind: 'unary', op: name, child: childJson},
              ExprBuilder.Unary(func, childOp),
              `Failed to restore conversion expression ${name}`)
    }
    done()
  })

  it('restores datetime operations', (done) => {
    const concert = new Date(1983, 11, 2, 7, 55, 19, 0)
    const childOp = ExprBuilder.Constant(concert)
    const childJson = {'kind': 'constant', 'constant': concert}
    const allChecks = [
      ['year', Datetime.year],
      ['month', Datetime.month],
      ['day', Datetime.day],
      ['weekday', Datetime.weekday],
      ['hours', Datetime.hours],
      ['minutes', Datetime.minutes],
      ['seconds', Datetime.seconds]
    ]
    for (const [name, func] of allChecks) {
      checkOp({kind: 'unary', op: name, child: childJson},
              ExprBuilder.Unary(func, childOp),
              `Failed to restore datetime operation ${name}`)
    }
    done()
  })
})

describe('restore pipeline stages from JSON', () => {
  it('restores drop from JSON', (done) => {
    const columns = ['left', 'right']
    checkStage({kind: 'stage', name: 'drop', columns},
               PipeBuilder.Drop(columns),
               `drop`)
    done()
  })

  it('restores filter from JSON', (done) => {
    const childOp = ExprBuilder.Constant(true)
    const childJson = {'kind': 'constant', 'constant': true}
    checkStage({kind: 'stage', name: 'filter', op: childJson},
               PipeBuilder.Filter(childOp),
               `filter`)
    done()
  })

  it('restores groupBy from JSON', (done) => {
    const columns = ['left', 'right']
    checkStage({kind: 'stage', name: 'groupBy', columns},
               PipeBuilder.GroupBy(columns),
               `groupBy`)
    done()
  })

  it('restores join from JSON', (done) => {
    const leftName = 'before',
          leftCol = 'red',
          rightName = 'after',
          rightCol = 'blue'
    checkStage({kind: 'stage', name: 'join',
                leftName, leftCol, rightName, rightCol},
               PipeBuilder.Join(leftName, leftCol, rightName, rightCol),
               `join`)
    done()
  })

  it('restores mutate from JSON', (done) => {
    const childOp = ExprBuilder.Constant(true)
    const childJson = {'kind': 'constant', 'constant': true}
    const newName = 'finished'
    checkStage({kind: 'stage', name: 'mutate', newName, op: childJson},
               PipeBuilder.Mutate(newName, childOp),
               `mutate`)
    done()
  })

  it('restores label from JSON', (done) => {
    const label = 'signal'
    checkStage({kind: 'stage', name: 'notify', label},
               PipeBuilder.Notify(label),
               `notify`)
    done()
  })

  it('restores read from JSON', (done) => {
    const path = '/to/file'
    checkStage({kind: 'stage', name: 'read', path},
               PipeBuilder.Read(path),
               `notify`)
    done()
  })

  it('restores select from JSON', (done) => {
    const columns = ['left', 'right']
    checkStage({kind: 'stage', name: 'select', columns},
               PipeBuilder.Select(columns),
               `select`)
    done()
  })

  it('restores sort from JSON', (done) => {
    const columns = ['left', 'right']
    checkStage({kind: 'stage', name: 'sort', columns},
               PipeBuilder.Sort(columns),
               `sort`)
    done()
  })

  it('restores ungroup from JSON', (done) => {
    checkStage({kind: 'stage', name: 'ungroup'},
               PipeBuilder.Ungroup(),
               `ungroup`)
    done()
  })

  it('restores unique from JSON', (done) => {
    const columns = ['left', 'right']
    checkStage({kind: 'stage', name: 'unique', columns},
               PipeBuilder.Unique(columns),
               `unique`)
    done()
  })
})

describe('restore plotting stages from JSON', () => {
  it('restores bar from JSON', (done) => {
    const x_axis = 'age', y_axis = 'height'
    checkStage({kind: 'stage', name: 'bar', x_axis, y_axis},
               PlotBuilder.Bar(x_axis, y_axis),
               `bar`)
    done()
  })

  it('restores box from JSON', (done) => {
    const x_axis = 'age', y_axis = 'height'
    checkStage({kind: 'stage', name: 'box', x_axis, y_axis},
               PlotBuilder.Box(x_axis, y_axis),
               `box`)
    done()
  })

  it('restores dot from JSON', (done) => {
    const x_axis = 'age'
    checkStage({kind: 'stage', name: 'dot', x_axis},
               PlotBuilder.Dot(x_axis),
               `dot`)
    done()
  })

  it('restores histogram from JSON', (done) => {
    const column = 'age'
    const bins = 17
    checkStage({kind: 'stage', name: 'histogram', column, bins},
               PlotBuilder.Dot(column, bins),
               `histogram`)
    done()
  })

  it('restores scatter from JSON', (done) => {
    const x_axis = 'age', y_axis = 'height', color = 'vermilion'
    checkStage({kind: 'stage', name: 'scatter', x_axis, y_axis, color},
               PlotBuilder.Scatter(x_axis, y_axis, color),
               `scatter`)
    done()
  })
})

describe('restore statistics stages from JSON', () => {
  it('restores ANOVA from JSON', (done) => {
    const significance = 0.03, groupName = 'red', valueName = 'blue'
    checkStage({kind: 'stage', name: 'ANOVA', significance, groupName, valueName},
               StatsBuilder.ANOVA(significance, groupName, valueName),
               `ANOVA`)
    done()
  })

  it('restores Kolmogorov-Smirnov from JSON', (done) => {
    const mean = 0.1, stdDev = 0.3, significance = 0.03, colName = 'red'
    checkStage({kind: 'stage', name: 'KolmogorovSmirnov', mean, stdDev, significance, colName},
               StatsBuilder.ANOVA(mean, stdDev, significance, colName),
               `Kolmogorov-Smirnov`)
    done()
  })

  it('restores Kruskal-Wallis from JSON', (done) => {
    const significance = 0.03, groupName = 'red', valueName = 'blue'
    checkStage({kind: 'stage', name: 'KruskalWallis', significance, groupName, valueName},
               StatsBuilder.KruskalWallis(significance, groupName, valueName),
               `Kruskal-Wallis`)
    done()
  })

  it('restores one-sample t test from JSON', (done) => {
    const mean = 0.1, significance = 0.03, colName = 'red'
    checkStage({kind: 'stage', name: 'TTestOneSample', mean, significance, colName},
               StatsBuilder.TTestOneSample(mean, significance, colName),
               `one-sample t test`)
    done()
  })

  it('restores paired two-sided t test from JSON', (done) => {
    const significance = 0.03, leftCol = 'green', rightCol = 'blue'
    checkStage({kind: 'stage', name: 'TTestPaired', significance, leftCol, rightCol},
               StatsBuilder.TTestPaired(significance, leftCol, rightCol),
               `paired t test`)
    done()
  })

  it('restores one-sample z test from JSON', (done) => {
    const mean = 0.1, stdDev = 0.04, significance = 0.03, colName = 'red'
    checkStage({kind: 'stage', name: 'ZTestOneSample', mean, stdDev, significance, colName},
               StatsBuilder.ZTestOneSample(mean, stdDev, significance, colName),
               `one-sample z test`)
    done()
  })
})

describe('program and pipeline persistence', () => {
  it('turns a single pipeline into JSON', (done) => {
    const fixture = [PipeBuilder.Read('/path/to/file'),
                     PipeBuilder.Sort(['left'], true)]
    const actual = Persist.PipelineToJSON(fixture)
    const expected = [
      {kind: 'stage', name: 'read', path: '/path/to/file'},
      {kind: 'stage', name: 'sort', columns: ['left'], reverse: true}
    ]
    assert.deepEqual(actual, expected,
                     `Wrong JSON`)
    done()
  })

  it('turns JSON into a single pipeline', (done) => {
    const fixture = [
      {kind: 'stage', name: 'read', path: 'colors.csv'},
      {kind: 'stage', name: 'sort', columns: ['name'], reverse: true}
    ]
    const actual = Persist.JSONToPipeline(fixture)

    const roundTrip = Persist.PipelineToJSON(actual)
    assert.deepEqual(fixture, roundTrip,
                     `Wrong result from reading pipeline`)

    const runner = new Runner(TestUI.instance)
    runner.register(actual)
    runner.run()
    assert.deepEqual(fixture, runner.getLog(),
                     `Wrong operation(s) when executed`)
    done()
  })

  it('turns a multi-pipeline program into JSON', (done) => {
    const fixture = [
      [PipeBuilder.Read('/path/to/first')],
      [PipeBuilder.Read('/path/to/second'), PipeBuilder.Unique(['left'])],
      [PipeBuilder.Read('/path/to/third'), PipeBuilder.Notify('signal')]
    ]
    const actual = Persist.ProgramToJSON(fixture)
    const expected = [
      [{kind: 'stage', name: 'read', path: '/path/to/first'}],
      [{kind: 'stage', name: 'read', path: '/path/to/second'},
       {kind: 'stage', name: 'unique', columns: ['left']}],
      [{kind: 'stage', name: 'read', path: '/path/to/third'},
       {kind: 'stage', name: 'notify', label: 'signal'}]
    ]
    assert.deepEqual(actual, expected,
                     `Wrong result for persisting program`)
    done()
  })

  it('turns JSON into a multi-pipeline program', (done) => {
    const fixture = [
      [{kind: 'stage', name: 'read', path: 'colors.csv'}],
      [{kind: 'stage', name: 'read', path: 'colors.csv'},
       {kind: 'stage', name: 'unique', columns: ['red']}],
      [{kind: 'stage', name: 'read', path: 'colors.csv'},
       {kind: 'stage', name: 'notify', label: 'signal'}]
    ]
    const actual = Persist.JSONToProgram(fixture)

    const roundTrip = Persist.ProgramToJSON(actual)
    assert.deepEqual(fixture, roundTrip,
                     `Wrong result from reading program`)

    const runner = new Runner(TestUI.instance)
    actual.forEach(pipeline => runner.register(pipeline))
    runner.run()
    assert.deepEqual(fixture.flat(1), runner.getLog(),
                     `Wrong operation(s) when executed`)
    done()
  })
})
