export const repairKeys = {
  all: ['repair'] as const,
  lists: () => [...repairKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...repairKeys.lists(), { filters }] as const,
  details: () => [...repairKeys.all, 'detail'] as const,
  detail: (id: string) => [...repairKeys.details(), id] as const,
}

export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...equipmentKeys.lists(), { filters }] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
}

export const transferKeys = {
  all: ['transfers'] as const,
  lists: () => [...transferKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...transferKeys.lists(), { filters }] as const,
  details: () => [...transferKeys.all, 'detail'] as const,
  detail: (id: string) => [...transferKeys.details(), id] as const,
}

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...maintenanceKeys.lists(), { filters }] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
  schedules: () => [...maintenanceKeys.all, 'schedules'] as const,
  schedule: (filters: Record<string, any>) => [...maintenanceKeys.schedules(), { filters }] as const,
}

export const lookupKeys = {
  departments: ['departments'] as const,
  equipmentTypes: ['equipment-types'] as const,
  users: ['users'] as const,
  profiles: ['profiles'] as const,
} 