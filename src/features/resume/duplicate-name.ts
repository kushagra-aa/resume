export function createResumeCopyName(name: string, existingNames: string[]) {
  const occupied = new Set(
    existingNames.map((value) => value.trim().toLowerCase()),
  )
  const first = `${name} Copy`
  if (!occupied.has(first.toLowerCase())) return first

  let suffix = 2
  while (occupied.has(`${first} ${suffix}`.toLowerCase())) suffix += 1
  return `${first} ${suffix}`
}
