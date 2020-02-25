#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')

const {
  PipeBuilder,
  PlotBuilder,
  StatsBuilder
} = require('../libs/builder')
const Persist = require('../libs/persist')

//
// All programs.
//
const Programs = {
  read_only: () => {
    return [
      [PipeBuilder.Read('colors.csv')]
    ]
  },

  read_notify: () => {
    return [
      [PipeBuilder.Read('colors.csv'),
       PipeBuilder.Notify('answer')]
    ]
  },

  read_plot: () => {
    return [
      [PipeBuilder.Read('colors.csv'),
       PlotBuilder.Scatter('red', 'green', null)]
    ]
  },

  parallel_two: () => {
    return [
      [PipeBuilder.Read('colors.csv'),
       PipeBuilder.Notify('alpha')],
      [PipeBuilder.Read('colors.csv'),
       PipeBuilder.Notify('beta')]
    ]
  },

  read_sort: () => {
    return [
      [PipeBuilder.Read('colors.csv'),
       PipeBuilder.Sort(['red'], true)]
    ]
  },

  simple_join: () => {
    return [
      [PipeBuilder.Read('colors.csv'),
       PipeBuilder.Notify('alpha')],
      [PipeBuilder.Read('colors.csv'),
       PipeBuilder.Notify('beta')],
      [PipeBuilder.Join('alpha', 'red', 'beta', 'green'),
       PipeBuilder.Notify('final')]
    ]
  },

  stats_test: () => {
    return [
      [PipeBuilder.Read('colors.csv'),
       StatsBuilder.ZTestOneSample(100, 10, 0.01, 'red')]
    ]
  }
}

//
// Regenerate all test programs.
//
const main = () => {
  assert(process.argv.length === 3,
         `Require output directory as command-line argument`)
  const outDir = process.argv[2]
  for (let stem in Programs) {
    const filename = `${outDir}/${stem}.yem`
    const program = Programs[stem]()
    const json = Persist.ProgramToJSON(program)
    fs.writeFileSync(filename, JSON.stringify(json, null, 2))
  }
}

main()
