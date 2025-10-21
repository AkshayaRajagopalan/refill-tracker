export function localISODate(d?: Date) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function formatLocalDate(input: string | Date) {
  const dt = typeof input === 'string' ? new Date(input) : input
  return dt.toLocaleDateString()
}
