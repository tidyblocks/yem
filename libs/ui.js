/**
 * Browser-based interface.
 * FIXME: not bundled during development - depends on 'yem' containing everything from `./libs`.
 */
class BrowserUI {
  /**
   * Set up after DOM is loaded: create singleton and show default tab.
   */
  static Setup () {
    BrowserUI.instance = new BrowserUI()
    BrowserUI.instance.createWorkbench()
    document.getElementById('tabDefault').click()
    REDIPS.drag.init()
    REDIPS.drag.dropMode = 'single' // one item per cell
    REDIPS.drag.trash.question = null // don't confirm deletion
  }

  /**
   * Construct a browser-based UI singleton.
   */
  constructor () {
    this.reset()
    this.data = new Map()
    this.program = null
  }

  /**
   * Reset stored data and displays before running program.
   */
  reset () {
    this.displayPlot(null)
    this.displayStatistics(null, null)
    this.displayLog(null)
    this.displayError(null)
    this.results = new Map()
  }

  /**
   * Display selected dataset (if any).
   * @param {string} name Name of dataset or null.
   */
  displayData (name) {
      this.showTable(this.data, name, 'dataSelect', 'dataArea')
  }

  /**
   * Display selected results (if any).
   * @param {string} name Name of results or null.
   */
  displayResults (name) {
    this.showTable(this.results, name, 'resultsSelect', 'resultsArea')
  }

  /**
   * Display a plot.
   * @param {Object} spec Vega-Lite plot spec.
   */
  displayPlot (spec) {
    if (spec === null) {
      this.displayInArea('plotArea', null)
    }
    else {
      spec = Object.assign({}, spec, BrowserUI.FULL_PLOT_SIZE)
      vegaEmbed('#plotArea', spec, {})
    }
  }

  /**
   * Display statistics.
   * @param {Object} results Results of statistical test.
   * @param {Object} legend Explanatory legend.
   */
  displayStatistics (results, legend) {
    const html = (results && legend) ? this.statisticsToHTML(results, legend) : ''
    this.displayInArea('statisticsArea', html)
  }

  /**
   * Display a log message.
   * @param {string} message To display.
   */
  displayLog (message) {
    this.displayInArea('logArea', message)
  }

  /**
   * Display an error message.
   * @param {string} message To display.
   */
  displayError (message) {
    if (message) {
      console.log(message)
    }
    this.displayInArea('errorArea', message)
  }

  /**
   * Get a named dataset.
   * @param {string} name Name of previously-loaded data set.
   * @returns Tabular data to be converted to dataframe.
   */
  getData (name) {
    yem.util.check(name && (typeof name === 'string'),
                   `Require non-empty string as dataset name`)
    yem.util.check(this.data.has(name),
                   `Cannot get unknown dataset ${name}`)
    return this.data.get(name).data
  }

  /**
   * Store a result.
   * @param {string} name Name to store dataframe as.
   * @param {DataFrame} df Dataframe to store.
   */
  setResult (name, df) {
    this.results.set(name, df)
  }

  // ----------------------------------------------------------------------

  /**
   * Display a program's structure.
   * @param {Object} program Program to display.
   */
  displayProgram (program) {
    if (program) {
      program = this.programToHTML(program)
    }
    this.displayInArea('programArea', program)
  }

  /**
   * Run the current program.
   */
  runProgram () {
    yem.util.check(this.program,
                   `No program`)
    const runner = new yem.Runner(this)
    this.program.forEach(pipeline => runner.register(pipeline))
    runner.run()
  }

  /**
   * Load a program from disk.
   * @param {FileList} fileList List of files provided by browser file selection dialog.
   */
  loadProgram (fileList) {
    const file = fileList[0]
    const name = file.name
    file.text().then(text => {
      const json = JSON.parse(text)
      this.program = yem.Persist.JSONToProgram(json)
      this.displayProgram(this.program)
    })
  }

  /**
   * Load a CSV data file.
   * @param {FileList} fileList List of files provided by browser file selection dialog.
   */
  loadData (fileList) {
    const file = fileList[0]
    const name = file.name
    file.text().then(text => {
      const data = yem.util.csvToTable(text)
      const df = new yem.DataFrame(data)
      this.data.set(name, df)
      this.displayData(name)
    })
  }

  /**
   * Save a program to disk.
   * @param {event} evt Browser event (ignored).
   */
  saveProgram (evt) {
    const filename = 'program.yem' // FIXME how to trigger dialog to ask for filename?
    const text = 'saved program' // FIXME get the actual JSON
    this.saveFile(filename, text)
  }

  /**
   * Save the current data to disk.
   * @param {event} evt Browser event (ignored).
   */
  saveData (evt) {
    const filename = 'result.csv' // FIXME how to trigger dialog to ask for filename?
    const text = 'a,b,c' // FIXME get the current result
    this.saveFile(filename, text)
  }

  /**
   * Save the current plot to disk.
   * @param {event} evt Browser event (ignored).
   */
  savePlot (evt) {
    const filename = 'plot.png' // FIXME how to trigger dialog to ask for filename?
    const image = 'something' // FIXME how to get the actual plot?
    this.saveFile(filename, image)
  }

  /**
   * Show the specified tab.
   * @param {event} evt Browser event.
   * @param {string} tabName Name of the tab (must match an id in the page).
   */
  showTab (evt, tabName) {
    Array.from(document.getElementsByClassName('tabContent'))
      .forEach(tab => {tab.style.display = 'none'})
    document.getElementById(tabName).style.display = 'block'

    Array.from(document.getElementsByClassName('tabButton'))
      .forEach(button => {button.classList.remove('active')})
    evt.currentTarget.classList.add('active')

    // Ensure that multi-select tabs are showing the up-to-date list of choices.
    this.displayData(null)
    this.displayResults(null)
  }

  /**
   * Display a named data table as an HTML table.
   * @param {Map} available Available tables.
   * @param {string} name Name of dataset to select, or null to leave selection alone.
   * @param {string} selectorId HTML ID of pulldown selector.
   * @param {string} areaId HTML ID of display area.
   */
  showTable (available, name, selectorId, areaId) {
    const selector = document.getElementById(selectorId)

    // Nothing to select.
    if (available.size === 0) {
      selector.innerHTML = '<option value="">-none-</option>'
      document.getElementById(areaId).innerHTML = ''
      return
    }

    // Figure out which dataset is currently selected (if any).
    if (name === null) {
      name = selector.value
    }
    if (!available.has(name)) {
      name = null
    }
    if (name === null) {
      name = available.keys().next().value
    }

    // Show all available datasets, potentially selecting the named one.
    const makeSelected = (key) => (key === name) ? 'selected="selected"' : ''
    selector.innerHTML =
      Array.from(available.keys())
      .map(key => `<option value="${key}"${makeSelected(key)}>${key}</option>`)
      .join('')

    // Display the selected dataset (if any).
    if (name) {
      const table = this.dfToHTML(available.get(name))
      document.getElementById(areaId).innerHTML = table
    }
  }

  /**
   * Convert dataframe to HTML.
   * @param {DataFrame} df Dataframe to display.
   */
  dfToHTML (df) {
    if (!df) {
      return '-empty-'
    }
    const data = df.data
    const keys = Array.from(Object.keys(data[0]))
    const header = '<tr>' + keys.map(k => `<th>${k}</th>`).join('') + '</tr>'
    const body = data.map(row => '<tr>' + keys.map(k => `<td>${row[k]}</td>`).join('') + '</tr>').join('')
    const html = `<table class="data">${header}${body}</table>`
    return html
  }

  /**
   * Convert a program to a vertical HTML table.
   * @param {Array} program Program to convert.
   * @returns HTML string.
   */
  programToHTML (program) {
    if (!program) {
      return ''
    }
    const cells = program.map(prog => prog.map(stage => `${stage.pretty()}`))
    const longest = Math.max(cells.map(cell => cell.length))
    cells.forEach(prog => {
      while (prog.length < longest) {
        prog.push('')
      }
    })
    const transpose = cells[0].map((col, i) => cells.map(row => row[i]))
    const body = transpose.map(row =>
                               '<tr>' +
                               row.map(cell => `<td>${cell}</td>`).join('') +
                               '</tr>').join('')
    const header =
          '<tr>' +
          program.map((prog, i) => `<th>${i + 1}</th>`).join('') +
          '</tr>'
    const html = `<table class="program">${header}${body}</table>`
    return html
  }

  /**
   * Convert results of statistical test to HTML.
   */
  statisticsToHTML (results, legend) {
    yem.util.check((results !== null) && (legend !== null),
                   `Must have result and legend`)
    const title = legend._title
    const header = '<tr><th>Result</th><th>Value</th><th>Explanation</th></tr>'
    const body = Object.keys(legend).map(key => {
      if (key === '_title') {
        return ''
      }
      let value = results[key]
      if (value === undefined) {
        value = ''
      }
      else if (Array.isArray(value)) {
        value = value.map(x => x.toPrecision(BrowserUI.PRECISION)).join(',<br/>')
      }
      else if (typeof value === 'number') {
        value = value.toPrecision(BrowserUI.PRECISION)
      }
      return `<tr><td>${key}</td><td>${value}</td><td>${legend[key]}</td></tr>`
    }).join('')
    const html = `<p>${title}</p><table class="statistics">${header}${body}</table>`
    return html
  }

  /**
   * Save a file locally.
   * @param {string} filename Name of file to save to.
   * @param {whatever} content Data to save.
   */
  saveFile (filename, content) {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plaincharset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  /**
   * Display some HTML in a browser element.
   * @param {string} id ID of element to display in.
   * @param {string} html What to display.
   */
  displayInArea (id, html) {
    const div = document.getElementById(id)
    div.innerHTML = html ? html : ''
  }

  /**
   * Trigger an input element when a button is clicked.
   * @param {string} id ID of element to trigger.
   */
  triggerInput (id) {
    document.getElementById(id).click()
  }

  /**
   * Create tabular workspace.
   */
  createWorkbench () {
    const numPipes = 3

    const top = `<tr><th class="redips-mark">Tools</th>`
          + [...Array(numPipes)].map((x, i) => `<th class="redips-mark">Pipe ${i+1}</th>`).join('')
          + `</tr>`

    const emptyCells = [...Array(numPipes)].map((x, i) => `<td></td>`).join('')
    const middle = [yem.ExprBuilder, yem.PipeBuilder, yem.PlotBuilder, yem.StatsBuilder]
          .map(cls => this.createDraggables(cls))
          .flat()
          .map(cell => `<tr>${cell}${emptyCells}</tr>`)
          .join('')

    const bottom = `<tr id="bottomRow">`
          + [...Array(numPipes-1)].map(x => `<th class="redips-mark"></th>`).join('')
          + `<th class="redips-mark" onclick="BrowserUI.instance.addRow()">[+]</th>`
          + `<th class="redips-trash">Trash</th>`
          + `</tr>`

    const table = `<table>${top}${middle}${bottom}</table>`
    const container = document.getElementById('redips-drag')
    container.innerHTML = table
  }

  /**
   * Create draggable items from specs in a class.
   *@ param {class} cls The class with fields.
   * @returns HTML.
   */
  createDraggables (cls) {
    return Object.keys(cls.FIELDS).map(name => {
      const fields = cls.FIELDS[name].map(field => this.createField(field)).join('')
      const content = `<table><tr>${fields}</tr></table>`
      const div = `<div class="redips-drag redips-clone">${content}</div>`
      return `<th class="redips-mark">${div}</th>`
    })
  }

  /**
   * Create a single field of a draggable from specs in a class.
   * @param {Array} field The field to convert to an HTML cell.
   * @returns HTML.
   */
  createField (field) {
    let result = '<td>-UNKNOWN-</td>'
    if (typeof field === 'string') {
      if (field[0] !== '@') {
        result = `<td>${field}</td>`
      }
      else {
        field = field.slice(1)
        switch (field) {
        case 'bool':
          result = this.createSelect([['true', true], ['false', false]])
          break
        case 'expr':
          result = `<td width="8em"></td>`
          break
        case 'text':
          result = `<td><input type="text" size="8" /></td>`
          break
        case 'textMulti':
          result = `<td><input type="text" size="8" value=" , " /></td>`
          break
        }
      }
    }
    else if (Array.isArray(field)) {
      result = this.createSelect(field)
    }
    return result
  }

  /**
   * Create a dropdown selection element.
   * @param {Array} pairs Array of value/text pairs.
   */
  createSelect (pairs) {
    const options = pairs
          .map(([text, value]) => `<option value="${value}">${text}</option>`)
          .join('')
    return `<td><select>${options}</select></td>`
  }

  /**
   * Add row to workbench.
   */
  addRow () {
    const bottomRow = document.getElementById("bottomRow")
    const numChildren = bottomRow.getElementsByTagName('th').length
    const newRow = document.createElement('tr')
    newRow.innerHTML =
      '<th class="redips-mark">' + '<td></td>'.repeat(numChildren-1)
    bottomRow.parentNode.insertBefore(newRow, bottomRow)
  }
}

/**
 * Size of standard plotting area.
 */
BrowserUI.FULL_PLOT_SIZE = {
  width: 500,
  height: 300
}

/**
 * Precision for displaying floating-point values.
 */
BrowserUI.PRECISION = 6
