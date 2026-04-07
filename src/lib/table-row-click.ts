import * as React from "react"

const ROW_CLICK_IGNORE_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='menuitem']",
  "[contenteditable='true']",
  "[data-row-click-ignore='true']",
].join(", ")

export function shouldHandleRowClick(event: React.MouseEvent<HTMLElement>) {
  const target = event.target
  if (!(target instanceof Element)) {
    return true
  }

  return !target.closest(ROW_CLICK_IGNORE_SELECTOR)
}

export function createRowClickHandler<T>(
  item: T,
  onOpenDetails: (item: T) => void,
) {
  return (event: React.MouseEvent<HTMLElement>) => {
    if (!shouldHandleRowClick(event)) return
    onOpenDetails(item)
  }
}
