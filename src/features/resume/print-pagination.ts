export const A4_PAGE_HEIGHT_PX = (297 / 25.4) * 96

export type PrintPageMargins = {
  top: number
  right: number
  bottom: number
  left: number
}

export function estimatePrintPageCount(
  contentHeight: number | null,
  margins: PrintPageMargins | null,
) {
  if (contentHeight === null || !Number.isFinite(contentHeight)) return 1

  const verticalMargins = margins
    ? margins.top + margins.bottom
    : (8 / 25.4) * 96 * 2
  const availableHeight = Math.max(1, A4_PAGE_HEIGHT_PX - verticalMargins)
  const measuredHeight = Math.max(0, contentHeight)

  return Math.max(1, Math.ceil((measuredHeight - 1) / availableHeight))
}

export function isPrintPageMargins(value: unknown): value is PrintPageMargins {
  if (!value || typeof value !== 'object') return false

  return ['top', 'right', 'bottom', 'left'].every((key) => {
    const margin = (value as Record<string, unknown>)[key]
    return (
      typeof margin === 'number' &&
      Number.isFinite(margin) &&
      margin >= 0 &&
      margin <= 500
    )
  })
}
