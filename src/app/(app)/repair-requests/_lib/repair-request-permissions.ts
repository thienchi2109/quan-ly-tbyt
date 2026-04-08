import type { User } from "@/types/database"

const MANAGER_ROLES = new Set<User["role"]>(["admin", "to_qltb"])

export function canManageRepairRequests(user: User | null | undefined) {
  return !!user && MANAGER_ROLES.has(user.role)
}

export function getRepairRequestDepartment(user: User | null | undefined) {
  if (!user || canManageRepairRequests(user)) {
    return null
  }

  return user.khoa_phong || null
}
