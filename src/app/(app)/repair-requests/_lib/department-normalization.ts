const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g
const DASH_VARIANTS_REGEX = /[‐‑‒–—−]/g
const DEPARTMENT_SEGMENT_SEPARATOR = "-"

function splitDepartmentSegments(normalizedDepartment: string) {
  return normalizedDepartment
    .split(DEPARTMENT_SEGMENT_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function isParentChildDepartmentMatch(first: string, second: string) {
  const firstSegments = splitDepartmentSegments(first)
  const secondSegments = splitDepartmentSegments(second)

  if (firstSegments.some((segment) => segment === second)) {
    return true
  }

  if (secondSegments.some((segment) => segment === first)) {
    return true
  }

  return false
}

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
    .replace(/đ/g, "d")
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

  if (!normalizedFirst || !normalizedSecond) {
    return false
  }

  if (normalizedFirst === normalizedSecond) {
    return true
  }

  return isParentChildDepartmentMatch(normalizedFirst, normalizedSecond)
}
