export type EquipmentPaginationState = {
  pageIndex: number
  pageSize: number
  preservePageOnNextDataUpdate: boolean
}

export function beginMutationPaginationPreservation(
  state: EquipmentPaginationState,
): EquipmentPaginationState {
  return {
    ...state,
    preservePageOnNextDataUpdate: true,
  }
}

export function resolveMutationPaginationPreservation(
  state: EquipmentPaginationState,
): EquipmentPaginationState {
  return {
    ...state,
    preservePageOnNextDataUpdate: false,
  }
}

export function resetPaginationForUserTableChange(
  state: EquipmentPaginationState,
): EquipmentPaginationState {
  return {
    ...state,
    pageIndex: 0,
    preservePageOnNextDataUpdate: false,
  }
}

export function shouldAutoResetEquipmentPageIndex(
  _state: EquipmentPaginationState,
): boolean {
  return false
}
