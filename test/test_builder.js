'use strict'

const assert = require('assert')

const util = require('../libs/util')
const {Op} = require('../libs/op')
const DataFrame = require('../libs/dataframe')
const {
  Stage,
  ExprBuilder,
  PipeBuilder,
  PlotBuilder,
  StatsBuilder
} = require('../libs/builder')
const Runner = require('../libs/runner')

const fixture = require('./fixture')
const TestUI = require('./ui')

const MISSING = util.MISSING

describe('builds stages', () => {
  it('pretty-prints a stage', (done) => {
    const df = new DataFrame([{left: 1, right: 10},
                              {left: 2, right: 20}])
    const func = (runner, df) => df
    func.ast = {kind: 'stage', name: 'test', value: 'value'}
    const stage = new Stage(func, null, null, false, true)
    const actual = stage.pretty()
    const expected = 'test: {"value":"value"}'
    assert.equal(actual, expected,
                 `Failing to pretty-print stages`)
    done()
  })
})

describe('build expressions', () => {
  it('creates constant values', (done) => {
    const expr = ExprBuilder.Constant('text')
    const result = fixture.number.map((row, i) => expr(row, i))
    assert.equal(result.length, fixture.number.length,
                 `Wrong number of results`)
    assert(result.every(item => (item === 'text')),
           `Value(s) incorrect`)
    done()
  })

  it('creates value getters', (done) => {
    const expr = ExprBuilder.Value('right')
    const result = fixture.number.map((row, i) => expr(row, i))
    assert.deepEqual(result, [2, 2, 0, 3, MISSING, MISSING],
                     `Wrong values in result`)
    done()
  })

  it('creates unary expressions', (done) => {
    const expr = ExprBuilder.Unary(Op.negate, ExprBuilder.Constant(3))
    const result = fixture.number.map((row, i) => expr(row, i))
    assert.equal(result.length, fixture.number.length,
                 `Wrong number of results`)
    assert(result.every(item => (item === -3)),
           `Value(s) incorrect`)
    done()
  })

  it('creates binary expressions', (done) => {
    const expr = ExprBuilder.Binary(Op.add,
                                    ExprBuilder.Constant(3),
                                    ExprBuilder.Constant(5))
    const result = fixture.number.map((row, i) => expr(row, i))
    assert.equal(result.length, fixture.number.length,
                 `Wrong number of results`)
    assert(result.every(item => (item === 8)),
           `Value(s) incorrect`)
    done()
  })

  it('creates ternary expressions', (done) => {
    const expr = ExprBuilder.Ternary(Op.ifElse,
                                     ExprBuilder.Constant(true),
                                     ExprBuilder.Constant(5),
                                     ExprBuilder.Constant(2))
    const result = fixture.number.map((row, i) => expr(row, i))
    assert.equal(result.length, fixture.number.length,
                 `Wrong number of results`)
    assert(result.every(item => (item === 5)),
           `Value(s) incorrect`)
    done()
  })
  
  it('creates nested expressions', (done) => {
    const leftABC = ExprBuilder.Binary(Op.equal,
                                       ExprBuilder.Unary(Op.get, 'left'),
                                       ExprBuilder.Constant('abc'))
    const product = ExprBuilder.Binary(Op.multiply,
                                       ExprBuilder.Constant(2),
                                       ExprBuilder.Constant(4))
    const quotient = ExprBuilder.Binary(Op.divide,
                                        ExprBuilder.Constant(3),
                                        ExprBuilder.Constant(2))
    const expr = ExprBuilder.Ternary(Op.ifElse,
                                     leftABC,
                                     product,
                                     quotient)
    const result = fixture.string.map((row, i) => expr(row, i))
    assert.deepEqual(result, [1.5, 8, 1.5, 8, MISSING, 8, MISSING],
                     `Wrong values`)
    done()
  })
})

describe('build dataframe operations', () => {
  it('drops columns', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.Drop(['personal'])
    const result = stage.run(runner, new DataFrame(fixture.names))
    const expected = fixture.names.map(row => ({family: row.family}))
    assert(result.equal(new DataFrame(expected)),
           `Expected one column of data`)
    done()
  })

  it('filters rows', (done) => {
    const runner = new Runner(TestUI.instance)
    const filter = ExprBuilder.Unary(Op.get, 'right')
    const stage = PipeBuilder.Filter(filter)
    const result = stage.run(runner, new DataFrame(fixture.bool))
    const expected = fixture.bool.filter(row => (row.right === true))
    assert(expected.length < fixture.bool.length, `No filtering?`)
    assert(result.equal(new DataFrame(expected)),
           `Expected only a few rows`)
    done()
  })

  it('groups data', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.GroupBy(['left'])
    const result = stage.run(runner, new DataFrame(fixture.number))
    const groups = new Set(result.data.map(row => row[DataFrame.GROUPCOL]))
    assert.deepEqual(groups, new Set([1, 2, 3, 4]),
                     `Wrong number of groups`)
    done()
  })

  it('joins', (done) => {
    const leftData = new DataFrame([{leftName: 7, value: 'leftVal'}])
    const rightData = new DataFrame([{rightName: 7, value: 'rightVal'}])
    const runner = new Runner(TestUI.instance,
                              [['leftTable', leftData],
                               ['rightTable', rightData]])
    const stage = PipeBuilder.Join('leftTable', 'leftName', 'rightTable', 'rightName')
    TestUI.instance.setResult('leftTable', leftData)
    TestUI.instance.setResult('rightTable', rightData)
    const result = stage.run(runner, null)
    const row = {leftTable_value: 'leftVal', rightTable_value: 'rightVal'}
    row[DataFrame.JOINCOL] = 7
    assert(result.equal(new DataFrame([row])),
           `Wrong joined dataframe`)
    done()
  })

  it('mutates', (done) => {
    const runner = new Runner(TestUI.instance)
    const mutater = ExprBuilder.Constant('stuff')
    const stage = PipeBuilder.Mutate('value', mutater)
    const result = stage.run(runner, new DataFrame(fixture.names))
    assert.deepEqual(result.columns, new Set(['personal', 'family', 'value']),
                     `Wrong columns in result`)
    assert(result.data.every(row => (row.value === 'stuff')),
           `Wrong values in result`)
    done()
  })

  it('notifies', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.Notify('answer')
    const input = new DataFrame(fixture.names)
    const result = stage.run(runner, input)
    assert(result.equal(new DataFrame(fixture.names)),
           `Should not modify data`)
    assert.equal(stage.produces, 'answer',
                 `Wrong name`)
    done()
  })

  it('reads data', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.Read('names.csv')
    const result = stage.run(runner, null)
    assert(result instanceof DataFrame,
           `Expected dataframe`)
    assert(result.equal(new DataFrame(fixture.names)),
           `Expected names dataset`)
    done()
  })

  it('selects', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.Select(['personal'])
    const result = stage.run(runner, new DataFrame(fixture.names))
    const expected = fixture.names.map(row => ({personal: row.personal}))
    assert(result.equal(new DataFrame(expected)),
           `Expected one column of data`)
    done()
  })

  it('sorts', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.Sort(['left'], true)
    const result = stage.run(runner, new DataFrame(fixture.string))
    const actual = result.data.map(row => row.left)
    const expected = ['pqr', 'def', 'abc', 'abc', 'abc', MISSING, MISSING]
    assert.deepEqual(actual, expected,
                     `Wrong sorted values`)
    done()
  })

  it('ungroups', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.Ungroup()
    const input = [{a: 1}, {a: 2}]
    input.forEach(row => {row[DataFrame.GROUPCOL] = 1})
    const result = stage.run(runner, new DataFrame(input))
    assert(result.data.every(row => !(DataFrame.GROUPCOL in row)),
           `Expected grouping column to be removed`)
    done()
  })

  it('finds unique values', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PipeBuilder.Unique(['a'])
    const input = [{a: 1}, {a: 1}, {a: 2}, {a: 1}]
    const result = stage.run(runner, new DataFrame(input))
    assert(result.equal(new DataFrame([{a: 1}, {a: 2}])),
           `Wrong result`)
    done()
  })
})

describe('build plots', () => {
  it('creates a bar plot', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PlotBuilder.Bar('left', 'right')
    const result = stage.run(runner, new DataFrame(fixture.number))
    assert.equal(runner.ui.plot.mark, 'bar',
                 `Wrong type of plot`)
    assert.deepEqual(runner.ui.plot.data.values, fixture.number,
                     `Wrong data in plot`)
    assert.equal(runner.ui.plot.encoding.x.field, 'left',
                 `Wrong X axis`)
    assert.equal(runner.ui.plot.encoding.y.field, 'right',
                 `Wrong Y axis`)
    done()
  })

  it('creates a box plot', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PlotBuilder.Box('left', 'right')
    const result = stage.run(runner, new DataFrame(fixture.number))
    assert.equal(runner.ui.plot.mark.type, 'boxplot',
                 `Wrong type of plot`)
    assert.deepEqual(runner.ui.plot.data.values, fixture.number,
                     `Wrong data in plot`)
    assert.equal(runner.ui.plot.encoding.x.field, 'left',
                 `Wrong X axis`)
    assert.equal(runner.ui.plot.encoding.y.field, 'right',
                 `Wrong Y axis`)
    done()
  })

  it('creates a dot plot', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PlotBuilder.Dot('left')
    const result = stage.run(runner, new DataFrame(fixture.number))
    assert.equal(runner.ui.plot.mark.type, 'circle',
                 `Wrong type of plot`)
    assert.deepEqual(runner.ui.plot.data.values, fixture.number,
                     `Wrong data in plot`)
    assert.equal(runner.ui.plot.encoding.x.field, 'left',
                 `Wrong X axis`)
    assert.deepEqual(runner.ui.plot.transform[0].groupby, ['left'],
                     `Wrong transform`)
    done()
  })

  it('creates a histogram', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PlotBuilder.Histogram('left', 7)
    const result = stage.run(runner, new DataFrame(fixture.number))
    assert.equal(runner.ui.plot.mark, 'bar',
                 `Wrong type of plot`)
    assert.deepEqual(runner.ui.plot.data.values, fixture.number,
                     `Wrong data in plot`)
    assert.equal(runner.ui.plot.encoding.x.field, 'left',
                 `Wrong X axis`)
    assert.equal(runner.ui.plot.encoding.x.bin.maxbins, 7,
                 `Wrong number of bins`)
    done()
  })

  it('creates a scatter plot without a color', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PlotBuilder.Scatter('left', 'right', null)
    const result = stage.run(runner, new DataFrame(fixture.number))
    assert.equal(runner.ui.plot.mark, 'point',
                 `Wrong type of plot`)
    assert.deepEqual(runner.ui.plot.data.values, fixture.number,
                     `Wrong data in plot`)
    assert.equal(runner.ui.plot.encoding.x.field, 'left',
                 `Wrong X axis`)
    assert.equal(runner.ui.plot.encoding.y.field, 'right',
                 `Wrong Y axis`)
    assert(!('color' in runner.ui.plot.encoding),
           `Should not have color`)
    done()
  })

  it('creates a scatter plot with a color', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = PlotBuilder.Scatter('left', 'right', 'right')
    const result = stage.run(runner, new DataFrame(fixture.number))
    assert.equal(runner.ui.plot.mark, 'point',
                 `Wrong type of plot`)
    assert.deepEqual(runner.ui.plot.data.values, fixture.number,
                     `Wrong data in plot`)
    assert.equal(runner.ui.plot.encoding.x.field, 'left',
                 `Wrong X axis`)
    assert.equal(runner.ui.plot.encoding.y.field, 'right',
                 `Wrong Y axis`)
    assert.equal(runner.ui.plot.encoding.color.field, 'right',
                 `Wrong color`)
    done()
  })

  it('checks parameters for plots', (done) => {
    for (const [x, y] of [['left', null], [null, 'right'],
                          ['left', ''], ['', 'right'],
                          ['left', 123], [456, 'right']]) {
      assert.throws(() => PlotBuilder.Bar(x, y),
                    Error,
                    `Not catching invalid axes for bar plot`)
      assert.throws(() => PlotBuilder.Box(x, y),
                    Error,
                    `Not catching invalid axes for bar plot`)
      assert.throws(() => PlotBuilder.Scatter(x, y, null),
                    Error,
                    `Not catching invalid axes for scatter plot`)
    }
    for (const color of ['', 123]) {
      assert.throws(() => PlotBuilder.Scatter('left', 'right', color),
                    Error,
                    `Not catching invalid color "${color}" for scatter plot`)
    }

    for (const x of [null, '', 789]) {
      assert.throws(() => PlotBuilder.Dot(x),
                    Error,
                    `Not catching invalid axis for dot plot`)
    }

    for (const [col, bins] of [[null, 12], ['', 12], [999, 12],
                               ['left', null], ['left', 'right'],
                               ['left', 0], ['left', -1]]) {
      assert.throws(() => PlotBuilder.Histogram(col, bins),
                    Error,
                    `Not catching invalid parameters for histogram`)
    }
    done()
  })
})

describe('build statistics', () => {
  it('runs an ANOVA', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = StatsBuilder.ANOVA(0.05, 'green', 'blue')
    const result = stage.run(runner, new DataFrame(fixture.Colors))
    done()
  })

  it('runs Kolmogorov-Smirnov', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = StatsBuilder.KolmogorovSmirnov(0.01, 2.0, 0.75, 'blue')
    const result = stage.run(runner, new DataFrame(fixture.Colors))
    done()
  })

  it('runs Kruskal-Wallis', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = StatsBuilder.KruskalWallis(0.05, 'green', 'blue')
    const result = stage.run(runner, new DataFrame(fixture.Colors))
    done()
  })

  it('runs one-sided two-sample t-test', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = StatsBuilder.TTestOneSample(0.0, 0.05, 'blue')
    const result = stage.run(runner, new DataFrame(fixture.Colors))
    done()
  })

  it('runs a paired two-sided t-test with different values', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = StatsBuilder.TTestPaired(0.05, 'blue', 'green')
    const result = stage.run(runner, new DataFrame(fixture.Colors))
    done()
  })

  it('runs a paired two-sided t-test with matching values', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = StatsBuilder.TTestPaired(0.05, 'blue', 'blue')
    const result = stage.run(runner, new DataFrame(fixture.Colors))
    done()
  })

  it('runs a one-sample z-test', (done) => {
    const runner = new Runner(TestUI.instance)
    const stage = StatsBuilder.ZTestOneSample(1.0, 0.5, 0.05, 'blue')
    const result = stage.run(runner, new DataFrame(fixture.Colors))
    done()
  })
})
