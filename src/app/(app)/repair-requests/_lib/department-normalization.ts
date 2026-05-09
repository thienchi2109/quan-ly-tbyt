const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g
const DASH_VARIANTS_REGEX = /[‐‑‒–—−]/g

export function normalizeRepairRequestDepartmentName(
  department: string | null | undefined,
) {
  if (!department) {
    return null
  }

  const normalized = department
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS_REGEX, "")
    .replace(DASH_VARIANTS_REGEX, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim()

  return normalized || null
}

export function isSameRepairRequestDepartment(
  first: string | null | undefined,
  second: string | null | undefined,
) {
  const normalizedFirst = normalizeRepairRequestDepartmentName(first)
  const normalizedSecond = normalizeRepairRequestDepartmentName(second)

  return !!normalizedFirst && normalizedFirst === normalizedSecond
}
