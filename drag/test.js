'use strict'

const redipsInit = () => {
  REDIPS.drag.init()
  REDIPS.drag.dropMode = 'single' // one item per cell
  REDIPS.drag.trash.question = null // don't confirm deletion
}

const addRow = () => {
  const bottomRow = document.getElementById("bottomRow")
  const numChildren = bottomRow.getElementsByTagName('th').length
  const newRow = document.createElement('tr')
  newRow.innerHTML =
    '<th class="redips-mark">' + '<td></td>'.repeat(numChildren-1)
  bottomRow.parentNode.insertBefore(newRow, bottomRow)
}

window.addEventListener('load', redipsInit, false)
