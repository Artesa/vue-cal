let changeViewTimeoutId = null
let viewBeforeDrag = { id: null, date: null } // To go back if cancelling.
let viewChanged = false
let cancelViewChange = true

export const eventDragStart = (e, event, vuecal) => {
  const { clickHoldAnEvent, dragAnEvent } = vuecal.domEvents
  // Remove delete button if held for too long.
  setTimeout(() => {
    clickHoldAnEvent._eid = null
    clearTimeout(clickHoldAnEvent.timeoutId)
    event.deleting = false
  }, 0)

  dragAnEvent._eid = event._eid
  event.dragging = true
  viewBeforeDrag = { id: vuecal.view.id, date: vuecal.view.startDate }

  const minutes = vuecal.minutesAtCursor(e).minutes
  // When click and drag an event the cursor can be anywhere in the event,
  // when later dropping the event, we need to subtract the cursor position in the event.
  dragAnEvent.cursorGrabAt = minutes - event.startTimeMinutes
  console.log('event drag start')

  cancelViewChange = true // Reinit the cancel view: should cancel unless a cell received the event.
}

export const eventDragEnd = (e, event, vuecal) => {
  const { dragAnEvent } = vuecal.domEvents
  dragAnEvent._eid = null
  event.dragging = false
  console.log('event drag end')

  // When droping the event, cancel view change if no cell received the event (in cellDragDrop).
  if (viewChanged && cancelViewChange && viewBeforeDrag.id) vuecal.switchView(viewBeforeDrag.id, viewBeforeDrag.date, true)
}

export const cellDragOver = (e, cell, cellDate, vuecal) => {
  e.preventDefault()
  cell.highlighted = true
}

export const cellDragEnter = (e, cell, cellDate, vuecal) => {
  cell.highlighted = true
}

export const cellDragLeave = (e, cell, cellDate, vuecal) => {
  cell.highlighted = false
}

export const cellDragDrop = (e, cell, cellDate, vuecal) => {
  const { dragAnEvent } = vuecal.domEvents
  let event = vuecal.view.events.find(e => e._eid === dragAnEvent._eid)
  const eventInView = !!event
  if (!event) event = (vuecal.mutableEvents.find(e => e._eid === dragAnEvent._eid) || {})
  const eventDuration = event.endTimeMinutes - event.startTimeMinutes
  const startTimeMinutes = vuecal.minutesAtCursor(e).minutes - dragAnEvent.cursorGrabAt
  event.startTimeMinutes = startTimeMinutes
  event.endTimeMinutes = startTimeMinutes + eventDuration
  event.startDate = new Date(new Date(cellDate).setMinutes(startTimeMinutes))
  event.endDate = new Date(new Date(cellDate).setMinutes(event.endTimeMinutes))
  event.dragging = false
  cell.highlighted = false
  cancelViewChange = false
  if (!eventInView) vuecal.addEventsToView([event])
  console.log('event dropped in cell')
}

export const viewSelectorDragEnter = (id, vuecal, headerData) => {
  // setTimeout 0: Has to be set slightly after a potential viewSelectorDragLeave
  // so that it does not get cancelled. (Case where the buttons are very close)
  setTimeout(() => {
    headerData.highlightedControl = id
    changeViewTimeoutId = setTimeout(() => {
      if (['previous', 'next'].includes(id)) vuecal[id]()
      else vuecal.switchView(id, null, true)
      viewChanged = true
    }, 800)
  }, 0)
}

export const viewSelectorDragLeave = (id, vuecal, headerData) => {
  headerData.highlightedControl = null
  if (changeViewTimeoutId) clearTimeout(changeViewTimeoutId)
}
